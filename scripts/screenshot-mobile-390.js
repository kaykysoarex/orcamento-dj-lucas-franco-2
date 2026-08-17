import puppeteer from 'puppeteer';
import fs from 'fs';
const url = 'file:///C:/Users/Gordim/Documents/orcamento-dj-lucas-franco/dist/index.html';
(async () => {
  // ensure output dir
  const outDir = 'screenshots';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 900, deviceScaleFactor: 1 });

    // wait for server to be ready with retries
    const maxAttempts = 30;
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const resp = await page.goto(url, { waitUntil: 'networkidle2', timeout: 5000 });
        if (resp && resp.status && resp.status() < 400) break;
      } catch (err) {
        // wait and retry
        await new Promise(r => setTimeout(r, 500));
        continue;
      }
    }

    // small wait to allow fonts to load and layout stabilize
    await new Promise(r => setTimeout(r, 800));

    const path = `${outDir}/mobile-390.png`;
    await page.screenshot({ path, fullPage: false });
    console.log('SCREENSHOT_SAVED:' + path);
  } catch (err) {
    console.error('ERROR', err && err.message);
    process.exit(2);
  } finally {
    await browser.close();
  }
})();
