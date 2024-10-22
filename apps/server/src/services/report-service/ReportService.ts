import { OntimeReport, ReportData } from 'ontime-types';
import { RuntimeState } from '../../stores/runtimeState.js';

const report = new Map<string, ReportData>();
const blankReportData: ReportData = {
  startAt: null,
  endAt: null,
  overUnder: null,
} as const;

export function generate(): OntimeReport {
  return Object.fromEntries(report);
}

export function clear(id?: string) {
  if (id) {
    report.delete(id);
  } else {
    report.clear();
  }
}

export function eventStart(state: RuntimeState) {
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
  const expectedDuration = state.eventNow.duration;
  const actualDuration = prevReport.endAt - prevReport.startAt;
  prevReport.overUnder = actualDuration - expectedDuration;
}
