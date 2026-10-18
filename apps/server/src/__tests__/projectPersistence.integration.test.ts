import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { DatabaseModel, OntimeEvent, ProjectCustomFields, Rundown, SupportedEntry } from 'ontime-types';

import { startTestServer } from './testServer.js';

// each start loads the full server module graph, which takes a few seconds on slower machines
describe('project persistence', { timeout: 15_000 }, () => {
  const dataRoot = process.env.ONTIME_DATA!;

  beforeEach(async () => {
    process.env.ONTIME_DATA = await mkdtemp(join(dataRoot, 'project-'));
  });

  afterAll(() => {
    process.env.ONTIME_DATA = dataRoot;
  });

  test('upgrading v4 preserves the original file and does not migrate the v5 project again after restart', async () => {
    const initialRun = await startTestServer();
    onTestFinished(() => initialRun.stop());
    const current: DatabaseModel = await (await initialRun.get('/data/db')).json();
    await initialRun.stop();

    const legacy = {
      ...current,
      settings: { ...current.settings, version: '4.13.0' },
      customFields: current.customFields.fields,
      customFieldOrder: [...current.customFields.order].reverse(),
    };
    const original = JSON.stringify(legacy);
    const originalName = 'demo project.json';
    await writeFile(join(process.env.ONTIME_DATA!, 'projects', originalName), original);

    const upgradedRun = await startTestServer();
    onTestFinished(() => upgradedRun.stop());
    const upgraded: DatabaseModel = await (await upgradedRun.get('/data/db')).json();
    expect(upgraded.settings.version.startsWith('5.')).toBe(true);
    expect(upgraded.customFields).toEqual({ fields: legacy.customFields, order: legacy.customFieldOrder });
    for (const [id, rundown] of Object.entries(current.rundowns)) {
      for (const [entryId, entry] of Object.entries(rundown.entries)) {
        if ('custom' in entry) expect(upgraded.rundowns[id].entries[entryId]).toMatchObject({ custom: entry.custom });
      }
    }
    expect(await readFile(join(process.env.ONTIME_DATA!, 'migrated files', originalName), 'utf8')).toBe(original);
    const projectList = await (await upgradedRun.get('/data/db/all')).json();
    expect(projectList.lastLoadedProject).toBe('demo project (migrated)');
    await upgradedRun.stop();

    const restartedRun = await startTestServer();
    onTestFinished(() => restartedRun.stop());
    const restored: DatabaseModel = await (await restartedRun.get('/data/db')).json();
    expect(restored.customFields).toEqual(upgraded.customFields);
    expect((await (await restartedRun.get('/data/db/all')).json()).lastLoadedProject).toBe(
      projectList.lastLoadedProject,
    );
  });

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

  test('a new field keeps its ID and stale-client values after rename and restart', async () => {
    const firstRun = await startTestServer();
    onTestFinished(() => firstRun.stop());
    const created = await firstRun.send('POST', '/data/custom-fields', { label: 'Camera', type: 'text', colour: '' });
    expect(created.status).toBe(201);
    const fields = await created.json();
    const fieldId = Object.keys(fields).find((id) => fields[id].label === 'Camera')!;
    expect(fieldId).toBeDefined();
    expect(fieldId).not.toBe('Camera');
    const rundown: Rundown = await (await firstRun.get('/data/rundowns/current')).json();
    const eventId = rundown.flatOrder.find((id) => rundown.entries[id].type === SupportedEntry.Event)!;

    const renamed = await firstRun.send('PUT', `/data/custom-fields/${fieldId}`, {
      label: 'New Camera',
      type: 'text',
      colour: '',
    });
    expect(renamed.status).toBe(200);
    const edited = await firstRun.send('PUT', `/data/rundowns/${rundown.id}/entry`, {
      id: eventId,
      custom: { [fieldId]: 'Written by another node' },
    });
    expect(edited.status).toBe(200);
    await firstRun.stop();

    const restarted = await startTestServer();
    onTestFinished(() => restarted.stop());
    const restored: DatabaseModel = await (await restarted.get('/data/db')).json();
    expect(restored.customFields.fields[fieldId]).toEqual({ label: 'New Camera', type: 'text', colour: '' });
    expect(restored.customFields.order).toContain(fieldId);
    expect((restored.rundowns[rundown.id].entries[eventId] as OntimeEvent).custom[fieldId]).toBe(
      'Written by another node',
    );
  });

  test('custom fields and their order are imported, saved and restored as one collection', async () => {
    const firstRun = await startTestServer();
    onTestFinished(() => firstRun.stop());
    const initial: ProjectCustomFields = await (await firstRun.get('/data/custom-fields/ordered')).json();
    const imported: ProjectCustomFields = {
      fields: {
        Stage: { label: 'Stage', type: 'text', colour: '' },
        '2': { label: '2', type: 'text', colour: '' },
      },
      order: ['Stage', '2'],
    };
    const patch = await firstRun.send('PATCH', '/data/db', { customFields: imported });
    expect(patch.status).toBe(200);
    const merged: ProjectCustomFields = await (await firstRun.get('/data/custom-fields/ordered')).json();
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
    await firstRun.stop();

    const projectFile = join(process.env.ONTIME_DATA!, 'projects', 'demo project.json');
    const saved: DatabaseModel = JSON.parse(await readFile(projectFile, 'utf-8'));
    expect(saved.customFields).toEqual(expected);
    expect(saved).not.toHaveProperty('customFieldOrder');

    const secondRun = await startTestServer();
    onTestFinished(() => secondRun.stop());
    expect(await (await secondRun.get('/data/custom-fields/ordered')).json()).toEqual(expected);
  });
});
