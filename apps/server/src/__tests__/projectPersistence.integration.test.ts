import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { DatabaseModel, OntimeEvent, ProjectCustomFields, Rundown, SupportedEntry } from 'ontime-types';

import { type TestServer, startTestServer } from './testServer.js';

const projectsDir = () => join(process.env.ONTIME_DATA!, 'projects');
const corruptDir = () => join(process.env.ONTIME_DATA!, 'corrupt files');

async function loadedProject(server: TestServer): Promise<string> {
  const { lastLoadedProject } = await (await server.get('/data/db/all')).json();
  return lastLoadedProject;
}

/** stops the server, and sets aside a file of the same name as its project, as an earlier failed load would */
async function stopWithEarlierBackup(server: TestServer): Promise<string> {
  const project = await loadedProject(server);
  await server.stop();
  await mkdir(corruptDir(), { recursive: true });
  await writeFile(join(corruptDir(), `${project}.json`), '{ set aside earlier');
  return project;
}

// each start loads the full server module graph, which takes a few seconds on slower machines
describe('project persistence', { timeout: 15_000 }, () => {
  test('rundown edits are saved to the project file and restored after a restart', async () => {
    const firstRun = await startTestServer();
    onTestFinished(() => firstRun.stop());
    const rundown: Rundown = await (await firstRun.get('/data/rundowns/current')).json();
    const eventId = rundown.flatOrder.find((id) => rundown.entries[id].type === SupportedEntry.Event);
    expect(eventId).toBeDefined();

    const response = await firstRun.send('PUT', `/data/rundowns/${rundown.id}/entry`, {
      id: eventId,
      title: 'Edited before restart',
    });
    expect(response.status).toBe(200);
    await firstRun.stop();

    const projectFile = join(process.env.ONTIME_DATA!, 'projects', 'demo project.json');
    const saved: DatabaseModel = JSON.parse(await readFile(projectFile, 'utf-8'));
    expect((saved.rundowns[rundown.id].entries[eventId!] as OntimeEvent).title).toBe('Edited before restart');

    const secondRun = await startTestServer();
    onTestFinished(() => secondRun.stop());
    const restored: Rundown = await (await secondRun.get('/data/rundowns/current')).json();
    expect(restored.id).toBe(rundown.id);
    expect((restored.entries[eventId!] as OntimeEvent).title).toBe('Edited before restart');
  });

  test('a project which fails to load is set aside, keeping a file of the same name set aside earlier', async () => {
    const firstRun = await startTestServer();
    onTestFinished(() => firstRun.stop());
    const project = await stopWithEarlierBackup(firstRun);
    await writeFile(join(projectsDir(), `${project}.json`), '{ not json');

    const secondRun = await startTestServer();
    onTestFinished(() => secondRun.stop());

    expect(await readdir(projectsDir())).not.toContain(`${project}.json`);
    expect(await readFile(join(corruptDir(), `${project}.json`), 'utf-8')).toBe('{ set aside earlier');
    expect(await readFile(join(corruptDir(), `${project} (1).json`), 'utf-8')).toBe('{ not json');
  });

  test('a project which loads with errors is backed up, keeping a file of the same name backed up earlier', async () => {
    const firstRun = await startTestServer();
    onTestFinished(() => firstRun.stop());
    const project = await stopWithEarlierBackup(firstRun);
    // without custom fields the file parses, but fails validation
    const projectFile = join(projectsDir(), `${project}.json`);
    const { customFields: _, ...withoutCustomFields } = JSON.parse(await readFile(projectFile, 'utf-8'));
    await writeFile(projectFile, JSON.stringify(withoutCustomFields));

    const secondRun = await startTestServer();
    onTestFinished(() => secondRun.stop());

    expect(await loadedProject(secondRun)).toBe(`${project} (recovered)`);
    expect(await readFile(join(corruptDir(), `${project}.json`), 'utf-8')).toBe('{ set aside earlier');
    expect(await readdir(corruptDir())).toContain(`${project} (1).json`);
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

  test('custom fields and their order are imported, saved and restored as one collection', async () => {
    const firstRun = await startTestServer();
    onTestFinished(() => firstRun.stop());
    const initial: ProjectCustomFields = await (await firstRun.get('/data/custom-fields')).json();
    const imported: ProjectCustomFields = {
      fields: {
        Stage: { label: 'Stage', type: 'text', colour: '' },
        '2': { label: '2', type: 'text', colour: '' },
      },
      order: ['Stage', '2'],
    };
    const patch = await firstRun.send('PATCH', '/data/db', { customFields: imported });
    expect(patch.status).toBe(200);
    const merged: ProjectCustomFields = await (await firstRun.get('/data/custom-fields')).json();
    expect(merged).toEqual({
      fields: { ...initial.fields, ...imported.fields },
      order: [...initial.order, ...imported.order],
    });

    const order = [...imported.order, ...initial.order];
    const reordered = await firstRun.send('PATCH', '/data/custom-fields/order', { order });
    expect(reordered.status).toBe(200);
    const expected = { fields: merged.fields, order };
    expect(await reordered.json()).toEqual(expected);
    const downloaded: DatabaseModel = await (await firstRun.get('/data/db')).json();
    expect(downloaded.customFields).toEqual(expected);
    expect(downloaded).not.toHaveProperty('customFieldOrder');
    const project = await loadedProject(firstRun);
    await firstRun.stop();

    const projectFile = join(projectsDir(), `${project}.json`);
    const saved: DatabaseModel = JSON.parse(await readFile(projectFile, 'utf-8'));
    expect(saved.customFields).toEqual(expected);
    expect(saved).not.toHaveProperty('customFieldOrder');

    const secondRun = await startTestServer();
    onTestFinished(() => secondRun.stop());
    expect(await (await secondRun.get('/data/custom-fields')).json()).toEqual(expected);
  });
});
