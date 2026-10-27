import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { MessageTag, Playback, RuntimeStore } from 'ontime-types';

import { publicFiles } from '../setup/index.js';
import { type TestServer, startTestServer } from './testServer.js';

async function playback(server: TestServer): Promise<Playback> {
  const { payload }: { payload: RuntimeStore } = await (await server.get('/api/poll')).json();
  return payload.timer.playback;
}

/** starts the first event, and waits for the restore point to be saved */
async function startShow(server: TestServer) {
  await server.get('/api/start/index/1');
  await vi.waitFor(
    async () => {
      expect(await readFile(publicFiles.restoreFile, 'utf-8')).toContain('"playback": "play"');
    },
    { timeout: 5000 },
  );
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

  test('a container stop resumes a running aux timer with the show, and keeps both saved', async () => {
    const firstRun = await startTestServer();
    onTestFinished(() => firstRun.stop());
    await startShow(firstRun);
    await firstRun.get('/api/auxtimer/2/start');
    // shutdown must flush the aux timer command still waiting for its scheduled write
    await firstRun.stop(3);

    const secondRun = await startTestServer();
    onTestFinished(() => secondRun.stop());

    const { payload }: { payload: RuntimeStore } = await (await secondRun.get('/api/poll')).json();
    expect(payload.timer.playback).toBe(Playback.Play);
    expect(payload.auxtimer2.playback).toBe('start');
    expect(payload.auxtimer2.current).toBeLessThan(payload.auxtimer2.duration);
    expect(payload.auxtimer1.playback).toBe('stop');

    // a crash now would resume both again
    await vi.waitFor(async () => {
      const restoreFile = JSON.parse(await readFile(publicFiles.restoreFile, 'utf-8'));
      expect(restoreFile).toMatchObject({ runtime: { playback: Playback.Play }, auxTimers: expect.any(Array) });
    });
  });

  test('a share link for a base URL without protocol is rejected as invalid input', async () => {
    const server = await startTestServer();
    onTestFinished(() => server.stop());

    const response = await server.send('POST', '/data/session/url', {
      baseUrl: '192.168.10.1:4001',
      path: 'timer',
      authenticate: false,
      lockConfig: false,
      lockNav: false,
    });

    expect(response.status).toBe(422);
  });

  test('a restore point from another project leaves playback stopped and shows welcome', async () => {
    const firstRun = await startTestServer();
    onTestFinished(() => firstRun.stop());
    await startShow(firstRun);
    await firstRun.stop(1);

    const point = JSON.parse(await readFile(publicFiles.restoreFile, 'utf-8'));
    await writeFile(
      publicFiles.restoreFile,
      JSON.stringify({ ...point, runtime: { ...point.runtime, projectId: 'another-project' } }),
    );

    const secondRun = await startTestServer();
    onTestFinished(() => secondRun.stop());
    expect(await playback(secondRun)).toBe(Playback.Stop);

    const dialogs: string[] = [];
    const socket = new WebSocket(secondRun.socketUrl);
    onTestFinished(() => socket.close());
    socket.addEventListener('message', (event) => {
      const { tag, payload } = JSON.parse(String(event.data));
      if (tag === MessageTag.Dialog) dialogs.push(payload.dialog);
    });
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', reject, { once: true });
    });
    socket.send(JSON.stringify({ tag: MessageTag.ClientSetPath, payload: '/editor' }));

    await vi.waitFor(() => expect(dialogs).toContain('welcome'));
  });

  test('a project file saved before project ids keeps the id it gets, so a crash still resumes the show', async () => {
    const firstRun = await startTestServer();
    onTestFinished(() => firstRun.stop());
    await firstRun.stop();

    const projectFile = join(process.env.ONTIME_DATA!, 'projects', 'demo project.json');
    const { projectId: _projectId, ...withoutId } = JSON.parse(await readFile(projectFile, 'utf-8'));
    await writeFile(projectFile, JSON.stringify(withoutId));

    const secondRun = await startTestServer();
    onTestFinished(() => secondRun.stop());
    await startShow(secondRun);
    await secondRun.stop(1);

    const thirdRun = await startTestServer();
    onTestFinished(() => thirdRun.stop());

    expect(await playback(thirdRun)).toBe(Playback.Play);
  });
});
