import { useState, useEffect, useRef } from "react";
import { Plus, X, Copy, Printer, Check, Music2, CalendarDays, User, MapPin, MessageSquareText, ImagePlus, Save } from "lucide-react";
import ItemProposta from "./components/ItemProposta.jsx";
import SeletorEstruturas from "./components/SeletorEstruturas.jsx";
import PdfCoverPage from "./components/pdf/PdfCoverPage.jsx";
import PdfBiographyPage from "./components/pdf/PdfBiographyPage.jsx";
import PdfBudgetDataPage from "./components/pdf/PdfBudgetDataPage.jsx";
import { PDF_ASSETS } from "./config/pdfAssets";
import { CATEGORIAS_ITEM, PLACEHOLDER_ITEM_IMAGE, buscarItemPorId, catalogoItens } from "./data/catalogoItens.js";

const STORAGE_KEY = "lucas-franco-custom-packages-v2";
const EQUIPMENT_KEY = "lucas-franco-equipment-v3";
const COUNTER_KEY = "lucas-franco-proposal-counter";
const PAYMENT_KEY = "lucas-franco-payment-terms";
const PROPOSALS_KEY = "lucas-franco-proposals";
const DEFAULT_PAYMENT_TERMS =
  "Sinal de 30% na assinatura do contrato, restante na semana do evento. Pagamento via Pix ou cartão em até 12x (com taxa da operadora). Atendimento somente com pacote fechado.";

const DEFAULT_PACKAGES = [];

// Itens que acompanham todas as estruturas (reutilizável)
const itensPadraoEstrutura = [
  "strobo-led",
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
    nome: "Estrutura 01",
    descricao: "Estrutura profissional personalizada para o evento.",
    imagens: [
      "/images/estruturas/estrutura-01-a.png",
      "/images/estruturas/estrutura-01-b.png",
    ],
    itensInclusosIds: itensPadraoEstrutura,
    ativo: true,
    ordem: 1,
  },
  {
    id: "estrutura-02",
    nome: "Estrutura 02",
    descricao: "Estrutura profissional personalizada para o evento.",
    imagens: ["/images/estruturas/estrutura-02.png"],
    itensInclusosIds: itensPadraoEstrutura,
    ativo: true,
    ordem: 2,
  },
  {
    id: "estrutura-03",
    nome: "Estrutura 03",
    descricao: "Estrutura profissional personalizada para o evento.",
    imagens: ["/images/estruturas/estrutura-03.png"],
    itensInclusosIds: itensPadraoEstrutura,
    ativo: true,
    ordem: 3,
  },
  {
    id: "estrutura-04",
    nome: "Estrutura 04",
    descricao: "Estrutura profissional personalizada para o evento.",
    imagens: ["/images/estruturas/estrutura-04.png"],
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
  const [paymentTerms, setPaymentTerms] = useState(DEFAULT_PAYMENT_TERMS);
  const [showPaymentTerms, setShowPaymentTerms] = useState(true);
  const [proposalNumber, setProposalNumber] = useState(null);
  const [copyState, setCopyState] = useState("idle"); // idle | copied
  const [savedProposals, setSavedProposals] = useState([]);
  const [currentProposalId, setCurrentProposalId] = useState(null);
  const [saveProposalState, setSaveProposalState] = useState("idle"); // idle | saved
  const saveTimer = useRef(null);
  const savePaymentTimer = useRef(null);

  // When editing a saved proposal, restore form fields so preview and PDF show the same values
  useEffect(() => {
    if (!currentProposalId) return;
    const proposal = savedProposals.find((p) => p.id === currentProposalId);
    if (!proposal) return;
    // only restore the client-related fields required for the PDF page
    setClientName(proposal.clientName || "");
    setEventDate(proposal.eventDate || "");
    setEventLocal(proposal.eventLocal || "");
    setEventType(proposal.eventType || "");
    setShowDuration(proposal.showDuration || "");
    // do not write into the PNG — these are just form states
  }, [currentProposalId, savedProposals]);

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

  const selectedPkg = packages.find((p) => p.id === selectedPkgId) || packages[0];
  const proposalPkg = selectedPkg;
  const completeCatalog = [...catalogoItens, ...customEquipment];
  const basePrice = priceOverride !== null ? priceOverride : proposalPkg?.price || 0;
  // Only extraItems (manual extras) and equipamentosAdicionais contribute to extras total
  const extraItemsTotal = extraItems.reduce((sum, it) => sum + (Number(it.price) || 0), 0);
  const equipamentosAdicionaisTotal = equipamentosAdicionais.reduce((sum, it) => sum + (Number(it.valorUnitario || 0) * (Number(it.quantidade) || 0)), 0);
  const total = basePrice + extraItemsTotal + equipamentosAdicionaisTotal;
  const validUntil = formatDatePt(addDays(new Date(), 7));
  const clientDetailsComplete = Boolean(clientName.trim() && eventDate && eventLocal.trim());
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

  const groupedProposalItems = CATEGORIAS_ITEM
    .map((categoria) => ({
      ...categoria,
      items: selectedProposalItems.filter((entry) => entry.itemCatalogo.categoria === categoria.id),
    }))
    .filter((categoria) => categoria.items.length > 0);

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

  function saveCurrentProposal() {
    const isNewProposal = !currentProposalId;
    const storedCounter = Number.parseInt(loadText(COUNTER_KEY, "0"), 10) || 0;
    const number = proposalNumber || storedCounter + 1;
    const existingProposal = currentProposalId
      ? savedProposals.find((proposal) => proposal.id === currentProposalId)
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
      total,
    };
    const idx = savedProposals.findIndex((proposal) => proposal.id === snapshot.id);
    const next = idx >= 0
      ? savedProposals.map((proposal, index) => (index === idx ? snapshot : proposal))
      : [snapshot, ...savedProposals];
    const saved = saveJSON(PROPOSALS_KEY, next);
    const counterSaved = !isNewProposal || saveText(COUNTER_KEY, String(number));
    setSavedProposals(next);
    setCurrentProposalId(snapshot.id);
    setProposalNumber(number);
    setSaveProposalState(saved && counterSaved ? "saved" : "error");
    if (!saved || !counterSaved) setSaveState("error");
    setTimeout(() => setSaveProposalState("idle"), 1800);
  }

  function newProposal() {
    setClientName("");
    setEventDate("");
    setEventLocal("");
    setEventType("");
    setShowDuration("");
    setClientErrors({});
    setNotes("");
    setExtraItems([]);
    setPriceOverride(null);
    setCurrentProposalId(null);
    const storedCounter = Number.parseInt(loadText(COUNTER_KEY, "0"), 10) || 0;
    const highestSavedNumber = savedProposals.reduce(
      (highest, proposal) => Math.max(highest, Number(proposal.number) || 0),
      0
    );
    setProposalNumber(Math.max(storedCounter, highestSavedNumber) + 1);
  }

  async function waitForPrintImages() {
    const images = Array.from(document.querySelectorAll(".obg-print-area img"));
    images.forEach((image) => { image.loading = "eager"; });
    await Promise.all(images.map((image) => new Promise((resolve) => {
      const finish = async () => {
        if (typeof image.decode === "function") {
          try { await image.decode(); } catch (error) { /* o componente já aplicou o fallback */ }
        }
        resolve();
      };
      if (image.complete) {
        finish();
      } else {
        image.addEventListener("load", finish, { once: true });
        image.addEventListener("error", finish, { once: true });
      }
    })));
  }

  async function handlePrint() {
    if (!validateClientDetails()) {
      setActiveTab("editar");
      window.setTimeout(() => {
        const firstError = document.querySelector(".obg-input-error");
        if (firstError) {
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
          firstError.focus({ preventScroll: true });
        }
      }, 0);
      return;
    }
    if (!estruturaSelecionadaId) {
      setActiveTab("editar");
      window.setTimeout(() => {
        const el = document.querySelector('.obg-section');
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      }, 0);
      alert('Selecione uma estrutura antes de gerar o PDF.');
      return;
    }
    await waitForPrintImages();
    window.print();
  }

  async function handleCopyWhatsApp() {
    const lines = [];
    lines.push(`*Proposta DJ Lucas Franco* — Nº ${String(proposalNumber || 1).padStart(4, "0")}`);
    if (clientName) lines.push(`Para: ${clientName}`);
    if (eventType) lines.push(`Tipo de evento: ${eventType}`);
    if (eventDate) lines.push(`Data do evento: ${formatDateBR(eventDate)}`);
    if (showDuration) lines.push(`Duração: ${showDuration}`);
    if (eventLocal) lines.push(`Local: ${eventLocal}`);
    lines.push("");
    lines.push(`*Estrutura ${proposalPkg?.name || "selecionada"}*`);
    selectedProposalItems.forEach(({ itemOrcamento, itemCatalogo }) => {
      const quantityLabel = itemOrcamento.quantidade > 1 ? `${itemOrcamento.quantidade}x ` : "";
      lines.push(`✔ ${quantityLabel}${itemCatalogo.nome}`);
    });
    if (extraItems.length) {
      lines.push("");
      lines.push("*Itens adicionais*");
      extraItems
        .filter((it) => it.desc)
        .forEach((it) => lines.push(`✔ ${it.desc} (+${formatBRL(it.price)})`));
    }
    lines.push("");
    lines.push(`*Valor total: ${formatBRL(total)}*`);
    lines.push(`Proposta válida até ${validUntil}`);
    if (notes) {
      lines.push("");
      lines.push(notes);
    }
    if (showPaymentTerms && paymentTerms) {
      lines.push("");
      lines.push(`Forma de pagamento: ${paymentTerms}`);
    }
    const text = lines.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch (e) {
      setCopyState("idle");
    }
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

        .obg-panel-editor, .obg-panel-preview { display: block; }

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

        .obg-field { margin-bottom: 10px; }
        .obg-field:last-child { margin-bottom: 0; }
        .obg-field label {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; color: var(--ink-soft); margin-bottom: 5px; font-weight: 600;
        }
        .obg-field input, .obg-field textarea {
          width: 100%; border: 1px solid var(--line); border-radius: var(--radius-sm);
          padding: 11px 12px; font-size: 15px; font-family: inherit; color: var(--ink);
          background: #fff;
        }
        .obg-field input:focus, .obg-field textarea:focus {
          outline: none; border-color: var(--accent);
        }
        .obg-field input.obg-input-error { border-color: #b34242; }
        .obg-required { color: #b34242; }
        .obg-field-error { color: #b34242; font-size: 11px; margin: 5px 0 0; font-weight: 600; }
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
        .obg-btn-dark { background: var(--dark); color: var(--gold); }
        .obg-btn-dark:disabled { cursor: not-allowed; opacity: 0.52; }
        .obg-btn-outline { background: #fff; color: var(--ink); border: 1px solid var(--line) !important; }
        .obg-pdf-hint { margin: -4px 0 0; color: #9a5a33; font-size: 11px; font-weight: 600; text-align: center; }

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
        /* Preview (screen) vs Print separation */
        .pdf-preview-viewport {
          width: 100%;
          max-width: 100%;
          padding: 8px;
          margin: 0 auto;
          box-sizing: border-box;
          overflow-x: hidden;
        }

        @media screen {
          .pdf-page--full-bleed {
            position: relative;
            width: 100%;
            max-width: 794px;
            min-width: 0;
            height: auto;
            aspect-ratio: 210 / 297;
            margin: 0 auto 16px;
            padding: 0;
            overflow: hidden;
            box-sizing: border-box;
            background: #191a1e;
            border-radius: 6px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.16);
          }

          .pdf-page__full-image {
            position: absolute;
            inset: 0;
            display: block;
            width: 100%;
            height: 100%;
            max-width: none;
            max-height: none;
            margin: 0;
            padding: 0;
            border: 0;
            object-fit: cover;
            object-position: center;
          }

          /* mobile adjustments */
          @media (max-width: 600px) {
            .pdf-preview-viewport { width: 100%; padding: 4px; overflow-x: hidden; }
            .pdf-page--full-bleed { width: 100%; max-width: 100%; min-width: 0; height: auto; aspect-ratio: 210 / 297; margin: 0 auto 12px; border-radius: 0; box-shadow: none; }
            .pdf-page--full-bleed, .pdf-preview-viewport { -webkit-overflow-scrolling: touch; }
          }
        }

        @media print {
          html, body, #root { margin: 0 !important; padding: 0 !important; }
          .obg-panel-editor, .obg-tabs, .obg-bottom-bar, .obg-header, .obg-actions-row { display: none !important; }
          .obg-panel-preview { display: block !important; position: static !important; }
          /* ensure only print area is visible */
          body * { visibility: hidden; }
          .obg-print-area, .obg-print-area * { visibility: visible; }
          .obg-print-area { position: absolute; left: 0; top: 0; width: 100%; }

          /* Full-bleed A4 pages for print */
          .pdf-page--full-bleed {
            position: relative;
            width: 210mm !important;
            min-width: 210mm !important;
            max-width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            overflow: hidden;
            background: #191a1e;
            break-after: page;
            page-break-after: always;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .pdf-page__full-image {
            position: absolute;
            inset: 0;
            display: block;
            width: 100% !important;
            height: 100% !important;
            max-width: none !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            object-fit: cover;
            object-position: center;
          }

          .obg-card { border-radius: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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
              <input
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                placeholder="Ex: Casamento, Festa Corporativa"
                aria-label="Tipo de evento"
              />
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
            <h2>ESCOLHA A ESTRUTURA</h2>
            <p className="obg-equipment-help">Selecione uma estrutura para começar a montar esta proposta.</p>
            <SeletorEstruturas
              estruturas={estruturas}
              estruturaSelecionadaId={estruturaSelecionadaId}
              onSelecionar={selecionarEstrutura}
            />
            {pendingDeletePackageId && (
              <div className="obg-delete-question" role="dialog" aria-live="polite">
                <p>Apagar o pacote “{packages.find((pkg) => pkg.id === pendingDeletePackageId)?.name || "sem nome"}”?</p>
                <div className="obg-delete-question-actions">
                  <button type="button" className="confirm" onClick={confirmDeletePackage}>Sim, apagar</button>
                  <button type="button" onClick={cancelDeletePackage}>Não, cancelar</button>
                </div>
              </div>
            )}
            {deleteSuccessMessage && <p className="obg-delete-success" role="status">{deleteSuccessMessage}</p>}
            {!selectedPkg && (
              <p className="obg-empty-package">
                Selecione uma estrutura para começar a montar esta proposta.
              </p>
            )}

            {selectedPkg && (
              <div className="obg-pkg-editor">
                <div className="row">
                  <input
                    data-role="name"
                    value={selectedPkg.name}
                    onChange={(e) => updatePackageField(selectedPkg.id, "name", e.target.value)}
                    placeholder="Nome do pacote"
                  />
                </div>

                <div className="obg-equipment-section">
                  <div className="obg-equipment-title">Equipamentos incluídos</div>
                  <p className="obg-equipment-help">Busque no catálogo e toque para incluir ou retirar do pacote.</p>

                  {selectedPkg.items.length > 0 && (
                    <div className="obg-equipment-selected" aria-label="Equipamentos selecionados">
                      {selectedPkg.items.map((item, idx) => (
                        <span className="obg-equipment-tag" key={`${item.itemId}-${idx}`}>
                          {(buscarItemPorId(item.itemId) || customEquipment.find((catalogItem) => catalogItem.id === item.itemId))?.nome || "Item não encontrado"}
                          <button
                            type="button"
                            onClick={() => removePackageItem(selectedPkg.id, idx)}
                            aria-label={`Retirar ${item}`}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="obg-equipment-search">
                    <input
                      type="search"
                      value={equipmentSearch}
                      onChange={(e) => setEquipmentSearch(e.target.value)}
                      placeholder="Buscar equipamento"
                      aria-label="Buscar equipamento"
                    />
                  </div>
                  <p className="obg-equipment-results-label">
                    {normalizedEquipmentSearch
                      ? `${filteredEquipment.length} equipamento${filteredEquipment.length === 1 ? "" : "s"} encontrado${filteredEquipment.length === 1 ? "" : "s"}`
                      : `Todos os equipamentos (${completeCatalog.length})`}
                  </p>
                  <div className="obg-equipment-list" aria-label="Catálogo de equipamentos">
                    {filteredEquipment.length > 0 ? (
                      filteredEquipment.map((equipment) => {
                        // render equipment name properly
                        const isSelectedInPackage = selectedPkg.items.some((item) => item.itemId === equipment.id);
                        const isAdicional = equipamentosAdicionais.some((it) => it.itemId === equipment.id);
                        return (
                          <div key={equipment.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              className={`obg-equipment-option ${isSelectedInPackage ? "selected" : isAdicional ? "selected" : ""}`}
                              onClick={() => {
                                if (estruturaSelecionadaId) {
                                  toggleEquipamentoAdicional(equipment);
                                } else {
                                  togglePackageEquipment(equipment);
                                }
                              }}
                            >
                              <span className="marker">{isSelectedInPackage || isAdicional ? "✓" : "+"}</span>
                              {equipment.nome}
                            </button>
                            {isAdicional && (
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <input type="number" min={1} value={equipamentosAdicionais.find((it) => it.itemId === equipment.id)?.quantidade || 1} onChange={(e) => updateEquipamentoAdicional(equipment.id, 'quantidade', Number(e.target.value))} style={{ width: 54, padding: 6, borderRadius: 8, border: '1px solid #e8e4dc' }} />
                                <input type="number" value={equipamentosAdicionais.find((it) => it.itemId === equipment.id)?.valorUnitario || 0} onChange={(e) => updateEquipamentoAdicional(equipment.id, 'valorUnitario', Number(e.target.value))} style={{ width: 100, padding: 6, borderRadius: 8, border: '1px solid #e8e4dc' }} />
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="obg-equipment-no-results">Nenhum equipamento encontrado.</p>
                    )}
                  </div>

                  <div className="obg-equipment-add">
                    <input
                      value={newEquipmentName}
                      onChange={(e) => setNewEquipmentName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addEquipmentToCatalog();
                        }
                      }}
                      placeholder="Cadastrar equipamento"
                      aria-label="Nome do novo equipamento"
                    />
                    <button type="button" onClick={addEquipmentToCatalog}>Adicionar</button>
                  </div>
                </div>

                <div className="obg-photos-section">
                  <div className="obg-photos-grid">
                    {(selectedPkg.photos || []).map((src, idx) => (
                      <div className="obg-photo-thumb" key={idx}>
                        <img src={src} alt="" />
                        <button className="obg-photo-remove" onClick={() => removePackagePhoto(selectedPkg.id, idx)}>
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                    {(selectedPkg.photos || []).length < 4 && (
                      <label className="obg-photo-add">
                        <ImagePlus size={16} />
                        <span>Adicionar foto</span>
                        <input type="file" accept="image/*" hidden onChange={(e) => handlePhotoUpload(selectedPkg.id, e)} />
                      </label>
                    )}
                  </div>
                  <p className="obg-photos-hint">Até 4 fotos do que está incluso (equipamento, estrutura montada, etc.)</p>
                </div>

                <div className="obg-field" style={{ marginTop: 10 }}>
                  <label>Valor para esta proposta (pode negociar)</label>
                  <div className="obg-currency-wrap">
                    <span className="obg-currency-prefix">R$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={priceOverride !== null ? priceOverride : proposalPkg?.price || 0}
                      onChange={(e) => setPriceOverride(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            )}
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
              <button className="obg-btn-outline" onClick={saveCurrentProposal}>
                {saveProposalState === "saved" ? <Check size={15} /> : <Save size={15} />}
                {saveProposalState === "saved"
                  ? "Salvo!"
                  : saveProposalState === "error"
                    ? "Não salvo"
                    : (currentProposalId ? "Atualizar" : "Salvar")}
              </button>
              <button className="obg-btn-outline" onClick={handleCopyWhatsApp}>
                {copyState === "copied" ? <Check size={15} /> : <Copy size={15} />}
                {copyState === "copied" ? "Copiado!" : "WhatsApp"}
              </button>
              <button
                className="obg-btn-dark"
                onClick={handlePrint}
                title={clientDetailsComplete ? "Gerar PDF" : "Preencha nome, data e local do evento para gerar o PDF"}
              >
                <Printer size={15} /> PDF
              </button>
            </div>
            {!clientDetailsComplete && (
              <p className="obg-pdf-hint">Preencha nome, data e local do evento para liberar o PDF.</p>
            )}

            <div className="pdf-preview-viewport">
              <div className="obg-print-area">
                <PdfCoverPage />
                <PdfBiographyPage />
                <PdfBudgetDataPage
                  eventType={eventType}
                  location={eventLocal}
                  eventDate={eventDate}
                  showDuration={showDuration}
                  clientName={clientName}
                />
                <div className="obg-card">
                <div className="brand">
                  <div className="badge"><Music2 size={14} /></div>
                  <div className="name">LUCAS FRANCO — DJ</div>
                  <div className="num">Nº {String(proposalNumber || 1).padStart(4, "0")}</div>
                </div>

                <h3>{proposalPkg?.name || "Estrutura selecionada para o seu evento"}</h3>
                <div className="subtitle">Proposta personalizada de sonorização e ambientação</div>

                {(clientName || eventDate || eventLocal) && (
                  <div className="meta-row">
                    {clientName && <span><User size={12} /> {clientName}</span>}
                    {eventDate && <span><CalendarDays size={12} /> {formatDateBR(eventDate)}</span>}
                    {eventLocal && (
                      <span>
                        <MapPin size={12} />
                        {eventLocal}
                      </span>
                    )}
                  </div>
                )}

                <hr className="divider" />

                {proposalPkg?.photos?.length > 0 && (
                  <div className="card-photos">
                    {proposalPkg.photos.map((src, idx) => (
                      <img key={idx} src={src} alt="" />
                    ))}
                  </div>
                )}

                <div className="obg-card-items">
                  {groupedProposalItems.map((group) => (
                    <section className="obg-item-group" key={group.id}>
                      <h4>{group.nome}</h4>
                      {group.items.map(({ itemOrcamento, itemCatalogo }) => (
                        <ItemProposta
                          key={itemOrcamento.itemId}
                          item={itemCatalogo}
                          quantidade={itemOrcamento.quantidade}
                        />
                      ))}
                    </section>
                  ))}
                  {extraItems.some((item) => item.desc) && (
                    <section className="obg-item-group">
                      <h4>Itens adicionais</h4>
                      {extraItems.filter((item) => item.desc).map((item) => (
                        <div className="obg-proposal-extra-item" key={item.id}>
                          <span className="tick">✓</span>
                          <span>{item.desc} <span className="obg-extra-price">(+{formatBRL(item.price)})</span></span>
                        </div>
                      ))}
                    </section>
                  )}
                </div>

                <div className="price-block">
                  <div className="label">Investimento total</div>
                  <div className="value">{formatBRL(total)}</div>
                  <div className="validity">Proposta válida até {validUntil}</div>
                </div>

                {notes && <div className="notes">{notes}</div>}

                {showPaymentTerms && paymentTerms && (
                  <div className="payment-terms">
                    <div className="payment-terms-label">Forma de pagamento</div>
                    {paymentTerms}
                  </div>
                )}

                <div className="footer-tag">A trilha sonora do seu evento</div>
              </div>
            </div>
          </div>
        </div>

      </div>
      </div>

      <div className="obg-bottom-bar">
        <button className="obg-btn-outline" onClick={saveCurrentProposal}>
          {saveProposalState === "saved" ? <Check size={16} /> : <Save size={16} />}
          {saveProposalState === "saved"
            ? "Salvo"
            : saveProposalState === "error"
              ? "Não salvo"
              : (currentProposalId ? "Atualizar" : "Salvar")}
        </button>
        <button className="obg-btn-outline" onClick={handleCopyWhatsApp}>
          <MessageSquareText size={16} />
          {copyState === "copied" ? "Copiado!" : "WhatsApp"}
        </button>
        <button
          className="obg-btn-dark"
          onClick={handlePrint}
          title={clientDetailsComplete ? "Gerar PDF" : "Preencha nome, data e local do evento para gerar o PDF"}
        >
          <Printer size={16} /> PDF
        </button>
      </div>
    </div>
  );
}
