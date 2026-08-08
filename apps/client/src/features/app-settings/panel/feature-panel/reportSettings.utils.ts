import { EntryId, MaybeNumber, OntimeEventReport, OntimeReport, RundownEntries, isOntimeEvent } from 'ontime-types';
import { MILLIS_PER_SECOND } from 'ontime-utils';

import { makeCSVFromArrayOfArrays } from '../../../../common/utils/csv';
import { formatDuration, formatTime } from '../../../../common/utils/time';

/**
 * Signed drift for a run, eg "+4m 12s" / "-1m". A run with no completed
 * events has no meaningful drift to report.
 */
export function formatDrift(drift: number, eventsRun: number): string {
  if (eventsRun === 0) return '–';
  if (Math.abs(drift) < MILLIS_PER_SECOND) return 'On time';
  return `${drift > 0 ? '+' : '-'}${formatDuration(Math.abs(drift), false)}`;
}

export type CombinedReport = {
  id: EntryId;
  index: number;
  title: string;
  cue: string;
  scheduledStart: number;
  actualStart: MaybeNumber;
  scheduledEnd: number;
  actualEnd: MaybeNumber;
  playCount: number;
};

/**
 * Creates a combined report joining a run's per event data with the rundown.
 *
 * A run's report keeps its own snapshot of the schedule (`scheduledStart` /
 * `scheduledDuration`), so an event that ran is shown against the schedule as
 * it was at the time, not against whatever the rundown has been edited to since.
 *
 * Events that ran but no longer exist in the rundown (deleted since the run)
 * are still included, from the snapshot alone, so a historical run stays a
 * complete record even after the rundown changes.
 */
export function getCombinedReport(
  report: OntimeReport,
  rundownEntries: RundownEntries,
  flatOrder: EntryId[],
): CombinedReport[] {
  if (Object.keys(report).length === 0 && flatOrder.length === 0) return [];

  const combinedReport: CombinedReport[] = [];
  const seen = new Set<EntryId>();
  let index = 1;

  for (const id of flatOrder) {
    const entry = rundownEntries[id];
    if (!entry || !isOntimeEvent(entry)) continue;

    seen.add(id);
    combinedReport.push(makeCombinedEntry(id, index, entry.title, entry.cue, report[id], entry.timeStart, entry.timeEnd));
    index++;
  }

  for (const [id, reportEntry] of Object.entries(report)) {
    if (seen.has(id)) continue;
    combinedReport.push(
      makeCombinedEntry(
        id,
        index,
        '(deleted event)',
        '–',
        reportEntry,
        reportEntry.scheduledStart,
        reportEntry.scheduledStart + reportEntry.scheduledDuration,
      ),
    );
    index++;
  }

  return combinedReport;
}

function makeCombinedEntry(
  id: EntryId,
  index: number,
  title: string,
  cue: string,
  reportEntry: OntimeEventReport | undefined,
  fallbackStart: number,
  fallbackEnd: number,
): CombinedReport {
  if (!reportEntry) {
    return {
      id,
      index,
      title,
      cue,
      scheduledStart: fallbackStart,
      scheduledEnd: fallbackEnd,
      actualStart: null,
      actualEnd: null,
      playCount: 0,
    };
  }

  return {
    id,
    index,
    title,
    cue,
    scheduledStart: reportEntry.scheduledStart,
    scheduledEnd: reportEntry.scheduledStart + reportEntry.scheduledDuration,
    actualStart: reportEntry.startedAt,
    actualEnd: reportEntry.endedAt,
    playCount: reportEntry.playCount,
  };
}

const csvHeader = ['Index', 'Title', 'Cue', 'Scheduled Start', 'Actual Start', 'Scheduled End', 'Actual End', 'Play count'];

/**
 * Transforms a CombinedReport into a CSV string
 */
export function makeReportCSV(combinedReport: CombinedReport[]) {
  const csv: string[][] = [];
  csv.push(csvHeader);

  for (const entry of combinedReport) {
    csv.push([
      String(entry.index),
      entry.title,
      entry.cue,
      formatTime(entry.scheduledStart),
      formatTime(entry.actualStart),
      formatTime(entry.scheduledEnd),
      formatTime(entry.actualEnd),
      String(entry.playCount),
    ]);
  }

  return makeCSVFromArrayOfArrays(csv);
}
