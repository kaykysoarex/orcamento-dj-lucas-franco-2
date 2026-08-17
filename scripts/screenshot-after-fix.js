import puppeteer from 'puppeteer';
import fs from 'fs';
const url = 'http://127.0.0.1:5176/orcamento-dj-lucas-franco/';
(async () => {
  const outDir = 'screenshots';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 900 });
    await page.goto(url, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));
    const path = `${outDir}/after-fix-390.png`;
    await page.screenshot({ path });
    console.log('SAVED:' + path);
  } catch (err) {
    console.error(err && err.message);
    process.exit(2);
  } finally {
    await browser.close();
  }
})();