import { CustomFields, OntimeEvent, RefetchKey, Rundown } from 'ontime-types';

import { sendRefetch } from '../../../adapters/WebsocketAdapter.js';
import { makeOntimeEvent, makeOntimeGroup, makeRundown } from '../__mocks__/rundown.mocks.js';
import { getCurrentRundown, rundownCache } from '../rundown.dao.js';
import { applyImportToRundown, applyRundown, renameRundown } from '../rundown.service.js';

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
    setCustomFields: vi.fn<(customFields: CustomFields) => Promise<CustomFields>>(async (customFields) => customFields),
    mergeIntoData: vi.fn<() => Promise<void>>(),
  }),
}));

vi.mock('../../../adapters/WebsocketAdapter.js', () => ({ sendRefetch: vi.fn<typeof sendRefetch>() }));
vi.mock('../../../services/runtime-service/runtime.service.js', () => ({
  runtimeService: {
    stop: stopMock,
  },
}));
vi.mock('../../../services/app-state-service/appState.service.js', () => ({
  setLastLoadedRundown: vi.fn<() => Promise<void>>(),
}));

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
      expect(sendRefetch).toHaveBeenCalledWith(RefetchKey.ProjectRundowns, null, undefined);
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

  describe('applyRundown()', () => {
    it('replaces the loaded rundown in place, telling clients to refetch only that rundown and the list', async () => {
      await applyRundown(
        makeRundown({ id: 'loaded', title: 'Loaded', entries: { b: makeOntimeEvent({ id: 'b' }) }, order: ['b'] }),
      );
      await flushSideEffects();

      expect(getCurrentRundown()).toMatchObject({ id: 'loaded', order: ['b'], revision: 4 });
      expect(storedRundowns.loaded).toMatchObject({ order: ['b'], revision: 4 });
      expect(stopMock).not.toHaveBeenCalled();
      expect(vi.mocked(sendRefetch).mock.calls).toEqual([
        [RefetchKey.Rundown, 4, 'loaded'],
        [RefetchKey.ProjectRundowns, null, undefined],
      ]);
    });

    it('replaces a background rundown without touching the loaded one', async () => {
      await applyRundown(
        makeRundown({ id: 'background', title: 'Renamed', entries: { b: makeOntimeEvent({ id: 'b' }) }, order: ['b'] }),
      );
      await flushSideEffects();

      expect(storedRundowns.background).toMatchObject({
        title: 'Renamed',
        order: ['b'],
        flatOrder: ['b'],
        revision: 8,
      });
      expect(getCurrentRundown()).toMatchObject({ id: 'loaded', order: ['a'] });
      expect(vi.mocked(sendRefetch).mock.calls).toEqual([
        [RefetchKey.Rundown, 8, 'background'],
        [RefetchKey.ProjectRundowns, null, undefined],
      ]);
    });

    it('reprocesses the supplied rundown rather than trusting it', async () => {
      await applyRundown({
        id: 'background',
        title: 'Background',
        // supplied revision and computed values are ignored
        revision: 100,
        order: ['group', 'top', 'missing'],
        flatOrder: ['stale'],
        entries: {
          group: makeOntimeGroup({ id: 'group', entries: ['child', 'missing'], timeStart: 999 }),
          child: makeOntimeEvent({ id: 'child', parent: 'elsewhere', timeStart: 0, timeEnd: 10, duration: 10 }),
          top: makeOntimeEvent({ id: 'top', parent: 'group', delay: 999 }),
          orphan: makeOntimeEvent({ id: 'orphan' }),
        },
      });
      await flushSideEffects();

      const applied = storedRundowns.background;
      expect(applied.revision).toBe(8);
      expect(applied.order).toEqual(['group', 'top']);
      expect(applied.flatOrder).toEqual(['group', 'child', 'top']);
      expect(Object.keys(applied.entries).sort()).toEqual(['child', 'group', 'top']);
      expect(applied.entries.group).toMatchObject({ entries: ['child'], timeStart: 0 });
      expect(applied.entries.child).toMatchObject({ parent: 'group' });
      expect(applied.entries.top as OntimeEvent).toMatchObject({ parent: null, delay: 0 });
    });

    it('rejects a rundown which is not stored, writing nothing', async () => {
      await expect(applyRundown(makeRundown({ id: 'unknown' }))).rejects.toThrow();
      await flushSideEffects();

      expect(storedRundowns).not.toHaveProperty('unknown');
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

    it('tells clients to refetch only the loaded rundown and the rundown list', async () => {
      const incoming = makeRundown({
        entries: { a: makeOntimeEvent({ id: 'a' }) },
        order: ['a'],
        flatOrder: ['a'],
      });

      await applyImportToRundown('override', 'loaded', incoming, {}, { event: [], custom: [] });
      await flushSideEffects();

      expect(getCurrentRundown().revision).toBe(4);
      expect(sendRefetch).toHaveBeenCalledWith(RefetchKey.Rundown, 4, 'loaded');
      expect(sendRefetch).toHaveBeenCalledWith(RefetchKey.ProjectRundowns, null, undefined);
      expect(sendRefetch).not.toHaveBeenCalledWith(RefetchKey.All);
    });
  });
});
