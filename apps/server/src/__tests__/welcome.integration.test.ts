import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { publicFiles } from '../setup/index.js';
import { type TestServer, editorWelcome, startTestServer } from './testServer.js';

const projectsDir = () => join(process.env.ONTIME_DATA!, 'projects');

async function loadedProject(server: TestServer): Promise<string> {
  const { lastLoadedProject } = await (await server.get('/data/db/all')).json();
  return lastLoadedProject;
}

// each start loads the full server module graph, which takes a few seconds on slower machines
describe('welcome dialog', { timeout: 15_000 }, () => {
  test('a first start greets the editor with the demo it loaded', async () => {
    // without app state there is no previous project, as on a first start
    await rm(publicFiles.appState, { force: true });
    const server = await startTestServer();
    onTestFinished(() => server.stop());

    expect(await editorWelcome(server)).toMatchObject({ dialog: 'welcome', reason: 'first-run' });
  });

  test('a project which fails to load is set aside and reported, even with the welcome dialog turned off', async () => {
    const firstRun = await startTestServer();
    onTestFinished(() => firstRun.stop());
    await firstRun.send('POST', '/data/settings/welcomedialog', { show: false });
    const project = await loadedProject(firstRun);
    await firstRun.stop();

    await writeFile(join(projectsDir(), `${project}.json`), '{ not json');
    // a file of the same name set aside earlier must not block setting this one aside
    const corruptDir = join(process.env.ONTIME_DATA!, 'corrupt files');
    await mkdir(corruptDir, { recursive: true });
    await writeFile(join(corruptDir, `${project}.json`), '{ set aside earlier');

    const secondRun = await startTestServer();
    onTestFinished(() => secondRun.stop());

    expect(await editorWelcome(secondRun)).toEqual({
      dialog: 'welcome',
      reason: 'recovered-corrupt',
      project: expect.any(String),
      corruptProject: project,
      setAside: true,
    });
    expect(await readdir(projectsDir())).not.toContain(`${project}.json`);
  });

  test('an imported project which fails to load is not kept', async () => {
    const server = await startTestServer();
    onTestFinished(() => server.stop());
    const body = new FormData();
    body.append('project', new Blob(['{ not json'], { type: 'application/json' }), 'broken import.json');

    const response = await server.request('/data/db/upload', { method: 'POST', body });

    expect(response.status).toBe(400);
    expect(await readdir(projectsDir())).not.toContain('broken import.json');
  });
});
