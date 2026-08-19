import test from "node:test";
import assert from "node:assert/strict";
import {
  buildProposalFileName,
  buildWhatsAppMessage,
  sanitizeProposalFilePart,
} from "../src/utils/proposalPdf.js";

test("cria um nome de arquivo legível e seguro para a proposta", () => {
  assert.equal(sanitizeProposalFilePart("Ana Áurea / João!"), "ana-aurea-joao");
  assert.equal(buildProposalFileName({ clientName: "Ana Áurea / João!" }), "proposta-lucas-franco-ana-aurea-joao.pdf");
  assert.equal(buildProposalFileName({ clientName: "" }), "proposta-lucas-franco.pdf");
});

test("monta a mensagem de compartilhamento sem nome indefinido", () => {
  assert.match(buildWhatsAppMessage({ clientName: "Ana" }), /Olá, Ana!/);
  assert.match(buildWhatsAppMessage({}), /Olá! Segue a proposta/);
});
