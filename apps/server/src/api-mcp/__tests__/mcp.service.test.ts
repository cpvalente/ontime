import { SupportedEntry, type EventPostPayload, type OntimeEntry, type PatchWithId, type Rundown } from 'ontime-types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

const { batchCreateEntriesForMcp, createCustomFieldForMcp, createEntryForMcp, groupEntriesForMcp, ungroupEntryForMcp } =
  await import('../mcp.service.js');

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
