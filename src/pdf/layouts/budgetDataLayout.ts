// Layout configuration for the budget data page.
// Positions and dimensions are expressed in percent of the page (design surface 1055×1491).
// For each field: lineX = left start of golden line, lineY = vertical position of the GOLDEN LINE, lineWidth = length of the golden line.
// The dynamic text will be positioned so its bottom is a fixed distance above the line (scaled with page width).
export const BUDGET_DATA_LAYOUT = {
  eventType:   { lineX: 9.2, lineY: 38.0, lineWidth: 34 },
  location:    { lineX: 9.2, lineY: 49.0, lineWidth: 34 },
  eventDate:   { lineX: 9.2, lineY: 59.5, lineWidth: 34 },
  showDuration:{ lineX: 9.2, lineY: 70.0, lineWidth: 34 },
  clientName:  { lineX: 9.2, lineY: 80.5, lineWidth: 34 },
};
