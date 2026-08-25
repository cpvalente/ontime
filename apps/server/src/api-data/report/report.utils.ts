import type { OntimeReport, Rundown, ShowReport } from 'ontime-types';
import { isOntimeEvent } from 'ontime-types';
import { dayInMs } from 'ontime-utils';

export function getActualShowTimes(
  report: OntimeReport,
): Pick<ShowReport, 'actualStart' | 'actualEnd' | 'actualDuration'> {
  let firstStart = Number.POSITIVE_INFINITY;
  let lastEnd = Number.NEGATIVE_INFINITY;
  let actualStart: number | null = null;
  let actualEnd: number | null = null;

  for (const entry of Object.values(report)) {
    if (entry.startedAt !== null && entry.startedAtDay !== null) {
      const start = entry.startedAtDay * dayInMs + entry.startedAt;
      if (start < firstStart) {
        firstStart = start;
        actualStart = entry.startedAt;
      }
    }

    if (entry.endedAt !== null && entry.endedAtDay !== null) {
      const end = entry.endedAtDay * dayInMs + entry.endedAt;
      if (end > lastEnd) {
        lastEnd = end;
        actualEnd = entry.endedAt;
      }
    }
  }

  return {
    actualStart,
    actualEnd,
    actualDuration: actualStart === null || actualEnd === null ? null : lastEnd - firstStart,
  };
}

export function getPlannedShowDuration(rundown: Rundown): number | null {
  let firstStart = Number.POSITIVE_INFINITY;
  let lastEnd = Number.NEGATIVE_INFINITY;

  for (const id of rundown.flatOrder) {
    const entry = rundown.entries[id];
    if (!entry || !isOntimeEvent(entry) || entry.skip) continue;

    const start = entry.dayOffset * dayInMs + entry.timeStart;
    firstStart = Math.min(firstStart, start);
    lastEnd = Math.max(lastEnd, start + entry.duration);
  }

  return Number.isFinite(firstStart) ? lastEnd - firstStart : null;
}
