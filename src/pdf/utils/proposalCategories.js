export const PDF_PROPOSAL_CATEGORIES = Object.freeze([
  { id: "som-dj", title: "SOM E DJ", sourceCategories: ["equipamento"] },
  { id: "iluminacao-efeitos", title: "ILUMINAÇÃO & EFEITOS", sourceCategories: ["efeito", "estrutura"] },
  { id: "servicos", title: "SERVIÇOS", sourceCategories: ["servico"] },
]);

const CATEGORY_BY_SOURCE = new Map(
  PDF_PROPOSAL_CATEGORIES.flatMap((category) =>
    category.sourceCategories.map((sourceCategory) => [sourceCategory, category.id])
  )
);

const MAX_ITEMS_PER_PAGE = 6;
const LIST_SAFE_HEIGHT = 800;

function pdfDescription(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  const maxLength = 132;
  if (text.length <= maxLength) return text;

  const shortened = text.slice(0, maxLength + 1).replace(/\s+\S*$/, "").trim();
  return `${shortened}…`;
}

function estimatedListItemHeight(item) {
  const name = String(item?.nome || "Item selecionado");
  const description = String(item?.pdfDescription || "");
  const nameLines = Math.max(1, Math.ceil(name.length / 48));
  const descriptionLines = description ? Math.min(2, Math.ceil(description.length / 82)) : 0;

  // Fixed vertical padding plus the visual line-height of name/description.
  return Math.max(124, 42 + (nameLines * 35) + (descriptionLines ? 12 + (descriptionLines * 26) : 0));
}

function stableItemId(item) {
  return item?.id || item?.slug || item?.itemId || "";
}

function normalizeItem(selection, resolveItem, included) {
  const itemId = selection?.itemId || selection?.id;
  const catalogItem = selection?.itemCatalogo || resolveItem(itemId);
  if (!catalogItem?.ativo && catalogItem?.ativo !== undefined) return null;

  const id = stableItemId(catalogItem) || itemId;
  const categoryId = CATEGORY_BY_SOURCE.get(catalogItem?.categoria);
  if (!id || !categoryId) return null;

  return {
    id,
    slug: catalogItem.slug || id,
    nome: catalogItem.nome || "Item selecionado",
    pdfDescription: pdfDescription(catalogItem.descricao),
    categoria: catalogItem.categoria,
    quantidade: Math.max(1, Number(selection?.quantidade) || 1),
    included,
    pdfCategoryId: categoryId,
    ordem: Number(catalogItem.ordem) || Number.MAX_SAFE_INTEGER,
  };
}

/**
 * Produces the only item source used by the PDF. It merges items supplied by
 * the chosen structure with package/manual selections, then removes duplicate
 * stable IDs before splitting them into the three visible proposal categories.
 */
export function buildProposalPdfCategories({
  includedItemIds = [],
  manualItems = [],
  resolveItem,
}) {
  const merged = new Map();
  const candidates = [
    ...(Array.isArray(includedItemIds) ? includedItemIds.map((itemId) => ({ itemId, quantidade: 1, included: true })) : []),
    ...(Array.isArray(manualItems) ? manualItems.map((item) => ({ ...item, included: false })) : []),
  ];

  candidates.forEach((candidate) => {
    const item = normalizeItem(candidate, resolveItem, candidate.included);
    if (!item) return;

    const current = merged.get(item.id);
    if (!current) {
      merged.set(item.id, item);
      return;
    }

    // One list line per stable item. A manually chosen quantity remains visible
    // without duplicating an item already included with the structure.
    current.quantidade = Math.max(current.quantidade, item.quantidade);
    current.included = current.included && item.included;
  });

  return PDF_PROPOSAL_CATEGORIES.map((category) => ({
    ...category,
    items: [...merged.values()]
      .filter((item) => item.pdfCategoryId === category.id)
      .sort((left, right) => left.ordem - right.ordem || left.nome.localeCompare(right.nome, "pt-BR")),
  })).filter((category) => category.items.length > 0);
}

export function createProposalCategoryPages(category) {
  const items = category?.items || [];
  const pages = [];

  let pageItems = [];
  let usedHeight = 0;

  const appendPage = () => {
    if (!pageItems.length) return;
    pages.push({ category, items: pageItems, continuation: pages.length > 0 });
    pageItems = [];
    usedHeight = 0;
  };

  items.forEach((item) => {
    const itemHeight = estimatedListItemHeight(item);
    const exceedsSafeHeight = pageItems.length > 0 && usedHeight + itemHeight > LIST_SAFE_HEIGHT;
    const exceedsItemLimit = pageItems.length >= MAX_ITEMS_PER_PAGE;

    if (exceedsSafeHeight || exceedsItemLimit) appendPage();
    pageItems.push(item);
    usedHeight += itemHeight;
  });

  appendPage();

  return pages;
}
