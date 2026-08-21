import { useState, useEffect, useMemo, useRef } from "react";
import { Plus, X, Printer, Check, Music2, CalendarDays, User, MapPin, MessageSquareText, MessageCircle, ImagePlus, LoaderCircle } from "lucide-react";
import SeletorEstruturas from "./components/SeletorEstruturas.jsx";
import PdfCoverPage from "./components/pdf/PdfCoverPage.jsx";
import PdfBiographyPage from "./components/pdf/PdfBiographyPage.jsx";
import PdfBudgetDataPage from "./components/pdf/PdfBudgetDataPage.jsx";
import PdfBudgetStructurePage from "./components/pdf/PdfBudgetStructurePage.jsx";
import PdfProposalCategoryPages from "./components/pdf/PdfProposalCategoryPages.jsx";
import WeddingExperiencePage from "./components/pdf/WeddingExperiencePage.jsx";
import InvestmentPage from "./components/pdf/InvestmentPage";
import { PLACEHOLDER_ITEM_IMAGE, buscarItemPorId, catalogoItens } from "./data/catalogoItens.js";
import { buildProposalPdfCategories } from "./pdf/utils/proposalCategories.js";
import { assetPath } from "./utils/assetPath.js";
import { EXPERIENCE_URL } from "./config/experienceLink.js";
import { formatBudgetValue, formatBudgetValueInput, normalizeBudgetValueInCents, parseBudgetValueInput } from "./utils/budgetValue.js";
import {
  buildWhatsAppMessage,
  downloadProposalPdfFile,
  generateProposalPdfFile,
  waitForProposalAssets,
} from "./utils/proposalPdf.js";

const STORAGE_KEY = "lucas-franco-custom-packages-v2";
const EQUIPMENT_KEY = "lucas-franco-equipment-v3";
const COUNTER_KEY = "lucas-franco-proposal-counter";
const PAYMENT_KEY = "lucas-franco-payment-terms";
const BUDGET_VALUE_KEY = "lucas-franco-budget-value-in-cents";
const PROPOSALS_KEY = "lucas-franco-proposals";
const DEFAULT_PAYMENT_TERMS =
  "Sinal de 30% na assinatura do contrato, restante na semana do evento. Pagamento via Pix ou cartão em até 12x (com taxa da operadora). Atendimento somente com pacote fechado.";

const DEFAULT_PACKAGES = [];

// Itens que acompanham todas as estruturas (reutilizável)
const itensPadraoEstrutura = [
  "strobo-led",
  "pista-led-slim-paris-black",
  "moving-head-profissional",
  "envelopamento-black",
  "sistema-som-profissional",
  "cabeamento-completo",
  "mesa-dobravel",
];

// Estruturas disponíveis (quatro estruturas conforme especificação)
const DEFAULT_ESTRUTURAS = [
  {
    id: "estrutura-01",
    nome: "Estrutura Prime",
    descricao: "Estrutura profissional personalizada para o evento.",
    imagens: [
      assetPath("/images/estruturas/estrutura-01-a.png"),
      assetPath("/images/estruturas/estrutura-01-b.png"),
    ],
    itensInclusosIds: itensPadraoEstrutura,
    ativo: true,
    ordem: 1,
  },
  {
    id: "estrutura-02",
    nome: "Estrutura Stand",
    descricao: "Estrutura profissional personalizada para o evento.",
    imagens: [assetPath("/images/estruturas/estrutura-02.png")],
    itensInclusosIds: itensPadraoEstrutura,
    ativo: true,
    ordem: 2,
  },
  {
    id: "estrutura-03",
    nome: "Estrutura Prime Ultra",
    descricao: "Estrutura profissional personalizada para o evento.",
    imagens: [assetPath("/images/estruturas/estrutura-03.png")],
    itensInclusosIds: itensPadraoEstrutura,
    ativo: true,
    ordem: 3,
  },
  {
    id: "estrutura-04",
    nome: "Boate X",
    descricao: "Estrutura profissional personalizada para o evento.",
    imagens: [assetPath("/images/estruturas/estrutura-04.png")],
    itensInclusosIds: itensPadraoEstrutura,
    ativo: true,
    ordem: 4,
  },
];

function formatBRL(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function compressImage(file, maxDim = 640, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDatePt(date) {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function formatDateBR(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

function loadText(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? raw : fallback;
  } catch (e) {
    return fallback;
  }
}

function saveText(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    return false;
  }
}

function copyPackage(pkg) {
  if (!pkg) return null;
  return {
    id: pkg.id,
    name: pkg.name,
    price: Number(pkg.price) || 0,
    items: (pkg.items || []).map((item) => ({ ...item })),
    photos: [...(pkg.photos || [])],
  };
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "item";
}

function makeCustomCatalogItem(name) {
  const slug = slugify(name);
  return {
    id: `custom-${slug}`,
    slug,
    nome: name,
    descricao: "Item personalizado cadastrado no catálogo.",
    categoria: "equipamento",
    imagem: PLACEHOLDER_ITEM_IMAGE,
    imagemFallback: PLACEHOLDER_ITEM_IMAGE,
    exibirImagemNoPdf: true,
    ativo: true,
    ordem: catalogoItens.length + 1,
  };
}

function normalizeCustomCatalog(savedItems) {
  const seen = new Set(catalogoItens.map((item) => item.nome.toLocaleLowerCase("pt-BR")));
  const custom = [];
  (Array.isArray(savedItems) ? savedItems : []).forEach((entry) => {
    const item = typeof entry === "string" ? makeCustomCatalogItem(entry.trim()) : entry;
    if (!item?.nome) return;
    const nameKey = item.nome.toLocaleLowerCase("pt-BR");
    if (seen.has(nameKey)) return;
    seen.add(nameKey);
    custom.push({ ...makeCustomCatalogItem(item.nome), ...item, imagemFallback: item.imagemFallback || PLACEHOLDER_ITEM_IMAGE });
  });
  return custom;
}

function normalizeBudgetItem(entry, customItems = []) {
  if (entry && typeof entry === "object" && entry.itemId) {
    return {
      itemId: entry.itemId,
      quantidade: Math.max(1, Number(entry.quantidade) || 1),
      valorUnitario: Number(entry.valorUnitario) || 0,
    };
  }
  const legacyName = String(entry || "").trim();
  const catalogItem = catalogoItens.find((item) => item.nome.toLocaleLowerCase("pt-BR") === legacyName.toLocaleLowerCase("pt-BR"));
  const customItem = customItems.find((item) => item.nome.toLocaleLowerCase("pt-BR") === legacyName.toLocaleLowerCase("pt-BR"));
  return {
    itemId: catalogItem?.id || customItem?.id || `legacy-${slugify(legacyName)}`,
    quantidade: 1,
    valorUnitario: 0,
  };
}

function normalizePackage(pkg, customItems = []) {
  return {
    ...pkg,
    items: (pkg.items || []).map((item) => normalizeBudgetItem(item, customItems)),
    photos: [...(pkg.photos || [])],
    price: Number(pkg.price) || 0,
  };
}

export default function OrcamentoApp() {
  const [packages, setPackages] = useState(DEFAULT_PACKAGES);
  const [estruturas, setEstruturas] = useState(DEFAULT_ESTRUTURAS);
  const [estruturaSelecionadaId, setEstruturaSelecionadaId] = useState(null);
  const [equipamentosAdicionais, setEquipamentosAdicionais] = useState([]); // { itemId, quantidade, valorUnitario }
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  const [activeTab, setActiveTab] = useState("editar"); // editar | previa
  const [selectedPkgId, setSelectedPkgId] = useState("");
  const [customEquipment, setCustomEquipment] = useState([]);
  const [equipmentSearch, setEquipmentSearch] = useState("");
  const [newEquipmentName, setNewEquipmentName] = useState("");
  const [priceOverride, setPriceOverride] = useState(null);
  const [extraItems, setExtraItems] = useState([]);
  const [clientName, setClientName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocal, setEventLocal] = useState("");
  const [eventType, setEventType] = useState("");
  const [showDuration, setShowDuration] = useState("");
  const [clientErrors, setClientErrors] = useState({});
  const [pendingDeletePackageId, setPendingDeletePackageId] = useState(null);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [budgetValueInCents, setBudgetValueInCents] = useState(0);
  const [budgetValueInput, setBudgetValueInput] = useState("");
  const [budgetValueError, setBudgetValueError] = useState("");
  const [paymentTerms, setPaymentTerms] = useState(DEFAULT_PAYMENT_TERMS);
  const [showPaymentTerms, setShowPaymentTerms] = useState(true);
  const [proposalNumber, setProposalNumber] = useState(null);
  const [savedProposals, setSavedProposals] = useState([]);
  const [currentProposalId, setCurrentProposalId] = useState(null);
  const [structureMode, setStructureMode] = useState(""); // '' | 'none' | 'with_structure' — start unselected
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [pdfActionState, setPdfActionState] = useState("idle"); // idle | generating
  const [pdfNotice, setPdfNotice] = useState("");
  const [pdfProgress, setPdfProgress] = useState(null);
  const [shareFallbackOpen, setShareFallbackOpen] = useState(false);
  const saveTimer = useRef(null);
  const savePaymentTimer = useRef(null);
  const saveBudgetValueTimer = useRef(null);
  const saveProposalTimer = useRef(null);
  const savedProposalsRef = useRef([]);
  const restoredProposalIdRef = useRef(null);
  const proposalPdfCacheRef = useRef({ fingerprint: null, file: null });
  const pdfGenerationRef = useRef(null);
  const pdfExportRootRef = useRef(null);

  // When editing a saved proposal, restore form fields so preview and PDF show the same values
  useEffect(() => {
    if (!currentProposalId || restoredProposalIdRef.current === currentProposalId) return;
    const proposal = savedProposals.find((p) => p.id === currentProposalId);
    if (!proposal) return;
    restoredProposalIdRef.current = currentProposalId;
    // only restore the client-related fields required for the PDF page
    setClientName(proposal.clientName || "");
    setEventDate(proposal.eventDate || "");
    setEventLocal(proposal.eventLocal || "");
    setEventType(proposal.eventType || "");
    setShowDuration(proposal.showDuration || "");
    const restoredBudgetValueInCents = normalizeBudgetValueInCents(proposal.budgetValueInCents);
    setBudgetValueInCents(restoredBudgetValueInCents);
    setBudgetValueInput(restoredBudgetValueInCents ? formatBudgetValue(restoredBudgetValueInCents) : "");
    setBudgetValueError("");

    // restore structure mode and selection if present
    const mode = proposal.structureMode || (proposal.packageId ? 'with_structure' : 'none');
    setStructureMode(mode);
    setEstruturaSelecionadaId(proposal.packageId || null);

    // restore equipamentos adicionais from itemSnapshots (exclude package items)
    const pkgItemIds = new Set((proposal.packageSnapshot?.items || []).map((i) => i.itemId));
    const adicionais = (proposal.itemSnapshots || [])
      .filter((s) => !pkgItemIds.has(s.itemId))
      .map((s) => ({ itemId: s.itemId, quantidade: s.quantidade || 1, valorUnitario: s.valorUnitario || 0 }));
    setEquipamentosAdicionais(adicionais);

    // compute selectedItemIds for UI summary
    const selIds = new Set(adicionais.map((a) => a.itemId));
    (proposal.packageSnapshot?.items || []).forEach((i) => selIds.add(i.itemId));
    (proposal.itemSnapshots || []).forEach((s) => selIds.add(s.itemId));
    setSelectedItemIds(Array.from(selIds));

    // do not write into the PNG — these are just form states
  }, [currentProposalId, savedProposals]);

  useEffect(() => {
    savedProposalsRef.current = savedProposals;
  }, [savedProposals]);

  // Load persisted packages + proposal counter on mount
  useEffect(() => {
    const savedPackages = loadJSON(STORAGE_KEY, null);
    const savedEquipment = loadJSON(EQUIPMENT_KEY, []);
    const legacyPackageItems = Array.isArray(savedPackages)
      ? savedPackages.flatMap((pkg) => (pkg.items || []).filter((item) => typeof item === "string"))
      : [];
    const normalizedCustomEquipment = normalizeCustomCatalog([
      ...(Array.isArray(savedEquipment) ? savedEquipment : []),
      ...legacyPackageItems,
    ]);
    setCustomEquipment(normalizedCustomEquipment);
    if (Array.isArray(savedPackages) && savedPackages.length) {
      const normalizedPackages = savedPackages.map((pkg) => normalizePackage(pkg, normalizedCustomEquipment));
      setPackages(normalizedPackages);
      setSelectedPkgId(normalizedPackages[0].id);
    }

    const savedPayment = loadText(PAYMENT_KEY, null);
    if (savedPayment) setPaymentTerms(savedPayment);

    const savedBudgetValueInCents = normalizeBudgetValueInCents(loadText(BUDGET_VALUE_KEY, "0"));
    setBudgetValueInCents(savedBudgetValueInCents);
    setBudgetValueInput(savedBudgetValueInCents ? formatBudgetValue(savedBudgetValueInCents) : "");

    const savedList = loadJSON(PROPOSALS_KEY, []);
    if (Array.isArray(savedList)) setSavedProposals(savedList);

    const savedCounter = Number.parseInt(loadText(COUNTER_KEY, "0"), 10) || 0;
    const highestSavedNumber = Array.isArray(savedList)
      ? savedList.reduce((highest, proposal) => Math.max(highest, Number(proposal.number) || 0), 0)
      : 0;
    const next = Math.max(savedCounter, highestSavedNumber) + 1;
    setProposalNumber(next);

    setLoaded(true);
  }, []);

  // Debounced autosave of packages
  useEffect(() => {
    if (!loaded) return;
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const packagesSaved = saveJSON(STORAGE_KEY, packages);
      const equipmentSaved = saveJSON(EQUIPMENT_KEY, customEquipment);
      setSaveState(packagesSaved && equipmentSaved ? "saved" : "error");
    }, 600);
    return () => clearTimeout(saveTimer.current);
  }, [packages, customEquipment, loaded]);

  // Debounced autosave of payment terms
  useEffect(() => {
    if (!loaded) return;
    if (savePaymentTimer.current) clearTimeout(savePaymentTimer.current);
    savePaymentTimer.current = setTimeout(() => {
      if (!saveText(PAYMENT_KEY, paymentTerms)) setSaveState("error");
    }, 600);
    return () => clearTimeout(savePaymentTimer.current);
  }, [paymentTerms, loaded]);

  // Persist only the integer amount. The formatted input remains presentation state.
  useEffect(() => {
    if (!loaded) return;
    if (saveBudgetValueTimer.current) clearTimeout(saveBudgetValueTimer.current);
    saveBudgetValueTimer.current = setTimeout(() => {
      if (!saveText(BUDGET_VALUE_KEY, String(budgetValueInCents))) setSaveState("error");
    }, 350);
    return () => clearTimeout(saveBudgetValueTimer.current);
  }, [budgetValueInCents, loaded]);

  const selectedPkg = packages.find((p) => p.id === selectedPkgId) || packages[0];
  const proposalPkg = selectedPkg;
  const completeCatalog = [...catalogoItens, ...customEquipment];

  // keep a derived list of selected item ids for the UI summary/modal
  useEffect(() => {
    const ids = new Set();
    equipamentosAdicionais.forEach((it) => ids.add(it.itemId));
    const estrutura = estruturas.find((s) => s.id === estruturaSelecionadaId);
    if (estrutura && Array.isArray(estrutura.itensInclusosIds)) {
      estrutura.itensInclusosIds.forEach((id) => ids.add(id));
    }
    if (selectedPkg && Array.isArray(selectedPkg.items)) {
      selectedPkg.items.forEach((it) => ids.add(it.itemId));
    }
    setSelectedItemIds(Array.from(ids));
  }, [equipamentosAdicionais, estruturaSelecionadaId, estruturas, selectedPkg]);
  const basePrice = priceOverride !== null ? priceOverride : proposalPkg?.price || 0;
  // Only extraItems (manual extras) and equipamentosAdicionais contribute to extras total
  const extraItemsTotal = extraItems.reduce((sum, it) => sum + (Number(it.price) || 0), 0);
  const equipamentosAdicionaisTotal = equipamentosAdicionais.reduce((sum, it) => sum + (Number(it.valorUnitario || 0) * (Number(it.quantidade) || 0)), 0);
  const total = basePrice + extraItemsTotal + equipamentosAdicionaisTotal;
  const validUntil = formatDatePt(addDays(new Date(), 7));
  const clientDetailsComplete = Boolean(clientName.trim() && eventDate && eventLocal.trim());
  const pdfActionBusy = pdfActionState !== "idle";
  const actionButtonLabel = pdfProgress
    ? `Página ${pdfProgress.current} de ${pdfProgress.total}`
    : "Preparando PDF...";
  const normalizedEquipmentSearch = equipmentSearch.trim().toLocaleLowerCase("pt-BR");
  const filteredEquipment = completeCatalog.filter((equipment) =>
    equipment.nome.toLocaleLowerCase("pt-BR").includes(normalizedEquipmentSearch)
  );

  // Estrutura selecionada e itens inclusos
  const estruturaSelecionada = estruturas.find((e) => e.id === estruturaSelecionadaId) || null;
  const itensInclusos = (estruturaSelecionada?.itensInclusosIds || []).map((itemId) => ({
    itemOrcamento: { itemId, quantidade: 1, valorUnitario: 0 },
    itemCatalogo: buscarItemPorId(itemId) || customEquipment.find((item) => item.id === itemId),
    incluso: true,
  })).filter((entry) => entry.itemCatalogo?.ativo);

  // Itens selecionados no pacote (se houver) — filtramos para não duplicar os itens inclusos
  const packageItems = (proposalPkg?.items || [])
    .filter((it) => !(estruturaSelecionada?.itensInclusosIds || []).includes(it.itemId))
    .map((itemOrcamento) => ({
      itemOrcamento,
      itemCatalogo: buscarItemPorId(itemOrcamento.itemId) || customEquipment.find((item) => item.id === itemOrcamento.itemId),
      incluso: false,
    }))
    .filter((entry) => entry.itemCatalogo?.ativo);

  // Equipamentos adicionais escolhidos pelo usuário (extras cobrados) — já no formato apropriado
  const adicionaisItems = equipamentosAdicionais.map((it) => ({
    itemOrcamento: { itemId: it.itemId, quantidade: it.quantidade || 1, valorUnitario: it.valorUnitario || 0 },
    itemCatalogo: buscarItemPorId(it.itemId) || customEquipment.find((item) => item.id === it.itemId),
    incluso: false,
  })).filter((entry) => entry.itemCatalogo?.ativo);

  const selectedProposalItems = [...itensInclusos, ...packageItems, ...adicionaisItems];
  const pdfProposalCategories = buildProposalPdfCategories({
    includedItemIds: estruturaSelecionada?.itensInclusosIds || [],
    manualItems: [...(proposalPkg?.items || []), ...equipamentosAdicionais],
    resolveItem: (itemId) => buscarItemPorId(itemId) || customEquipment.find((item) => item.id === itemId),
  });
  const proposalPdfFingerprint = useMemo(() => JSON.stringify({
    proposalNumber,
    clientName,
    eventDate,
    eventLocal,
    eventType,
    showDuration,
    notes,
    structureMode,
    estruturaSelecionadaId,
    selectedPkgId,
    packages,
    estruturas,
    customEquipment,
    equipamentosAdicionais,
    extraItems,
    paymentTerms,
    showPaymentTerms,
    budgetValueInCents,
    experienceUrl: EXPERIENCE_URL,
  }), [
    proposalNumber, clientName, eventDate, eventLocal, eventType, showDuration, notes,
    structureMode, estruturaSelecionadaId, selectedPkgId, packages, estruturas, customEquipment,
    equipamentosAdicionais, extraItems, paymentTerms, showPaymentTerms, budgetValueInCents,
    EXPERIENCE_URL,
  ]);

  useEffect(() => {
    proposalPdfCacheRef.current = { fingerprint: null, file: null };
  }, [proposalPdfFingerprint]);

  useEffect(() => {
    if (activeTab !== "previa") return undefined;
    const root = pdfExportRootRef.current;
    if (!root) return undefined;
    waitForProposalAssets(root).catch((error) => {
      if (import.meta.env.DEV) console.warn("Não foi possível pré-carregar os assets do PDF", error);
    });
    return undefined;
  }, [activeTab, proposalPdfFingerprint]);

  useEffect(() => {
    if (activeTab !== "previa" || !clientDetailsComplete || !estruturaSelecionadaId) return undefined;
    if (proposalPdfCacheRef.current.fingerprint === proposalPdfFingerprint || pdfGenerationRef.current) return undefined;

    let cancelled = false;
    let idleId;
    const prepare = () => {
      if (cancelled || pdfGenerationRef.current) return;
      getProposalPdfFile().catch((error) => {
        if (import.meta.env.DEV) console.warn("Não foi possível preparar o PDF em segundo plano", error);
      });
    };
    const timeout = window.setTimeout(() => {
      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(prepare, { timeout: 2500 });
      } else {
        prepare();
      }
    }, 1000);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      if (idleId !== undefined && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId);
    };
  }, [activeTab, clientDetailsComplete, estruturaSelecionadaId, proposalPdfFingerprint]);

  useEffect(() => {
    if (!loaded || proposalNumber === null) return undefined;
    if (saveProposalTimer.current) clearTimeout(saveProposalTimer.current);
    saveProposalTimer.current = setTimeout(() => saveCurrentProposal({ silent: true }), 650);
    return () => clearTimeout(saveProposalTimer.current);
  }, [
    loaded, proposalNumber, currentProposalId, clientName, eventDate, eventLocal, eventType,
    showDuration, notes, structureMode, estruturaSelecionadaId, selectedPkgId, packages, estruturas,
    customEquipment, equipamentosAdicionais, extraItems, paymentTerms, showPaymentTerms,
    budgetValueInCents, priceOverride, selectedItemIds,
  ]);

  function selectPackage(id) {
    setSelectedPkgId(id);
    setPriceOverride(null);
  }

  function selecionarEstrutura(id) {
    setEstruturaSelecionadaId(id);
  }

  function toggleEquipamentoAdicional(equipment) {
    if (!equipment || !equipment.id) return;
    const exists = equipamentosAdicionais.find((it) => it.itemId === equipment.id);
    if (exists) {
      setEquipamentosAdicionais((prev) => prev.filter((it) => it.itemId !== equipment.id));
    } else {
      setEquipamentosAdicionais((prev) => [...prev, { itemId: equipment.id, quantidade: 1, valorUnitario: 0 }]);
    }
  }

  function updateEquipamentoAdicional(itemId, field, value) {
    setEquipamentosAdicionais((prev) => prev.map((it) => (it.itemId === itemId ? { ...it, [field]: value } : it)));
  }

  function requestDeletePackage(id) {
    setPendingDeletePackageId(id);
    setDeleteSuccessMessage("");
  }

  function confirmDeletePackage() {
    const id = pendingDeletePackageId;
    const packageToDelete = packages.find((pkg) => pkg.id === id);
    if (!packageToDelete) {
      setPendingDeletePackageId(null);
      return;
    }

    const nextPackages = packages.filter((pkg) => pkg.id !== id);
    setPackages(nextPackages);
    if (selectedPkgId === id) {
      setSelectedPkgId(nextPackages[0]?.id || "");
      setPriceOverride(null);
    }
    setPendingDeletePackageId(null);
    setDeleteSuccessMessage(`Estrutura "${packageToDelete.name || "sem nome"}" apagada com sucesso.`);
    window.setTimeout(() => setDeleteSuccessMessage(""), 3000);
  }

  function cancelDeletePackage() {
    setPendingDeletePackageId(null);
  }

  function validateClientField(field, value) {
    const isEmpty = !String(value || "").trim();
    const messages = {
      clientName: "Informe o nome do cliente ou casal.",
      eventDate: "Informe a data do evento.",
      eventLocal: "Informe o local do evento.",
    };
    setClientErrors((prev) => ({ ...prev, [field]: isEmpty ? messages[field] : "" }));
    return !isEmpty;
  }

  function validateClientDetails() {
    const nameValid = validateClientField("clientName", clientName);
    const dateValid = validateClientField("eventDate", eventDate);
    const localValid = validateClientField("eventLocal", eventLocal);
    return nameValid && dateValid && localValid;
  }

  function handleBudgetValueChange(event) {
    const parsed = parseBudgetValueInput(event.target.value);
    setBudgetValueInput(parsed.input);
    setBudgetValueError(parsed.valid ? "" : "Informe um valor monetário válido e não negativo.");
    if (parsed.valid) setBudgetValueInCents(parsed.cents);
  }

  function handleBudgetValueFocus() {
    setBudgetValueInput(budgetValueInCents ? formatBudgetValueInput(budgetValueInCents) : "");
  }

  function handleBudgetValueBlur() {
    if (budgetValueError) return;
    setBudgetValueInput(budgetValueInCents ? formatBudgetValue(budgetValueInCents) : "");
  }

  function updatePackageField(id, field, value) {
    setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }

  function removePackageItem(id, idx) {
    setPackages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, items: p.items.filter((_, i) => i !== idx) } : p))
    );
  }

  function createPackage() {
    const id = uid();
    const newPackage = {
      id,
      name: `Estrutura ${packages.length + 1}`, 
      price: 0,
      photos: [],
      items: [],
    };
    setPackages((prev) => [...prev, newPackage]);
    setSelectedPkgId(id);
    setPriceOverride(null);
  }

  function togglePackageEquipment(equipment) {
    if (!selectedPkg) return;
    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id !== selectedPkg.id) return pkg;
        const hasEquipment = pkg.items.some((item) => item.itemId === equipment.id);
        return {
          ...pkg,
          items: hasEquipment
            ? pkg.items.filter((item) => item.itemId !== equipment.id)
            : [...pkg.items, { itemId: equipment.id, quantidade: 1, valorUnitario: 0 }],
        };
      })
    );
  }

  function addEquipmentToCatalog() {
    const typedEquipment = newEquipmentName.trim();
    if (!typedEquipment) return;
    const existingEquipment = completeCatalog.find(
      (item) => item.nome.toLocaleLowerCase("pt-BR") === typedEquipment.toLocaleLowerCase("pt-BR")
    );
    const equipment = existingEquipment || makeCustomCatalogItem(typedEquipment);
    if (!existingEquipment) setCustomEquipment((prev) => [...prev, equipment]);
    if (selectedPkg && !selectedPkg.items.some((item) => item.itemId === equipment.id)) togglePackageEquipment(equipment);
    setNewEquipmentName("");
    setEquipmentSearch("");
  }

  function addPackagePhoto(id, dataUrl) {
    setPackages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, photos: [...(p.photos || []), dataUrl].slice(0, 4) } : p))
    );
  }

  function removePackagePhoto(id, idx) {
    setPackages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, photos: (p.photos || []).filter((_, i) => i !== idx) } : p))
    );
  }

  async function handlePhotoUpload(id, e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      addPackagePhoto(id, dataUrl);
    } catch (err) {
      // upload falhou (arquivo inválido) — ignora silenciosamente
    }
    e.target.value = "";
  }

  function addExtraItem() {
    setExtraItems((prev) => [...prev, { id: uid(), desc: "", price: 0 }]);
  }

  function updateExtraItem(id, field, value) {
    setExtraItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  }

  function removeExtraItem(id) {
    setExtraItems((prev) => prev.filter((it) => it.id !== id));
  }

  function saveCurrentProposal({ silent = false } = {}) {
    const isNewProposal = !currentProposalId;
    const storedCounter = Number.parseInt(loadText(COUNTER_KEY, "0"), 10) || 0;
    const number = proposalNumber || storedCounter + 1;
    const existingProposal = currentProposalId
      ? savedProposalsRef.current.find((proposal) => proposal.id === currentProposalId)
      : null;
    const snapshot = {
      id: currentProposalId || uid(),
      number,
      createdAt: existingProposal?.createdAt || new Date().toISOString(),
      clientName,
      eventDate,
      eventLocal,
      eventType,
      showDuration,
      notes,
      packageId: proposalPkg?.id,
      packageName: proposalPkg?.name || "Estrutura selecionada para o seu evento", 
      packageSnapshot: copyPackage(proposalPkg),
      // preserve structure and item selections so saved proposals fully restore
      structureMode,
      selectedStructureId: estruturaSelecionadaId,
      selectedItemIds,
      itemSnapshots: selectedProposalItems.map(({ itemOrcamento, itemCatalogo }) => ({
        itemId: itemOrcamento.itemId,
        nome: itemCatalogo.nome,
        descricao: itemCatalogo.descricao,
        categoria: itemCatalogo.categoria,
        imagem: itemCatalogo.imagem,
        quantidade: itemOrcamento.quantidade,
        valorUnitario: itemOrcamento.valorUnitario,
      })),
      basePrice,
      priceOverride,
      extraItems: extraItems.map((item) => ({ ...item })),
      paymentTerms,
      showPaymentTerms,
      budgetValueInCents,
      total,
    };
    const idx = savedProposalsRef.current.findIndex((proposal) => proposal.id === snapshot.id);
    const next = idx >= 0
      ? savedProposalsRef.current.map((proposal, index) => (index === idx ? snapshot : proposal))
      : [snapshot, ...savedProposalsRef.current];
    const saved = saveJSON(PROPOSALS_KEY, next);
    const counterSaved = !isNewProposal || saveText(COUNTER_KEY, String(number));
    savedProposalsRef.current = next;
    setSavedProposals(next);
    setCurrentProposalId(snapshot.id);
    setProposalNumber(number);
    if (!saved || !counterSaved) setSaveState("error");
    else if (!silent) setSaveState("saved");
  }

  function newProposal() {
    setClientName("");
    setEventDate("");
    setEventLocal("");
    setEventType("");
    setShowDuration("");
    setClientErrors({});
    setNotes("");
    setBudgetValueInCents(0);
    setBudgetValueInput("");
    setBudgetValueError("");
    setExtraItems([]);
    setPriceOverride(null);
    setCurrentProposalId(null);
    restoredProposalIdRef.current = null;
    const storedCounter = Number.parseInt(loadText(COUNTER_KEY, "0"), 10) || 0;
    const highestSavedNumber = savedProposals.reduce(
      (highest, proposal) => Math.max(highest, Number(proposal.number) || 0),
      0
    );
    setProposalNumber(Math.max(storedCounter, highestSavedNumber) + 1);
  }

  function validateProposalAction() {
    if (!validateClientDetails()) {
      setActiveTab("editar");
      window.setTimeout(() => {
        const firstError = document.querySelector(".obg-input-error");
        if (firstError) {
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
          firstError.focus({ preventScroll: true });
        }
      }, 0);
      return false;
    }
    if (!estruturaSelecionadaId) {
      setActiveTab("editar");
      window.setTimeout(() => {
        const el = document.querySelector('.obg-section');
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      }, 0);
      alert('Selecione uma estrutura antes de gerar o PDF.');
      return false;
    }
    return true;
  }

  async function getProposalPdfFile({ onProgress } = {}) {
    const cached = proposalPdfCacheRef.current;
    if (cached.file && cached.fingerprint === proposalPdfFingerprint) {
      return { file: cached.file, fromCache: true };
    }
    if (pdfGenerationRef.current) return pdfGenerationRef.current;

    const generation = (async () => {
      const container = pdfExportRootRef.current;
      const file = await generateProposalPdfFile({ container, clientName, onProgress });
      proposalPdfCacheRef.current = { fingerprint: proposalPdfFingerprint, file };
      return { file, fromCache: false };
    })();
    pdfGenerationRef.current = generation;

    try {
      return await generation;
    } finally {
      pdfGenerationRef.current = null;
    }
  }

  async function handlePrint() {
    if (!validateProposalAction() || pdfActionState !== "idle") return;
    setPdfNotice("");
    setPdfProgress(null);
    setPdfActionState("generating");
    try {
      const { file } = await getProposalPdfFile({
        onProgress: ({ current, total }) => {
          setPdfProgress({ current, total });
          setPdfNotice(`Preparando PDF — página ${current} de ${total}`);
        },
      });
      downloadProposalPdfFile(file);
      setPdfNotice("PDF baixado com links clicáveis.");
    } catch (error) {
      if (import.meta.env.DEV) console.error("Falha ao preparar o PDF para download", error);
      setPdfNotice("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setPdfProgress(null);
      setPdfActionState("idle");
    }
  }

  function downloadAndOfferWhatsApp(file) {
    downloadProposalPdfFile(file);
    setShareFallbackOpen(true);
    setPdfNotice("O PDF foi baixado. Agora anexe o arquivo na conversa do WhatsApp.");
  }

  async function handleWhatsAppShare() {
    if (!validateProposalAction() || pdfActionState !== "idle") return;
    setPdfNotice("");
    setPdfProgress(null);
    setShareFallbackOpen(false);
    setPdfActionState("generating");

    let result;
    try {
      result = await getProposalPdfFile({
        onProgress: ({ current, total }) => {
          setPdfProgress({ current, total });
          setPdfNotice(`Preparando PDF — página ${current} de ${total}`);
        },
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error("Falha ao gerar PDF para compartilhamento", error);
      setPdfNotice("Não foi possível gerar o PDF. Tente novamente.");
      setPdfProgress(null);
      setPdfActionState("idle");
      return;
    }

    const shareData = {
      files: [result.file],
      title: "Proposta Lucas Franco — DJ",
      text: buildWhatsAppMessage({ clientName }),
    };
    const canShareFile = typeof navigator.share === "function"
      && typeof navigator.canShare === "function"
      && navigator.canShare({ files: [result.file] });

    if (!canShareFile) {
      downloadAndOfferWhatsApp(result.file);
      setPdfProgress(null);
      setPdfActionState("idle");
      return;
    }

    try {
      setPdfProgress(null);
      setPdfNotice("Abrindo compartilhamento...");
      await navigator.share(shareData);
    } catch (error) {
      if (error?.name === "AbortError") return;
      if (result.fromCache === false && ["NotAllowedError", "SecurityError"].includes(error?.name)) {
        setPdfNotice("PDF pronto. Toque novamente para compartilhar.");
        return;
      }
      if (import.meta.env.DEV) console.error("Falha ao compartilhar proposta", error);
      downloadAndOfferWhatsApp(result.file);
    } finally {
      setPdfProgress(null);
      setPdfActionState("idle");
    }
  }

  function openWhatsAppFallback() {
    const text = encodeURIComponent(buildWhatsAppMessage({ clientName }));
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const url = isMobile ? `https://wa.me/?text=${text}` : `https://web.whatsapp.com/send?text=${text}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function renderProposalPages() {
    return (
      <>
        <PdfCoverPage />
        <PdfBiographyPage />
        <PdfBudgetDataPage
          eventType={eventType}
          location={eventLocal}
          eventDate={eventDate}
          showDuration={showDuration}
          clientName={clientName}
        />

        {structureMode === 'with_structure' && estruturaSelecionadaId && (
          <PdfBudgetStructurePage structure={estruturaSelecionada} />
        )}

        <PdfProposalCategoryPages categories={pdfProposalCategories} />

        {budgetValueInCents > 0 && (
          <>
            <WeddingExperiencePage />
            <InvestmentPage
              valueInCents={budgetValueInCents}
              proposalNumber={proposalNumber}
              clientName={clientName}
              eventDate={formatDateBR(eventDate)}
              eventLocation={eventLocal}
              showPaymentTerms={showPaymentTerms}
            />
          </>
        )}
      </>
    );
  }

  return (
    <div className="obg-shell" data-tab={activeTab}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');

        .obg-shell {
          --bg: #faf9f7;
          --bg-card: #ffffff;
          --line: #e6e2da;
          --ink: #1c1a17;
          --ink-soft: #746e64;
          --accent: #a3793f;
          --accent-soft: #f1e6d3;
          --radius: 14px;
          --radius-sm: 9px;
          --dark: #0d0e12;
          --dark-card: #14161c;
          --gold: #c9a961;
          --gold-soft: rgba(201,169,97,0.35);
          --cream: #f3efe6;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: var(--bg);
          color: var(--ink);
          max-width: 100%;
          min-height: 100%;
          box-sizing: border-box;
          padding-bottom: 84px;
        }
        .obg-shell *, .obg-shell *::before, .obg-shell *::after { box-sizing: border-box; }

        .obg-header {
          display: flex; align-items: center; gap: 10px;
          padding: 16px 16px 10px;
        }
        .obg-header .logo-badge {
          width: 34px; height: 34px; border-radius: 50%;
          background: var(--dark); color: var(--gold);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .obg-header h1 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 18px; margin: 0; font-weight: 700; letter-spacing: 0.2px;
        }
        .obg-header p { margin: 0; font-size: 12px; color: var(--ink-soft); }
        .obg-save-pill {
          margin-left: auto; font-size: 11px; color: var(--ink-soft);
          display: flex; align-items: center; gap: 5px;
        }
        .obg-save-pill .dot {
          width: 6px; height: 6px; border-radius: 50%; background: #9aa08e;
        }
        .obg-save-pill.saved .dot { background: #5c8a5c; }
        .obg-save-pill.error { color: #b34242; }
        .obg-save-pill.error .dot { background: #b34242; }

        .obg-tabs {
          display: flex; gap: 6px; padding: 4px 16px 12px;
        }
        .obg-tabs button {
          flex: 1; border: 1px solid var(--line); background: var(--bg-card);
          color: var(--ink-soft); font-size: 13px; font-weight: 600;
          padding: 9px 10px; border-radius: 999px; cursor: pointer;
        }
        .obg-tabs button.active { background: var(--dark); color: var(--gold); border-color: var(--dark); }

        .obg-body {
          padding: 0 16px 16px;
          display: flex; flex-direction: column; gap: 16px;
        }

        .obg-panel-editor, .obg-panel-preview { display: block; min-width: 0; }

        @media screen and (max-width: 859px) {
          .obg-shell[data-tab="editar"] .obg-panel-preview { display: none; }
          .obg-shell[data-tab="previa"] .obg-panel-editor { display: none; }
        }

        .obg-section {
          background: var(--bg-card); border: 1px solid var(--line);
          border-radius: var(--radius); padding: 14px;
        }
        .obg-section + .obg-section { margin-top: 12px; }
        .obg-section h2 {
          font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;
          color: var(--ink-soft); margin: 0 0 10px; font-weight: 700;
        }
        .obg-section-help { margin: -2px 0 12px; color: var(--ink-soft); font-size: 12px; line-height: 1.45; }

        .obg-field { margin-bottom: 10px; }
        .obg-field:last-child { margin-bottom: 0; }
        .obg-field label {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; color: var(--ink-soft); margin-bottom: 5px; font-weight: 600;
        }
        .obg-field input, .obg-field textarea, .obg-field select {
          width: 100%; border: 1px solid var(--line); border-radius: var(--radius-sm);
          padding: 11px 12px; font-size: 15px; font-family: inherit; color: var(--ink);
          background: #fff; -webkit-appearance: none; appearance: none;
        }
        .obg-field input:focus, .obg-field textarea:focus, .obg-field select:focus {
          outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(35, 101, 152, .15);
        }
        .obg-field input.obg-input-error { border-color: #b34242; }
        .obg-required { color: #b34242; }
        .obg-field-error { color: #b34242; font-size: 11px; margin: 5px 0 0; font-weight: 600; }
        .obg-field-help { color: var(--ink-soft); font-size: 11px; margin: 5px 0 0; }
        .obg-field textarea { resize: vertical; min-height: 64px; }

        .obg-currency-wrap { position: relative; }
        .obg-currency-wrap .obg-currency-prefix {
          position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
          font-size: 15px; color: var(--ink-soft); pointer-events: none;
        }
        .obg-currency-wrap input,
        .obg-pkg-editor .obg-currency-wrap input { padding-left: 34px; }

        .obg-pkg-grid { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px; }
        .obg-pkg-chip {
          flex: 0 0 auto; border: 1.5px solid var(--line); background: #fff;
          border-radius: var(--radius-sm); position: relative; min-width: 132px;
        }
        .obg-pkg-select {
          width: 100%; min-height: 62px; border: none; border-radius: inherit; padding: 10px 30px 10px 14px;
          background: transparent; color: var(--ink); cursor: pointer; text-align: left; font: inherit;
        }
        .obg-pkg-chip.active { border-color: var(--accent); background: var(--accent-soft); }
        .obg-pkg-chip .name { font-weight: 700; font-size: 13px; }
        .obg-pkg-chip .price { font-size: 12px; color: var(--ink-soft); margin-top: 2px; }
        .obg-pkg-delete {
          position: absolute; top: 5px; right: 5px; width: 21px; height: 21px; padding: 0; border: none;
          border-radius: 50%; background: transparent; color: var(--ink-soft); display: flex;
          align-items: center; justify-content: center; cursor: pointer;
        }
        .obg-pkg-delete:hover { background: rgba(0,0,0,0.08); color: #b34242; }
        .obg-delete-question {
          display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 10px;
          padding: 10px 12px; border: 1px solid #ead8bf; border-radius: var(--radius-sm); background: #fffaf2;
          color: var(--ink); font-size: 12px;
        }
        .obg-delete-question p { margin: 0; }
        .obg-delete-question-actions { display: flex; gap: 6px; flex-shrink: 0; }
        .obg-delete-question-actions button {
          border: 1px solid var(--line); border-radius: 999px; padding: 6px 10px; background: #fff;
          color: var(--ink); font: inherit; font-size: 11px; font-weight: 700; cursor: pointer;
        }
        .obg-delete-question-actions .confirm { background: #b34242; color: #fff; border-color: #b34242; }
        .obg-delete-question-actions button:hover { filter: brightness(0.96); }
        .obg-delete-success { margin: 8px 0 0; color: #4f7e55; font-size: 11px; font-weight: 700; }

        .obg-pkg-editor { margin-top: 14px; border-top: 1px dashed var(--line); padding-top: 12px; }
        .obg-pkg-editor input, .obg-pkg-editor textarea {
          width: 100%; border: 1px solid var(--line); border-radius: var(--radius-sm);
          padding: 11px 12px; font-size: 15px; font-family: inherit; color: var(--ink);
          background: #fff;
        }
        .obg-pkg-editor input:focus, .obg-pkg-editor textarea:focus {
          outline: none; border-color: var(--accent);
        }
        .obg-pkg-editor .row { display: flex; gap: 8px; margin-bottom: 8px; }
        .obg-pkg-editor .row input[data-role="name"] { flex: 1; font-weight: 600; }

        .obg-empty-package {
          margin: 12px 0 0; padding: 12px; border-radius: var(--radius-sm);
          background: #faf7f1; border: 1px dashed var(--line); color: var(--ink-soft);
          font-size: 13px; line-height: 1.45;
        }
        .obg-equipment-section { margin-top: 14px; border-top: 1px dashed var(--line); padding-top: 12px; }
        .obg-equipment-title { font-size: 12px; font-weight: 700; color: var(--ink); margin-bottom: 3px; }
        .obg-equipment-help { color: var(--ink-soft); font-size: 11px; line-height: 1.4; margin: 0 0 8px; }
        .obg-equipment-selected { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 10px; }
        .obg-equipment-tag {
          display: inline-flex; align-items: center; gap: 5px; padding: 5px 7px 5px 9px;
          border-radius: 999px; background: var(--accent-soft); color: var(--ink); font-size: 12px; font-weight: 600;
        }
        .obg-equipment-tag button {
          width: 16px; height: 16px; padding: 0; border: none; border-radius: 50%; background: transparent;
          color: var(--ink-soft); display: inline-flex; align-items: center; justify-content: center; cursor: pointer;
        }
        .obg-equipment-tag button:hover { background: rgba(0,0,0,0.08); color: var(--ink); }
        .obg-equipment-search { margin-bottom: 8px; }
        .obg-equipment-results-label { color: var(--ink-soft); font-size: 11px; font-weight: 600; margin: 0 0 6px; }
        .obg-equipment-list { display: flex; flex-wrap: wrap; gap: 6px; }
        .obg-equipment-option {
          display: inline-flex; align-items: center; gap: 5px; border: 1px solid var(--line); background: #fff;
          color: var(--ink); border-radius: 999px; padding: 7px 9px; font: inherit; font-size: 12px; cursor: pointer;
        }
        .obg-equipment-option:hover { border-color: var(--accent); }
        .obg-equipment-option.selected { background: var(--dark); border-color: var(--dark); color: var(--gold); }
        .obg-equipment-option .marker { font-size: 13px; line-height: 1; }
        .obg-equipment-no-results { width: 100%; color: var(--ink-soft); font-size: 12px; padding: 6px 0; }
        .obg-equipment-add { display: flex; gap: 6px; margin-top: 10px; }
        .obg-equipment-add input { min-width: 0; flex: 1; }
        .obg-equipment-add button {
          flex-shrink: 0; border: 1px solid var(--line); border-radius: var(--radius-sm); background: #fff;
          color: var(--accent); font: inherit; font-size: 12px; font-weight: 700; padding: 0 10px; cursor: pointer;
        }
        .obg-equipment-add button:hover { background: var(--accent-soft); border-color: var(--accent); }

        .obg-item-row { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
        .obg-item-row input {
          flex: 1; width: 100%; border: 1px solid var(--line); border-radius: var(--radius-sm);
          padding: 11px 12px; font-size: 15px; font-family: inherit; color: var(--ink); background: #fff;
        }
        .obg-item-row input:focus { outline: none; border-color: var(--accent); }
        .obg-icon-btn {
          border: none; background: transparent; color: var(--ink-soft);
          width: 30px; height: 30px; border-radius: 8px; cursor: pointer;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .obg-icon-btn:hover { background: #f1efe9; color: var(--ink); }

        .obg-add-line {
          display: flex; align-items: center; gap: 6px; font-size: 13px;
          color: var(--accent); font-weight: 600; background: none; border: none;
          cursor: pointer; padding: 6px 2px;
        }

        .obg-photos-section { margin-top: 14px; border-top: 1px dashed var(--line); padding-top: 12px; }
        .obg-photos-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .obg-photo-thumb {
          position: relative; width: 62px; height: 62px; border-radius: 8px;
          overflow: hidden; border: 1px solid var(--line); flex-shrink: 0;
        }
        .obg-photo-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .obg-photo-remove {
          position: absolute; top: 2px; right: 2px; width: 17px; height: 17px; border-radius: 50%;
          background: rgba(0,0,0,0.62); color: #fff; border: none; display: flex;
          align-items: center; justify-content: center; cursor: pointer; padding: 0;
        }
        .obg-photo-add {
          width: 62px; height: 62px; border-radius: 8px; border: 1.5px dashed var(--line);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 2px; font-size: 8.5px; color: var(--ink-soft); cursor: pointer; text-align: center;
          flex-shrink: 0;
        }
        .obg-photo-add span { line-height: 1.1; }
        .obg-photos-hint { font-size: 11px; color: var(--ink-soft); margin-top: 6px; }

        .obg-ghost-btn {
          display: inline-flex; align-items: center; gap: 6px; font-size: 12px;
          color: var(--ink-soft); background: none; border: 1px solid var(--line);
          border-radius: 999px; padding: 6px 12px; cursor: pointer;
        }

        /* ---------- PREVIEW / PROPOSAL CARD ---------- */
        .obg-preview-wrap { display: flex; flex-direction: column; gap: 12px; }
        .obg-actions-row { display: flex; gap: 8px; }
        .obg-actions-row button {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
          padding: 12px; border-radius: 999px; font-size: 13.5px; font-weight: 700;
          border: none; cursor: pointer;
        }
        .obg-actions-row button:disabled, .obg-bottom-bar button:disabled { cursor: wait; opacity: .58; }
        .obg-spin { animation: obg-spin .8s linear infinite; }
        @keyframes obg-spin { to { transform: rotate(360deg); } }
        .obg-btn-dark { background: var(--dark); color: var(--gold); }
        .obg-btn-dark:disabled { cursor: not-allowed; opacity: 0.52; }
        .obg-btn-outline { background: #fff; color: var(--ink); border: 1px solid var(--line) !important; }
        .obg-pdf-hint { margin: -4px 0 0; color: #9a5a33; font-size: 11px; font-weight: 600; text-align: center; }
        .obg-action-notice { margin: -4px 0 0; color: var(--ink-soft); font-size: 12px; font-weight: 600; text-align: center; }
        .obg-share-fallback { position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(15, 14, 12, .42); }
        .obg-share-fallback-dialog { width: min(100%, 390px); border-radius: 16px; padding: 22px; background: #fff; box-shadow: 0 18px 52px rgba(0, 0, 0, .22); }
        .obg-share-fallback-dialog h3 { margin: 0 0 8px; font-family: 'Playfair Display', Georgia, serif; font-size: 22px; }
        .obg-share-fallback-dialog p { margin: 0; color: var(--ink-soft); font-size: 14px; line-height: 1.5; }
        .obg-share-fallback-actions { display: flex; gap: 8px; margin-top: 18px; }
        .obg-share-fallback-actions button { flex: 1; min-height: 44px; border-radius: 999px; font-weight: 700; cursor: pointer; }

        .obg-card {
          background: var(--dark-card); color: var(--cream);
          border-radius: 18px; padding: 28px 24px 24px;
          position: relative; overflow: hidden;
        }
        .obg-card::before {
          content: ""; position: absolute; inset: 0;
          background: radial-gradient(circle at 15% 0%, rgba(201,169,97,0.12), transparent 55%);
          pointer-events: none;
        }
        .obg-card .brand {
          display: flex; align-items: center; gap: 8px; margin-bottom: 18px;
        }
        .obg-card .brand .badge {
          width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--gold-soft);
          display: flex; align-items: center; justify-content: center; color: var(--gold);
        }
        .obg-card .brand .name { font-family: 'Playfair Display', Georgia, serif; font-size: 15px; font-weight: 700; letter-spacing: 0.3px; }
        .obg-card .brand .num { margin-left: auto; font-size: 11px; color: rgba(243,239,230,0.55); }

        .obg-card h3 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 26px; margin: 0 0 4px; font-weight: 700;
        }
        .obg-card .subtitle { font-size: 13px; color: rgba(243,239,230,0.6); margin-bottom: 18px; }

        .obg-card .meta-row { display: flex; flex-wrap: wrap; gap: 14px; font-size: 12.5px; color: rgba(243,239,230,0.75); margin-bottom: 18px; }
        .obg-card .meta-row span { display: flex; align-items: center; gap: 5px; }
        .obg-card .divider { height: 1px; background: var(--gold-soft); margin: 18px 0; border: none; }

        .obg-card .card-photos {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(68px, 1fr));
          gap: 6px; margin-bottom: 14px;
        }
        .obg-card .card-photos img {
          width: 100%; height: 62px; object-fit: cover; border-radius: 8px;
          border: 1px solid var(--gold-soft); display: block;
        }

        .obg-card-items { display: flex; flex-direction: column; gap: 13px; }
        .obg-item-group { break-inside: avoid; page-break-inside: avoid; }
        .obg-item-group h4 {
          color: var(--gold); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
          margin: 0 0 6px; font-weight: 700;
        }
        .obg-proposal-item {
          display: flex; align-items: center; gap: 9px; min-height: 48px; padding: 5px 0;
          color: rgba(243,239,230,0.9); break-inside: avoid; page-break-inside: avoid;
        }
        .obg-proposal-item-image {
          width: 54px; height: 40px; border-radius: 6px; object-fit: cover; flex-shrink: 0;
          border: 1px solid var(--gold-soft); background: var(--dark);
        }
        .obg-proposal-item-copy { min-width: 0; }
        .obg-proposal-item-name { display: flex; gap: 7px; font-size: 13px; font-weight: 700; line-height: 1.25; }
        .obg-proposal-item-quantity { color: var(--gold); flex-shrink: 0; }
        .obg-proposal-item-description { color: rgba(243,239,230,0.58); font-size: 11px; line-height: 1.35; margin-top: 2px; }
        .obg-proposal-extra-item {
          display: flex; gap: 8px; font-size: 13px; padding: 5px 0; color: rgba(243,239,230,0.9);
          break-inside: avoid; page-break-inside: avoid;
        }
        .obg-proposal-extra-item .tick { color: var(--gold); flex-shrink: 0; }
        .obg-extra-price { color: rgba(243,239,230,0.5); margin-left: 4px; }

        .obg-card .price-block { margin-top: 18px; text-align: right; }
        .obg-card .price-block .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(243,239,230,0.55); }
        .obg-card .price-block .value {
          font-family: 'Playfair Display', Georgia, serif; font-size: 32px; font-weight: 700; color: var(--gold);
        }
        .obg-card .validity { font-size: 11.5px; color: rgba(243,239,230,0.55); margin-top: 4px; }
        .obg-card .notes { margin-top: 16px; font-size: 12.5px; color: rgba(243,239,230,0.7); white-space: pre-wrap; }
        .obg-card .payment-terms {
          margin-top: 14px; padding-top: 14px; border-top: 1px dashed var(--gold-soft);
          font-size: 11.5px; line-height: 1.5; color: rgba(243,239,230,0.65);
        }
        .obg-card .payment-terms-label {
          font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em;
          color: rgba(243,239,230,0.5); margin-bottom: 4px; font-weight: 700;
        }
        .obg-card .footer-tag {
          margin-top: 22px; font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase;
          color: rgba(243,239,230,0.4); text-align: center;
        }

        .obg-total-line { display: flex; justify-content: space-between; font-size: 13px; padding: 3px 0; color: rgba(243,239,230,0.75); }

        /* Sticky bottom bar (mobile) */
        .obg-bottom-bar {
          position: fixed; left: 0; right: 0; bottom: 0;
          background: var(--bg-card); border-top: 1px solid var(--line);
          padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
          display: flex; gap: 8px; z-index: 20;
        }
        .obg-bottom-bar button {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 12px; border-radius: 999px; font-size: 13.5px; font-weight: 700; border: none; cursor: pointer;
        }

        @media (min-width: 860px) {
          .obg-shell { padding-bottom: 24px; }
          .obg-tabs { display: none; }
          .obg-bottom-bar { display: none; }
          .obg-body { flex-direction: row; align-items: flex-start; padding: 0 24px 24px; gap: 20px; }
          .obg-panel-editor { flex: 1; min-width: 0; }
          .obg-panel-preview { flex: 0 0 380px; position: sticky; top: 20px; }
          .obg-header { padding: 20px 24px 12px; }
        }

        @page { size: A4 portrait; margin: 0; }

        /* The wrapper alone scales previews; every inner page stays 1055 × 1491. */
        .pdf-preview-viewport {
          width: 100%; max-width: 100%; margin: 0 auto; padding: 8px;
          overflow-x: hidden; box-sizing: border-box;
        }
        .pdf-pages-container {
          display: flex; flex-direction: column; align-items: stretch; gap: 16px;
          width: 100%; min-width: 0; margin: 0; padding: 0;
        }
        .pdf-preview-item {
          display: flex; justify-content: center; width: 100%; min-width: 0;
          margin: 0; padding: 0; box-sizing: border-box;
        }
        .pdf-page-scaler {
          position: relative; flex: 0 0 auto; overflow: hidden; background: #191a1e;
          border-radius: 6px; box-shadow: 0 6px 20px rgba(0,0,0,0.16);
        }
        .pdf-page {
          position: relative; width: 1055px; height: 1491px; margin: 0; padding: 0;
          overflow: hidden; box-sizing: border-box; isolation: isolate; transform-origin: top left; background: #191a1e;
        }
        .pdf-page--full-bleed { background: #191a1e; }
        .pdf-page-image {
          display: block; width: 100%; height: 100%; margin: 0; padding: 0; border: 0;
          object-fit: cover; object-position: center;
        }
        .pdf-export-root {
          position: fixed; top: 0; left: -20000px; z-index: -1; width: 1055px;
          pointer-events: none; overflow: visible;
        }
        .pdf-export-root .pdf-pages-container { display: block; width: 1055px; margin: 0; padding: 0; }
        .pdf-export-root .pdf-preview-item { display: block; width: 1055px; height: 1491px; margin: 0; padding: 0; }
        .pdf-export-root .pdf-page-scaler { width: 1055px !important; height: 1491px !important; overflow: visible; border-radius: 0; box-shadow: none; }
        .pdf-export-root .pdf-page { width: 1055px !important; height: 1491px !important; max-width: none !important; transform: none !important; }

        @media screen and (max-width: 600px) {
          .pdf-preview-viewport { padding: 6px; }
          .pdf-pages-container { gap: 12px; }
          .pdf-page-scaler { border-radius: 0; box-shadow: none; }
        }

        @media print {
          html, body, #root {
            width: 210mm !important; height: auto !important; margin: 0 !important;
            padding: 0 !important; background: transparent !important;
          }

          .obg-header, .obg-tabs, .obg-panel-editor, .obg-bottom-bar,
          .obg-actions-row, .obg-pdf-hint, .obg-card, .pdf-export-root { display: none !important; }

          .obg-shell, .obg-body, .obg-panel-preview, .obg-preview-wrap,
          .pdf-preview-viewport, .pdf-pages-container, .obg-print-area {
            position: static !important; display: block !important; width: 210mm !important;
            min-width: 210mm !important; max-width: 210mm !important; margin: 0 !important;
            padding: 0 !important; gap: 0 !important; overflow: visible !important;
            background: transparent !important;
          }

          body * { visibility: hidden; }
          .obg-print-area, .obg-print-area * { visibility: visible; }

          .pdf-preview-item {
            position: relative !important; display: block !important; width: 210mm !important;
            height: 297mm !important; min-width: 210mm !important; min-height: 297mm !important;
            max-width: 210mm !important; max-height: 297mm !important; margin: 0 !important;
            padding: 0 !important; overflow: hidden !important; box-sizing: border-box !important;
            break-after: page !important; page-break-after: always !important;
            break-inside: avoid !important; page-break-inside: avoid !important;
          }
          .pdf-preview-item:last-child { break-after: auto !important; page-break-after: auto !important; }

          .pdf-page-scaler {
            position: relative !important; display: block !important; width: 210mm !important;
            height: 297mm !important; margin: 0 !important; padding: 0 !important;
            overflow: hidden !important; border: 0 !important; border-radius: 0 !important;
            box-shadow: none !important; transform: none !important;
          }

          /* 210 mm equals 793.701 CSS pixels. Scale only the fixed canvas,
             never individual text, images or absolute-positioned elements. */
          .pdf-page {
            position: relative !important; display: block !important; width: 1055px !important;
            height: 1491px !important; min-width: 1055px !important; min-height: 1491px !important;
            max-width: 1055px !important; max-height: 1491px !important; margin: 0 !important;
            padding: 0 !important; overflow: hidden !important; box-sizing: border-box !important;
            transform: scale(0.752323) !important; transform-origin: top left !important;
            print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important;
          }
          .pdf-page-image {
            display: block !important; width: 100% !important; height: 100% !important;
            max-width: none !important; max-height: none !important; margin: 0 !important;
            padding: 0 !important; border: 0 !important; object-fit: cover !important;
            object-position: center !important;
          }
        }
      `}</style>

      <div className="obg-header">
        <div className="logo-badge"><Music2 size={16} /></div>
        <div>
          <h1>Orçamentos — DJ Lucas Franco</h1>
          <p>Monte a proposta e envie em segundos</p>
        </div>
        <div className={`obg-save-pill ${saveState}`} role="status" aria-live="polite">
          <span className="dot" />
          {saveState === "saving"
            ? "salvando…"
            : saveState === "error"
              ? "não foi possível salvar"
              : "orçamentos salvos"}
        </div>
      </div>

      <div className="obg-tabs">
        <button className={activeTab === "editar" ? "active" : ""} onClick={() => setActiveTab("editar")}>
          Montar
        </button>
        <button className={activeTab === "previa" ? "active" : ""} onClick={() => setActiveTab("previa")}>
          Prévia
        </button>
      </div>

      <div className="obg-body">
        {/* ---------- EDITOR ---------- */}
        <div className="obg-panel-editor">
          <div className="obg-section">
            <h2>Dados do cliente</h2>
            <div className="obg-field">
              <label><User size={13} /> Nome do cliente / casal <span className="obg-required">*</span></label>
              <input
                className={clientErrors.clientName ? "obg-input-error" : ""}
                value={clientName}
                onChange={(e) => {
                  setClientName(e.target.value);
                  if (clientErrors.clientName) validateClientField("clientName", e.target.value);
                }}
                onBlur={() => validateClientField("clientName", clientName)}
                placeholder="Ana &amp; João"
                required
                aria-invalid={Boolean(clientErrors.clientName)}
              />
              {clientErrors.clientName && <p className="obg-field-error">{clientErrors.clientName}</p>}
            </div>
            <div className="obg-field">
              <label><CalendarDays size={13} /> Data do evento <span className="obg-required">*</span></label>
              <input
                className={clientErrors.eventDate ? "obg-input-error" : ""}
                type="date"
                value={eventDate}
                onChange={(e) => {
                  setEventDate(e.target.value);
                  if (clientErrors.eventDate) validateClientField("eventDate", e.target.value);
                }}
                onBlur={() => validateClientField("eventDate", eventDate)}
                required
                aria-invalid={Boolean(clientErrors.eventDate)}
              />
              {clientErrors.eventDate && <p className="obg-field-error">{clientErrors.eventDate}</p>}
            </div>
            <div className="obg-field">
              <label><MapPin size={13} /> Local <span className="obg-required">*</span></label>
              <input
                className={clientErrors.eventLocal ? "obg-input-error" : ""}
                value={eventLocal}
                onChange={(e) => {
                  setEventLocal(e.target.value);
                  if (clientErrors.eventLocal) validateClientField("eventLocal", e.target.value);
                }}
                onBlur={() => validateClientField("eventLocal", eventLocal)}
                placeholder="Espaço Vila Bela, BH"
                required
                aria-invalid={Boolean(clientErrors.eventLocal)}
              />
              {clientErrors.eventLocal && <p className="obg-field-error">{clientErrors.eventLocal}</p>}
            </div>

            <div className="obg-field">
              <label>Tipo de evento</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                aria-label="Tipo de evento"
              >
                <option value="">Selecione...</option>
                <option value="Casamento">Casamento</option>
                <option value="Festa de 15 anos">Festa de 15 anos</option>
              </select>
            </div>

            <div className="obg-field">
              <label>Duração do show</label>
              <input
                value={showDuration}
                onChange={(e) => setShowDuration(e.target.value)}
                placeholder="Ex: 5 horas, 3h30, Das 20h às 02h"
                aria-label="Duração do show"
              />
            </div>
          </div>

          <div className="obg-section">
            <h2>ESTRUTURA DO EVENTO</h2>
            <p className="obg-equipment-help">O evento terá estrutura?</p>

            {/* Structure mode radios as cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                type="button"
                onClick={() => { setStructureMode('none'); setEstruturaSelecionadaId(null); }}
                aria-pressed={structureMode === 'none'}
                className={`obg-pkg-chip ${structureMode === 'none' ? 'active' : ''}`}
                style={{ borderRadius: 14, padding: 12, textAlign: 'left', background: structureMode === 'none' ? '#0c0d10' : '#fff', border: structureMode === 'none' ? '2px solid #c79a2b' : '1px solid #e5ddd2', color: structureMode === 'none' ? '#fff' : '#000', minHeight: 72 }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Somente DJ e equipamentos</div>
                    <div style={{ fontSize: 13, color: structureMode === 'none' ? '#dcd8d3' : '#6e675f' }}>Continue escolhendo os itens abaixo.</div>
                  </div>
                  <div style={{ marginLeft: 8 }}>
                    {structureMode === 'none' ? <div style={{ width: 28, height: 28, borderRadius: 999, background: '#c79a2b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={14} color="#fff" /></div> : <div style={{ width: 28, height: 28, borderRadius: 999, border: '1px solid #e5ddd2' }} />} 
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setStructureMode('with_structure'); }}
                aria-pressed={structureMode === 'with_structure'}
                className={`obg-pkg-chip ${structureMode === 'with_structure' ? 'active' : ''}`}
                style={{ borderRadius: 14, padding: 12, textAlign: 'left', background: structureMode === 'with_structure' ? '#0c0d10' : '#fff', border: structureMode === 'with_structure' ? '2px solid #c79a2b' : '1px solid #e5ddd2', color: structureMode === 'with_structure' ? '#fff' : '#000', minHeight: 72 }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Adicionar estrutura</div>
                    <div style={{ fontSize: 13, color: structureMode === 'with_structure' ? '#dcd8d3' : '#6e675f' }}>Escolha uma das opções disponíveis.</div>
                  </div>
                  <div style={{ marginLeft: 8 }}>
                    {structureMode === 'with_structure' ? <div style={{ width: 28, height: 28, borderRadius: 999, background: '#c79a2b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={14} color="#fff" /></div> : <div style={{ width: 28, height: 28, borderRadius: 999, border: '1px solid #e5ddd2' }} />}
                  </div>
                </div>
              </button>
            </div>

            {/* Show structures only when with_structure */}
            {structureMode === 'with_structure' && (
              <div style={{ marginTop: 12 }}>
                <p className="obg-equipment-help">Selecione uma estrutura para começar a montar esta proposta.</p>
                <SeletorEstruturas
                  estruturas={estruturas}
                  estruturaSelecionadaId={estruturaSelecionadaId}
                  onSelecionar={(id) => { setEstruturaSelecionadaId(id); setStructureMode('with_structure'); }}
                />
                {deleteSuccessMessage && <p className="obg-delete-success" role="status">{deleteSuccessMessage}</p>}
              </div>
            )}

            {/* Equipamentos e serviços (accordions) */}
            <div style={{ marginTop: 16 }}>
              <h3>EQUIPAMENTOS E SERVIÇOS</h3>
              <p className="obg-equipment-help">Selecione os itens que farão parte da proposta.</p>

              {/* Accordions */}
              <div>
                {[{id:'equipamento', title:'Som e DJ', icon:Music2}, {id:'efeito', title:'Iluminação & Efeitos', icon:ImagePlus}, {id:'servico', title:'Serviços', icon:MessageSquareText}].map((group, idx) => (
                  <details key={group.id} style={{ marginTop: 12 }}>
                    <summary style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 12px', borderRadius: 8, background: '#fff', border: '1px solid #e5ddd2' }}>
                      <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:28, height:28, borderRadius:999, background:'#f1efe9' }}><group.icon size={14} /></span>
                      <span style={{ flex:1, fontWeight:700 }}>{group.title}</span>
                      <span aria-hidden>▾</span>
                    </summary>
                    <div style={{ padding: 12 }}>
                      {completeCatalog.filter((it) => it.categoria === group.id).map((equipment) => {
                        const isSelectedInPackage = selectedPkg && selectedPkg.items.some((item) => item.itemId === equipment.id);
                        const isAdicional = equipamentosAdicionais.some((it) => it.itemId === equipment.id);
                        const isIncludedInStructure = estruturas.find((s) => s.id === estruturaSelecionadaId)?.itensInclusosIds?.includes(equipment.id);
                        const disabled = Boolean(isIncludedInStructure);
                        return (
                          <div key={equipment.id} onClick={() => {
                              if (disabled) return;
                              if (estruturaSelecionadaId) toggleEquipamentoAdicional(equipment);
                              else togglePackageEquipment(equipment);
                            }}
                            style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 6px', borderRadius:8, cursor: disabled ? 'not-allowed' : 'pointer', background:'#fff', marginBottom:8 }}
                            role="checkbox"
                            aria-checked={isSelectedInPackage || isAdicional || isIncludedInStructure}
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!disabled) { if (estruturaSelecionadaId) toggleEquipamentoAdicional(equipment); else togglePackageEquipment(equipment); } } }}
                          >
                            <input type="checkbox" checked={isSelectedInPackage || isAdicional || isIncludedInStructure} readOnly style={{ width:24, height:24 }} />
                            {equipment.imagem ? <img src={equipment.imagem} alt="" style={{ width:40, height:40, objectFit:'cover', borderRadius:6 }} onError={(e)=>{e.currentTarget.style.display='none'}} /> : null}
                            <div style={{ flex:1 }}>
                              <div style={{ fontWeight:700 }}>{equipment.nome}</div>
                              <div style={{ fontSize:13, color:'#6e675f' }}>{equipment.descricao}</div>
                            </div>
                            <div style={{ marginLeft: 8 }}>
                              {isIncludedInStructure ? <span style={{ fontSize:12, padding:'4px 8px', background:'#fff5e0', borderRadius:6 }}>Incluído na estrutura</span> : (isAdicional ? <span style={{ fontSize:12, padding:'4px 8px', background:'#e8f6ea', borderRadius:6 }}>Selecionado</span> : null)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                ))}
              </div>
            </div>

            {/* Summary bar above bottom controls */}
            <div style={{ marginTop: 16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', background:'#fff', border:'1px solid #e5ddd2', borderRadius:12 }}>
                <div>{selectedItemIds.length === 0 ? 'Nenhum item selecionado' : (selectedItemIds.length === 1 ? '1 item selecionado' : `${selectedItemIds.length} itens selecionados`)}</div>
                <div>
                  <button className="obg-ghost-btn" onClick={() => setShowSummaryModal(true)}>Ver resumo</button>
                </div>
              </div>

              {showSummaryModal && (
                <div role="dialog" aria-modal style={{ position:'fixed', left:0, right:0, bottom:0, top:0, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
                  <div style={{ width:'100%', maxWidth:480, background:'#fff', borderRadius:12, padding:16, boxShadow:'0 -8px 30px rgba(0,0,0,0.2)' }}>
                    <h3>Resumo</h3>
                    <div style={{ maxHeight: 340, overflow:'auto' }}>
                      <div style={{ marginBottom:8 }}><strong>Estrutura:</strong> {estruturaSelecionadaId ? (estruturas.find(s=>s.id===estruturaSelecionadaId)?.nome || '—') : 'Sem estrutura'}</div>
                      <div>
                        <strong>Itens</strong>
                        <ul>
                          {Array.from(new Set([...(estruturas.find(s=>s.id===estruturaSelecionadaId)?.itensInclusosIds||[]), ...equipamentosAdicionais.map(i=>i.itemId)] )).map((id) => (
                            <li key={id} style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
                              <span>{(buscarItemPorId(id) || customEquipment.find(c=>c.id===id))?.nome || id}</span>
                              <span>
                                { (estruturas.find(s=>s.id===estruturaSelecionadaId)?.itensInclusosIds||[]).includes(id) ? <em>Incluído</em> : <button className="obg-ghost-btn" onClick={() => { toggleEquipamentoAdicional(buscarItemPorId(id)); }}>Remover</button> }
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:12 }}>
                      <button className="obg-ghost-btn" onClick={() => setShowSummaryModal(false)}>Fechar</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          <div className="obg-section">
            <h2>Itens adicionais desta proposta</h2>
            {extraItems.map((it) => (
              <div className="obg-item-row" key={it.id}>
                <input
                  value={it.desc}
                  onChange={(e) => updateExtraItem(it.id, "desc", e.target.value)}
                  placeholder="Ex: Hora extra"
                  style={{ flex: 2 }}
                />
                <input
                  type="number"
                  inputMode="decimal"
                  value={it.price}
                  onChange={(e) => updateExtraItem(it.id, "price", Number(e.target.value))}
                  placeholder="R$"
                  style={{ flex: 1 }}
                />
                <button className="obg-icon-btn" onClick={() => removeExtraItem(it.id)}>
                  <X size={15} />
                </button>
              </div>
            ))}
            <button className="obg-add-line" onClick={addExtraItem}>
              <Plus size={14} /> Adicionar item extra
            </button>
          </div>

          <div className="obg-section">
            <h2>Observações (aparecem na proposta)</h2>
            <div className="obg-field">
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: Inclui visita técnica ao local antes do evento." />
            </div>
          </div>

          <div className="obg-section">
            <h2>Valor do orçamento</h2>
            <p className="obg-section-help">Informe o valor total que será apresentado ao cliente.</p>
            <div className="obg-field">
              <label htmlFor="budget-value">Valor total da proposta</label>
              <input
                id="budget-value"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={budgetValueInput}
                onFocus={handleBudgetValueFocus}
                onChange={handleBudgetValueChange}
                onBlur={handleBudgetValueBlur}
                placeholder="R$ 12.500,00"
                aria-invalid={Boolean(budgetValueError)}
                aria-describedby="budget-value-help budget-value-error"
                className={budgetValueError ? "obg-input-error" : ""}
              />
              <p id="budget-value-help" className="obg-field-help">Use vírgula para os centavos.</p>
              {budgetValueError && <p id="budget-value-error" className="obg-field-error" role="alert">{budgetValueError}</p>}
            </div>
          </div>

          <div className="obg-section">
            <h2>Forma de pagamento</h2>
            <div className="obg-field">
              <textarea value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-soft)", fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={showPaymentTerms}
                onChange={(e) => setShowPaymentTerms(e.target.checked)}
                style={{ width: "auto" }}
              />
              Mostrar na proposta
            </label>
          </div>

          <div className="obg-section" style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end" }}>
            <button className="obg-ghost-btn" onClick={newProposal}>
              <Plus size={13} /> Novo orçamento
            </button>
          </div>
        </div>

        {/* ---------- PREVIEW ---------- */}
        <div className="obg-panel-preview">
          <div className="obg-preview-wrap">
            <div className="obg-actions-row">
              <button
                type="button"
                className="obg-btn-outline"
                onClick={handleWhatsAppShare}
                disabled={pdfActionBusy}
                aria-label="Compartilhar proposta pelo WhatsApp"
              >
                {pdfActionBusy ? <LoaderCircle size={15} className="obg-spin" /> : <MessageCircle size={15} color="#25d366" />}
                {pdfActionBusy ? actionButtonLabel : "WhatsApp"}
              </button>
              <button
                type="button"
                className="obg-btn-dark"
                onClick={handlePrint}
                disabled={pdfActionBusy}
                aria-label="Abrir ou baixar proposta em PDF"
                title={clientDetailsComplete ? "Gerar PDF" : "Preencha nome, data e local do evento para gerar o PDF"}
              >
                {pdfActionBusy ? <LoaderCircle size={15} className="obg-spin" /> : <Printer size={15} />}
                {pdfActionBusy ? actionButtonLabel : "PDF"}
              </button>
            </div>
            {!clientDetailsComplete && (
              <p className="obg-pdf-hint">Preencha nome, data e local do evento para liberar o PDF.</p>
            )}
            {pdfNotice && <p className="obg-action-notice" role="status" aria-live="polite">{pdfNotice}</p>}

            <div className="pdf-preview-viewport">
              <div className="obg-print-area pdf-pages-container">
                {renderProposalPages()}

            </div>
          </div>
        </div>

      </div>
      </div>

      <div id="pdf-export-root" className="pdf-export-root" ref={pdfExportRootRef} aria-hidden="true">
        <div className="pdf-pages-container">
          {renderProposalPages()}
        </div>
      </div>

      <div className="obg-bottom-bar">
        <button
          type="button"
          className="obg-btn-outline"
          onClick={handleWhatsAppShare}
          disabled={pdfActionBusy}
          aria-label="Compartilhar proposta pelo WhatsApp"
        >
          {pdfActionBusy ? <LoaderCircle size={16} className="obg-spin" /> : <MessageCircle size={16} color="#25d366" />}
          {pdfActionBusy ? actionButtonLabel : "WhatsApp"}
        </button>
        <button
          type="button"
          className="obg-btn-dark"
          onClick={handlePrint}
          disabled={pdfActionBusy}
          aria-label="Abrir ou baixar proposta em PDF"
          title={clientDetailsComplete ? "Gerar PDF" : "Preencha nome, data e local do evento para gerar o PDF"}
        >
          {pdfActionBusy ? <LoaderCircle size={16} className="obg-spin" /> : <Printer size={16} />}
          {pdfActionBusy ? actionButtonLabel : "PDF"}
        </button>
      </div>

      {shareFallbackOpen && (
        <div className="obg-share-fallback" role="presentation">
          <div className="obg-share-fallback-dialog" role="dialog" aria-modal="true" aria-labelledby="share-fallback-title">
            <h3 id="share-fallback-title">PDF baixado</h3>
            <p>Seu navegador não permite enviar o arquivo diretamente. Abra o WhatsApp e anexe o PDF baixado.</p>
            <div className="obg-share-fallback-actions">
              <button type="button" className="obg-btn-dark" onClick={openWhatsAppFallback}>Abrir WhatsApp</button>
              <button type="button" className="obg-btn-outline" onClick={() => setShareFallbackOpen(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
