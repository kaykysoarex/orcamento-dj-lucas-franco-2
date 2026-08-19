/** Layout positions for the lighting/effects A4 surface (1055 × 1491). */
export const BUDGET_EFFECTS_LAYOUT = {
  canvas: { width: 1055, height: 1491 },
  title: { left: 90, top: 75, width: 760 },
  images: {
    top: 300,
    left: 62,
    right: 62,
    heightByCount: { 1: 370, 2: 350, 3: 290 },
  },
  items: {
    left: 92,
    right: 92,
    // Reserve the footer/logo area on every variant of this page.
    bottom: 300,
    topByImageCount: { 0: 350, 1: 760, 2: 740, 3: 665 },
  },
  logo: { bottom: 72, width: 280 },
  decorative: {
    topDiagonal: { startX: -50, startY: -110, endX: 120, endY: 80 },
    bottomDiagonal: { startX: 1105, startY: 1391, endX: 900, endY: 1240 },
  },
} as const;
