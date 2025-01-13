import {
  CustomFields,
  EndAction,
  OntimeEvent,
  OntimeRundown,
  SupportedEvent,
  TimeStrategy,
  TimerType,
} from 'ontime-types';
import {
  addToCustomAssignment,
  calculateDayOffset,
  getLink,
  handleCustomField,
  handleLink,
  hasChanges,
  isDataStale,
} from '../rundownCacheUtils.js';
import { MILLIS_PER_HOUR } from 'ontime-utils';

describe('getLink()', () => {
  it('should return null if there is no link', () => {
    const rundown = [
      { type: SupportedEvent.Block, id: 'block' },
      { type: SupportedEvent.Event, id: '1' },
    ] as OntimeRundown;

    const result = getLink(1, rundown);
    expect(result).toBeNull();
  });

  it('returns previous event', () => {
    const rundown = [
      { type: SupportedEvent.Event, id: '1', timeEnd: 100 },
      { type: SupportedEvent.Event, id: '2', timeStart: 0, linkStart: '1' },
    ] as OntimeRundown;

    const result = getLink(1, rundown);
    expect(result.id).toBe('1');
  });
});

describe('handleLink()', () => {
  it('populates data in object and updates link map', () => {
    const rundown = [
      { type: SupportedEvent.Event, id: '1', timeEnd: 100 },
      { type: SupportedEvent.Event, id: '2', timeStart: 0, linkStart: '1' },
    ] as OntimeRundown;
    const mutableEvent = { ...rundown[1] } as OntimeEvent;
    const links = {};

    const result = handleLink(1, rundown, mutableEvent, links);
    expect(result).toBeUndefined();
    expect(mutableEvent.timeStart).toBe(100);
    expect(mutableEvent.linkStart).toBe('1');
    expect(links).toStrictEqual({ '1': '2' });
  });

  it('removes link if linked event is not found', () => {
    const rundown = [
      { type: SupportedEvent.Block, id: '1' },
      { type: SupportedEvent.Event, id: '2', timeStart: 0, linkStart: '1' },
    ] as OntimeRundown;
    const mutableEvent = { ...rundown[1] } as OntimeEvent;
    const links = {};

    const result = handleLink(1, rundown, mutableEvent, links);
    expect(result).toBeUndefined();
    expect(mutableEvent.timeStart).toBe(0);
    expect(mutableEvent.linkStart).toBe(null);
    expect(links).toStrictEqual({});
  });
});

describe('addToCustomAssignment()', () => {
  it('adds given entry to assignedCustomFields', () => {
    const assignedCustomFields = {};

    addToCustomAssignment('label1', 'eventId 1', assignedCustomFields);
    expect(assignedCustomFields).toStrictEqual({ label1: ['eventId 1'] });

    addToCustomAssignment('label1', 'eventId 2', assignedCustomFields);
    expect(assignedCustomFields).toStrictEqual({ label1: ['eventId 1', 'eventId 2'] });
  });
});

describe('handleCustomField()', () => {
  it('creates a map of where custom fields are used', () => {
    const customFields = {
      lighting: {
        type: 'string',
        colour: 'red',
        label: 'lighting',
      },
      sound: {
        type: 'string',
        colour: 'red',
        label: 'sound',
      },
    } as CustomFields;
    const customFieldChangelog = new Map<string, string>();

    // @ts-expect-error -- partial event for testing
    const event: OntimeEvent = {
      type: SupportedEvent.Event,
      id: '2',
      timeStart: 0,
      linkStart: '1',
      custom: {
        lighting: 'on',
      },
    };
    const assignedCustomFields = {};

    const result = handleCustomField(customFields, customFieldChangelog, event, assignedCustomFields);
    expect(result).toBeUndefined();
    expect(assignedCustomFields).toStrictEqual({ lighting: ['2'] });
    expect(event.custom).toStrictEqual({
      lighting: 'on',
    });
  });

  it('renames a field if in changelog', () => {
    const customFields = {
      lighting: {
        type: 'string',
        colour: 'red',
        label: 'lighting',
      },
      video: {
        type: 'string',
        colour: 'red',
        label: 'video',
      },
    } as CustomFields;

    const customFieldChangelog = new Map([['sound', 'video']]);

    // @ts-expect-error -- partial event for testing
    const event: OntimeEvent = {
      type: SupportedEvent.Event,
      id: '2',
      timeStart: 0,
      linkStart: '1',
      custom: {
        sound: 'on',
      },
    };
    const assignedCustomFields = {};

    const result = handleCustomField(customFields, customFieldChangelog, event, assignedCustomFields);
    expect(result).toBeUndefined();
    expect(assignedCustomFields).toStrictEqual({ video: ['2'] });
    expect(event.custom).toStrictEqual({
      video: 'on',
    });
  });

  it('processes all fields', () => {
    const customFields = {
      field1: {
        type: 'string',
        colour: 'red',
        label: 'field1',
      },
      field2: {
        type: 'string',
        colour: 'red',
        label: 'field2',
      },
    } as CustomFields;

    const customFieldChangelog = new Map([['field1', 'newField1']]);

    // @ts-expect-error -- partial event for testing
    const mutableEvent: OntimeEvent = {
      type: SupportedEvent.Event,
      id: 'event1',
      custom: {
        field1: 'value1',
        field2: 'value2',
      },
    };

    const assignedCustomFields = {};

    handleCustomField(customFields, customFieldChangelog, mutableEvent, assignedCustomFields);

    // Check that field1 has been renamed to newField1 and the value reassigned
    expect(mutableEvent.custom['newField1']).toStrictEqual('value1');
    expect(mutableEvent.custom['field1']).toBeUndefined();

    // Check that field2 has been processed
    expect(mutableEvent.custom['field2']).toStrictEqual('value2');

    // Check that assignedCustomFields has been updated correctly
    expect(assignedCustomFields).toStrictEqual({
      newField1: ['event1'],
      field2: ['event1'],
    });
  });
});

describe('isDataStale()', () => {
  it('is stale if data contains timers', () => {
    const needsRecompute = [
      { timeStart: 10 },
      { timeEnd: 10 },
      { duration: 10 },
      { linkStart: '1' },
      { timerStrategy: TimeStrategy.LockDuration },
    ];

    for (const testCase of needsRecompute) {
      expect(isDataStale(testCase)).toBe(true);
    }
    expect.assertions(needsRecompute.length);
  });

  it('is not stale if data contains auxiliary dataset', () => {
    expect(
      isDataStale({
        cue: 'cue',
        title: 'title',
        note: 'note',
        endAction: EndAction.LoadNext,
        timerType: TimerType.Clock,
        isPublic: false,
        colour: 'colour',
        timeWarning: 1,
        timeDanger: 2,
        custom: {
          lighting: '3',
        },
      }),
    ).toBe(false);
  });
});

describe('hasChanges()', () => {
  it('identifies objects with new values', () => {
    const newEvent = { id: '1', title: 'new-title' } as OntimeEvent;
    const existing = { id: '1', cue: 'cue', title: 'title' } as OntimeEvent;
    expect(hasChanges(existing, newEvent)).toBe(true);
  });
  it('identifies objects with all same values', () => {
    const newEvent = { id: '1', title: 'title' } as OntimeEvent;
    const existing = { id: '1', cue: 'cue', title: 'title' } as OntimeEvent;
    expect(hasChanges(existing, newEvent)).toBe(false);
  });
});

describe('calculateDayOffset', () => {
  it('returns 0 if there is no previous event', () => {
    expect(calculateDayOffset({ timeStart: 0 })).toBe(0);
  });

  it('returns 0 if the previous event duration is 0', () => {
    expect(calculateDayOffset({ timeStart: 0 }, { timeStart: 0, duration: 0 })).toBe(0);
  });

  it('returns 0 if event starts after previous', () => {
    expect(calculateDayOffset({ timeStart: 11 }, { timeStart: 10, duration: 2 })).toBe(0);
  });

  it('returns 1 if event starts before previous', () => {
    expect(calculateDayOffset({ timeStart: 9 }, { timeStart: 10, duration: 2 })).toBe(1);
  });

  it('returns 1 if event starts at the same time as one before', () => {
    expect(calculateDayOffset({ timeStart: 10 }, { timeStart: 10, duration: 2 })).toBe(1);
  });

  it('should account for an event that crossed midnight and there is a overlap', () => {
    expect(
      calculateDayOffset(
        { timeStart: MILLIS_PER_HOUR }, // starts at 01:00:00
        { timeStart: 20 * MILLIS_PER_HOUR, duration: 6 * MILLIS_PER_HOUR }, // ends at 02:00:00
      ),
    ).toBe(1);
  });

  it('should account for an event that crossed midnight and there is a gap', () => {
    expect(
      calculateDayOffset(
        { timeStart: 2 * MILLIS_PER_HOUR }, // starts at 02:00:00
        { timeStart: 23 * MILLIS_PER_HOUR, duration: 2 * MILLIS_PER_HOUR }, // ends at 01:00:00
      ),
    ).toBe(1);
  });

  it('should account for an event that crossed midnight with no overlaps or gaps', () => {
    expect(
      calculateDayOffset(
        { timeStart: 2 * MILLIS_PER_HOUR }, // starts at 02:00:00
        { timeStart: 20 * MILLIS_PER_HOUR, duration: 6 * MILLIS_PER_HOUR }, // ends at 02:00:00
      ),
    ).toBe(1);
  });

  it('should account for an event that finishes exactly at midnight', () => {
    expect(
      calculateDayOffset(
        { timeStart: 2 * MILLIS_PER_HOUR }, // starts at 02:00:00
        { timeStart: 23 * MILLIS_PER_HOUR, duration: 6 * MILLIS_PER_HOUR }, // ends at 24:00:00
      ),
    ).toBe(1);
  });
});
