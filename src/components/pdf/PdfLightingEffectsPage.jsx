import React from "react";
import BudgetEffectsPage from "./BudgetEffectsPage";
import { createEffectsPdfPages } from "../../pdf/utils/effectsPdf.js";

export default function PdfLightingEffectsPage({ items = [] }) {
  return createEffectsPdfPages(items).map((page, index) => (
    <BudgetEffectsPage key={`lighting-effects-${index}`} page={page} />
  ));
}
