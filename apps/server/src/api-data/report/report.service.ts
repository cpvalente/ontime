import { OntimeReport, OntimeEventReport, TimerLifeCycle } from 'ontime-types';
import { RuntimeState } from '../../stores/runtimeState.js';
import { sendRefetch } from '../../adapters/websocketAux.js';
import { DeepReadonly } from 'ts-essentials';

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
  if (state.eventNow === null) {
    return;
  }

  if (cycle === TimerLifeCycle.onStart) {
    report.set(state.eventNow.id, { startedAt: state.timer.startedAt, endedAt: null });
    formattedReport = null;
    return;
  }

  if (cycle === TimerLifeCycle.onStop) {
    const startedAt = report.get(state.eventNow.id)?.startedAt ?? null;
    report.set(state.eventNow.id, { startedAt, endedAt: state.clock });
    formattedReport = null;
    sendRefetch({
      target: 'REPORT',
    });
    return;
  }
}
