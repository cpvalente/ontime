import type { OntimeEventReport, OntimeReport } from 'ontime-types';
import {
  createDelay,
  createEvent,
  createGroup,
  dayInMs,
  MILLIS_PER_HOUR,
  MILLIS_PER_MINUTE,
  MILLIS_PER_SECOND,
} from 'ontime-utils';

import {
  formatOffset,
  getCombinedReport,
  getGroupReports,
  getRunSummary,
  getShowOffsets,
  makeReportCSV,
} from '../reportSettings.utils';

function makeEvent(id: string, patch = {}) {
  const event = createEvent({ id, title: id, ...patch });
  if (!event) throw new Error('Failed to create test event');
  return event;
}

function makeReport(patch: Partial<OntimeEventReport> = {}): OntimeEventReport {
  return {
    startedAt: 5 * MILLIS_PER_MINUTE,
    startedAtDay: 1,
    endedAt: 15 * MILLIS_PER_MINUTE,
    endedAtDay: 1,
    scheduledStart: dayInMs - 5 * MILLIS_PER_MINUTE,
    scheduledDay: 0,
    scheduledDuration: 10 * MILLIS_PER_MINUTE,
    ...patch,
  };
}

describe('getCombinedReport()', () => {
  it('uses the captured schedule and absolute day when calculating offsets', () => {
    const entry = makeEvent('a', { timeStart: 0, duration: 99 * MILLIS_PER_MINUTE });
    const rows = getCombinedReport({ a: makeReport() }, { a: entry }, ['a']);

    expect(rows[0]).toMatchObject({
      scheduledStart: dayInMs - 5 * MILLIS_PER_MINUTE,
      scheduledEnd: dayInMs + 5 * MILLIS_PER_MINUTE,
      startOffset: 10 * MILLIS_PER_MINUTE,
      endOffset: 10 * MILLIS_PER_MINUTE,
    });
  });

  it('includes unplayed events but excludes skipped and non-event entries', () => {
    const ran = makeEvent('ran');
    const unplayed = makeEvent('unplayed', { timeStart: 20 * MILLIS_PER_MINUTE });
    const skipped = makeEvent('skipped', { skip: true });
    const delay = createDelay({ id: 'delay' });
    const report: OntimeReport = { ran: makeReport({ scheduledStart: 0, scheduledDay: 0 }) };

    const rows = getCombinedReport(report, { ran, unplayed, skipped, delay }, ['ran', 'unplayed', 'skipped', 'delay']);

    expect(rows.map(({ id }) => id)).toEqual(['ran', 'unplayed']);
    expect(rows[1]).toMatchObject({ scheduledStart: unplayed.timeStart, actualStart: null, actualEnd: null });
  });
});

describe('report calculations', () => {
  it('keeps finishing time separate from running time', () => {
    const offsets = getShowOffsets({
      plannedStart: 19 * MILLIS_PER_HOUR,
      plannedEnd: 21 * MILLIS_PER_HOUR,
      plannedDuration: 2 * MILLIS_PER_HOUR,
      actualStart: 19 * MILLIS_PER_HOUR - 10 * MILLIS_PER_MINUTE,
      actualEnd: 21 * MILLIS_PER_HOUR - 6 * MILLIS_PER_MINUTE,
      actualDuration: 2 * MILLIS_PER_HOUR + 4 * MILLIS_PER_MINUTE,
    });

    expect(offsets).toMatchObject({
      startOffset: -10 * MILLIS_PER_MINUTE,
      endOffset: -6 * MILLIS_PER_MINUTE,
      durationOffset: 4 * MILLIS_PER_MINUTE,
    });
  });

  it('measures completed groups against their target', () => {
    const group = createGroup({ id: 'group', entries: ['a', 'b'], targetDuration: 30 * MILLIS_PER_MINUTE });
    const entries = {
      group,
      a: makeEvent('a', { parent: group.id, duration: 10 * MILLIS_PER_MINUTE }),
      b: makeEvent('b', { parent: group.id, duration: 10 * MILLIS_PER_MINUTE }),
    };
    const report: OntimeReport = {
      a: makeReport({ startedAt: 0, startedAtDay: 0, endedAt: 10 * MILLIS_PER_MINUTE, endedAtDay: 0 }),
      b: makeReport({
        startedAt: 15 * MILLIS_PER_MINUTE,
        startedAtDay: 0,
        endedAt: 25 * MILLIS_PER_MINUTE,
        endedAtDay: 0,
      }),
    };

    expect(getGroupReports(report, entries, [group.id])[0]).toMatchObject({
      elapsed: 25 * MILLIS_PER_MINUTE,
      variance: -5 * MILLIS_PER_MINUTE,
      eventsRun: 2,
      eventsPlanned: 2,
    });
    expect(getGroupReports({ a: report.a }, entries, [group.id])[0].variance).toBeNull();
  });

  it('summarises completed events and excludes skipped events from the plan', () => {
    const entries = { a: makeEvent('a'), b: makeEvent('b', { skip: true }) };
    const report = {
      a: makeReport({ startedAt: 0, startedAtDay: 0, endedAt: 15 * MILLIS_PER_MINUTE, endedAtDay: 0 }),
      b: makeReport({ startedAt: 0, startedAtDay: 0, endedAt: 30 * MILLIS_PER_MINUTE, endedAtDay: 0 }),
    };

    expect(getRunSummary(report, entries, ['a', 'b'])).toEqual({ eventsRun: 2, eventsPlanned: 1 });
  });
});

describe('report formatting', () => {
  it.each([
    [null, '–'],
    [MILLIS_PER_SECOND / 2, 'On time'],
    [4 * MILLIS_PER_MINUTE + 12 * MILLIS_PER_SECOND, '+4m12s'],
    [-MILLIS_PER_MINUTE, '-1m'],
  ])('formats offset %s', (value, expected) => {
    expect(formatOffset(value)).toBe(expected);
  });

  it('exports group context and leaves missing actual times empty', () => {
    const csv = makeReportCSV([
      {
        id: 'a',
        index: 1,
        title: 'Welcome',
        cue: '1',
        parent: 'act1',
        groupTitle: 'Act 1',
        scheduledStart: 0,
        scheduledEnd: 10 * MILLIS_PER_MINUTE,
        actualStart: null,
        startOffset: null,
        actualEnd: null,
        endOffset: null,
      },
    ]);

    const fields = csv.trim().split('\n')[1].split(',');
    expect(csv).toContain('Group');
    expect(fields[1]).toBe('Act 1');
    expect(fields[5]).toBe('');
    expect(fields[7]).toBe('');
  });
});
