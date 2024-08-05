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

export function clear() {
  report.clear();
}

export function eventStart(state: RuntimeState) {
  report.set(state.eventNow.id, { ...blankReportData, startAt: state.timer.startedAt });
}

export function eventStop(state: RuntimeState) {
  if (state.eventNow?.id === undefined) {
    return;
  }
  const prevReport = report.get(state.eventNow.id);
  if (prevReport) {
    prevReport.endAt = state.clock;
    const expectedDuration = state.eventNow.duration;
    const actualDuration = prevReport.endAt - prevReport.startAt;
    prevReport.overUnder = actualDuration - expectedDuration;
  }
}
