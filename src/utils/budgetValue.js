export function normalizeBudgetValueInCents(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return Math.min(Math.round(numeric), Number.MAX_SAFE_INTEGER);
}

export function formatBudgetValue(valueInCents) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(normalizeBudgetValueInCents(valueInCents) / 100);
}

export function formatBudgetValueInput(valueInCents) {
  return (normalizeBudgetValueInCents(valueInCents) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parseBudgetValueInput(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return { valid: true, cents: 0, input: "" };

  const normalized = raw
    .replace(/^R\$\s*/i, "")
    .replace(/[.\s]/g, "");

  if (!/^\d*(?:,\d{0,2})?$/.test(normalized)) {
    return { valid: false, cents: 0, input: raw };
  }

  const [wholePart = "", decimalPart = ""] = normalized.split(",");
  const whole = Number.parseInt(wholePart || "0", 10);
  const decimal = Number.parseInt(decimalPart.padEnd(2, "0") || "0", 10);
  const cents = (whole * 100) + decimal;

  if (!Number.isSafeInteger(cents) || cents < 0) {
    return { valid: false, cents: 0, input: raw };
  }

  return { valid: true, cents, input: normalized };
}
