import {
  EntryId,
  OntimeEventReport,
  OntimeReport,
  RefetchKey,
  ShowRun,
  ShowRunSummary,
  TimerLifeCycle,
} from 'ontime-types';
import { countPlannedEvents, generateId, getRunSummary } from 'ontime-utils';
import { DeepReadonly } from 'ts-essentials';

import { sendRefetch } from '../../adapters/WebsocketAdapter.js';
import * as reportStore from '../../services/report-service/report.store.js';
import { RuntimeState } from '../../stores/runtimeState.js';
import { getCurrentRundown } from '../rundown/rundown.dao.js';

/** per event data for the run currently in progress */
const report = new Map<EntryId, OntimeEventReport>();

let formattedReport: OntimeReport | null = null;

/** metadata for the run in progress, null when no run is open */
let openRun: Omit<ShowRun, 'report' | 'summary'> | null = null;

/**
 * generates a full report
 * @returns full report
 */
export function generate(): OntimeReport {
  if (formattedReport === null) {
    formattedReport = Object.fromEntries(report);
  }
  return formattedReport;
}

/**
 * clear report
 * @param id optional id of a event report to clear
 */
export function clear(id?: string) {
  formattedReport = null;
  if (id) {
    report.delete(id);
  } else {
    report.clear();
  }
  void persistOpenRun();
}

/**
 * trigger report entry
 * @param cycle
 * @param state
 * @returns
 */
export function triggerReportEntry(
  cycle: TimerLifeCycle.onStart | TimerLifeCycle.onStop,
  state: DeepReadonly<RuntimeState>,
) {
  if (!state.eventNow?.id) {
    return;
  }

  const eventId = state.eventNow.id;

  if (cycle === TimerLifeCycle.onStart) {
    openRunIfNeeded(state);

    // an event started twice in the same run is a re-run, not a new record
    const playCount = (report.get(eventId)?.playCount ?? 0) + 1;

    report.set(eventId, {
      startedAt: state.timer.startedAt,
      endedAt: null,
      // snapshot the schedule so later rundown edits cannot rewrite this run
      scheduledStart: state.eventNow.timeStart,
      scheduledDuration: state.eventNow.duration,
      playCount,
    });
    formattedReport = null;
    return;
  }

  if (cycle === TimerLifeCycle.onStop) {
    const previous = report.get(eventId);
    report.set(eventId, {
      startedAt: previous?.startedAt ?? null,
      endedAt: state.clock,
      scheduledStart: previous?.scheduledStart ?? state.eventNow.timeStart,
      scheduledDuration: previous?.scheduledDuration ?? state.eventNow.duration,
      playCount: previous?.playCount ?? 1,
    });
    formattedReport = null;
    void persistOpenRun();
    sendRefetch(RefetchKey.Report);
  }
}

/**
 * Closes the run in progress.
 * Called when playback stops and events are unloaded, which is the operator
 * saying the show is over. Pausing or loading another event does not end a run.
 */
export function closeRun() {
  if (openRun === null) {
    return;
  }

  // detach the run before the async write so a start arriving in between
  // opens a new run instead of appending to the one we are closing
  const closing = { ...openRun, endedAt: lastEndedAt() };
  openRun = null;

  void persistRun(closing, generate());
  sendRefetch(RefetchKey.Report);
}

/**
 * Opens a run on the first event start after the previous run closed.
 * The in progress report is reset here rather than on close, so the rundown
 * chips keep showing the run that just finished.
 * @private
 */
function openRunIfNeeded(state: DeepReadonly<RuntimeState>) {
  if (openRun !== null) {
    return;
  }

  report.clear();
  formattedReport = null;

  const rundown = getCurrentRundown();
  const startedAt = state.rundown.actualStart ?? state.clock;

  openRun = {
    id: generateId(),
    rundownId: rundown.id,
    rundownTitle: rundown.title,
    label: new Date().toISOString(),
    startedAt,
    endedAt: null,
  };
}

/**
 * Writes the run in progress to the sidecar.
 * Persisting on every event stop means an interrupted show still leaves a record.
 * @private
 */
async function persistOpenRun(): Promise<void> {
  if (openRun === null) {
    return;
  }
  await persistRun(openRun, generate());
}

/**
 * Writes a run and its derived summary to the sidecar
 * @private
 */
async function persistRun(run: Omit<ShowRun, 'report' | 'summary'>, currentReport: OntimeReport): Promise<void> {
  const rundown = getCurrentRundown();
  const eventsPlanned = countPlannedEvents(rundown.entries, rundown.flatOrder);

  await reportStore.upsertRun({
    ...run,
    report: structuredClone(currentReport),
    summary: getRunSummary(currentReport, eventsPlanned),
  });
}

/**
 * Timestamp of the last event to finish in this run
 * @private
 */
function lastEndedAt(): number | null {
  let latest: number | null = null;
  for (const entry of report.values()) {
    if (entry.endedAt !== null && (latest === null || entry.endedAt > latest)) {
      latest = entry.endedAt;
    }
  }
  return latest;
}

/**
 * Prepares reporting for a newly loaded project.
 * Any run left open by a crash or shutdown is closed against its own data
 * so it cannot absorb events from the next show.
 */
export async function initReports(projectFilename: string): Promise<void> {
  report.clear();
  formattedReport = null;
  openRun = null;

  await reportStore.loadReports(projectFilename);

  const dangling = reportStore.getRuns().find((run) => run.endedAt === null);
  if (dangling) {
    const endedAt = Object.values(dangling.report).reduce<number | null>((latest, entry) => {
      if (entry.endedAt === null) return latest;
      return latest === null || entry.endedAt > latest ? entry.endedAt : latest;
    }, null);
    await reportStore.upsertRun({ ...dangling, endedAt });
  }
}

/** Run history for the current project, without per event data */
export function listRuns(rundownId?: string): ShowRunSummary[] {
  return reportStore
    .getRuns()
    .filter((run) => rundownId === undefined || run.rundownId === rundownId)
    .map(({ report: _report, ...rest }) => rest);
}

export function getRun(id: string): ShowRun | undefined {
  return reportStore.getRun(id);
}

/** Most recent closed run, used to compare a rundown against its last outing */
export function getLatestRun(rundownId?: string): ShowRun | undefined {
  return reportStore
    .getRuns()
    .filter((run) => run.endedAt !== null && (rundownId === undefined || run.rundownId === rundownId))
    .sort((a, b) => b.startedAt - a.startedAt)
    .at(0);
}

export async function renameRun(id: string, label: string): Promise<ShowRun | undefined> {
  const run = reportStore.getRun(id);
  if (!run) {
    return undefined;
  }

  const renamed = { ...run, label };
  await reportStore.upsertRun(renamed);
  sendRefetch(RefetchKey.Report);
  return renamed;
}

export async function deleteRun(id: string): Promise<boolean> {
  const didDelete = await reportStore.deleteRun(id);
  if (didDelete) {
    if (openRun?.id === id) {
      openRun = null;
      report.clear();
      formattedReport = null;
    }
    sendRefetch(RefetchKey.Report);
  }
  return didDelete;
}

export async function deleteAllRuns(): Promise<void> {
  await reportStore.deleteAllRuns();
  openRun = null;
  report.clear();
  formattedReport = null;
  sendRefetch(RefetchKey.Report);
}
