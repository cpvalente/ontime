import type { EntryId, OntimeEventReport, OntimeReport, RundownEntries, RunSummary } from 'ontime-types';
import { isOntimeEvent } from 'ontime-types';

import { MILLIS_PER_SECOND } from '../date-utils/conversionUtils.js';

export type VarianceStatus = 'ontime' | 'over' | 'under' | 'not-run';

export type EventVariance = {
  /** how long the event actually took, null if it never completed */
  actualDuration: number | null;
  /** actualDuration - scheduledDuration, signed. 0 when the event did not complete */
  delta: number;
  status: VarianceStatus;
};

const notRun: EventVariance = { actualDuration: null, delta: 0, status: 'not-run' };

/**
 * Calculates how an event performed against its schedule.
 * An event is considered on time if it is within a second of its scheduled duration.
 */
export function getEventVariance(entry: OntimeEventReport | undefined): EventVariance {
  if (!entry) {
    return notRun;
  }

  const { startedAt, endedAt, scheduledDuration } = entry;
  if (startedAt === null || endedAt === null) {
    return notRun;
  }

  const actualDuration = endedAt - startedAt;
  const delta = actualDuration - scheduledDuration;

  if (Math.abs(delta) < MILLIS_PER_SECOND) {
    return { actualDuration, delta, status: 'ontime' };
  }

  return { actualDuration, delta, status: delta > 0 ? 'over' : 'under' };
}

/**
 * Aggregates a run's per event data into the headline numbers for a show.
 * @param report the run's per event data
 * @param eventsPlanned how many playable events the rundown held when the run was made
 */
export function getRunSummary(report: OntimeReport, eventsPlanned: number): RunSummary {
  const summary: RunSummary = {
    eventsRun: 0,
    eventsPlanned,
    scheduledDuration: 0,
    actualDuration: 0,
    drift: 0,
    eventsOver: 0,
    eventsUnder: 0,
    eventsOnTime: 0,
    worstOverrun: null,
  };

  for (const [id, entry] of Object.entries(report)) {
    const variance = getEventVariance(entry);
    if (variance.status === 'not-run') {
      continue;
    }

    summary.eventsRun += 1;
    summary.scheduledDuration += entry.scheduledDuration;
    summary.actualDuration += variance.actualDuration as number;

    if (variance.status === 'over') {
      summary.eventsOver += 1;
      if (summary.worstOverrun === null || variance.delta > summary.worstOverrun.delta) {
        summary.worstOverrun = { id, delta: variance.delta };
      }
    } else if (variance.status === 'under') {
      summary.eventsUnder += 1;
    } else {
      summary.eventsOnTime += 1;
    }
  }

  summary.drift = summary.actualDuration - summary.scheduledDuration;

  return summary;
}

/**
 * Counts the events a run could have played.
 * Skipped events are excluded: they were never meant to run and would
 * make the completion figures read as if the show fell short.
 */
export function countPlannedEvents(entries: RundownEntries, order: EntryId[]): number {
  let count = 0;
  for (const id of order) {
    const entry = entries[id];
    if (entry && isOntimeEvent(entry) && !entry.skip) {
      count += 1;
    }
  }
  return count;
}
