import { OntimeReport, OntimeEventReport, TimerLifeCycle, RefetchKey, Maybe } from 'ontime-types';
import { sendRefetch } from '../../adapters/WebsocketAdapter.js';
import { reportDTO } from './report.dto.js';

const report = new Map<string, OntimeEventReport>();

let formattedReport: OntimeReport | null = null;

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
}

/**
 * trigger report entry
 * @param cycle
 * @param state - it can pull in the state itself or it can be provided if the state is from a previous time
 * @returns
 */
export function triggerReportEntry(
  cycle: TimerLifeCycle.onStart | TimerLifeCycle.onStop,
  state: { eventId: Maybe<string>; startedAt: Maybe<number>; clock: number } = reportDTO.stateToReport(),
) {
  const { eventId, startedAt, clock } = state;
  if (!eventId) {
    return;
  }

  if (cycle === TimerLifeCycle.onStart) {
    report.set(eventId, { startedAt: startedAt, endedAt: null });
    formattedReport = null;
    return;
  }

  if (cycle === TimerLifeCycle.onStop) {
    const startedAt = report.get(eventId)?.startedAt ?? null;
    report.set(eventId, { startedAt, endedAt: clock });
    formattedReport = null;
    sendRefetch(RefetchKey.Report);
  }
}
