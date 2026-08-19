import test from "node:test";
import assert from "node:assert/strict";
import { buscarItemPorId } from "../src/data/catalogoItens.js";
import {
  PDF_PROPOSAL_CATEGORIES,
  buildProposalPdfCategories,
  createProposalCategoryPages,
} from "../src/pdf/utils/proposalCategories.js";

const resolveItem = (id) => buscarItemPorId(id);
const structureItems = [
  "strobo-led",
  "pista-led-slim-paris-black",
  "moving-head-profissional",
  "envelopamento-black",
  "sistema-som-profissional",
  "cabeamento-completo",
  "mesa-dobravel",
];

test("usa exclusivamente as três categorias visíveis no orçamento", () => {
  assert.deepEqual(
    PDF_PROPOSAL_CATEGORIES.map((category) => category.title),
    ["SOM E DJ", "ILUMINAÇÃO & EFEITOS", "SERVIÇOS"]
  );
});

test("itens automáticos da estrutura aparecem uma única vez nas categorias corretas", () => {
  const categories = buildProposalPdfCategories({ includedItemIds: structureItems, resolveItem });

  assert.deepEqual(categories.map((category) => category.id), ["som-dj", "iluminacao-efeitos"]);
  assert.deepEqual(categories[0].items.map((item) => item.id), ["mesa-dobravel", "sistema-som-profissional", "cabeamento-completo"]);
  assert.deepEqual(categories[1].items.map((item) => item.id), ["moving-head-profissional", "envelopamento-black", "pista-led-slim-paris-black", "strobo-led"]);
  assert.equal(new Set(categories.flatMap((category) => category.items.map((item) => item.id))).size, structureItems.length);
});

test("combina itens incluídos e manuais sem duplicar IDs estáveis", () => {
  const categories = buildProposalPdfCategories({
    includedItemIds: ["sistema-som-profissional"],
    manualItems: [
      { itemId: "sistema-som-profissional", quantidade: 2 },
      { itemId: "canhao-co2", quantidade: 1 },
      { itemId: "tecnico-audio", quantidade: 1 },
    ],
    resolveItem,
  });
  const allItems = categories.flatMap((category) => category.items);
  const soundItem = allItems.find((item) => item.id === "sistema-som-profissional");

  assert.equal(allItems.filter((item) => item.id === "sistema-som-profissional").length, 1);
  assert.equal(soundItem?.quantidade, 2);
  assert.deepEqual(categories.map((category) => category.id), ["som-dj", "iluminacao-efeitos", "servicos"]);
});

test("cria continuação sem dividir linhas quando uma categoria ultrapassa a altura segura", () => {
  const category = {
    id: "som-dj",
    title: "SOM E DJ",
    items: Array.from({ length: 7 }, (_, index) => ({ id: `item-${index}`, nome: `Item ${index}` })),
  };
  const pages = createProposalCategoryPages(category);

  assert.equal(pages.length, 2);
  assert.equal(pages[0].continuation, false);
  assert.equal(pages[0].items.length, 6);
  assert.equal(pages[1].continuation, true);
  assert.equal(pages[1].items.length, 1);
});

test("limita somente a descrição usada no PDF, preservando o dado do catálogo", () => {
  const longDescription = "Descrição longa para validação visual ".repeat(8);
  const categories = buildProposalPdfCategories({
    manualItems: [{ itemId: "item-longo", quantidade: 1 }],
    resolveItem: (id) => id === "item-longo" ? {
      id,
      nome: "Equipamento com nome suficientemente longo para ocupar duas linhas sem cortar",
      descricao: longDescription,
      categoria: "equipamento",
      ativo: true,
    } : null,
  });

  assert.equal(categories[0].items[0].pdfDescription.endsWith("…"), true);
  assert.ok(categories[0].items[0].pdfDescription.length <= 133);
  assert.equal(longDescription.length > categories[0].items[0].pdfDescription.length, true);
});
