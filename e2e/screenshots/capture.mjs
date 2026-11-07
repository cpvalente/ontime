/* oxlint-disable no-await-in-loop -- Playback history and captures share one server clock and must run in order. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium, expect } from '@playwright/test';

const root = fileURLToPath(new URL('../../', import.meta.url));
const output = join(root, process.env.CAPTURE_OUTPUT || 'automated-screenshots/demo');
const viewport = {
  width: Number(process.env.CAPTURE_WIDTH || 1920),
  height: Number(process.env.CAPTURE_HEIGHT || 1080),
};
const data = await mkdtemp(join(tmpdir(), 'ontime-screenshots-'));
const clockPath = join(data, 'clock.txt');
const frozen = Date.parse('2026-10-17T11:32:45+02:00');
const setClock = async (at) => {
  await writeFile(`${clockPath}.tmp`, String(at));
  await rename(`${clockPath}.tmp`, clockPath);
};
await mkdir(output, { recursive: true });
await setClock(frozen);

// Reserve a free port rather than connecting to an existing Ontime instance.
const reservation = createServer();
reservation.listen(0, '127.0.0.1');
await once(reservation, 'listening');
const port = reservation.address().port;
await new Promise((resolve) => reservation.close(resolve));
const base = `http://127.0.0.1:${port}`;
const serverRequire = createRequire(join(root, 'apps/server/package.json'));
const server = spawn(
  process.execPath,
  [
    '--import',
    fileURLToPath(new URL('./clock.mjs', import.meta.url)),
    '--import',
    serverRequire.resolve('tsx'),
    'apps/server/src/index.ts',
  ],
  {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PORT: String(port),
      ONTIME_DATA: data,
      ONTIME_SCREENSHOT_CLOCK: clockPath,
      TSX_TSCONFIG_PATH: 'apps/server/tsconfig.app.json',
      TZ: 'Europe/Oslo',
      IS_TEST: '',
      IS_CLOUD: '',
      ROUTER_PREFIX: '',
      SESSION_PASSWORD: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);
let serverLog = '';
server.stdout.on('data', (chunk) => {
  serverLog += chunk;
});
server.stderr.on('data', (chunk) => {
  serverLog += chunk;
});
let browser;

async function request(path, method = 'GET') {
  const response = await fetch(base + path, { method });
  assert.ok(response.ok, `${path}: ${response.status} ${await response.clone().text()}`);
  return response.json();
}

/** The Script field holds whole presenter scripts, which would stretch every table row */
async function hideScriptColumn(page) {
  await page.getByRole('button', { name: 'Table options' }).click();
  await page.getByRole('checkbox', { name: 'Script', exact: true }).uncheck();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('columnheader', { name: 'Script', exact: true })).toHaveCount(0);
}

async function poll() {
  return (await request('/api/poll')).payload;
}

try {
  await expect
    .poll(
      async () => {
        assert.equal(server.exitCode, null, serverLog);
        try {
          return (await fetch(base + '/api')).ok;
        } catch {
          return false;
        }
      },
      { timeout: 30000, message: 'Screenshot server did not start' },
    )
    .toBe(true);
  await request('/data/db/demo', 'POST');
  const demo = await request('/data/db');
  const events = demo.rundowns.default.flatOrder
    .map((id) => demo.rundowns.default.entries[id])
    .filter((entry) => entry.type === 'event');
  const current = events.find((event) => event.cue === '1.2');
  assert.ok(current, 'Demo must include the Session 1 event at cue 1.2');
  const upcoming = events.filter((event) => event.timeStart > current.timeStart);
  assert.ok(
    upcoming.some((event) => event.flag),
    'Demo needs an upcoming flagged event',
  );

  // Stage real playback history without changing any of the demo project or rundown data.
  for (const event of events.slice(0, events.indexOf(current) + 1)) {
    await setClock(Date.parse('2026-10-17T00:00:00+02:00') + event.timeStart);
    await request(`/api/start/id/${event.id}`);
  }
  const message = new URLSearchParams({
    text: '',
    visible: 'false',
    secondarySource: 'secondary',
  });
  await request(`/api/message/timer?${message}`);
  await request(`/api/message/secondary/${encodeURI('Please slow down for the interpreters')}`);
  for (const [index, duration] of [
    [1, 1800000],
    [2, 900000],
    [3, 300000],
  ]) {
    await request(`/api/auxtimer/${index}/duration/${duration}`);
    if (index === 1) await request(`/api/auxtimer/${index}/start`);
  }
  await setClock(frozen);
  await expect.poll(async () => (await poll()).clock).toBe(41565000);
  await expect.poll(async () => (await poll()).auxtimer1.current).toBe(435000);
  const before = await poll();
  assert.equal(before.eventFlag?.id, upcoming.find((event) => event.flag).id);
  assert.deepEqual(
    [before.auxtimer1.playback, before.auxtimer2.playback, before.auxtimer3.playback],
    ['start', 'stop', 'stop'],
  );
  assert.equal(before.message.timer.visible, false);
  assert.equal(before.message.timer.text, '');

  const countdown = new URLSearchParams({ 'secondary-src': 'note' });
  for (const event of upcoming) countdown.append('sub', event.id);
  const views = [
    ['Editor — Control', '/editor?layout=control'],
    ['Editor — Planning', '/editor?layout=planning'],
    ['Editor — Tracking', '/editor?layout=tracking'],
    ['Cuesheet', '/cuesheet'],
    ['Operator', '/op?secondary-src=note&subscribe=Video_Notes&showStart=true'],
    ['Timer', '/timer'],
    ['Backstage', '/backstage'],
    ['Timeline', '/timeline?fixedSize=true&secondary-src=note'],
    ['Studio Clock', '/studio'],
    ['Countdown', `/countdown?${countdown}`],
    ['Project Info', '/info'],
    ['Cuesheet — Video department', '/cuesheet'],
    ['Editor — Tracking delayed', '/editor?layout=tracking'],
  ];
  browser = await chromium.launch();
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    timezoneId: 'Europe/Oslo',
    locale: 'en-GB',
    colorScheme: 'dark',
  });
  const errors = [];
  const captures = [];
  for (const [index, [label, path]] of views.entries()) {
    const name = `${String(index + 1).padStart(2, '0')}-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`;
    const delayed = label === 'Editor — Tracking delayed';
    const department = label === 'Cuesheet — Video department';
    if (delayed) {
      await request('/api/addtime/add/300000');
      await expect.poll(async () => (await poll()).timer.addedTime).toBe(before.timer.addedTime + 300000);
    }
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.on('pageerror', (error) => errors.push({ label, message: error.message }));
    await page.clock.setFixedTime(frozen);
    await page.goto(base + path);
    if (label === 'Project Info') {
      await expect(page.getByTestId('project-view')).toContainText(demo.project.description);
      await expect(page.locator('.info__image')).toBeVisible();
    } else if (label === 'Countdown') {
      await expect(page.getByText(upcoming[0].title, { exact: true }).first()).toBeVisible();
    } else if (label.startsWith('Cuesheet')) {
      await expect(page.getByText(demo.rundowns.default.title, { exact: true }).first()).toBeVisible();
    } else if (!path.startsWith('/editor')) {
      await expect(page.locator('body')).toContainText(current.title);
    }
    if (label === 'Backstage') await expect(page.locator('.info-card svg')).toBeVisible();
    if (label === 'Timeline') await expect(page.getByText(current.note, { exact: true }).first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    if (path.startsWith('/editor')) {
      await expect(page.getByTestId('rundown-event').first()).toBeVisible();
      const welcome = page.getByRole('button', { name: 'close welcome modal' });
      if (await welcome.isVisible()) await welcome.click();
      if (path.includes('control')) {
        await page.getByRole('button', { name: 'Run', exact: true }).click();
        await page
          .getByTestId('rundown-event')
          .filter({ has: page.locator(`input[value="${current.title}"]`) })
          .click();
      } else {
        await page.getByRole('button', { name: 'Table', exact: true }).click();
        await expect(page.getByRole('columnheader', { name: 'Video Notes', exact: true })).toBeVisible();
        await hideScriptColumn(page);
      }
      if (!path.includes('planning')) {
        await expect(page.getByTestId('flag-plannedStart')).not.toContainText('––');
      }
    }
    if (label.startsWith('Cuesheet')) {
      await page.getByRole('button', { name: department ? 'Edit' : 'Run', exact: true }).click();
      await hideScriptColumn(page);
      if (department) {
        await page.getByRole('button', { name: 'Table options' }).click();
        for (const column of ['Audio Notes', 'PowerPoint Name', 'PowerPoint Slide']) {
          await page.getByRole('checkbox', { name: column, exact: true }).uncheck();
        }
        await page.keyboard.press('Escape');
        await expect(page.getByRole('columnheader', { name: 'Video Notes', exact: true })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Audio Notes', exact: true })).toHaveCount(0);
        for (const [column, extraWidth] of [
          ['Title', 200],
          ['Note', 200],
          ['Video Notes', 300],
        ]) {
          const header = page.getByRole('columnheader', { name: column, exact: true });
          await header.hover();
          const initialWidth = (await header.boundingBox()).width;
          await expect
            .poll(async () => (await header.locator('[class*="resizer"]').boundingBox()).width)
            .toBeGreaterThan(0);
          const handle = await header.locator('[class*="resizer"]').boundingBox();
          assert.ok(handle, `Missing resize handle for ${column}`);
          await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
          await page.mouse.down();
          await page.mouse.move(handle.x + handle.width / 2 + extraWidth, handle.y + handle.height / 2, { steps: 5 });
          await page.mouse.up();
          await expect
            .poll(async () => (await header.boundingBox()).width)
            .toBeGreaterThan(initialWidth + extraWidth - 2);
        }
      }
    }
    if (delayed) {
      await page.getByRole('button', { name: 'Table options' }).click();
      await page.getByRole('checkbox', { name: 'Show delayed times', exact: true }).check();
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('flag-expectedStart')).not.toHaveText(
        await page.getByTestId('flag-plannedStart').innerText(),
      );
    }
    if (path.startsWith('/editor')) {
      if (path.includes('control')) {
        await page.evaluate(() => document.activeElement?.blur());
        await page.keyboard.press('Alt+KeyL');
      } else {
        await page
          .getByRole('listitem')
          .filter({ has: page.getByText(current.title, { exact: true }) })
          .click();
      }
      const currentRow = path.includes('control')
        ? page.getByTestId('rundown-event').filter({ has: page.locator(`input[value="${current.title}"]`) })
        : page.locator(`[data-testid="cuesheet-event"][data-entry-id="${current.id}"]`);
      await expect.poll(async () => (await currentRow.boundingBox())?.y ?? Infinity).toBeLessThan(320);
    }
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      window.getSelection()?.removeAllRanges();
    });
    await expect(page.locator(':focus')).toHaveCount(0);
    await page.mouse.move(viewport.width - 1, viewport.height - 1);
    // Let the real navigation controls fade out, without changing product styles.
    const navigation = page.locator('#fadeable-navigation');
    if (await navigation.count()) await expect(navigation).toHaveCSS('opacity', '0', { timeout: 10000 });
    await expect
      .poll(() =>
        page.locator('img').evaluateAll((images) =>
          images.every((image) => {
            const { top, bottom, left, right } = image.getBoundingClientRect();
            const offscreen = bottom <= 0 || top >= innerHeight || right <= 0 || left >= innerWidth;
            return offscreen || (image.complete && image.naturalWidth > 0);
          }),
        ),
      )
      .toBe(true);
    // Refresh the baseline before capture: the client extrapolates stale server clocks.
    await setClock(frozen + 1000);
    await expect.poll(async () => (await poll()).clock).toBe(41566000);
    if (label !== 'Project Info') await expect(page.getByText('11:32:46', { exact: true }).first()).toBeVisible();
    await setClock(frozen);
    await expect.poll(async () => (await poll()).clock).toBe(41565000);
    if (label !== 'Project Info') await expect(page.getByText('11:32:45', { exact: true }).first()).toBeVisible();
    await expect.poll(async () => (await poll()).auxtimer1.current).toBe(before.auxtimer1.current);
    if (['Editor — Control', 'Editor — Tracking', 'Studio Clock'].includes(label)) {
      await expect(page.getByText('00:07:15', { exact: true }).first()).toBeVisible();
    }
    // Closing a menu can restore focus after its transition; clear it after all waits.
    if (department || delayed) await page.getByText('11:32:45', { exact: true }).first().click();
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      window.getSelection()?.removeAllRanges();
    });
    await expect(page.locator(':focus')).toHaveCount(0);
    await page.mouse.move(viewport.width - 1, viewport.height - 1);
    const runtime = await poll();
    if (delayed) {
      assert.equal(runtime.offset.absolute, before.offset.absolute + 300000);
      assert.equal(runtime.timer.expectedFinish, before.timer.expectedFinish + 300000);
    } else {
      assert.deepEqual(runtime, before, `Runtime changed before ${label}`);
    }
    // Signage comparison: wait for the refreshed clock to paint before capturing.
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.screenshot({ path: join(output, `${name}.png`), animations: 'disabled' });
    captures.push({
      name,
      label,
      path,
      scenario: delayed ? 'delayed' : department ? 'department' : 'standard',
      runtime,
      metrics: await page
        .locator(
          '.backstage, .project-header, .clock-container, .schedule-container, .timer, .event, .title-card__title, .title-card__label, .time-entry__value, .info-card, .entry',
        )
        .evaluateAll((elements) =>
          elements.map((element) => {
            const r = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return {
              selector: element.className,
              text: element.textContent,
              fontSize: style.fontSize,
              zoom: style.zoom,
              x: r.x,
              y: r.y,
              width: r.width,
              height: r.height,
              scrollWidth: element.scrollWidth,
              clientWidth: element.clientWidth,
            };
          }),
        ),
      text: await page.locator('body').innerText(),
    });
    if (delayed) {
      await request('/api/addtime/remove/300000');
      await expect.poll(async () => (await poll()).timer.addedTime).toBe(before.timer.addedTime);
    }
    await page.close();
    console.log(`Captured ${label}`);
  }
  const after = await poll();
  assert.deepEqual(after, before, 'Runtime changed across screenshots');
  assert.deepEqual(errors, [], 'Uncaught browser errors');
  assert.deepEqual(await request('/data/db'), demo, 'Capture changed the demo project');
  await writeFile(
    join(output, 'capture-report.json'),
    JSON.stringify(
      {
        viewport: `${viewport.width}x${viewport.height}`,
        frozen: '2026-10-17 11:32:45 Europe/Oslo',
        before,
        after,
        errors,
        captures,
      },
      null,
      2,
    ),
  );
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Ontime demo screenshots</title><style>body{margin:24px;background:#101114;color:#eee;font:16px system-ui}h1{font-size:24px}main{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}a{color:inherit;text-decoration:none;background:#1b1c20}img{display:block;width:100%}p{margin:12px}</style><h1>Ontime demo · ${viewport.width} × ${viewport.height} · 11:32:45</h1><main>${captures.map(({ name, label }) => `<a href="${name}.png"><img src="${name}.png" alt="${label}"><p>${label}</p></a>`).join('')}</main></html>`;
  await writeFile(join(output, 'index.html'), html);
  const gallery = await context.newPage();
  await gallery.setViewportSize({ width: 1680, height: 1200 });
  await gallery.goto(pathToFileURL(join(output, 'index.html')).href);
  await gallery.locator('img').evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
  await gallery.screenshot({ path: join(output, 'overview.png'), fullPage: true });
  console.log(`Saved ${captures.length} screenshots and gallery to ${output}`);
} catch (error) {
  const page = browser?.contexts()[0]?.pages().at(-1);
  if (page) {
    await page.screenshot({ path: join(output, 'failure.png') });
    console.error(await page.locator('body').innerText());
  }
  console.error(serverLog);
  throw error;
} finally {
  await browser?.close();
  if (server.exitCode === null && server.signalCode === null) {
    server.kill('SIGTERM');
    await once(server, 'exit');
  }
  await rm(data, { recursive: true, force: true });
}
