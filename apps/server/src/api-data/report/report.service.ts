import { OntimeReport, OntimeEventReport, TimerLifeCycle, MaybeString } from 'ontime-types';
import { RuntimeState } from '../../stores/runtimeState.js';

//TODO: there seams to be some actions that should invalidate reports
// events timer edits?
// event delete
// Also what about roll mode?

const report = new Map<string, OntimeEventReport>();

let formattedReport: OntimeReport | null = null;

/**
 * blank placeholder data
 */
const blankReportData: OntimeEventReport = {
  startedAt: null,
  endedAt: null,
} as const;

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

export function getWithId(id: string): OntimeEventReport | null {
  return report.get(id) ?? null;
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
}

let currentReportId: MaybeString = null;

/**
 * trigger report entry
 * @param cycle
 * @param state
 * @returns
 */
export function triggerReportEntry(cycle: TimerLifeCycle, state: Readonly<RuntimeState>) {
  switch (cycle) {
    case TimerLifeCycle.onStart: {
      currentReportId = state.eventNow.id;
      report.set(currentReportId, { ...blankReportData, startedAt: state.timer.startedAt });
      break;
    }
    case TimerLifeCycle.onLoad:
    case TimerLifeCycle.onStop: {
      if (currentReportId) {
        const startedAt = report.get(currentReportId).startedAt;
        report.set(currentReportId, { startedAt, endedAt: state.clock });
        currentReportId = null;
        formattedReport = null;
      }
      break;
    }
  }
}
