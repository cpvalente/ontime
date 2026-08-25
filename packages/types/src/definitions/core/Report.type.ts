import type { MaybeNumber } from '../../utils/utils.type.js';
import type { EntryId } from './OntimeEntry.js';
import type { Rundown } from './Rundown.type.js';

export type OntimeEventReport = {
  startedAt: MaybeNumber;
  startedAtDay: number | null;
  endedAt: MaybeNumber;
  endedAtDay: number | null;
  /**
   * Snapshot of the schedule taken when the event ran.
   * Keeping a copy is what makes a report a record: editing the rundown
   * afterwards no longer changes how a show that already happened is reported.
   */
  scheduledStart: number;
  scheduledDay: number;
  scheduledDuration: number;
};

export type OntimeReport = Record<EntryId, OntimeEventReport>;

/**
 * Show level times for the report.
 *
 * Planned times are snapshotted when the show starts, for the same reason the
 * per event schedule is. Actual times are derived from the events that ran.
 */
export type ShowReport = {
  plannedStart: MaybeNumber;
  plannedEnd: MaybeNumber;
  plannedDuration: MaybeNumber;
  actualStart: MaybeNumber;
  actualEnd: MaybeNumber;
  actualDuration: MaybeNumber;
};

/** Recorded event timings together with the rundown plan they are measured against. */
export type ReportData = {
  eventReports: OntimeReport;
  rundown: Rundown | null;
  show: ShowReport;
};
