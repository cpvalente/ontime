const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');

const { loadWindowState, saveWindowState } = require('../windowState.js');

const primary = { workArea: { x: 0, y: 25, width: 1440, height: 875 } };
const secondary = { workArea: { x: -1920, y: 0, width: 1920, height: 1080 } };

function fixture(t, state) {
  const directory = mkdtempSync(path.join(tmpdir(), 'ontime-window-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const filename = path.join(directory, 'window-state.json');
  if (state !== undefined) writeFileSync(filename, JSON.stringify(state));
  return filename;
}

test('first launch fits and centres the window in the primary work area', (t) => {
  const state = loadWindowState(fixture(t), [secondary, primary], primary);
  assert.deepEqual(state, { bounds: { x: 72, y: 69, width: 1296, height: 788 }, isMaximized: false });
});

test('restores normal bounds and maximized state on a secondary display', (t) => {
  const saved = { bounds: { x: -1800, y: 50, width: 1200, height: 800 }, isMaximized: true };
  const filename = fixture(t);
  assert.equal(saveWindowState(filename, saved), true);
  assert.deepEqual(loadWindowState(filename, [primary, secondary], primary), saved);
});

test('moves a window from a disconnected monitor onto the primary display', (t) => {
  const saved = { bounds: { x: -1800, y: 50, width: 1200, height: 800 }, isMaximized: false };
  const state = loadWindowState(fixture(t, saved), [primary], primary);
  assert.deepEqual(state.bounds, { x: 0, y: 50, width: 1200, height: 800 });
});

test('clamps oversized or partially offscreen windows to the current work area', (t) => {
  const state = loadWindowState(
    fixture(t, { bounds: { x: 100, y: -50, width: 2000, height: 1200 } }),
    [primary],
    primary,
  );
  assert.deepEqual(state.bounds, primary.workArea);
});

test('respects the editor minimum size without overflowing a smaller display', (t) => {
  const small = { workArea: { x: 0, y: 0, width: 500, height: 350 } };
  const state = loadWindowState(fixture(t, { bounds: { x: 0, y: 0, width: 1, height: 1 } }), [small], small);
  assert.deepEqual(state.bounds, small.workArea);
});

test('invalid or malformed saved state falls back to first-launch bounds', (t) => {
  const filename = fixture(t);
  const fallback = loadWindowState(filename, [primary], primary);
  for (const value of ['{broken', 'null', JSON.stringify({ bounds: { x: '0', y: 0, width: -1, height: 800 } })]) {
    writeFileSync(filename, value);
    assert.deepEqual(loadWindowState(filename, [primary], primary), fallback);
  }
});

test('a failed preference write does not prevent closing the app', (t) => {
  const filename = path.join(fixture(t, {}), 'not-a-directory', 'state.json');
  assert.equal(saveWindowState(filename, { bounds: primary.workArea, isMaximized: false }), false);
});
