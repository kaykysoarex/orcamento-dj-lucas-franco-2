import test from "node:test";
import assert from "node:assert/strict";
import {
  formatBudgetValue,
  formatBudgetValueInput,
  normalizeBudgetValueInCents,
  parseBudgetValueInput,
} from "../src/utils/budgetValue.js";

test("armazena valores monetários como centavos não negativos", () => {
  assert.equal(normalizeBudgetValueInCents(1250000), 1250000);
  assert.equal(normalizeBudgetValueInCents(-10), 0);
  assert.equal(normalizeBudgetValueInCents(Number.NaN), 0);
  assert.equal(normalizeBudgetValueInCents(undefined), 0);
  assert.equal(parseBudgetValueInput("12.500,75").cents, 1250075);
});

test("formata valores em real sem calcular com o texto exibido", () => {
  assert.equal(formatBudgetValue(85000), "R$ 850,00");
  assert.equal(formatBudgetValue(12500000), "R$ 125.000,00");
  assert.equal(formatBudgetValue(125000000), "R$ 1.250.000,00");
  assert.equal(formatBudgetValueInput(1250000), "12.500,00");
});

test("aceita edição vazia e rejeita entrada monetária inválida", () => {
  assert.deepEqual(parseBudgetValueInput(""), { valid: true, cents: 0, input: "" });
  assert.equal(parseBudgetValueInput("850,5").cents, 85050);
  assert.equal(parseBudgetValueInput("-20").valid, false);
  assert.equal(parseBudgetValueInput("R$ abc").valid, false);
});
