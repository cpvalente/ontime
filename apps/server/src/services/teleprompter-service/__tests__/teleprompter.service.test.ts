import { RefetchKey, type TeleprompterScriptEvent } from 'ontime-types';

import { sendRefetch } from '../../../adapters/WebsocketAdapter.js';
import { buildScriptEvents } from '../teleprompter.utils.js';

vi.mock('../../../adapters/WebsocketAdapter.js', () => ({ sendRefetch: vi.fn() }));
vi.mock('../../../api-data/rundown/rundown.dao.js', () => ({
  getCurrentRundown: vi.fn(),
  getProjectCustomFields: vi.fn(),
  getRundownMetadata: vi.fn(),
}));
vi.mock('../../../classes/data-provider/DataProvider.js', () => ({
  getDataProvider: () => ({
    getViewSettings: () => ({
      teleprompter: {
        script: 'note',
        charsPerLine: 32,
        heading: 'title',
        showGroups: true,
        hideEmpty: true,
        followLoaded: true,
      },
    }),
  }),
}));
vi.mock('../../../stores/EventStore.js', () => ({ eventStore: { set: vi.fn() } }));
vi.mock('../../../stores/runtimeState.js', () => ({ getState: () => ({ eventNow: null }) }));
vi.mock('../teleprompter.utils.js', () => ({ buildScriptEvents: vi.fn() }));

function makeEvent(id: string, text: string): TeleprompterScriptEvent {
  return { id, cue: id, lines: [{ kind: 'text', text, start: 0 }] } as TeleprompterScriptEvent;
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
    vi.mocked(sendRefetch).mockClear();
  });

  test('an edit with nothing reading the script neither builds it nor tells screens', async () => {
    const service = await loadService();
    service.invalidateTeleprompterScript();
    service.followLoadedEvent('a');

    expect(buildScriptEvents).not.toHaveBeenCalled();
    expect(sendRefetch).not.toHaveBeenCalled();
  });

  test('the first read builds the script, later reads reuse it', async () => {
    const service = await loadService();
    service.invalidateTeleprompterScript();

    const script = service.getSharedScript();
    expect(script).toMatchObject({ revision: 1, charsPerLine: 32, events: [makeEvent('a', 'one')] });
    expect(service.getSharedScript()).toBe(script);
    expect(buildScriptEvents).toHaveBeenCalledTimes(1);
  });

  test('after a read, an edit tells screens to refetch and the script is rebuilt when next read', async () => {
    const service = await loadService();
    service.getSharedScript();

    vi.mocked(buildScriptEvents).mockReturnValue([makeEvent('a', 'two')]);
    service.invalidateTeleprompterScript();
    expect(sendRefetch).toHaveBeenCalledExactlyOnceWith(RefetchKey.Teleprompter);
    expect(buildScriptEvents).toHaveBeenCalledTimes(1);

    expect(service.getSharedScript()).toMatchObject({ revision: 2, events: [makeEvent('a', 'two')] });
    expect(buildScriptEvents).toHaveBeenCalledTimes(2);
  });

  test('a rebuild with the same lines keeps the script and its revision', async () => {
    const service = await loadService();
    const before = service.getSharedScript();

    service.invalidateTeleprompterScript();
    expect(service.getSharedScript()).toBe(before);
    expect(buildScriptEvents).toHaveBeenCalledTimes(2);
  });
});
