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
