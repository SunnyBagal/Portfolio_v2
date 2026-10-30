// Builds are served with `vite preview`; this script screenshots the overview and one opened rock
// at desktop and phone sizes, and prints the measured frame rate and the GPU the browser used.
// Usage: npm run screenshots   (or: node scripts/screenshots.mjs --headed for a real-GPU fps reading)
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = new URL('../screenshots/', import.meta.url);
const port = 4317;
const url = `http://localhost:${port}/?fps`;
const headed = process.argv.includes('--headed');

const viewports = [
  { name: 'desktop', width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false },
  { name: 'mobile', width: 390, height: 844, deviceScaleFactor: 2, isMobile: true },
];

const server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
const stop = () => server.kill();
process.on('exit', stop);

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('vite preview did not start');
}

const measureFps = (page, ms = 4000) =>
  page.evaluate(
    (ms) =>
      new Promise((resolve) => {
        let frames = 0;
        const t0 = performance.now();
        const tick = (t) => {
          frames++;
          if (t - t0 < ms) requestAnimationFrame(tick);
          else resolve(Math.round((frames * 1000) / (t - t0)));
        };
        requestAnimationFrame(tick);
      }),
    ms,
  );

const gpu = (page) =>
  page.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl2');
    const ext = gl?.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown';
  });

await waitForServer();
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: !headed, args: ['--ignore-gpu-blocklist', '--enable-gpu'] });

for (const vp of viewports) {
  const page = await browser.newPage({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.deviceScaleFactor,
    isMobile: vp.isMobile,
    hasTouch: vp.isMobile,
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  await page.goto(url);
  await page.waitForSelector('body[data-ready="1"]');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  const fps = await measureFps(page);
  await page.screenshot({ path: fileURLToPath(new URL(`${vp.name}-overview.png`, out)) });

  await page.evaluate(() => document.querySelector('[data-story="competitor-day-5"]').click());
  await page.waitForTimeout(1600);
  await page.screenshot({ path: fileURLToPath(new URL(`${vp.name}-rock.png`, out)) });

  console.log(JSON.stringify({ viewport: vp.name, fps, gpu: await gpu(page), errors }));
  await page.close();
}

await browser.close();
stop();
