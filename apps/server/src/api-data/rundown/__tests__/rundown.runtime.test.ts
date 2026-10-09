import { CustomFields, Playback, RefetchKey, Rundown } from 'ontime-types';
import { MILLIS_PER_MINUTE } from 'ontime-utils';

import { sendRefetch } from '../../../adapters/WebsocketAdapter.js';
import { runtimeService } from '../../../services/runtime-service/runtime.service.js';
import { getState } from '../../../stores/runtimeState.js';
import {
  makeCustomField,
  makeOntimeDelay,
  makeOntimeEvent,
  makeOntimeGroup,
  makeRundown,
} from '../__mocks__/rundown.mocks.js';
import {
  cloneEntry,
  deleteCustomField,
  deleteEntries,
  editCustomField,
  editEntry,
  initRundown,
  ungroupEntries,
} from '../rundown.service.js';

/**
 * Exercises the rundown service against the real runtime,
 * asserting on the runtime as soon as the rundown mutation resolves
 */

/** captures what the runtime broadcasts to clients */
const broadcast = vi.hoisted(() => ({ sent: [] as Array<Record<string, unknown>> }));

vi.mock('../../../stores/EventStore.js', () => ({
  eventStore: {
    createBatch: () => {
      const patch: Record<string, unknown> = {};
      return {
        add: (key: string, value: unknown) => {
          patch[key] = value;
        },
        send: () => {
          if (Object.keys(patch).length > 0) broadcast.sent.push(patch);
        },
      };
    },
  },
}));

vi.mock('../../../classes/data-provider/DataProvider.js', () => ({
  getDataProvider: () => ({
    getRundown: vi.fn<() => Rundown>(),
    setRundown: vi.fn<() => Promise<void>>(async () => {}),
    getProjectRundowns: () => ({}),
    getCustomFields: () => ({}),
    setCustomFields: vi.fn<(customFields: CustomFields) => Promise<CustomFields>>(async (customFields) => customFields),
  }),
}));

// the timer owns a setInterval, we drive the runtime state without it
vi.mock('../../../services/runtime-service/EventTimer.js', async () => {
  const runtimeState = await import('../../../stores/runtimeState.js');
  return {
    EventTimer: class {
      setOnUpdateCallback() {}
      start() {
        return runtimeState.start();
      }
      stop() {
        return runtimeState.stop();
      }
      scheduleNextBoundary() {}
      shutdown() {}
    },
  };
});

vi.mock('../../../adapters/WebsocketAdapter.js', () => ({ sendRefetch: vi.fn<typeof sendRefetch>() }));
vi.mock('../../../services/app-state-service/appState.service.js', () => ({
  setLastLoadedRundown: vi.fn<() => Promise<void>>(async () => {}),
}));
vi.mock('../../../services/restore-service/restore.service.js', () => ({
  restoreService: { save: vi.fn<() => Promise<void>>(async () => {}) },
}));
vi.mock('../../automation/automation.service.js', () => ({ triggerAutomations: vi.fn<() => void>() }));
vi.mock('../../report/report.service.js', () => ({ triggerReportEntry: vi.fn<() => void>() }));

async function playRundown(rundown: Rundown, customFields: CustomFields = {}) {
  await initRundown(rundown, customFields);
  runtimeService.startById('a');
  expect(getState().timer.playback).toBe(Playback.Play);
  broadcast.sent = [];
}

const eventA = { id: 'a', timeStart: 0, timeEnd: 10 * MILLIS_PER_MINUTE, duration: 10 * MILLIS_PER_MINUTE };
const eventB = {
  id: 'b',
  timeStart: 10 * MILLIS_PER_MINUTE,
  timeEnd: 20 * MILLIS_PER_MINUTE,
  duration: 10 * MILLIS_PER_MINUTE,
};

describe('rundown changes update the runtime', () => {
  beforeAll(() => {
    // the runtime listens for changes once initialised
    runtimeService.init(null);
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime('jan 1 00:05');
  });

  afterEach(() => {
    runtimeService.stop();
    // send the queued refetches, so they do not carry over into the next test
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('stops playback and broadcasts it when the loaded event is deleted', async () => {
    await playRundown(
      makeRundown({
        id: 'loaded',
        entries: { a: makeOntimeEvent(eventA), b: makeOntimeEvent(eventB) },
        order: ['a', 'b'],
      }),
    );

    await deleteEntries('loaded', ['a']);

    // the event which moved into the deleted slot must not inherit the running timer
    expect(getState().eventNow).toBeNull();
    expect(getState().timer.playback).toBe(Playback.Stop);
    // clients are told in the same call, not on the next timer tick
    expect(broadcast.sent).toContainEqual(expect.objectContaining({ eventNow: null }));
  });

  it('updates the runtime before clients are told to refetch the rundown', async () => {
    await playRundown(
      makeRundown({
        id: 'loaded',
        entries: { a: makeOntimeEvent(eventA), b: makeOntimeEvent(eventB) },
        order: ['a', 'b'],
      }),
    );
    vi.mocked(sendRefetch).mockClear();

    await editEntry('loaded', { id: 'a', title: 'Edited' });

    expect(getState().eventNow).toMatchObject({ title: 'Edited' });
    expect(sendRefetch).not.toHaveBeenCalled();

    await vi.runOnlyPendingTimersAsync();
    expect(sendRefetch).toHaveBeenCalledWith(RefetchKey.Rundown, expect.any(Number), 'loaded');
  });

  it('keeps playback running when the loaded event is edited', async () => {
    await playRundown(
      makeRundown({
        id: 'loaded',
        entries: { a: makeOntimeEvent(eventA), b: makeOntimeEvent(eventB) },
        order: ['a', 'b'],
      }),
    );

    await editEntry('loaded', { id: 'a', title: 'Edited' });

    expect(getState().timer.playback).toBe(Playback.Play);
    expect(getState().eventNow).toMatchObject({ id: 'a', title: 'Edited' });
  });

  it('clears the group when the loaded event is ungrouped', async () => {
    await playRundown(
      makeRundown({
        id: 'loaded',
        entries: {
          group: makeOntimeGroup({ id: 'group', entries: ['a', 'b'] }),
          a: makeOntimeEvent({ ...eventA, parent: 'group' }),
          b: makeOntimeEvent({ ...eventB, parent: 'group' }),
        },
        order: ['group'],
      }),
    );
    expect(getState().groupNow?.id).toBe('group');
    expect(getState().offset.expectedGroupEnd).not.toBeNull();

    await ungroupEntries('loaded', 'group');

    expect(getState().groupNow).toBeNull();
    expect(getState().eventNow?.parent).toBeNull();
    expect(getState().offset.expectedGroupEnd).toBeNull();
  });

  it('updates the loaded event when a custom field is renamed or deleted', async () => {
    await playRundown(
      makeRundown({
        id: 'loaded',
        entries: { a: makeOntimeEvent({ ...eventA, custom: { old: 'value' } }), b: makeOntimeEvent(eventB) },
        order: ['a', 'b'],
      }),
      { old: makeCustomField({ label: 'old' }) },
    );

    await editCustomField('old', { label: 'renamed' });
    expect(getState().eventNow?.custom).toEqual({ renamed: 'value' });

    await deleteCustomField('renamed');
    expect(getState().eventNow?.custom).toEqual({});
  });

  it('updates the next event when a delay before it is cloned', async () => {
    await playRundown(
      makeRundown({
        id: 'loaded',
        entries: {
          a: makeOntimeEvent(eventA),
          delay: makeOntimeDelay({ id: 'delay', duration: 5 * MILLIS_PER_MINUTE }),
          b: makeOntimeEvent(eventB),
        },
        order: ['a', 'delay', 'b'],
      }),
    );
    expect(getState().eventNext).toMatchObject({ id: 'b', delay: 5 * MILLIS_PER_MINUTE });

    await cloneEntry('loaded', 'delay', { after: 'delay' });

    expect(getState().eventNext).toMatchObject({ id: 'b', delay: 10 * MILLIS_PER_MINUTE });
  });
});
