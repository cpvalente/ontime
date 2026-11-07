import { readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { publicFiles } from '../setup/index.js';
import { type TestServer, editorWelcome, startTestServer } from './testServer.js';

async function loadedProject(server: TestServer): Promise<string> {
  const { lastLoadedProject } = await (await server.get('/data/db/all')).json();
  return lastLoadedProject;
}

/** waits for the restore point to hold this playback */
async function restoredPlayback(playback: string) {
  await vi.waitFor(
    async () => {
      expect(await readFile(publicFiles.restoreFile, 'utf-8')).toContain(`"playback": "${playback}"`);
    },
    { timeout: 5000 },
  );
}

// each start loads the full server module graph, which takes a few seconds on slower machines
describe('welcome dialog', { timeout: 15_000 }, () => {
  test('a first start greets the editor with the demo it loaded', async () => {
    // without app state there is no previous project, as on a first start
    await rm(publicFiles.appState, { force: true });
    const server = await startTestServer();
    onTestFinished(() => server.stop());

    expect(await editorWelcome(server)).toEqual({ dialog: 'welcome', reason: 'first-run', project: 'demo project' });
  });

  test('a container stopped and started again with the show stopped greets the editor back', async () => {
    const firstRun = await startTestServer();
    onTestFinished(() => firstRun.stop());
    const project = await loadedProject(firstRun);
    await firstRun.get('/api/start/index/1');
    await restoredPlayback('play');
    await firstRun.get('/api/stop');
    await restoredPlayback('stop');
    // exit code 3 is a container shutdown, it keeps the restore point
    await firstRun.stop(3);

    const secondRun = await startTestServer();
    onTestFinished(() => secondRun.stop());

    expect(await editorWelcome(secondRun)).toEqual({ dialog: 'welcome', reason: 'resumed', project });
  });

  test('a container stopped and started again mid-show does not interrupt the show', async () => {
    const firstRun = await startTestServer();
    onTestFinished(() => firstRun.stop());
    await firstRun.get('/api/start/index/1');
    await restoredPlayback('play');
    await firstRun.stop(3);

    const secondRun = await startTestServer();
    onTestFinished(() => secondRun.stop());

    expect(await editorWelcome(secondRun)).toBeNull();
  });

  test('a project which fails to load is replaced, and the editor is told, even with the dialog turned off', async () => {
    const firstRun = await startTestServer();
    onTestFinished(() => firstRun.stop());
    await firstRun.send('POST', '/data/settings/welcomedialog', { show: false });
    const project = await loadedProject(firstRun);
    await firstRun.stop();

    await writeFile(join(process.env.ONTIME_DATA!, 'projects', `${project}.json`), '{ not json');

    const secondRun = await startTestServer();
    onTestFinished(() => secondRun.stop());

    expect(await editorWelcome(secondRun)).toEqual({
      dialog: 'welcome',
      reason: 'recovered',
      project: await loadedProject(secondRun),
      failedProject: project,
    });
  });

  test('the startup preference is saved, and turned off hides the dialog on the next start', async () => {
    const firstRun = await startTestServer();
    onTestFinished(() => firstRun.stop());
    await firstRun.send('POST', '/data/settings/welcomedialog', { show: false });
    expect(await (await firstRun.get('/data/settings/welcomedialog')).json()).toEqual({ show: false });
    await firstRun.stop();

    const secondRun = await startTestServer();
    onTestFinished(() => secondRun.stop());

    expect(await editorWelcome(secondRun)).toBeNull();
  });
});
