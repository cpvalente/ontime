import type { EntryId, MaybeNumber, OntimeGroup, OntimeReport, RundownEntries, ShowReport } from 'ontime-types';
import { isOntimeEvent, isOntimeGroup } from 'ontime-types';
import { dayInMs, MILLIS_PER_SECOND } from 'ontime-utils';

import { makeCSVFromArrayOfArrays } from '../../../../common/utils/csv';
import { getEventVariance, getReportTimePosition } from '../../../../common/utils/report';
import { enDash } from '../../../../common/utils/styleUtils';
import { formatDuration, formatTime } from '../../../../common/utils/time';

export type CombinedReport = {
  id: EntryId;
  index: number;
  title: string;
  cue: string;
  colour: string;
  /** the group this event belongs to, so the report can mirror the rundown */
  parent: EntryId | null;
  groupTitle: string;
  scheduledStart: number;
  actualStart: MaybeNumber;
  startOffset: MaybeNumber;
  scheduledEnd: number;
  actualEnd: MaybeNumber;
  endOffset: MaybeNumber;
};

type ShowOffsets = {
  startOffset: MaybeNumber;
  endOffset: MaybeNumber;
  durationOffset: MaybeNumber;
};

export type GroupReport = {
  id: EntryId;
  title: string;
  colour: string;
  targetDuration: MaybeNumber;
  scheduledDuration: number;
  actualStart: MaybeNumber;
  actualEnd: MaybeNumber;
  elapsed: MaybeNumber;
  variance: MaybeNumber;
  eventsRun: number;
  eventsPlanned: number;
};

export type RunSummary = {
  eventsRun: number;
  eventsPlanned: number;
};

/**
 * Creates a combined report with the rundown data.
 *
 * Events that ran are measured against the schedule recorded at the time,
 * not the rundown's current values, so editing the rundown afterwards does
 * not change how a show that already happened is reported. Events that never
 * ran have no snapshot and fall back to the rundown.
 */
export function getCombinedReport(
  report: OntimeReport,
  rundown: RundownEntries,
  flatOrder: EntryId[],
): CombinedReport[] {
  if (Object.keys(report).length === 0 || flatOrder.length === 0) return [];

  const combinedReport: CombinedReport[] = [];

  let index = 1;
  for (const id of flatOrder) {
    const entry = rundown[id];
    // skipped events were never meant to run, listing them alongside events
    // that did would also disagree with the summary, which excludes them
    if (!entry || !isOntimeEvent(entry) || entry.skip) continue;

    const parent = entry.parent;
    const group = parent ? rundown[parent] : undefined;
    const reported = report[id];
    const scheduledStart = reported?.scheduledStart ?? entry.timeStart;
    const scheduledDay = reported?.scheduledDay ?? entry.dayOffset;
    const scheduledStartPosition = getReportTimePosition(scheduledStart, scheduledDay);
    const actualStartPosition = reported ? getReportTimePosition(reported.startedAt, reported.startedAtDay) : null;
    const actualEndPosition = reported ? getReportTimePosition(reported.endedAt, reported.endedAtDay) : null;
    const scheduledDuration = reported?.scheduledDuration ?? entry.duration;

    combinedReport.push({
      id,
      index,
      title: entry.title,
      cue: entry.cue,
      colour: entry.colour,
      parent,
      groupTitle: group && isOntimeGroup(group) ? group.title : '',
      // an event that ran is measured against the plan it ran on, one that
      // did not has no snapshot and falls back to the rundown
      scheduledStart,
      scheduledEnd: scheduledStart + scheduledDuration,
      actualStart: reported?.startedAt ?? null,
      startOffset: getOffset(actualStartPosition, scheduledStartPosition),
      actualEnd: reported?.endedAt ?? null,
      endOffset: getOffset(actualEndPosition, scheduledStartPosition + scheduledDuration),
    });
    index++;
  }

  return combinedReport;
}

function getOffset(actual: MaybeNumber, scheduled: number): MaybeNumber {
  return actual === null ? null : actual - scheduled;
}

export function getShowOffsets(show: ShowReport): ShowOffsets {
  const { plannedDuration, actualDuration } = show;
  return {
    startOffset: getWallClockOffset(show.plannedStart, show.actualStart),
    endOffset: getWallClockOffset(show.plannedEnd, show.actualEnd),
    durationOffset: plannedDuration === null || actualDuration === null ? null : actualDuration - plannedDuration,
  };
}

function getWallClockOffset(planned: MaybeNumber, actual: MaybeNumber): MaybeNumber {
  if (planned === null || actual === null) return null;

  const offset = actual - planned;
  if (offset < -dayInMs / 2) return offset + dayInMs;
  if (offset > dayInMs / 2) return offset - dayInMs;
  return offset;
}

export function getGroupReports(report: OntimeReport, entries: RundownEntries, order: EntryId[]): GroupReport[] {
  const groups: GroupReport[] = [];
  for (const id of order) {
    const group = entries[id];
    if (group && isOntimeGroup(group)) groups.push(getGroupReport(group, report, entries));
  }
  return groups;
}

function getGroupReport(group: OntimeGroup, report: OntimeReport, entries: RundownEntries): GroupReport {
  let scheduledDuration = 0;
  let eventsPlanned = 0;
  let eventsRun = 0;
  let firstStart = Number.POSITIVE_INFINITY;
  let lastEnd = Number.NEGATIVE_INFINITY;
  let actualStart: MaybeNumber = null;
  let actualEnd: MaybeNumber = null;

  for (const childId of group.entries) {
    const child = entries[childId];
    if (!child || !isOntimeEvent(child) || child.skip) continue;

    eventsPlanned += 1;
    const reported = report[childId];
    scheduledDuration += reported?.scheduledDuration ?? child.duration;

    const variance = getEventVariance(reported);
    if (variance.actualDuration === null || !reported) continue;

    eventsRun += 1;
    const start = getReportTimePosition(reported.startedAt, reported.startedAtDay);
    const end = getReportTimePosition(reported.endedAt, reported.endedAtDay);
    if (start !== null && start < firstStart) {
      firstStart = start;
      actualStart = reported.startedAt;
    }
    if (end !== null && end > lastEnd) {
      lastEnd = end;
      actualEnd = reported.endedAt;
    }
  }

  const elapsed = actualStart === null || actualEnd === null ? null : lastEnd - firstStart;
  const measuredAgainst = group.targetDuration ?? scheduledDuration;
  const isComplete = eventsRun > 0 && eventsRun === eventsPlanned;

  return {
    id: group.id,
    title: group.title,
    colour: group.colour,
    targetDuration: group.targetDuration,
    scheduledDuration,
    actualStart,
    actualEnd,
    elapsed,
    variance: elapsed === null || !isComplete ? null : elapsed - measuredAgainst,
    eventsRun,
    eventsPlanned,
  };
}

export function getRunSummary(report: OntimeReport, entries: RundownEntries, order: EntryId[]): RunSummary {
  const eventsPlanned = order.filter((id) => {
    const entry = entries[id];
    return entry && isOntimeEvent(entry) && !entry.skip;
  }).length;
  const eventsRun = Object.values(report).filter((entry) => getEventVariance(entry).status !== 'not-run').length;
  return { eventsRun, eventsPlanned };
}

/**
 * Signed offset, eg "+4m12s" / "-1m", following Ontime's convention that
 * positive means behind schedule.
 */
export function formatOffset(value: MaybeNumber): string {
  if (value === null) return enDash;
  if (Math.abs(value) < MILLIS_PER_SECOND) return 'On time';
  return `${value > 0 ? '+' : '-'}${formatDuration(Math.abs(value), false)}`;
}

export function offsetTone(value: MaybeNumber): 'over' | 'under' | 'none' {
  if (value === null || Math.abs(value) < MILLIS_PER_SECOND) return 'none';
  return value > 0 ? 'over' : 'under';
}

function formatCsvTime(value: MaybeNumber): string {
  return value === null ? '' : formatTime(value);
}

const csvHeader = ['Index', 'Group', 'Cue', 'Title', 'Scheduled Start', 'Actual Start', 'Scheduled End', 'Actual End'];

/**
 * Transforms a CombinedReport into a CSV string.
 *
 * Exported as one row per event with its group named, rather than with
 * rollups baked in, so it stays the dataset a report is built from.
 */
export function makeReportCSV(combinedReport: CombinedReport[]) {
  const csv = combinedReport.map((entry) => [
    String(entry.index),
    entry.groupTitle,
    entry.cue,
    entry.title,
    formatTime(entry.scheduledStart),
    formatCsvTime(entry.actualStart),
    formatTime(entry.scheduledEnd),
    formatCsvTime(entry.actualEnd),
  ]);

  return makeCSVFromArrayOfArrays([csvHeader, ...csv]);
}
