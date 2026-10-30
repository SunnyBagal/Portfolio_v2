// Builds are served with `vite preview`; this script screenshots every section at desktop
// and phone sizes, plus one opened state per interactive section, and reports page errors.
// Usage: npm run screenshots   (or: node scripts/screenshots.mjs --headed)
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = new URL('../screenshots/', import.meta.url);
const port = 4318;
const url = `http://localhost:${port}/`;
const headed = process.argv.includes('--headed');
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7);

const viewports = [
  { name: 'desktop', width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false },
  { name: 'mobile', width: 390, height: 844, deviceScaleFactor: 2, isMobile: true },
];
const sections = ['preview', 'about', 'trajectory', 'portfolio', 'skills', 'education', 'stories', 'contact'];

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

await waitForServer();
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: !headed, args: ['--ignore-gpu-blocklist', '--enable-gpu'] });

for (const vp of viewports) {
  if (only && only !== vp.name) continue;
  const page = await browser.newPage({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.deviceScaleFactor,
    isMobile: vp.isMobile,
    hasTouch: vp.isMobile,
    reducedMotion: 'no-preference',
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  await page.goto(url);
  await page.waitForSelector('body[data-ready="1"]');
  await page.waitForTimeout(1200);

  const shot = (name) => page.screenshot({ path: fileURLToPath(new URL(`${vp.name}-${name}.png`, out)) });
  // Sections are sticky, so offsetTop is where they're stuck; sum heights for the real position.
  const scrollToSection = (id, extra = 0) =>
    page.evaluate(
      ([id, extra]) => {
        let y = 0;
        for (const s of document.querySelectorAll('.sec')) {
          if (s.id === id) break;
          y += s.offsetHeight;
        }
        scrollTo(0, y + extra);
      },
      [id, extra],
    );

  for (const id of sections) {
    await scrollToSection(id);
    await page.waitForTimeout(900);
    await shot(id);
  }

  // A few interactions: second track, third record, a tag on the wall.
  await scrollToSection('trajectory', 200);
  await page.locator('.track').nth(3).click();
  await page.waitForTimeout(700);
  await shot('trajectory-track');

  await scrollToSection('education');
  await page.locator('.vinyl').nth(3).click();
  await page.waitForTimeout(900);
  await shot('education-record');

  await scrollToSection('contact');
  await page.waitForTimeout(600);
  const box = await page.locator('.wall-canvas canvas').nth(1).boundingBox();
  if (box) {
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const r = Math.min(box.width, box.height) * 0.28;
    await page.mouse.move(cx + r, cy);
    await page.mouse.down();
    for (let a = 0; a <= Math.PI * 2; a += 0.08) {
      await page.mouse.move(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.8);
    }
    await page.mouse.up();
    await page.waitForTimeout(1500);
    await shot('contact-tag');
  }

  console.log(JSON.stringify({ viewport: vp.name, errors }));
  await page.close();
}

await browser.close();
stop();
