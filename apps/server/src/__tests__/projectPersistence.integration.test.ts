import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { DatabaseModel, OntimeEvent, Rundown, SupportedEntry } from 'ontime-types';

import { startTestServer } from './testServer.js';

describe('project persistence', () => {
  test('rundown edits are saved to the project file and restored after a restart', async () => {
    const firstRun = await startTestServer();
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
    const restored: Rundown = await (await secondRun.get('/data/rundowns/current')).json();
    expect(restored.id).toBe(rundown.id);
    expect((restored.entries[eventId!] as OntimeEvent).title).toBe('Edited before restart');
    await secondRun.stop();
  });
});
