// Renderiza video.html quadro a quadro (1080x1920, 30fps) e envia ao ffmpeg.
// Uso: node video/render.js saida.mp4              -> vídeo completo (sem áudio)
//      node video/render.js --frames dir t1 t2 ...  -> quadros de teste (PNG)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
(async () => {
  const args = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.join(__dirname, '..', 'video.html') + '?render', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => render(0));
  if (args[0] === '--frames') {
    for (const t of args.slice(2)) {
      await page.evaluate(x => render(x), parseFloat(t));
      await page.screenshot({ path: `${args[1]}/f_${t}.png` });
    }
  } else {
    const FPS = 30, total = await page.evaluate(() => TOTAL), n = Math.ceil(total * FPS);
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', args[0]], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = 0; f < n; f++) {
      await page.evaluate(x => render(x), f / FPS);
      const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (f % 150 === 0) console.log(`frame ${f}/${n}`);
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
    console.log('total', total);
  }
  await browser.close();
})();
