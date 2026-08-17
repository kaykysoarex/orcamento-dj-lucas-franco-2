/**
 * Layout configuration for the budget data page.
 * All positions are in px on the design surface (1055 × 1491).
 * Each field defines: top, height, showLine (whether to display golden line).
 */
export const BUDGET_DATA_LAYOUT = {
  canvas: {
    width: 1055,
    height: 1491,
  },

  content: {
    left: 96,
    width: 368,
  },

  title: {
    left: 95,
    top: 245,
    width: 490,
  },

  fields: {
    eventType: {
      top: 500,
      height: 108,
      showLine: true,
    },
    location: {
      top: 650,
      height: 110,
      showLine: true,
    },
    eventDate: {
      top: 804,
      height: 114,
      showLine: true,
    },
    showDuration: {
      top: 962,
      height: 113,
      showLine: true,
    },
    clientName: {
      top: 1122,
      height: 100,
          showLine: true,
    },
  },

  dj: {
    left: 525,
    top: 185,
    width: 500,
  },

  logo: {
    left: 94,
    bottom: 105,
    width: 360,
  },

  decorativeLineTop: {
    startX: -50,
    startY: -100,
    endX: 50,
    endY: 150,
    thickness: 3,
    color: "#279DFF",
    shadow: "0 0 8px rgba(39, 157, 255, 0.75)",
  },

  decorativeLineBottom: {
    startX: 1105,
    startY: 1391,
    endX: 955,
    endY: 1241,
    thickness: 3,
    color: "#E0A53A",
    shadow: "0 0 8px rgba(224, 165, 58, 0.65)",
  },

  frame: {
    margin: 16,
    thickness: 1,
    color: "rgba(185, 135, 45, 0.55)",
  },

  background: {
    color: "#07090B",
    texture: true,
  },
} as const;

