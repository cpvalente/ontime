import type { TeleprompterScriptEvent } from 'ontime-types';

import { logger } from '../../../classes/Logger.js';
import { buildScriptEvents } from '../teleprompter.utils.js';

vi.mock('../../../api-data/rundown/rundown.dao.js', () => ({
  getCurrentRundown: vi.fn<() => void>(),
  getProjectCustomFields: vi.fn<() => void>(),
}));
vi.mock('../../../classes/data-provider/DataProvider.js', () => ({
  getDataProvider: () => ({
    getTeleprompterSettings: () => ({ script: 'note', charsPerLine: 32, heading: 'title' }),
  }),
}));
const published = vi.hoisted(() => [] as Record<string, unknown>[]);
vi.mock('../../../stores/EventStore.js', () => ({
  eventStore: {
    createBatch: () => {
      const patch: Record<string, unknown> = {};
      return {
        add: (key: string, value: unknown) => (patch[key] = value),
        send: () => published.push(patch),
      };
    },
  },
}));
const clock = vi.hoisted(() => ({ now: 0 }));
vi.mock('../../../lib/time-core/timeCore.js', () => ({ timeOfDayNow: () => clock.now }));
const loaded = vi.hoisted(() => ({ eventNow: null as { id: string } | null }));
vi.mock('../../../stores/runtimeState.js', () => ({ getState: () => loaded }));
vi.mock('../../../classes/Logger.js', () => ({ logger: { error: vi.fn<() => void>() } }));
vi.mock('../../../adapters/WebsocketAdapter.js', () => ({ sendRefetch: vi.fn<() => void>() }));
vi.mock('../teleprompter.utils.js', () => ({ buildScriptEvents: vi.fn<() => TeleprompterScriptEvent[]>() }));

function makeEvent(id: string, text: string): TeleprompterScriptEvent {
  return { id, cue: id, title: id, lines: [{ kind: 'text', text, start: 0 }] };
}

/** the service keeps its script between calls, so every test starts from a fresh module */
async function loadService() {
  vi.resetModules();
  return import('../teleprompter.service.js');
}

describe('teleprompter script', () => {
  beforeEach(() => {
    vi.mocked(buildScriptEvents)
      .mockReset()
      .mockReturnValue([makeEvent('a', 'one')]);
  });

  test('an edit with nothing reading the script does not build it', async () => {
    const service = await loadService();
    service.invalidateTeleprompterScript();
    service.followLoadedEvent('a');

    expect(buildScriptEvents).not.toHaveBeenCalled();
  });

  test('a read builds the script, an edit rebuilds it only when it is next read', async () => {
    const service = await loadService();
    const script = service.getSharedScript();
    expect(script).toMatchObject({ revision: 1, charsPerLine: 32, events: [makeEvent('a', 'one')] });
    expect(service.getSharedScript()).toBe(script);

    vi.mocked(buildScriptEvents).mockReturnValue([makeEvent('a', 'two')]);
    service.invalidateTeleprompterScript();
    expect(buildScriptEvents).toHaveBeenCalledTimes(1);

    expect(service.getSharedScript()).toMatchObject({ revision: 2, events: [makeEvent('a', 'two')] });
    expect(buildScriptEvents).toHaveBeenCalledTimes(2);
  });

  test('a build which fails keeps the last script, and the next change tries again', async () => {
    vi.mocked(logger.error).mockClear();
    const service = await loadService();
    const before = service.getSharedScript();

    service.invalidateTeleprompterScript();
    vi.mocked(buildScriptEvents).mockImplementationOnce(() => {
      throw new Error('broken');
    });
    expect(service.getSharedScript()).toBe(before);
    expect(service.getSharedScript()).toBe(before);
    expect(buildScriptEvents).toHaveBeenCalledTimes(2);
    expect(logger.error).toHaveBeenCalledOnce();

    vi.mocked(buildScriptEvents).mockReturnValue([makeEvent('a', 'two')]);
    service.invalidateTeleprompterScript();
    expect(service.getSharedScript()).toMatchObject({ revision: 2, events: [makeEvent('a', 'two')] });
  });

  test('a rebuild with the same lines keeps the script and its revision', async () => {
    const service = await loadService();
    const before = service.getSharedScript();

    service.invalidateTeleprompterScript();
    expect(service.getSharedScript()).toBe(before);
    expect(buildScriptEvents).toHaveBeenCalledTimes(2);
  });
});

describe('teleprompter commands', () => {
  beforeEach(() => {
    published.length = 0;
    loaded.eventNow = null;
    clock.now = 0;
    vi.mocked(buildScriptEvents)
      .mockReset()
      .mockReturnValue([makeEvent('a', 'one'), makeEvent('b', 'two')]);
  });

  test('a go to by index counts the events of the script', async () => {
    const service = await loadService();
    expect(service.handleTeleprompterCommand({ type: 'goto', target: { index: 2 } }).event?.id).toBe('b');
    expect(() => service.handleTeleprompterCommand({ type: 'goto', target: { index: 3 } })).toThrow('Event not found');
  });

  test('a go to the loaded event fails while the loaded event is not in the script', async () => {
    const service = await loadService();
    loaded.eventNow = { id: 'skipped' };
    expect(() => service.handleTeleprompterCommand({ type: 'goto', target: 'loaded' })).toThrow('Event not found');

    loaded.eventNow = { id: 'b' };
    expect(service.handleTeleprompterCommand({ type: 'goto', target: 'loaded' }).event?.id).toBe('b');
  });

  test('a command publishes the teleprompter and its sync key together', async () => {
    const service = await loadService();
    service.handleTeleprompterCommand({ type: 'mode', mode: 'toggle' });
    expect(published.at(-1)).toMatchObject({
      teleprompter: { mode: 'script' },
      teleprompterSync: { revision: 1, playback: 'pause' },
    });
  });

  /** a batch like the runtime's, which collects what the tick adds */
  function tick(service: Awaited<ReturnType<typeof loadService>>) {
    const patch: Record<string, unknown> = {};
    service.onClockTick({ add: (key, value) => (patch[key] = value), send: () => {} });
    return patch;
  }

  test('a tick while paused adds nothing', async () => {
    const service = await loadService();
    service.handleTeleprompterCommand({ type: 'top' });
    expect(tick(service)).toEqual({});
  });

  test('a tick while playing adds the teleprompter, and leaves the sync key alone', async () => {
    const service = await loadService();
    service.handleTeleprompterCommand({ type: 'top' });
    service.handleTeleprompterCommand({ type: 'speed', value: 30 });
    service.handleTeleprompterCommand({ type: 'play' });
    const sync = service.getTeleprompterSync();
    const sent = published.length;

    clock.now = 1000;
    expect(tick(service)).toEqual({
      teleprompter: expect.objectContaining({ playback: 'play', event: expect.objectContaining({ id: 'a' }) }),
    });
    expect(service.getTeleprompterSync()).toBe(sync);
    expect(published).toHaveLength(sent);
  });

  test('a tick whose rebuild fails reads on with the last script', async () => {
    const service = await loadService();
    service.handleTeleprompterCommand({ type: 'play' });
    service.invalidateTeleprompterScript();
    vi.mocked(buildScriptEvents).mockImplementationOnce(() => {
      throw new Error('broken');
    });

    expect(tick(service)).toMatchObject({ teleprompter: { playback: 'play', event: { id: 'a' } } });
  });

  test('a tick after playback reached the end of the event settles it, and adds both keys', async () => {
    const service = await loadService();
    service.handleTeleprompterCommand({ type: 'top' });
    service.handleTeleprompterCommand({ type: 'speed', value: 30 });
    service.handleTeleprompterCommand({ type: 'play' });

    // one line of text in a, two seconds at 30 lines per minute
    clock.now = 2500;
    expect(tick(service)).toMatchObject({
      teleprompter: { playback: 'pause', ended: 'event' },
      teleprompterSync: { playback: 'pause' },
    });
    expect(tick(service)).toEqual({});
  });
});
