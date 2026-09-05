import type { OntimeEventReport, OntimeReport, PlayableEvent, ReportData, Rundown, ShowReport } from 'ontime-types';
import { RefetchKey, TimerLifeCycle } from 'ontime-types';
import type { DeepReadonly } from 'ts-essentials';

import { sendRefetch } from '../../adapters/WebsocketAdapter.js';
import type { RuntimeState } from '../../stores/runtimeState.js';
import { getCurrentRundown } from '../rundown/rundown.dao.js';
import { getActualShowTimes, getPlannedShowDuration } from './report.utils.js';

const report = new Map<string, OntimeEventReport>();

let formattedReport: OntimeReport | null = null;
const emptyPlannedTimes: Pick<ShowReport, 'plannedStart' | 'plannedEnd' | 'plannedDuration'> = {
  plannedStart: null,
  plannedEnd: null,
  plannedDuration: null,
};

/**
 * The plan the show was measured against, taken when it starts.
 * Snapshotted for the same reason the per event schedule is: editing the
 * rundown afterwards must not move the target a past show was judged by.
 */
let plannedTimes = emptyPlannedTimes;
let rundownSnapshot: Rundown | null = null;

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
    if (report.size === 0) resetReportPlan();
  } else {
    // A full clear makes the next event start a new report instead of resuming this run.
    report.clear();
    resetReportPlan();
  }

  sendRefetch(RefetchKey.Report);
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
  rundown: Readonly<Rundown> = getCurrentRundown(),
) {
  if (!state.eventNow?.id) {
    return;
  }

  const eventId = state.eventNow.id;

  if (cycle === TimerLifeCycle.onStart) {
    captureReportPlan(state, rundown);

    report.set(eventId, {
      ...getScheduleSnapshot(state.eventNow),
      startedAt: state.timer.startedAt,
      startedAtDay: state.rundown.currentDay ?? state.eventNow.dayOffset,
      endedAt: null,
      endedAtDay: null,
    });
    formattedReport = null;
    sendRefetch(RefetchKey.Report);
    return;
  }

  if (cycle === TimerLifeCycle.onStop) {
    captureReportPlan(state, rundown);
    const previous = report.get(eventId);
    const schedule = previous ?? getScheduleSnapshot(state.eventNow);
    report.set(eventId, {
      startedAt: previous?.startedAt ?? null,
      startedAtDay: previous?.startedAtDay ?? null,
      endedAt: state.clock,
      endedAtDay: state.rundown.currentDay ?? state.eventNow.dayOffset,
      scheduledStart: schedule.scheduledStart,
      scheduledDay: schedule.scheduledDay,
      scheduledDuration: schedule.scheduledDuration,
    });
    formattedReport = null;
    sendRefetch(RefetchKey.Report);
  }
}

function getScheduleSnapshot(
  event: Pick<PlayableEvent, 'timeStart' | 'dayOffset' | 'duration'>,
): Pick<OntimeEventReport, 'scheduledStart' | 'scheduledDay' | 'scheduledDuration'> {
  return {
    scheduledStart: event.timeStart,
    scheduledDay: event.dayOffset,
    scheduledDuration: event.duration,
  };
}

/**
 * Captures the plan once, when the first event in the report is recorded.
 */
function captureReportPlan(state: DeepReadonly<RuntimeState>, rundown: Readonly<Rundown>) {
  if (rundownSnapshot !== null) return;

  rundownSnapshot = structuredClone(rundown);
  plannedTimes = {
    plannedStart: state.rundown.plannedStart,
    plannedEnd: state.rundown.plannedEnd,
    plannedDuration: getPlannedShowDuration(rundownSnapshot),
  };
}

function resetReportPlan() {
  plannedTimes = emptyPlannedTimes;
  rundownSnapshot = null;
}

/**
 * Show level times for the report.
 * Planned times are the ones captured when the show started, actual times are
 * derived from the events that ran.
 */
function generateShowReport(): ShowReport {
  return { ...plannedTimes, ...getActualShowTimes(generate()) };
}

export function generateReport(): ReportData {
  return {
    eventReports: generate(),
    rundown: rundownSnapshot,
    show: generateShowReport(),
  };
}
