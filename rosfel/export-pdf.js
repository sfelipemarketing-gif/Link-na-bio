// Exporta a apresentação para PDF (1920x1080 por página) e gera prévias PNG opcionais.
// Uso: node export-pdf.js [saida.pdf] [--shots dir]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2] || path.join(__dirname, 'ROSFEL-Apresentacao.pdf');
  const si = process.argv.indexOf('--shots');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('file://' + path.join(__dirname, 'index.html'), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  if (si > -1) {
    const dir = process.argv[si + 1];
    for (let i = 0; i < 12; i++) {
      await page.evaluate(n => go(n), i);
      await page.waitForTimeout(3200);
      await page.screenshot({ path: `${dir}/s${String(i + 1).padStart(2, '0')}.png` });
    }
  }
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: out, width: '1920px', height: '1080px', printBackground: true, preferCSSPageSize: true });
  await browser.close();
  console.log('PDF:', out);
})();
