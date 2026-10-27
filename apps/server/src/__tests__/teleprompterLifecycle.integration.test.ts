import type { ProjectFileListResponse, Rundown, TeleprompterScript, TeleprompterSettings } from 'ontime-types';
import { defaultTeleprompterSettings } from 'ontime-utils';

import { type TestServer, startTestServer } from './testServer.js';

async function settings(server: TestServer): Promise<TeleprompterSettings> {
  return (await server.get('/data/teleprompter/settings')).json();
}

async function script(server: TestServer): Promise<TeleprompterScript> {
  return (await server.get('/data/teleprompter/script')).json();
}

describe('teleprompter project lifecycle', { timeout: 15_000 }, () => {
  test('settings survive restart and follow the project when switching away and back', async () => {
    const firstRun = await startTestServer();
    onTestFinished(() => firstRun.stop());
    const { lastLoadedProject }: ProjectFileListResponse = await (await firstRun.get('/data/db/all')).json();
    const saved: TeleprompterSettings = { script: 'title', charsPerLine: 20, heading: 'none' };
    expect((await firstRun.send('POST', '/data/teleprompter/settings', saved)).ok).toBe(true);
    const before = await script(firstRun);
    expect(before.events.length).toBeGreaterThan(0);
    await firstRun.stop();

    const secondRun = await startTestServer();
    onTestFinished(() => secondRun.stop());
    expect(await settings(secondRun)).toEqual(saved);
    expect(await script(secondRun)).toMatchObject({ charsPerLine: saved.charsPerLine, events: before.events });

    expect((await secondRun.send('POST', '/data/db/new', { filename: 'Empty prompt project' })).ok).toBe(true);
    expect(await settings(secondRun)).toEqual(defaultTeleprompterSettings);
    expect((await script(secondRun)).events).toEqual([]);

    expect((await secondRun.send('POST', '/data/db/load', { filename: lastLoadedProject })).ok).toBe(true);
    expect(await settings(secondRun)).toEqual(saved);
    expect((await script(secondRun)).events).toEqual(before.events);
  });

  test('renaming and deleting a script custom field update its source and the resulting script', async () => {
    const server = await startTestServer();
    onTestFinished(() => server.stop());
    const rundown: Rundown = await (await server.get('/data/rundowns/current')).json();
    const eventId = rundown.flatOrder.find((id) => rundown.entries[id].type === 'event')!;
    const field = { label: 'Prompt', type: 'text', colour: '#ffffff' };
    expect((await server.send('POST', '/data/custom-fields', field)).ok).toBe(true);
    expect(
      (
        await server.send('PUT', `/data/rundowns/${rundown.id}/entry`, {
          id: eventId,
          note: 'Fallback note',
          custom: { Prompt: 'Custom script' },
        })
      ).ok,
    ).toBe(true);
    expect(
      (await server.send('POST', '/data/teleprompter/settings', { script: 'custom-Prompt', heading: 'none' })).ok,
    ).toBe(true);
    const before = await script(server);
    expect(before.events).toHaveLength(1);
    expect(before.events[0].lines).toContainEqual({ kind: 'text', text: 'Custom script', start: 0 });

    expect((await server.send('PUT', '/data/custom-fields/Prompt', { ...field, label: 'Renamed' })).ok).toBe(true);
    expect((await settings(server)).script).toBe('custom-Renamed');
    expect((await script(server)).events).toEqual(before.events);

    expect((await server.send('DELETE', '/data/custom-fields/Renamed')).ok).toBe(true);
    expect((await settings(server)).script).toBe(defaultTeleprompterSettings.script);
    const fallback = (await script(server)).events.find((event) => event.id === eventId);
    expect(fallback?.lines).toContainEqual({ kind: 'text', text: 'Fallback note', start: 0 });
  });

  test('shared playback pauses when another project loads', async () => {
    const server = await startTestServer();
    onTestFinished(() => server.stop());
    const teleprompter = async () => (await (await server.get('/api/poll')).json()).payload.teleprompter;
    await script(server);
    expect((await server.get('/api/teleprompter/play')).ok).toBe(true);
    expect(await teleprompter()).toMatchObject({ playback: 'play' });

    expect((await server.send('POST', '/data/db/demo')).ok).toBe(true);
    await vi.waitFor(async () => expect(await teleprompter()).toMatchObject({ playback: 'pause' }), { timeout: 3000 });
  });
});
