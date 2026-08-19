import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import puppeteer from "puppeteer";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4173/orcamento-dj-lucas-franco-2/";
const outputDirectory = path.join(os.tmpdir(), "orcamento-dj-lucas-franco-effects-pdf");
const scenarios = [
  { name: "nenhum-efeito", effects: [] },
  { name: "fogos", effects: ["Fogos de Artifício"] },
  { name: "canhao", effects: ["Canhão de CO₂"] },
  { name: "bazuca", effects: ["Bazuca de CO₂"] },
  { name: "dois-efeitos", effects: ["Fogos de Artifício", "Canhão de CO₂"] },
  { name: "tres-efeitos", effects: ["Fogos de Artifício", "Canhão de CO₂", "Bazuca de CO₂"] },
];

fs.mkdirSync(outputDirectory, { recursive: true });

async function selectTextButton(page, text) {
  const clicked = await page.evaluate((label) => {
    const button = [...document.querySelectorAll("button")].find((element) => element.textContent?.includes(label));
    if (!button) return false;
    button.click();
    return true;
  }, text);
  assert.equal(clicked, true, `Botão não encontrado: ${text}`);
}

async function chooseEffects(page, effects) {
  await selectTextButton(page, "Adicionar estrutura");
  await selectTextButton(page, "Estrutura Prime");

  await page.evaluate(() => {
    const group = [...document.querySelectorAll("details")].find((element) => element.textContent?.includes("Iluminação & Efeitos"));
    if (group) group.open = true;
  });

  for (const effect of effects) {
    const clicked = await page.evaluate((label) => {
      const item = [...document.querySelectorAll('[role="checkbox"]')].find((element) => element.textContent?.includes(label));
      if (!item) return false;
      item.click();
      return true;
    }, effect);
    assert.equal(clicked, true, `Efeito não encontrado: ${effect}`);
  }
}

async function inspectEffectsPage(page, scenario) {
  return page.evaluate((expectedEffects) => {
    const sheet = document.querySelector('[aria-label="Iluminação e Efeitos"]');
    if (!sheet) throw new Error("Folha de Iluminação e Efeitos não foi renderizada.");

    const pageRect = sheet.getBoundingClientRect();
    const cards = [...sheet.querySelectorAll("figure")];
    const captions = cards.map((card) => card.querySelector("figcaption")?.textContent?.trim());
    const itemCards = [...sheet.querySelectorAll("article")];
    const logo = sheet.querySelector('img[alt="Lucas Franco"]');
    const logoRect = logo?.getBoundingClientRect();
    const figureBottom = cards.length ? Math.max(...cards.map((card) => card.getBoundingClientRect().bottom)) : pageRect.top;
    const itemBottom = itemCards.length ? Math.max(...itemCards.map((item) => item.getBoundingClientRect().bottom)) : pageRect.top;
    const itemTop = itemCards.length ? Math.min(...itemCards.map((item) => item.getBoundingClientRect().top)) : pageRect.top;

    return {
      expectedEffects,
      captions,
      itemCount: itemCards.length,
      hasLogo: Boolean(logo),
      itemBottom: Math.round(itemBottom - pageRect.top),
      logoTop: Math.round((logoRect?.top || pageRect.top) - pageRect.top),
      imagesAboveItems: cards.length === 0 || itemTop > figureBottom,
      itemsAboveLogo: !logoRect || itemBottom < logoRect.top,
      insidePage: !logoRect || (logoRect.top >= pageRect.top && logoRect.bottom <= pageRect.bottom),
    };
  }, scenario.effects);
}

const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900, deviceScaleFactor: 1 });

  for (const scenario of scenarios) {
    await page.goto(baseUrl, { waitUntil: "networkidle0" });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "networkidle0" });
    await chooseEffects(page, scenario.effects);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const inspection = await inspectEffectsPage(page, scenario);
    console.log(`${scenario.name}: ${JSON.stringify(inspection)}`);
    assert.deepEqual(inspection.captions, scenario.effects, `${scenario.name}: imagens incorretas`);
    assert.ok(inspection.itemCount > 0, `${scenario.name}: itens abaixo das imagens não foram renderizados`);
    assert.ok(inspection.hasLogo, `${scenario.name}: logo ausente`);
    assert.ok(inspection.imagesAboveItems, `${scenario.name}: itens sobrepostos às imagens`);
    assert.ok(inspection.itemsAboveLogo, `${scenario.name}: itens sobrepostos ao logo`);
    assert.ok(inspection.insidePage, `${scenario.name}: logo fora da folha A4`);

    const sheet = await page.$('[aria-label="Iluminação e Efeitos"]');
    await sheet.screenshot({ path: path.join(outputDirectory, `${scenario.name}.png`) });
    await page.addStyleTag({ content: "@media print { .obg-print-area > * { display: none !important; } .obg-print-area > [aria-label^='Iluminação e Efeitos'] { display: block !important; } }" });
    await page.pdf({
      path: path.join(outputDirectory, `${scenario.name}.pdf`),
      preferCSSPageSize: true,
      printBackground: true,
    });
  }

  console.log(`Validação visual concluída: ${outputDirectory}`);
} finally {
  await browser.close();
}
