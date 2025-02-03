import { OntimeReport, OntimeEventReport, TimerLifeCycle } from 'ontime-types';
import { RuntimeState } from '../../stores/runtimeState.js';
import { sendRefetch } from '../../adapters/websocketAux.js';
import { DeepReadonly } from 'ts-essentials';

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
  switch (cycle) {
    case TimerLifeCycle.onStart: {
      report.set(state.eventNow.id, { ...blankReportData, startedAt: state.timer.startedAt });
      break;
    }
    case TimerLifeCycle.onStop: {
      const activeReport = report.get(state.eventNow?.id);
      // check that there is an active report for this id
      if (activeReport) {
        const { startedAt, endedAt } = activeReport;
        // and that the correct values are populated/free
        if (startedAt !== null && endedAt === null) {
          report.set(state.eventNow.id, { startedAt, endedAt: state.clock });
          formattedReport = null;
          sendRefetch({
            target: 'REPORT',
          });
        } else {
          // otherwise something is wrong and we should clear the report
          report.delete(state.eventNow?.id);
        }
      }
      break;
    }
  }
}
