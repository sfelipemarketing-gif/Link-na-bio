// usage: node render.js stills out_dir t1 t2 ...   |   node render.js video out.mp4 [fps] [start] [end]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
(async () => {
  const [mode, out, ...rest] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('PAGEERR', e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const dur = await page.evaluate(() => window.DUR);
  if (mode === 'stills') {
    for (const ts of rest) {
      await page.evaluate(t => render(t), parseFloat(ts));
      await page.screenshot({ path: `${out}/f_${ts}.jpg`, type: 'jpeg', quality: 85 });
    }
    console.log('dur', dur);
  } else {
    const fps = parseFloat(rest[0] || 30), start = parseFloat(rest[1] || 0), end = parseFloat(rest[2] || dur);
    const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'ignore', 'inherit'] });
    const n = Math.round((end - start) * fps);
    const t0 = Date.now();
    for (let i = 0; i < n; i++) {
      await page.evaluate(t => render(t), start + i / fps);
      const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 150 === 0) console.log(`frame ${i}/${n} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
  }
  await browser.close();
})();
