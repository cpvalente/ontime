import { OntimeReport, OntimeReportData } from 'ontime-types';
import { RuntimeState } from '../../stores/runtimeState.js';

//TODO: there seams to be some actions that should invalidate reports
// events timer edits?
// event delete

const report = new Map<string, OntimeReportData>();

let formattedReport: OntimeReport | null = null;

/**
 * blank placeholder data
 */
const blankReportData: OntimeReportData = {
  startAt: null,
  endAt: null,
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

export function getWithId(id: string): OntimeReportData | null {
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

export function eventStart(state: RuntimeState) {
  formattedReport = null;
  if (state.eventNow === null) {
    // eslint-disable-next-line no-unused-labels -- dev code path
    DEV: {
      throw new Error('report.eventStart: called without eventNow present');
    }
    return;
  }

  // this clears out potentaly old data
  report.set(state.eventNow.id, { ...blankReportData, startAt: state.timer.startedAt });
}

export function eventStop(state: RuntimeState) {
  formattedReport = null;
  if (state.eventNow === null) {
    // This is normal and happens every time we call load
    return;
  }

  const prevReport = report.get(state.eventNow.id);

  if (prevReport === undefined) {
    //we can't stop it if the is no start
    return;
  }

  if (prevReport.startAt === null) {
    //we can't stop it if the is no start, so better to clear out bad data
    report.delete(state.eventNow.id);
  }

  prevReport.endAt = state.clock;
}
