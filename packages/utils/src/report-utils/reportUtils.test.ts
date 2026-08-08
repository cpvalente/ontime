import type { OntimeEventReport, OntimeReport } from 'ontime-types';

import { getEventVariance, getRunSummary } from './reportUtils.js';

function makeEntry(patch: Partial<OntimeEventReport> = {}): OntimeEventReport {
  return {
    startedAt: 0,
    endedAt: 10000,
    scheduledStart: 0,
    scheduledDuration: 10000,
    playCount: 1,
    ...patch,
  };
}

describe('getEventVariance()', () => {
  it('reports an event which never ran', () => {
    expect(getEventVariance(undefined)).toMatchObject({ status: 'not-run', actualDuration: null, delta: 0 });
  });

  it('reports an event which started but never finished', () => {
    const entry = makeEntry({ startedAt: 1000, endedAt: null });
    expect(getEventVariance(entry)).toMatchObject({ status: 'not-run', actualDuration: null });
  });

  it('reports an event which never started', () => {
    const entry = makeEntry({ startedAt: null, endedAt: 1000 });
    expect(getEventVariance(entry)).toMatchObject({ status: 'not-run' });
  });

  it('reports an event which matched its schedule', () => {
    const entry = makeEntry({ startedAt: 0, endedAt: 10000, scheduledDuration: 10000 });
    expect(getEventVariance(entry)).toMatchObject({ status: 'ontime', actualDuration: 10000, delta: 0 });
  });

  it('treats sub-second differences as on time', () => {
    const entry = makeEntry({ startedAt: 0, endedAt: 10500, scheduledDuration: 10000 });
    expect(getEventVariance(entry)).toMatchObject({ status: 'ontime', delta: 500 });
  });

  it('reports an overrun', () => {
    const entry = makeEntry({ startedAt: 0, endedAt: 15000, scheduledDuration: 10000 });
    expect(getEventVariance(entry)).toMatchObject({ status: 'over', actualDuration: 15000, delta: 5000 });
  });

  it('reports an underrun', () => {
    const entry = makeEntry({ startedAt: 0, endedAt: 6000, scheduledDuration: 10000 });
    expect(getEventVariance(entry)).toMatchObject({ status: 'under', actualDuration: 6000, delta: -4000 });
  });

  it('measures against the snapshot, not the current rundown', () => {
    // the rundown may have been edited after the run, the snapshot is what counts
    const entry = makeEntry({ startedAt: 0, endedAt: 12000, scheduledDuration: 10000 });
    expect(getEventVariance(entry).delta).toBe(2000);
  });
});

describe('getRunSummary()', () => {
  it('returns an empty summary for an empty report', () => {
    expect(getRunSummary({}, 0)).toMatchObject({
      eventsRun: 0,
      eventsPlanned: 0,
      scheduledDuration: 0,
      actualDuration: 0,
      drift: 0,
      worstOverrun: null,
    });
  });

  it('aggregates durations and drift across a run', () => {
    const report: OntimeReport = {
      a: makeEntry({ startedAt: 0, endedAt: 15000, scheduledDuration: 10000 }), // +5000
      b: makeEntry({ startedAt: 15000, endedAt: 21000, scheduledDuration: 10000 }), // -4000
      c: makeEntry({ startedAt: 21000, endedAt: 31000, scheduledDuration: 10000 }), // 0
    };

    expect(getRunSummary(report, 4)).toMatchObject({
      eventsRun: 3,
      eventsPlanned: 4,
      scheduledDuration: 30000,
      actualDuration: 31000,
      drift: 1000,
      eventsOver: 1,
      eventsUnder: 1,
      eventsOnTime: 1,
    });
  });

  it('identifies the worst overrun', () => {
    const report: OntimeReport = {
      a: makeEntry({ startedAt: 0, endedAt: 15000, scheduledDuration: 10000 }), // +5000
      b: makeEntry({ startedAt: 0, endedAt: 30000, scheduledDuration: 10000 }), // +20000
      c: makeEntry({ startedAt: 0, endedAt: 12000, scheduledDuration: 10000 }), // +2000
    };

    expect(getRunSummary(report, 3).worstOverrun).toEqual({ id: 'b', delta: 20000 });
  });

  it('ignores events which did not complete', () => {
    const report: OntimeReport = {
      a: makeEntry({ startedAt: 0, endedAt: 15000, scheduledDuration: 10000 }),
      b: makeEntry({ startedAt: 15000, endedAt: null, scheduledDuration: 10000 }),
    };

    expect(getRunSummary(report, 2)).toMatchObject({
      eventsRun: 1,
      scheduledDuration: 10000,
      actualDuration: 15000,
      drift: 5000,
    });
  });
});
