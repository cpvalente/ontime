import type { MaybeNumber } from '../../utils/utils.type.js';
import type { EntryId } from './OntimeEntry.js';

export type OntimeEventReport = {
  startedAt: MaybeNumber;
  endedAt: MaybeNumber;
  /**
   * Snapshot of the schedule taken when the event ran.
   * Keeping a copy is what makes a report a record: editing the rundown
   * afterwards no longer rewrites history.
   */
  scheduledStart: number;
  scheduledDuration: number;
  /** how many times the event was started within this run, >1 means it was re-run */
  playCount: number;
};

export type OntimeReport = Record<EntryId, OntimeEventReport>;

export type RunSummary = {
  /** events which produced a report entry */
  eventsRun: number;
  /** playable events in the rundown at the time the summary was made */
  eventsPlanned: number;
  scheduledDuration: number;
  actualDuration: number;
  /** actualDuration - scheduledDuration, signed */
  drift: number;
  eventsOver: number;
  eventsUnder: number;
  eventsOnTime: number;
  /** largest single overrun, answers "what blew the schedule" */
  worstOverrun: { id: EntryId; delta: number } | null;
};

export type ShowRun = {
  id: string;
  rundownId: string;
  /**
   * Denormalised so a run stays readable after its rundown
   * is renamed or deleted.
   */
  rundownTitle: string;
  /** user editable, defaults to a formatted local date and time */
  label: string;
  /**
   * Wall clock instant (milliseconds from epoch) the run began.
   * Not a time of day: runs must be datable and orderable across days.
   */
  startedAt: number;
  /**
   * Time of day the last event in the run finished, or null while the run is
   * open. Only ever compared against the per event times in the same run.
   */
  endedAt: MaybeNumber;
  report: OntimeReport;
  summary: RunSummary;
};

/** A run without its per event data, for list views */
export type ShowRunSummary = Omit<ShowRun, 'report'>;

/** Contents of a project's report sidecar file */
export type ProjectReports = {
  runs: ShowRun[];
};
