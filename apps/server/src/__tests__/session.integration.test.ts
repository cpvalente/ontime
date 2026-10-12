import { readFile } from 'node:fs/promises';

import { Playback, RuntimeStore } from 'ontime-types';

import { publicFiles } from '../setup/index.js';
import { type TestServer, startTestServer } from './testServer.js';

async function playback(server: TestServer): Promise<Playback> {
  const { payload }: { payload: RuntimeStore } = await (await server.get('/api/poll')).json();
  return payload.timer.playback;
}

/** starts the first event, and waits for the restore point to be saved */
async function startShow(server: TestServer) {
  await server.get('/api/start/index/1');
  await vi.waitFor(async () => {
    expect(await readFile(publicFiles.restoreFile, 'utf-8')).toContain('"playback": "play"');
  });
}

async function logTexts(server: TestServer): Promise<string[]> {
  const entries = await (await server.get('/data/logs/entries')).json();
  return entries.map((entry: { text: string }) => entry.text);
}

// each start loads the full server module graph, which takes a few seconds on slower machines
describe('session', { timeout: 15_000 }, () => {
  test('a clean restart starts stopped, and keeps the previous session log', async () => {
    const firstRun = await startTestServer();
    onTestFinished(() => firstRun.stop());
    await startShow(firstRun);
    await firstRun.stop();

    const secondRun = await startTestServer();
    onTestFinished(() => secondRun.stop());

    expect(await playback(secondRun)).toBe(Playback.Stop);
    const previous = await (await secondRun.get('/data/logs/previous')).text();
    expect(previous.trimEnd().split('\n').at(-1)).toMatch(/ INFO SERVER Server stopped code=0$/);
    expect((await logTexts(secondRun)).some((text) => text.startsWith('Previous session'))).toBe(false);
  });

  test('a container stop resumes the show, and is not reported', async () => {
    const firstRun = await startTestServer();
    onTestFinished(() => firstRun.stop());
    await startShow(firstRun);
    await firstRun.stop(3);

    const secondRun = await startTestServer();
    onTestFinished(() => secondRun.stop());

    expect(await playback(secondRun)).toBe(Playback.Play);
    expect((await logTexts(secondRun)).some((text) => text.startsWith('Previous session'))).toBe(false);
  });

  test('a start after a crash resumes the show and says so', async () => {
    const firstRun = await startTestServer();
    onTestFinished(() => firstRun.stop());
    await startShow(firstRun);
    await firstRun.stop(1);

    const secondRun = await startTestServer();
    onTestFinished(() => secondRun.stop());

    expect(await playback(secondRun)).toBe(Playback.Play);
    expect(await logTexts(secondRun)).toContain('Previous session did not end cleanly log=ontime.previous.log');
  });
});
