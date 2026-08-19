import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const DESIGN_WIDTH = 1055;
const DESIGN_HEIGHT = 1491;
export const PDF_CAPTURE_SCALE = 1.3;
export const PDF_JPEG_QUALITY = 0.9;

export function sanitizeProposalFilePart(value) {
  const normalized = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "";
}

export function buildProposalFileName({ clientName } = {}) {
  const client = sanitizeProposalFilePart(clientName);
  return client ? `proposta-lucas-franco-${client}.pdf` : "proposta-lucas-franco.pdf";
}

export function buildWhatsAppMessage({ clientName } = {}) {
  const name = String(clientName || "").trim();
  return name
    ? `Olá, ${name}! Segue a proposta personalizada para o seu evento, preparada por Lucas Franco — DJ.`
    : "Olá! Segue a proposta personalizada para o seu evento, preparada por Lucas Franco — DJ.";
}

export async function waitForProposalAssets(container) {
  if (!container) throw new Error("Área da proposta não encontrada.");

  await document.fonts?.ready;
  const images = Array.from(container.querySelectorAll("img"));
  const failures = [];

  await Promise.all(images.map(async (image) => {
    if (!image.complete) {
      const loaded = await new Promise((resolve) => {
        const timeout = window.setTimeout(() => resolve(false), 8000);
        image.addEventListener("load", () => { clearTimeout(timeout); resolve(true); }, { once: true });
        image.addEventListener("error", () => { clearTimeout(timeout); resolve(false); }, { once: true });
      });
      if (!loaded) failures.push(image.currentSrc || image.src || "imagem");
    }

    if (!image.naturalWidth) {
      failures.push(image.currentSrc || image.src || "imagem");
      return;
    }

    if (typeof image.decode === "function") {
      await Promise.race([
        image.decode().catch(() => undefined),
        new Promise((resolve) => window.setTimeout(resolve, 1500)),
      ]);
    }
  }));

  if (failures.length) throw new Error("Uma imagem da proposta não foi carregada.");
}

function canvasToJpegBytes(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error("Falha ao converter página para JPEG."));
        return;
      }
      resolve(new Uint8Array(await blob.arrayBuffer()));
    }, "image/jpeg", PDF_JPEG_QUALITY);
  });
}

async function fetchImageBytes(image) {
  const response = await fetch(image.currentSrc || image.src);
  if (!response.ok) throw new Error(`Não foi possível carregar a imagem ${image.currentSrc || image.src}.`);
  const blob = await response.blob();
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (!bytes.length) throw new Error("A imagem da página está vazia.");
  return { bytes, format: blob.type === "image/png" ? "PNG" : "JPEG" };
}

function isFullPageImage(page) {
  const image = page.querySelector(":scope > .pdf-page-image");
  return image && page.children.length === 1 ? image : null;
}

async function renderPdfPage(page, pageId) {
  const stage = document.createElement("div");
  const pageClone = page.cloneNode(true);
  stage.setAttribute("aria-hidden", "true");
  stage.style.cssText = [
    "position:fixed",
    "top:0",
    "left:-12000px",
    `width:${DESIGN_WIDTH}px`,
    `height:${DESIGN_HEIGHT}px`,
    "overflow:visible",
    "pointer-events:none",
  ].join(";");
  pageClone.style.width = `${DESIGN_WIDTH}px`;
  pageClone.style.height = `${DESIGN_HEIGHT}px`;
  pageClone.style.transform = "none";
  pageClone.style.transformOrigin = "top left";
  pageClone.dataset.pdfPageId = pageId;
  stage.append(pageClone);
  document.body.append(stage);

  try {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return await html2canvas(pageClone, {
      backgroundColor: "#0d0e12",
      scale: PDF_CAPTURE_SCALE,
      useCORS: true,
      allowTaint: false,
      logging: false,
      imageTimeout: 15000,
      width: DESIGN_WIDTH,
      height: DESIGN_HEIGHT,
      windowWidth: DESIGN_WIDTH,
      windowHeight: DESIGN_HEIGHT,
      onclone: (clonedDocument) => {
        const clonedPage = clonedDocument.querySelector(`[data-pdf-page-id="${pageId}"]`);
        if (!clonedPage) return;
        clonedPage.style.transform = "none";
        clonedPage.style.zoom = "1";
        clonedPage.style.width = `${DESIGN_WIDTH}px`;
        clonedPage.style.height = `${DESIGN_HEIGHT}px`;
        clonedPage.style.maxWidth = "none";
      },
    });
  } finally {
    stage.remove();
  }
}

export async function generateProposalPdfBlob({ container, onProgress } = {}) {
  if (!container) throw new Error("Área da proposta não encontrada.");

  await waitForProposalAssets(container);
  const pages = Array.from(container.querySelectorAll(".pdf-page"));
  if (!pages.length) throw new Error("Nenhuma página foi encontrada para gerar o PDF.");

  const startedAt = performance.now();
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
    putOnlyUsedFonts: true,
  });
  for (const [index, page] of pages.entries()) {
    const pageStartedAt = performance.now();
    const pageId = `pdf-page-${index + 1}`;
    const fullPageImage = isFullPageImage(page);
    let imageBytes;
    let imageFormat;

    if (fullPageImage) {
      ({ bytes: imageBytes, format: imageFormat } = await fetchImageBytes(fullPageImage));
    } else {
      const canvas = await renderPdfPage(page, pageId);
      if (!canvas.width || !canvas.height) throw new Error(`Não foi possível preparar a página ${index + 1}.`);
      imageBytes = await canvasToJpegBytes(canvas);
      imageFormat = "JPEG";
      canvas.width = 1;
      canvas.height = 1;
    }

    if (index > 0) pdf.addPage("a4", "portrait");
    pdf.addImage(imageBytes, imageFormat, 0, 0, 210, 297, undefined, "MEDIUM");
    onProgress?.({ current: index + 1, total: pages.length, elapsedMs: performance.now() - pageStartedAt });
    if (import.meta.env.DEV) console.info(`[proposal-pdf] Página ${index + 1}: ${Math.round(performance.now() - pageStartedAt)}ms`);
    imageBytes = null;
  }

  const blob = pdf.output("blob");
  if (!blob || !blob.size) throw new Error("O PDF gerado está vazio.");
  if (import.meta.env.DEV) console.info(`[proposal-pdf] PDF: ${(blob.size / 1024 / 1024).toFixed(2)} MB | Total: ${Math.round(performance.now() - startedAt)}ms`);
  return blob;
}

export async function generateProposalPdfFile(proposal = {}) {
  const blob = await generateProposalPdfBlob(proposal);
  return new File([blob], buildProposalFileName(proposal), { type: "application/pdf" });
}

export function downloadProposalPdfFile(file) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
