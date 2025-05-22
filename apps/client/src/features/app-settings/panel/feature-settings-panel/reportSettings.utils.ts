import { EntryId, isOntimeEvent, MaybeNumber, OntimeReport, RundownEntries } from 'ontime-types';

import { makeCSVFromArrayOfArrays } from '../../../../common/utils/csv';
import { formatTime } from '../../../../common/utils/time';

export type CombinedReport = {
  index: number;
  title: string;
  cue: string;
  scheduledStart: number;
  actualStart: MaybeNumber;
  scheduledEnd: number;
  actualEnd: MaybeNumber;
};

/**
 * Creates a combined report with the rundown data
 */
export function getCombinedReport(report: OntimeReport, rundown: RundownEntries, order: EntryId[]): CombinedReport[] {
  if (Object.keys(report).length === 0) return [];
  if (order.length === 0) return [];

  const combinedReport: CombinedReport[] = [];

  for (const [key, value] of Object.entries(report)) {
    if (!rundown[key] || !isOntimeEvent(rundown[key])) continue;

    combinedReport.push({
      index: order.findIndex((id) => id === key),
      title: rundown[key].title,
      cue: rundown[key].cue,
      scheduledStart: rundown[key].timeStart,
      actualEnd: value.endedAt,
      scheduledEnd: rundown[key].timeEnd,
      actualStart: value.startedAt,
    });
  }

  return combinedReport;
}

const csvHeader = ['Index', 'Title', 'Cue', 'Scheduled Start', 'Actual Start', 'Scheduled End', 'Actual End'];

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
    ]);
  }

  return makeCSVFromArrayOfArrays(csv);
}
