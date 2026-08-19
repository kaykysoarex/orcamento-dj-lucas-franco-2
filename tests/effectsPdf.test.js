import test from "node:test";
import assert from "node:assert/strict";
import { createEffectsPdfPages } from "../src/pdf/utils/effectsPdf.js";

const normalItem = { id: "strobo-led", nome: "Strobo de LED", categoria: "efeito" };
const effects = {
  fogos: { id: "fogos-artificio", nome: "Fogos de Artifício", categoria: "efeito" },
  canhao: { id: "canhao-co2", nome: "Canhão de CO₂", categoria: "efeito" },
  bazuca: { id: "bazuca-co2", nome: "Bazuca de CO₂", categoria: "efeito" },
};

test("não cria área de imagens quando nenhum efeito visual foi selecionado", () => {
  const [page] = createEffectsPdfPages([normalItem]);
  assert.equal(page.effects.length, 0);
  assert.deepEqual(page.items.map((item) => item.id), ["strobo-led"]);
});

for (const [name, effect] of Object.entries(effects)) {
  test(`mostra somente a imagem selecionada: ${name}`, () => {
    const [page] = createEffectsPdfPages([effect, normalItem]);
    assert.deepEqual(page.effects.map((item) => item.id), [effect.id]);
    assert.deepEqual(page.items.map((item) => item.id), ["strobo-led"]);
  });
}

test("equilibra dois efeitos sem incluir o terceiro", () => {
  const [page] = createEffectsPdfPages([effects.fogos, effects.canhao, normalItem]);
  assert.deepEqual(page.effects.map((item) => item.id), ["fogos-artificio", "canhao-co2"]);
});

test("mostra os três efeitos selecionados", () => {
  const [page] = createEffectsPdfPages([effects.fogos, effects.canhao, effects.bazuca, normalItem]);
  assert.equal(page.effects.length, 3);
  assert.deepEqual(page.effects.map((item) => item.id), ["fogos-artificio", "canhao-co2", "bazuca-co2"]);
});

test("leva somente o excedente para uma continuação com o mesmo rodapé", () => {
  const items = [effects.fogos, ...Array.from({ length: 20 }, (_, index) => ({ id: `item-${index}`, nome: `Item ${index}` }))];
  const pages = createEffectsPdfPages(items);
  assert.equal(pages.length, 2);
  assert.equal(pages[0].effects.length, 1);
  assert.equal(pages[0].items.length, 8);
  assert.equal(pages[1].continuation, true);
  assert.equal(pages[1].effects.length, 0);
  assert.equal(pages[1].items.length, 12);
});
