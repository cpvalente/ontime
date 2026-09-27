import {
  OffsetMode,
  Playback,
  SupportedEntry,
  type EventPostPayload,
  type OntimeEntry,
  type PatchWithId,
  type PlayableEvent,
  type Rundown,
} from 'ontime-types';
import { MILLIS_PER_HOUR, MILLIS_PER_MINUTE } from 'ontime-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeOntimeEvent, makeOntimeGroup } from '../../api-data/rundown/__mocks__/rundown.mocks.js';
import type { RuntimeState } from '../../stores/runtimeState.js';

const addEntryMock = vi.hoisted(() => vi.fn());
const editEntryMock = vi.hoisted(() => vi.fn());
const groupEntriesMock = vi.hoisted(() => vi.fn());
const ungroupEntriesMock = vi.hoisted(() => vi.fn());
const getCurrentRundownMock = vi.hoisted(() => vi.fn());
const getProjectCustomFieldsMock = vi.hoisted(() => vi.fn());
const createCustomFieldMock = vi.hoisted(() => vi.fn());

vi.mock('../../api-data/rundown/rundown.dao.js', () => ({
  getCurrentRundown: getCurrentRundownMock,
  getCurrentRundownId: vi.fn(() => 'loaded-rundown'),
  getProjectCustomFields: getProjectCustomFieldsMock,
}));

vi.mock('../../classes/data-provider/DataProvider.js', () => ({
  getDataProvider: vi.fn(),
}));

vi.mock('../../api-data/rundown/rundown.service.js', () => ({
  addEntry: addEntryMock,
  batchEditEntries: vi.fn(),
  createCustomField: createCustomFieldMock,
  deleteEntries: vi.fn(),
  editEntry: editEntryMock,
  groupEntries: groupEntriesMock,
  reorderEntry: vi.fn(),
  ungroupEntries: ungroupEntriesMock,
}));

const {
  batchCreateEntriesForMcp,
  createCustomFieldForMcp,
  createEntryForMcp,
  getScheduleForecast,
  groupEntriesForMcp,
  limitForecastSize,
  ungroupEntryForMcp,
} = await import('../mcp.service.js');

function makeRundown(entries: Rundown['entries'], order: string[] = Object.keys(entries)): Rundown {
  return {
    id: 'loaded-rundown',
    title: 'Loaded',
    order,
    flatOrder: order,
    entries,
    revision: 0,
  };
}

describe('mcp.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentRundownMock.mockReturnValue(makeRundown({}));
    getProjectCustomFieldsMock.mockReturnValue({});

    let id = 0;
    addEntryMock.mockImplementation(async (_rundownId: string, payload: EventPostPayload) => {
      id += 1;
      const entryId = `entry-${id}`;

      if (payload.type === SupportedEntry.Group) {
        return {
          id: entryId,
          type: SupportedEntry.Group,
          title: payload.title ?? '',
          note: '',
          colour: '',
          custom: {},
          targetDuration: null,
          entries: [],
          revision: 0,
          timeStart: null,
          timeEnd: null,
          duration: 0,
          isFirstLinked: false,
        };
      }

      return {
        id: entryId,
        type: payload.type ?? SupportedEntry.Event,
        title: payload.title ?? '',
        parent: 'parent' in payload ? payload.parent : null,
      } as OntimeEntry;
    });

    editEntryMock.mockImplementation(async (_rundownId: string, patch: PatchWithId) => ({
      id: patch.id,
      type: SupportedEntry.Group,
      title: 'Session block',
      note: patch.note ?? '',
      colour: patch.colour ?? '',
      custom: patch.custom ?? {},
      targetDuration: patch.targetDuration ?? null,
      entries: [],
      revision: 1,
      timeStart: null,
      timeEnd: null,
      duration: 0,
      isFirstLinked: false,
    }));
  });

  it('creates grouped batch entries with group metadata and child parent references', async () => {
    const result = await batchCreateEntriesForMcp({
      entries: [
        {
          type: SupportedEntry.Group,
          title: 'Session block',
          note: 'Main room',
          colour: '#123456',
          targetDuration: 3_600_000,
          children: [
            { type: SupportedEntry.Event, title: 'Talk', timeStart: 36_000_000, duration: 1_800_000 },
            { type: SupportedEntry.Milestone, title: 'Reset stage' },
          ],
        },
        { type: SupportedEntry.Event, title: 'After block', timeStart: 39_600_000, duration: 900_000 },
      ],
    });

    expect(addEntryMock).toHaveBeenNthCalledWith(
      1,
      'loaded-rundown',
      expect.objectContaining({ type: SupportedEntry.Group, title: 'Session block' }),
    );
    expect(editEntryMock).toHaveBeenCalledWith(
      'loaded-rundown',
      expect.objectContaining({
        id: 'entry-1',
        note: 'Main room',
        colour: '#123456',
        targetDuration: 3_600_000,
      }),
    );
    expect(addEntryMock).toHaveBeenNthCalledWith(
      2,
      'loaded-rundown',
      expect.objectContaining({ type: SupportedEntry.Event, title: 'Talk', parent: 'entry-1' }),
    );
    expect(addEntryMock).toHaveBeenNthCalledWith(
      3,
      'loaded-rundown',
      expect.objectContaining({
        type: SupportedEntry.Milestone,
        title: 'Reset stage',
        parent: 'entry-1',
        after: 'entry-2',
      }),
    );
    expect(addEntryMock).toHaveBeenNthCalledWith(
      4,
      'loaded-rundown',
      expect.objectContaining({ type: SupportedEntry.Event, title: 'After block', after: 'entry-1' }),
    );
    expect(result.created.map((entry) => entry.id)).toEqual(['entry-1', 'entry-2', 'entry-3', 'entry-4']);
  });

  it('omits insert anchors when creating an entry without a position', async () => {
    await createEntryForMcp({
      type: SupportedEntry.Milestone,
      title: 'End marker',
    });

    expect(addEntryMock).toHaveBeenCalledWith(
      'loaded-rundown',
      expect.objectContaining({ type: SupportedEntry.Milestone, title: 'End marker' }),
    );
    expect(addEntryMock.mock.calls[0][1]).not.toHaveProperty('after');
    expect(addEntryMock.mock.calls[0][1]).not.toHaveProperty('before');
  });

  it('uses before true for the first batch entry and chains the rest', async () => {
    await batchCreateEntriesForMcp({
      before: true,
      entries: [
        { type: SupportedEntry.Event, title: 'First' },
        { type: SupportedEntry.Event, title: 'Second' },
      ],
    });

    expect(addEntryMock).toHaveBeenNthCalledWith(
      1,
      'loaded-rundown',
      expect.objectContaining({ type: SupportedEntry.Event, title: 'First', before: true }),
    );
    expect(addEntryMock).toHaveBeenNthCalledWith(
      2,
      'loaded-rundown',
      expect.objectContaining({ type: SupportedEntry.Event, title: 'Second', after: 'entry-1' }),
    );
  });

  it('rejects nested groups before creating entries', async () => {
    await expect(
      batchCreateEntriesForMcp({
        entries: [
          {
            type: SupportedEntry.Group,
            title: 'Outer',
            children: [{ type: SupportedEntry.Group, title: 'Inner' }],
          },
        ],
      }),
    ).rejects.toThrow('Cannot create a group inside another group.');

    expect(addEntryMock).not.toHaveBeenCalled();
    expect(editEntryMock).not.toHaveBeenCalled();
  });

  it('groups existing top-level entries and applies group metadata', async () => {
    const sourceRundown = makeRundown(
      {
        'entry-1': { id: 'entry-1', type: SupportedEntry.Event, title: 'One', parent: null } as OntimeEntry,
        'entry-2': { id: 'entry-2', type: SupportedEntry.Event, title: 'Two', parent: null } as OntimeEntry,
      },
      ['entry-1', 'entry-2'],
    );
    const groupedRundown = makeRundown(
      {
        group: {
          id: 'group',
          type: SupportedEntry.Group,
          title: '',
          note: '',
          colour: '',
          custom: {},
          targetDuration: null,
          entries: ['entry-1', 'entry-2'],
          revision: 0,
          timeStart: null,
          timeEnd: null,
          duration: 0,
          isFirstLinked: false,
        },
        'entry-1': { id: 'entry-1', type: SupportedEntry.Event, title: 'One', parent: 'group' } as OntimeEntry,
        'entry-2': { id: 'entry-2', type: SupportedEntry.Event, title: 'Two', parent: 'group' } as OntimeEntry,
      },
      ['group'],
    );

    getCurrentRundownMock.mockReturnValue(sourceRundown);
    groupEntriesMock.mockResolvedValue(groupedRundown);

    const result = await groupEntriesForMcp({
      ids: ['entry-1', 'entry-2'],
      title: 'Block',
      colour: '#abcdef',
      targetDuration: 1_200_000,
    });

    expect(groupEntriesMock).toHaveBeenCalledWith('loaded-rundown', ['entry-1', 'entry-2']);
    expect(editEntryMock).toHaveBeenCalledWith(
      'loaded-rundown',
      expect.objectContaining({ id: 'group', colour: '#abcdef', targetDuration: 1_200_000 }),
    );
    expect(result.entry.id).toBe('group');
    expect(result.order).toEqual(['group']);
  });

  it('rejects grouping nested entries before mutating', async () => {
    getCurrentRundownMock.mockReturnValue(
      makeRundown({
        group: { id: 'group', type: SupportedEntry.Group, entries: ['entry-1'] } as OntimeEntry,
        'entry-1': { id: 'entry-1', type: SupportedEntry.Event, title: 'One', parent: 'group' } as OntimeEntry,
      }),
    );

    await expect(groupEntriesForMcp({ ids: ['entry-1'] })).rejects.toThrow(
      'Cannot group nested entry entry-1. Move it out of its group first.',
    );

    expect(groupEntriesMock).not.toHaveBeenCalled();
    expect(editEntryMock).not.toHaveBeenCalled();
  });

  it('ungroups an existing group entry', async () => {
    getCurrentRundownMock.mockReturnValue(
      makeRundown({
        group: { id: 'group', type: SupportedEntry.Group, entries: ['entry-1'] } as OntimeEntry,
        'entry-1': { id: 'entry-1', type: SupportedEntry.Event, title: 'One', parent: 'group' } as OntimeEntry,
      }),
    );
    ungroupEntriesMock.mockResolvedValue(
      makeRundown(
        {
          'entry-1': { id: 'entry-1', type: SupportedEntry.Event, title: 'One', parent: null } as OntimeEntry,
        },
        ['entry-1'],
      ),
    );

    const result = await ungroupEntryForMcp({ id: 'group' });

    expect(ungroupEntriesMock).toHaveBeenCalledWith('loaded-rundown', 'group');
    expect(result).toMatchObject({ ungrouped: 'group', order: ['entry-1'] });
  });

  describe('createCustomFieldForMcp', () => {
    it('creates a field and returns the derived key', async () => {
      createCustomFieldMock.mockResolvedValue({
        Camera_Angle: { label: 'Camera Angle', type: 'text', colour: '#3E75E8' },
      });

      const result = await createCustomFieldForMcp({ label: 'Camera Angle', type: 'text', colour: '#3E75E8' });

      expect(createCustomFieldMock).toHaveBeenCalledWith({ label: 'Camera Angle', type: 'text', colour: '#3E75E8' });
      expect(result.key).toBe('Camera_Angle');
    });

    it('rejects labels the editor UI would not accept', async () => {
      await expect(createCustomFieldForMcp({ label: 'Camera/GFX', type: 'text', colour: '#000000' })).rejects.toThrow(
        'Invalid label',
      );
      expect(createCustomFieldMock).not.toHaveBeenCalled();
    });

    it('rejects case-insensitive duplicates and points at the existing key', async () => {
      getProjectCustomFieldsMock.mockReturnValue({ Camera: { label: 'Camera', type: 'text', colour: '' } });

      await expect(createCustomFieldForMcp({ label: 'camera', type: 'text', colour: '#000000' })).rejects.toThrow(
        'A custom field with key "Camera" (label "Camera") already exists.',
      );
      expect(createCustomFieldMock).not.toHaveBeenCalled();
    });
  });

  it('suggests the correctly cased key when custom values use the wrong casing', async () => {
    getProjectCustomFieldsMock.mockReturnValue({ Camera: { label: 'Camera', type: 'text', colour: '' } });

    await expect(createEntryForMcp({ title: 'Talk', custom: { camera: 'CAM 2' } })).rejects.toThrow(
      'Keys are case-sensitive — did you mean: "camera" → "Camera"?',
    );
    expect(addEntryMock).not.toHaveBeenCalled();
  });
});

describe('getScheduleForecast()', () => {
  const at = (hours: number, minutes = 0) => hours * MILLIS_PER_HOUR + minutes * MILLIS_PER_MINUTE;
  const event = (id: string, start: number, end: number, patch: Parameters<typeof makeOntimeEvent>[0] = {}) =>
    makeOntimeEvent({
      id,
      cue: id,
      title: `Event ${id}`,
      timeStart: start,
      timeEnd: end,
      duration: end - start,
      dayOffset: 0,
      delay: 0,
      gap: 0,
      linkStart: false,
      countToEnd: false,
      flag: false,
      parent: null,
      ...patch,
    });

  // a (10:00) -> b linked -> 10 min gap -> c, d in a group -> e skipped -> f countToEnd hard out at 12:30
  const rundown = {
    entries: {
      a: event('a', at(10), at(10, 30)),
      b: event('b', at(10, 30), at(11), { linkStart: true }),
      g: makeOntimeGroup({ id: 'g', title: 'Afternoon', entries: ['c', 'd'] }),
      c: event('c', at(11, 10), at(11, 40), { gap: at(0, 10), parent: 'g' }),
      d: event('d', at(11, 40), at(12), { linkStart: true, flag: true, parent: 'g' }),
      e: event('e', at(12), at(12, 15), { skip: true }),
      f: event('f', at(12), at(12, 30), { countToEnd: true }),
    },
  };
  const metadata = {
    playableEventOrder: ['a', 'b', 'c', 'd', 'f'],
    timedEventOrder: ['a', 'b', 'c', 'd', 'e', 'f'],
  };

  function makeState(patch: {
    eventNow?: string | null;
    playback?: Playback;
    mode?: OffsetMode;
    absolute?: number;
    relative?: number;
    actualStart?: number;
  }) {
    const { eventNow = 'a', playback = Playback.Play, mode = OffsetMode.Absolute, absolute = 0, relative = 0 } = patch;
    return {
      clock: at(10, 20),
      eventNow: eventNow ? (rundown.entries[eventNow as 'a'] as PlayableEvent) : null,
      timer: { playback },
      offset: { mode, absolute, relative },
      rundown: { plannedStart: at(10), actualStart: patch.actualStart ?? at(10), currentDay: 0 },
    } as unknown as RuntimeState;
  }

  const startsOf = (forecast: ReturnType<typeof getScheduleForecast>) =>
    Object.fromEntries(forecast.upcoming.map((row) => [row.id, row.expectedStart.time]));

  it('lets gaps absorb a small overrun', () => {
    const forecast = getScheduleForecast(makeState({ absolute: at(0, 5) }), rundown, metadata);

    expect(forecast.offset).toStrictEqual({ ms: at(0, 5), time: '+00:05:00' });
    expect(startsOf(forecast)).toStrictEqual({
      a: '10:05:00',
      b: '10:35:00',
      c: '11:10:00',
      d: '11:40:00',
      f: '12:00:00',
    });
    expect(forecast.upcoming[1].plannedStart).toStrictEqual({ ms: at(10, 30), time: '10:30:00' });
    expect(forecast.upcoming[2].group).toBe('Afternoon');
    expect(forecast.currentEvent).toStrictEqual({
      id: 'a',
      cue: 'a',
      title: 'Event a',
      expectedEnd: { ms: at(10, 35), time: '10:35:00' },
    });
    expect(forecast.rundown).toMatchObject({ overUnder: { ms: 0, time: '+00:00:00' } });
    expect(forecast.warnings).toStrictEqual([]);
    expect(forecast).not.toHaveProperty('note');
  });

  it('pushes the overrun past the gaps and warns about a late flag', () => {
    const forecast = getScheduleForecast(makeState({ absolute: at(0, 15) }), rundown, metadata);

    expect(startsOf(forecast)).toMatchObject({ b: '10:45:00', c: '11:15:00', d: '11:45:00', f: '12:05:00' });
    expect(forecast.warnings).toStrictEqual([
      {
        id: 'd',
        cue: 'd',
        title: 'Event d',
        warning: 'Flagged event expected to start late',
        by: { ms: at(0, 5), time: '+00:05:00' },
      },
    ]);
    // the countToEnd hard out still ends on time
    expect(forecast.rundown).toStrictEqual({
      plannedEnd: { ms: at(12, 30), time: '12:30:00' },
      expectedEnd: { ms: at(12, 30), time: '12:30:00' },
      overUnder: { ms: 0, time: '+00:00:00' },
    });
  });

  it('lists skipped events after the loaded event as contingency', () => {
    const forecast = getScheduleForecast(makeState({ eventNow: 'b' }), rundown, metadata);

    expect(forecast.upcoming.map((row) => row.id)).toStrictEqual(['b', 'c', 'd', 'f']);
    expect(forecast.skipped).toStrictEqual([
      { id: 'e', cue: 'e', title: 'Event e', duration: { ms: at(0, 15), time: '00:15:00' } },
    ]);
  });

  it('warns when a countToEnd hard out is already blown', () => {
    const forecast = getScheduleForecast(makeState({ absolute: at(0, 45) }), rundown, metadata);

    expect(forecast.upcoming.at(-1)?.expectedStart.time).toBe('12:35:00');
    expect(forecast.warnings).toContainEqual({
      id: 'f',
      cue: 'f',
      title: 'Event f',
      warning: 'Hard out blown: expected to start after its planned end',
      by: { ms: at(0, 5), time: '+00:05:00' },
    });
    expect(forecast.rundown?.overUnder).toStrictEqual({ ms: at(0, 5), time: '+00:05:00' });
  });

  it('uses the relative offset and actual start in relative mode', () => {
    const forecast = getScheduleForecast(
      makeState({ mode: OffsetMode.Relative, absolute: at(1), relative: 0, actualStart: at(10, 20) }),
      rundown,
      metadata,
    );

    expect(forecast.offsetMode).toBe(OffsetMode.Relative);
    expect(forecast.offset.ms).toBe(0);
    expect(startsOf(forecast)).toMatchObject({ b: '10:50:00', c: '11:30:00' });
    expect(forecast.upcoming[1].plannedStart.time).toBe('10:30:00');
  });

  it('returns the planned schedule when nothing is loaded', () => {
    const forecast = getScheduleForecast(makeState({ eventNow: null, playback: Playback.Stop }), rundown, metadata);

    expect(forecast.note).toBe('No show is running: expected times equal the planned schedule.');
    expect(forecast.currentEvent).toBeNull();
    expect(forecast.upcoming.map((row) => row.id)).toStrictEqual(['a', 'b', 'c', 'd', 'f']);
    for (const row of forecast.upcoming) {
      expect(row.expectedStart).toStrictEqual(row.plannedStart);
      expect(row.expectedEnd).toStrictEqual(row.plannedEnd);
    }
    expect(forecast.skipped.map((entry) => entry.id)).toStrictEqual(['e']);
  });

  it('trims upcoming rows to fit the size limit and says so', () => {
    const forecast = getScheduleForecast(makeState({}), rundown, metadata);
    const limit = JSON.stringify(forecast).length - 1;

    const trimmed = limitForecastSize(forecast, limit);
    const shown = trimmed.upcoming.length;

    expect(JSON.stringify(trimmed).length).toBeLessThanOrEqual(limit);
    expect(shown).toBeLessThan(forecast.upcoming.length);
    expect(trimmed.upcoming).toStrictEqual(forecast.upcoming.slice(0, shown));
    expect(trimmed).toMatchObject({ truncated: true, truncationNote: expect.stringContaining(`next ${shown} of 5`) });
    expect(trimmed.rundown).toStrictEqual(forecast.rundown);
  });
});
