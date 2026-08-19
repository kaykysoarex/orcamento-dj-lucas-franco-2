import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4173/orcamento-dj-lucas-franco-2/";
const outputDirectory = path.resolve("tmp/pdfs");
const pdfPath = path.join(outputDirectory, "preview-validation.pdf");

fs.mkdirSync(outputDirectory, { recursive: true });

async function clickText(page, text) {
  const clicked = await page.evaluate((label) => {
    const button = [...document.querySelectorAll("button")].find((element) => element.textContent?.trim().includes(label));
    if (!button) return false;
    button.click();
    return true;
  }, text);
  assert.equal(clicked, true, `Botão não encontrado: ${text}`);
}

async function addStructure(page) {
  await clickText(page, "Adicionar estrutura");
  await clickText(page, "Estrutura Prime");
  await new Promise((resolve) => setTimeout(resolve, 250));
}

async function fillBudgetData(page) {
  await page.evaluate(() => {
    const values = ["Ana & João", "2026-10-24", "Espaço Aurora", "Casamento", "6 horas"];
    const controls = [...document.querySelectorAll(".obg-panel-editor .obg-field input, .obg-panel-editor .obg-field select")];
    controls.slice(0, values.length).forEach((control, index) => {
      const prototype = control instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
      setter?.call(control, values[index]);
      control.dispatchEvent(new Event("input", { bubbles: true }));
      control.dispatchEvent(new Event("change", { bubbles: true }));
    });
  });
  await new Promise((resolve) => setTimeout(resolve, 150));
}

async function inspectPreview(page) {
  return page.evaluate(() => {
    const viewport = document.querySelector(".pdf-preview-viewport");
    const items = [...document.querySelectorAll(".pdf-preview-item")];
    return {
      viewportWidth: viewport?.getBoundingClientRect().width || 0,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      pages: items.map((item) => {
        const scaler = item.querySelector(".pdf-page-scaler");
        const page = item.querySelector(".pdf-page");
        const itemRect = item.getBoundingClientRect();
        const scalerRect = scaler?.getBoundingClientRect();
        return {
          itemWidth: itemRect.width,
          itemHeight: itemRect.height,
          scalerWidth: scalerRect?.width || 0,
          scalerHeight: scalerRect?.height || 0,
          pageWidth: page?.clientWidth || 0,
          pageHeight: page?.clientHeight || 0,
        };
      }),
    };
  });
}

function assertPreview(name, inspection) {
  assert.equal(inspection.horizontalOverflow, false, `${name}: a página não pode rolar horizontalmente`);
  assert.ok(inspection.pages.length >= 5, `${name}: todas as páginas esperadas precisam aparecer`);

  for (const [index, page] of inspection.pages.entries()) {
    assert.equal(page.pageWidth, 1055, `${name}: página ${index + 1} perdeu a largura de design`);
    assert.equal(page.pageHeight, 1491, `${name}: página ${index + 1} perdeu a altura de design`);
    assert.ok(Math.abs(page.itemWidth - page.scalerWidth) < 1, `${name}: página ${index + 1} não está centralizada no wrapper`);
    assert.ok(Math.abs(page.itemHeight - page.scalerHeight) < 1, `${name}: página ${index + 1} tem altura de wrapper incorreta`);
    assert.ok(Math.abs((page.itemWidth / page.itemHeight) - (1055 / 1491)) < 0.002, `${name}: página ${index + 1} perdeu a proporção A4`);
  }
}

const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  await page.goto(baseUrl, { waitUntil: "networkidle0" });
  await fillBudgetData(page);
  await addStructure(page);

  const desktop = await inspectPreview(page);
  assertPreview("desktop", desktop);
  await (await page.$(".pdf-preview-viewport")).screenshot({ path: path.join(outputDirectory, "preview-desktop.png") });

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await clickText(page, "Prévia");
  await new Promise((resolve) => setTimeout(resolve, 300));
  const mobile = await inspectPreview(page);
  assertPreview("mobile", mobile);
  await (await page.$(".pdf-preview-viewport")).screenshot({ path: path.join(outputDirectory, "preview-mobile-390.png") });

  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  await page.pdf({ path: pdfPath, preferCSSPageSize: true, printBackground: true });
  console.log(JSON.stringify({ desktop, mobile, pdfPath }, null, 2));
} finally {
  await browser.close();
}
