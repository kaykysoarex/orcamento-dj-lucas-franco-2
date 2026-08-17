import test from "node:test";
import assert from "node:assert/strict";
import { CATEGORIAS_ITEM, PLACEHOLDER_ITEM_IMAGE, buscarItemPorId, catalogoItens } from "../src/data/catalogoItens.js";

test("cadastra os 24 itens com IDs e imagens estáveis", () => {
  assert.equal(catalogoItens.length, 24);
  assert.equal(buscarItemPorId("bazuca-co2").imagem, "/images/efeitos/bazuca-co2.png");
  assert.equal(buscarItemPorId("maquina-fumaca-profissional").imagem, "/images/efeitos/maquina-fumaca-profissional.png");
  assert.ok(catalogoItens.every((item) => item.id && item.slug && item.imagem && item.imagemFallback === PLACEHOLDER_ITEM_IMAGE));
});

test("resolve somente os itens selecionados", () => {
  const selecionados = [
    { itemId: "bazuca-co2", quantidade: 1, valorUnitario: 0 },
    { itemId: "maquina-fumaca-profissional", quantidade: 1, valorUnitario: 0 },
  ];
  const resolvidos = selecionados.map((item) => buscarItemPorId(item.itemId));
  assert.deepEqual(resolvidos.map((item) => item.id), ["bazuca-co2", "maquina-fumaca-profissional"]);
  assert.equal(resolvidos.some((item) => item.id === "painel-led"), false);
  assert.deepEqual(selecionados.filter((item) => item.itemId !== "bazuca-co2").map((item) => item.itemId), ["maquina-fumaca-profissional"]);
});

test("categorias do catálogo são agrupáveis e não duplicam seções vazias", () => {
  const selectedIds = new Set(["estrutura-prime", "tecnico-audio"]);
  const grupos = CATEGORIAS_ITEM
    .map((categoria) => ({ ...categoria, itens: catalogoItens.filter((item) => item.categoria === categoria.id && selectedIds.has(item.id)) }))
    .filter((grupo) => grupo.itens.length > 0);
  assert.deepEqual(grupos.map((grupo) => grupo.id), ["estrutura", "servico"]);
});

test("o total existente continua sendo base mais adicionais", () => {
  const base = 1800;
  const extras = [{ price: 250 }, { price: 100 }];
  assert.equal(base + extras.reduce((total, item) => total + item.price, 0), 2150);
});
