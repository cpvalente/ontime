import { OntimeEventReport, OntimeReport, RefetchKey, TimerLifeCycle } from 'ontime-types';
import { RuntimeState } from '../../stores/runtimeState.js';
import { DeepReadonly } from 'ts-essentials';
import { sendRefetch } from '../../adapters/WebsocketAdapter.js';

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
    report.set(eventId, { startedAt: state.timer.startedAt, endedAt: null });
    formattedReport = null;
    return;
  }

  if (cycle === TimerLifeCycle.onStop) {
    const startedAt = report.get(eventId)?.startedAt ?? null;
    report.set(eventId, { startedAt, endedAt: state.clock });
    formattedReport = null;
    sendRefetch(RefetchKey.Report);
  }
}
