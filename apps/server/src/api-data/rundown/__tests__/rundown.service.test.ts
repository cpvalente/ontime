import { RefetchKey, Rundown } from 'ontime-types';

import { sendRefetch } from '../../../adapters/WebsocketAdapter.js';
import { makeOntimeEvent, makeRundown } from '../__mocks__/rundown.mocks.js';
import { getCurrentRundown, rundownCache } from '../rundown.dao.js';
import { applyImportToRundown, renameRundown } from '../rundown.service.js';

const storedRundowns: Record<string, Rundown> = {};
const stopMock = vi.hoisted(() => vi.fn<() => void>());

vi.mock('../../../classes/data-provider/DataProvider.js', () => ({
  getDataProvider: () => ({
    getRundown: (id: string) => {
      if (!storedRundowns[id]) throw new Error(`Rundown with id: ${id} not found`);
      return storedRundowns[id];
    },
    setRundown: vi.fn<(id: string, rundown: Rundown) => Promise<void>>(async (id, rundown) => {
      storedRundowns[id] = structuredClone(rundown);
    }),
    getProjectRundowns: () => storedRundowns,
    getCustomFields: () => ({}),
    mergeIntoData: vi.fn<() => Promise<void>>(),
  }),
}));

vi.mock('../../../adapters/WebsocketAdapter.js', () => ({ sendRefetch: vi.fn<typeof sendRefetch>() }));
vi.mock('../../../services/runtime-service/runtime.service.js', () => ({
  runtimeService: {
    stop: stopMock,
    notifyOfChangedEvents: vi.fn<() => void>(),
    getLoadedEventId: vi.fn<() => string | null>(),
  },
}));
vi.mock('../../../services/app-state-service/AppStateService.js', () => ({
  setLastLoadedRundown: vi.fn<() => Promise<void>>(),
}));
vi.mock('../../../stores/runtimeState.js', () => ({ updateRundownData: vi.fn<() => void>() }));

/** side effects are scheduled for the end of the event loop */
const flushSideEffects = () => new Promise((resolve) => setImmediate(resolve));

function seedRundown(rundown: Rundown) {
  storedRundowns[rundown.id] = structuredClone(rundown);
}

describe('rundown.service', () => {
  beforeEach(() => {
    for (const id of Object.keys(storedRundowns)) delete storedRundowns[id];

    const loaded = makeRundown({
      id: 'loaded',
      title: 'Loaded',
      entries: { a: makeOntimeEvent({ id: 'a' }) },
      order: ['a'],
      flatOrder: ['a'],
      revision: 3,
    });
    seedRundown(loaded);
    seedRundown(makeRundown({ id: 'background', title: 'Background', revision: 7 }));
    rundownCache.init(loaded, {});

    vi.clearAllMocks();
  });

  describe('renameRundown()', () => {
    it('renames the loaded rundown in place, without stopping playback', async () => {
      await renameRundown('loaded', 'Renamed');
      await flushSideEffects();

      expect(getCurrentRundown().title).toBe('Renamed');
      expect(storedRundowns.loaded).toMatchObject({ title: 'Renamed', revision: 4 });
      expect(stopMock).not.toHaveBeenCalled();
      expect(sendRefetch).toHaveBeenCalledWith(RefetchKey.Rundown, 4, 'loaded');
      expect(sendRefetch).toHaveBeenCalledWith(RefetchKey.ProjectRundowns);
    });

    it('renames a background rundown and tells its viewers', async () => {
      await renameRundown('background', 'Renamed');
      await flushSideEffects();

      expect(storedRundowns.background).toMatchObject({ title: 'Renamed', revision: 8 });
      expect(getCurrentRundown().title).toBe('Loaded');
      expect(sendRefetch).toHaveBeenCalledWith(RefetchKey.Rundown, 8, 'background');
    });

    it('does not commit a rename to the same title', async () => {
      await renameRundown('background', 'Background');
      await flushSideEffects();

      expect(storedRundowns.background.revision).toBe(7);
      expect(sendRefetch).not.toHaveBeenCalled();
    });
  });

  describe('applyImportToRundown()', () => {
    it('tells the viewers of a background rundown that its data changed', async () => {
      const incoming = makeRundown({
        entries: { b: makeOntimeEvent({ id: 'b' }) },
        order: ['b'],
        flatOrder: ['b'],
      });

      await applyImportToRundown('override', 'background', incoming, {}, { event: [], custom: [] });
      await flushSideEffects();

      expect(storedRundowns.background).toMatchObject({ id: 'background', title: 'Background', revision: 8 });
      expect(sendRefetch).toHaveBeenCalledWith(RefetchKey.Rundown, 8, 'background');
      expect(stopMock).not.toHaveBeenCalled();
    });
  });
});
