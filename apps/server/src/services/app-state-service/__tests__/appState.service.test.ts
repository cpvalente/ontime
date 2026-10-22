import { rm } from 'node:fs/promises';

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
