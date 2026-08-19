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

async function addEquipmentItems(page, itemNames) {
  const selected = await page.evaluate((names) => {
    const group = [...document.querySelectorAll("details")]
      .find((element) => element.querySelector("summary")?.textContent?.includes("Iluminação & Efeitos"));
    if (!group) return [];

    group.open = true;
    const selectedNames = [];
    names.forEach((name) => {
      const option = [...group.querySelectorAll('[role="checkbox"]')]
        .find((element) => element.textContent?.includes(name));
      if (option && option.getAttribute("aria-checked") !== "true") {
        option.click();
        selectedNames.push(name);
      }
    });
    return selectedNames;
  }, itemNames);

  assert.deepEqual(selected, itemNames, "Os itens extras de iluminação precisam ser selecionados pela interface existente");
  await new Promise((resolve) => setTimeout(resolve, 250));
}

async function fillBudgetData(page, values = ["Ana & João", "2026-10-24", "Espaço Aurora", "Casamento", "6 horas"]) {
  await page.evaluate((nextValues) => {
    const controls = [...document.querySelectorAll(".obg-panel-editor .obg-field input, .obg-panel-editor .obg-field select")];
    controls.slice(0, nextValues.length).forEach((control, index) => {
      const prototype = control instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
      setter?.call(control, nextValues[index]);
      control.dispatchEvent(new Event("input", { bubbles: true }));
      control.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }, values);
  await new Promise((resolve) => setTimeout(resolve, 150));
}

async function fillBudgetValue(page, value) {
  await page.evaluate((nextValue) => {
    const control = document.querySelector("#budget-value");
    if (!control) throw new Error("Campo de valor do orçamento não encontrado");
    control.focus();
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(control, nextValue);
    control.dispatchEvent(new Event("input", { bubbles: true }));
    control.dispatchEvent(new Event("change", { bubbles: true }));
    control.blur();
  }, value);
  await new Promise((resolve) => setTimeout(resolve, 150));
}

async function inspectPreview(page) {
  return page.evaluate(() => {
    const viewport = document.querySelector(".pdf-preview-viewport");
    const items = [...document.querySelectorAll(".pdf-preview-item")];
    return {
      viewportWidth: viewport?.getBoundingClientRect().width || 0,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      pageLabels: items.map((item) => item.getAttribute("aria-label")),
      selectionCategories: [...document.querySelectorAll("details summary")]
        .map((summary) => summary.textContent?.replace(/▾/g, "").trim())
        .filter(Boolean),
      categoryPages: items
        .filter((item) => /^(SOM E DJ|ILUMINAÇÃO & EFEITOS|SERVIÇOS)/.test(item.getAttribute("aria-label") || ""))
        .map((item) => ({
          label: item.getAttribute("aria-label"),
          listItems: item.querySelectorAll("article").length,
          images: item.querySelectorAll("img").length,
        })),
      pageText: items.map((item) => item.textContent || ""),
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

function assertCategoryContinuation(inspection) {
  assert.deepEqual(
    inspection.categoryPages.map((page) => page.images),
    [1, 1, 1],
    "as páginas de categoria devem conter somente a imagem da logo, sem imagens ou placeholders de equipamentos"
  );
  assert.deepEqual(
    inspection.categoryPages.map((page) => page.listItems),
    [3, 6, 1],
    "a lista deve distribuir seis itens na folha principal e um na continuação"
  );
}

function assertPreview(name, inspection) {
  assert.equal(inspection.horizontalOverflow, false, `${name}: a página não pode rolar horizontalmente`);
  assert.deepEqual(
    inspection.pageLabels,
    ["Capa do PDF", "Biografia do DJ", "Dados do Orçamento", "Estrutura Selecionada", "SOM E DJ", "ILUMINAÇÃO & EFEITOS"],
    `${name}: a sequência deve conter apenas categorias PDF preenchidas`
  );
  assert.deepEqual(
    inspection.selectionCategories,
    ["Som e DJ", "Iluminação & Efeitos", "Serviços"],
    `${name}: os accordions de seleção não podem ser alterados`
  );

  for (const [index, page] of inspection.pages.entries()) {
    assert.equal(page.pageWidth, 1055, `${name}: página ${index + 1} perdeu a largura de design`);
    assert.equal(page.pageHeight, 1491, `${name}: página ${index + 1} perdeu a altura de design`);
    assert.ok(Math.abs(page.itemWidth - page.scalerWidth) < 1, `${name}: página ${index + 1} não está centralizada no wrapper`);
    assert.ok(Math.abs(page.itemHeight - page.scalerHeight) < 1, `${name}: página ${index + 1} tem altura de wrapper incorreta`);
    assert.ok(Math.abs((page.itemWidth / page.itemHeight) - (1055 / 1491)) < 0.002, `${name}: página ${index + 1} perdeu a proporção A4`);
  }
}

function assertInvestmentPage(inspection, expectedValue, expectedDetails = {}) {
  assert.equal(inspection.pageLabels.at(-1), "Investimento", "Investimento deve ser a última folha do PDF");
  const investment = inspection.pages.at(-1);
  assert.equal(investment.pageWidth, 1055, "Investimento deve manter a largura de design");
  assert.equal(investment.pageHeight, 1491, "Investimento deve manter a altura de design");
  const text = inspection.pageText.at(-1);
  assert.match(text, new RegExp(expectedValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), "Investimento deve mostrar o valor formatado");
  assert.match(text, /LUCAS FRANCO — DJ/, "Investimento deve apresentar a identificação do DJ no cabeçalho");
  assert.match(text, /Nº 0001/, "Investimento deve formatar o número real da proposta com quatro dígitos");
  for (const detail of Object.values(expectedDetails)) {
    assert.ok(text.includes(detail), `Investimento deve mostrar o dado dinâmico: ${detail}`);
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
  assert.equal(desktop.pageLabels.includes("Investimento"), false, "campo vazio não pode criar a folha Investimento");
  await (await page.$(".pdf-preview-viewport")).screenshot({ path: path.join(outputDirectory, "preview-desktop.png") });

  await fillBudgetValue(page, "0");
  const zeroValue = await inspectPreview(page);
  assert.equal(zeroValue.pageLabels.includes("Investimento"), false, "valor zero não pode criar a folha Investimento");

  await fillBudgetValue(page, "850");
  const smallValue = await inspectPreview(page);
  assertInvestmentPage(smallValue, "R$ 850,00", {
    client: "Ana & João",
    date: "24/10/2026",
    location: "Espaço Aurora",
  });

  await fillBudgetValue(page, "1.250.000,00");
  const largeValue = await inspectPreview(page);
  assertInvestmentPage(largeValue, "R$ 1.250.000,00", {
    client: "Ana & João",
    date: "24/10/2026",
    location: "Espaço Aurora",
  });

  await fillBudgetValue(page, "0");

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await clickText(page, "Prévia");
  await new Promise((resolve) => setTimeout(resolve, 300));
  const mobile = await inspectPreview(page);
  assertPreview("mobile", mobile);
  assert.equal(mobile.pageLabels.includes("Investimento"), false, "valor zero não pode criar a folha Investimento");
  await (await page.$(".pdf-preview-viewport")).screenshot({ path: path.join(outputDirectory, "preview-mobile-390.png") });

  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  await fillBudgetValue(page, "12.500,75");
  await addEquipmentItems(page, ["Máquina de Fumaça Profissional", "Canhão de CO₂", "Bazuca de CO₂"]);
  const continuation = await inspectPreview(page);
  assert.equal(continuation.horizontalOverflow, false, "continuação: a prévia não pode rolar horizontalmente");
  assert.deepEqual(
    continuation.pageLabels,
    ["Capa do PDF", "Biografia do DJ", "Dados do Orçamento", "Estrutura Selecionada", "SOM E DJ", "ILUMINAÇÃO & EFEITOS", "ILUMINAÇÃO & EFEITOS — CONTINUAÇÃO", "Investimento"],
    "a página Investimento deve ser a última, depois das continuações"
  );
  assertCategoryContinuation(continuation);
  assertInvestmentPage(continuation, "R$ 12.500,75", {
    client: "Ana & João",
    date: "24/10/2026",
    location: "Espaço Aurora",
  });
  await (await page.$(".pdf-preview-viewport")).screenshot({ path: path.join(outputDirectory, "preview-continuation.png") });

  const longClient = "Ana Carolina de Almeida e João Pedro Monteiro";
  const longLocation = "Espaço de Eventos Jardim das Palmeiras — Salão Principal";
  await fillBudgetData(page, [longClient, "", longLocation, "Casamento", "6 horas"]);
  const missingDate = await inspectPreview(page);
  assertInvestmentPage(missingDate, "R$ 12.500,75", {
    client: longClient,
    date: "Não informado",
    location: longLocation,
  });
  await (await page.$(".pdf-preview-viewport")).screenshot({ path: path.join(outputDirectory, "preview-investment-long-text.png") });

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await new Promise((resolve) => setTimeout(resolve, 350));
  const investmentMobile = await inspectPreview(page);
  assert.equal(investmentMobile.horizontalOverflow, false, "Investimento mobile: a prévia não pode rolar horizontalmente");
  assertInvestmentPage(investmentMobile, "R$ 12.500,75", {
    client: longClient,
    date: "Não informado",
    location: longLocation,
  });
  const mobileInvestmentPage = investmentMobile.pages.at(-1);
  assert.ok(Math.abs(mobileInvestmentPage.itemWidth - mobileInvestmentPage.scalerWidth) < 1, "Investimento mobile deve recalcular a escala pelo container real");
  assert.ok(Math.abs((mobileInvestmentPage.itemWidth / mobileInvestmentPage.itemHeight) - (1055 / 1491)) < 0.002, "Investimento mobile deve preservar a proporção A4");
  await (await page.$(".pdf-preview-viewport")).screenshot({ path: path.join(outputDirectory, "preview-investment-mobile-390.png") });

  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  await page.pdf({ path: pdfPath, preferCSSPageSize: true, printBackground: true });
  console.log(JSON.stringify({ desktop, zeroValue, smallValue, largeValue, mobile, continuation, missingDate, investmentMobile, pdfPath }, null, 2));
} finally {
  await browser.close();
}
