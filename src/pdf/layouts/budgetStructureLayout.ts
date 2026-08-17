/**
 * Layout configuration for the budget structure page.
 * Positions are on the design surface (1055 × 1491).
 */
export const BUDGET_STRUCTURE_LAYOUT = {
  canvas: { width: 1055, height: 1491 },

  title: {
    left: 90,
    top: 75,
    width: 760,
  },

  structureName: {
    left: 92,
    top: 245,
    width: 760,
  },

  titleLine: {
    left: 92,
    top: 300,
    width: 95,
  },

  photo: {
    left: 62,
    top: 335,
    width: 931,
    height: 640,
  },

  includedSection: {
    left: 92,
    top: 1025,
    width: 871,
  },

  decorative: {
    topDiagonal: { startX: -50, startY: -110, endX: 120, endY: 80 },
    bottomDiagonal: { startX: 1105, startY: 1391, endX: 900, endY: 1240 },
  },

  frame: {
    margin: 16,
    thickness: 1,
    color: "rgba(185,135,45,0.55)",
  },

  background: {
    color: "#07090B",
    texture: true,
  },
} as const;
