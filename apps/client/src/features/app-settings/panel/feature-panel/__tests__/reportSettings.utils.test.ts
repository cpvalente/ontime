import { EndAction, OntimeEvent, OntimeReport, RundownEntries, SupportedEntry, TimeStrategy, TimerType } from 'ontime-types';

import { getCombinedReport, makeReportCSV } from '../reportSettings.utils';

function makeEvent(patch: Partial<OntimeEvent>): OntimeEvent {
  return {
    type: SupportedEntry.Event,
    id: 'event',
    flag: false,
    cue: '1',
    title: 'event title',
    note: '',
    endAction: EndAction.None,
    timerType: TimerType.CountDown,
    countToEnd: false,
    linkStart: false,
    timeStrategy: TimeStrategy.LockEnd,
    timeStart: 0,
    timeEnd: 10000,
    duration: 10000,
    skip: false,
    colour: '',
    timeWarning: 0,
    timeDanger: 0,
    custom: {},
    triggers: [],
    parent: null,
    revision: 0,
    delay: 0,
    dayOffset: 0,
    gap: 0,
    ...patch,
  } as OntimeEvent;
}

describe('getCombinedReport()', () => {
  it('returns an empty list when there is nothing to show', () => {
    expect(getCombinedReport({}, {}, [])).toEqual([]);
  });

  it('includes an event which has not run, using the current schedule', () => {
    const entry = makeEvent({ id: 'a', timeStart: 0, timeEnd: 10000 });
    const rundownEntries: RundownEntries = { a: entry };

    const result = getCombinedReport({}, rundownEntries, ['a']);

    expect(result).toEqual([
      {
        id: 'a',
        index: 1,
        title: 'event title',
        cue: '1',
        scheduledStart: 0,
        scheduledEnd: 10000,
        actualStart: null,
        actualEnd: null,
        playCount: 0,
      },
    ]);
  });

  it('uses the snapshot taken when the event ran, not the current rundown', () => {
    const entry = makeEvent({ id: 'a', timeStart: 0, timeEnd: 99999 }); // edited after the run
    const rundownEntries: RundownEntries = { a: entry };
    const report: OntimeReport = {
      a: { startedAt: 100, endedAt: 10100, scheduledStart: 0, scheduledDuration: 10000, playCount: 1 },
    };

    const result = getCombinedReport(report, rundownEntries, ['a']);

    expect(result[0]).toMatchObject({
      scheduledStart: 0,
      scheduledEnd: 10000, // from the snapshot, not the edited timeEnd of 99999
      actualStart: 100,
      actualEnd: 10100,
      playCount: 1,
    });
  });

  it('keeps an event which ran but has since been removed from the rundown', () => {
    const report: OntimeReport = {
      deleted: { startedAt: 0, endedAt: 5000, scheduledStart: 0, scheduledDuration: 5000, playCount: 1 },
    };

    const result = getCombinedReport(report, {}, []);

    expect(result).toEqual([
      {
        id: 'deleted',
        index: 1,
        title: '(deleted event)',
        cue: '–',
        scheduledStart: 0,
        scheduledEnd: 5000,
        actualStart: 0,
        actualEnd: 5000,
        playCount: 1,
      },
    ]);
  });

  it('orders rundown events first, deleted events after', () => {
    const entry = makeEvent({ id: 'a', timeStart: 0, timeEnd: 10000 });
    const report: OntimeReport = {
      a: { startedAt: 0, endedAt: 10000, scheduledStart: 0, scheduledDuration: 10000, playCount: 1 },
      deleted: { startedAt: 10000, endedAt: 15000, scheduledStart: 10000, scheduledDuration: 5000, playCount: 1 },
    };

    const result = getCombinedReport(report, { a: entry }, ['a']);

    expect(result.map((entry) => entry.id)).toEqual(['a', 'deleted']);
  });

  it('skips entries which are not events', () => {
    const rundownEntries: RundownEntries = {
      delay: { type: SupportedEntry.Delay, id: 'delay', duration: 1000, parent: null },
    };

    expect(getCombinedReport({}, rundownEntries, ['delay'])).toEqual([]);
  });
});

describe('makeReportCSV()', () => {
  it('produces a header row and one row per entry', () => {
    const csv = makeReportCSV([
      {
        id: 'a',
        index: 1,
        title: 'Welcome',
        cue: '1',
        scheduledStart: 0,
        scheduledEnd: 10000,
        actualStart: 0,
        actualEnd: 12000,
        playCount: 1,
      },
    ]);

    const rows = csv.trim().split('\n');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain('Play count');
  });
});
