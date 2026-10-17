import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { DatabaseModel, OntimeEvent, ProjectCustomFields, Rundown, SupportedEntry } from 'ontime-types';

import { startTestServer } from './testServer.js';

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
