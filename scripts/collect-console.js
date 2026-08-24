import puppeteer from 'puppeteer';

(async () => {
  const url = 'http://127.0.0.1:4174/';
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE_CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE_ERROR:', err.message));

  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
    console.log('HTTP_STATUS', resp && resp.status());
  } catch (err) {
    console.log('NAV_ERROR', err && err.message);
  }

  // wait a bit
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
