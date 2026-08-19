export const VISUAL_EFFECT_IDS = Object.freeze([
  "fogos-artificio",
  "canhao-co2",
  "bazuca-co2",
]);

const VISUAL_EFFECT_ID_SET = new Set(VISUAL_EFFECT_IDS);

// Capacities use a two-column item list and reserve a protected footer area
// for the logo on the 1055 × 1491 A4 design surface.
const FIRST_PAGE_CAPACITY = Object.freeze({
  0: 16,
  1: 8,
  2: 8,
  3: 8,
});

const CONTINUATION_PAGE_CAPACITY = 16;

function normalizeItem(item) {
  if (!item) return null;
  const id = item.id || item.itemId;
  if (!id) return null;
  return { ...item, id };
}

export function isVisualEffect(item) {
  const id = item?.id || item?.itemId;
  return VISUAL_EFFECT_ID_SET.has(id);
}

/**
 * Splits the lighting/effects sheet only when its A4 content area is full.
 * The first page contains every selected visual effect; continuation pages
 * preserve the visual identity and footer while carrying the remaining items.
 */
export function createEffectsPdfPages(items = []) {
  const normalizedItems = (Array.isArray(items) ? items : [])
    .map(normalizeItem)
    .filter(Boolean);
  const effects = normalizedItems.filter(isVisualEffect);
  const remainingItems = normalizedItems.filter((item) => !isVisualEffect(item));
  const firstCapacity = FIRST_PAGE_CAPACITY[Math.min(effects.length, 3)];
  const pages = [{
    effects,
    items: remainingItems.slice(0, firstCapacity),
    continuation: false,
  }];

  for (let index = firstCapacity; index < remainingItems.length; index += CONTINUATION_PAGE_CAPACITY) {
    pages.push({
      effects: [],
      items: remainingItems.slice(index, index + CONTINUATION_PAGE_CAPACITY),
      continuation: true,
    });
  }

  return pages;
}
