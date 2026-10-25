import { CustomFields, RefetchKey, Rundown } from 'ontime-types';

import { sendRefetch } from '../../../adapters/WebsocketAdapter.js';
import { makeOntimeEvent, makeOntimeGroup, makeRundown } from '../__mocks__/rundown.mocks.js';
import { getCurrentRundown, rundownCache } from '../rundown.dao.js';
import { InvalidRundownTitleError } from '../rundown.errors.js';
import { applyImportToRundown, createNewRundown, renameRundown, replaceRundown } from '../rundown.service.js';

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

  it('rejects symbol-only titles on direct create and rename without changing stored rundowns', async () => {
    const before = structuredClone(storedRundowns);

    await expect(createNewRundown('-,.')).rejects.toThrow(InvalidRundownTitleError);
    await expect(renameRundown('background', '🎉')).rejects.toThrow(InvalidRundownTitleError);
    await flushSideEffects();

    expect(storedRundowns).toStrictEqual(before);
    expect(sendRefetch).not.toHaveBeenCalled();
  });

  it('accepts and trims Unicode titles on direct create and rename', async () => {
    await createNewRundown('  東京 — ١٢٣ 🎉  ');
    await renameRundown('background', '  Café 2026 🎉  ');

    expect(Object.values(storedRundowns).some((rundown) => rundown.title === '東京 — ١٢٣ 🎉')).toBe(true);
    expect(storedRundowns.background.title).toBe('Café 2026 🎉');
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
        entries: { a: makeOntimeEvent({ id: 'a' }), b: makeOntimeEvent({ id: 'b' }) },
        order: ['a', 'b'],
        flatOrder: ['a', 'b'],
      });

      await applyImportToRundown('override', 'loaded', incoming, {}, { event: [], custom: [] });
      await flushSideEffects();

      expect(getCurrentRundown().revision).toBe(4);
      expect(sendRefetch).toHaveBeenCalledWith(RefetchKey.Rundown, 4, 'loaded');
      expect(sendRefetch).toHaveBeenCalledWith(RefetchKey.ProjectRundowns, null, undefined);
      expect(sendRefetch).not.toHaveBeenCalledWith(RefetchKey.All);
    });
  });

  describe('replaceRundown()', () => {
    it('replaces the loaded rundown without stopping playback, refetching only that rundown', async () => {
      const incoming = makeRundown({
        id: 'other',
        title: 'Loaded',
        entries: { a: makeOntimeEvent({ id: 'a', title: 'replaced' }) },
        order: ['a'],
        flatOrder: ['a'],
        revision: 99,
      });

      await replaceRundown('loaded', incoming);
      await flushSideEffects();

      expect(getCurrentRundown()).toMatchObject({ id: 'loaded', revision: 4, entries: { a: { title: 'replaced' } } });
      expect(storedRundowns.loaded).toMatchObject({ id: 'loaded', revision: 4 });
      expect(stopMock).not.toHaveBeenCalled();
      expect(sendRefetch).toHaveBeenCalledTimes(1);
      expect(sendRefetch).toHaveBeenCalledWith(RefetchKey.Rundown, 4, 'loaded');
    });

    it('replaces a background rundown, keeping the loaded one', async () => {
      const incoming = makeRundown({
        title: 'New title',
        entries: { b: makeOntimeEvent({ id: 'b' }) },
        order: ['b'],
        flatOrder: ['b'],
      });

      await replaceRundown('background', incoming);
      await flushSideEffects();

      expect(storedRundowns.background).toMatchObject({
        id: 'background',
        title: 'New title',
        revision: 8,
        order: ['b'],
      });
      expect(getCurrentRundown()).toMatchObject({ id: 'loaded', revision: 3 });
      expect(stopMock).not.toHaveBeenCalled();
      expect(sendRefetch).toHaveBeenCalledWith(RefetchKey.Rundown, 8, 'background');
      // the title shows in the rundown list
      expect(sendRefetch).toHaveBeenCalledWith(RefetchKey.ProjectRundowns, null, undefined);
      expect(sendRefetch).not.toHaveBeenCalledWith(RefetchKey.All);
    });

    it('restores rundown invariants in the supplied rundown', async () => {
      const incoming = makeRundown({
        entries: {
          // computed values are recalculated rather than trusted
          group: makeOntimeGroup({ id: 'group', entries: ['a', 'missing'], timeStart: 999 }),
          a: makeOntimeEvent({ id: 'a', parent: null, timeStart: 0, timeEnd: 10, duration: 10 }),
          b: makeOntimeEvent({ id: 'b', parent: 'group', delay: 999 }),
        },
        order: ['group', 'a', 'b', 'missing'],
        flatOrder: ['b'],
      });

      await replaceRundown('background', incoming);
      await flushSideEffects();

      expect(storedRundowns.background).toMatchObject({
        order: ['group', 'b'],
        flatOrder: ['group', 'a', 'b'],
        entries: {
          group: { entries: ['a'], timeStart: 0 },
          a: { parent: 'group' },
          b: { parent: null, delay: 0 },
        },
      });
    });

    it('refuses a rundown which does not exist', async () => {
      await expect(replaceRundown('missing', makeRundown({}))).rejects.toThrow('not found');
      await flushSideEffects();

      expect(storedRundowns).not.toHaveProperty('missing');
      expect(sendRefetch).not.toHaveBeenCalled();
    });
  });
});
