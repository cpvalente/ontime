import type { MaybeNumber, OntimeEventReport } from 'ontime-types';
import { dayInMs, MILLIS_PER_SECOND } from 'ontime-utils';

type EventVariance = {
  actualDuration: MaybeNumber;
  delta: number;
  status: 'ontime' | 'over' | 'under' | 'not-run';
};

const notRun: EventVariance = { actualDuration: null, delta: 0, status: 'not-run' };

export function getReportTimePosition(time: number, day: number): number;
export function getReportTimePosition(time: MaybeNumber, day: number | null): MaybeNumber;
export function getReportTimePosition(time: MaybeNumber, day: number | null): MaybeNumber {
  return time === null || day === null ? null : day * dayInMs + time;
}

export function getEventVariance(entry: OntimeEventReport | undefined): EventVariance {
  if (!entry) return notRun;

  const start = getReportTimePosition(entry.startedAt, entry.startedAtDay);
  const end = getReportTimePosition(entry.endedAt, entry.endedAtDay);
  if (start === null || end === null) return notRun;

  const actualDuration = end - start;
  const delta = actualDuration - entry.scheduledDuration;
  if (Math.abs(delta) < MILLIS_PER_SECOND) return { actualDuration, delta, status: 'ontime' };
  return { actualDuration, delta, status: delta > 0 ? 'over' : 'under' };
}
