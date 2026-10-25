import { readFile, rm } from 'node:fs/promises';

import { JSONFile } from 'lowdb/node';

import { publicFiles } from '../../../setup/index.js';

let appState: typeof import('../appState.service.js');

beforeEach(async () => {
  vi.resetModules();
  await rm(publicFiles.appState, { force: true });
  appState = await import('../appState.service.js');
});

describe('session', () => {
  it('treats a first start as following a clean session', async () => {
    await expect(appState.startSession()).resolves.toBe(true);
  });

  it('knows a session which ended cleanly', async () => {
    await appState.startSession();
    await appState.endSession();

    await expect(appState.startSession()).resolves.toBe(true);
  });

  it('knows a session which never ended cleanly', async () => {
    await appState.startSession();

    await expect(appState.startSession()).resolves.toBe(false);
  });
});

describe('getNodeId()', () => {
  it('keeps the node id the first session created across restarts', async () => {
    await appState.startSession();
    const nodeId = appState.getNodeId();

    vi.resetModules();
    const restarted: typeof import('../appState.service.js') = await import('../appState.service.js');
    await restarted.startSession();

    expect(nodeId).toMatch(/.+/);
    expect(restarted.getNodeId()).toBe(nodeId);
  });
});

it('keeps visibility changes when a concurrent read finishes with an older disk snapshot', async () => {
  await appState.startSession();
  const previousState = JSON.parse(await readFile(publicFiles.appState, 'utf8'));
  let finishRead!: () => void;
  const pendingRead = new Promise<typeof previousState>((resolve) => {
    finishRead = () => resolve(previousState);
  });
  const read = vi.spyOn(JSONFile.prototype, 'read').mockReturnValueOnce(pendingRead);
  onTestFinished(() => read.mockRestore());

  const listing = appState.getCustomViewsInNav();
  await appState.setCustomViewInNav('first', true);
  finishRead();
  await listing;
  await appState.setCustomViewInNav('second', true);

  const saved = JSON.parse(await readFile(publicFiles.appState, 'utf8'));
  expect(saved.customViewsInNav).toEqual(['first', 'second']);
});

it('loads saved state before the first write after a restart', async () => {
  await appState.startSession();
  const nodeId = appState.getNodeId();
  await appState.setCustomViewInNav('first', true);

  vi.resetModules();
  const restarted: typeof import('../appState.service.js') = await import('../appState.service.js');
  await restarted.setCustomViewInNav('second', true);

  expect(await restarted.getCustomViewsInNav()).toEqual(['first', 'second']);
  expect(restarted.getNodeId()).toBe(nodeId);
});
