// Renders render.html frame-by-frame with Playwright and pipes JPEG frames to ffmpeg.
// Usage: node render.js out.mp4 [start=0] [end=60] [stills=t1,t2,...]
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const { spawn } = require('child_process');
const ROOT = __dirname, FPS = 30;
const [out = 'video.mp4', s0 = '0', s1 = '60', stills] = process.argv.slice(2);
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  const ext = path.extname(f);
  res.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.json': 'application/json', '.png': 'image/png' }[ext] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(0);
(async () => {
  const port = server.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto(`http://127.0.0.1:${port}/render.html`);
  await page.evaluate(() => window.ready);
  const grab = async t => {
    const data = await page.evaluate(t => { window.draw(t); return document.getElementById('c').toDataURL('image/jpeg', 0.95); }, t);
    return Buffer.from(data.split(',')[1], 'base64');
  };
  if (stills) {
    for (const t of stills.split(',')) fs.writeFileSync(path.join(out, `f_${t}.jpg`), await grab(+t));
  } else {
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const n0 = Math.round(+s0 * FPS), n1 = Math.round(+s1 * FPS);
    for (let i = n0; i < n1; i++) {
      const buf = await grab(i / FPS);
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 150 === 0) console.log('frame', i);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  await browser.close(); server.close();
})();
