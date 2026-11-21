import type { MaybeNumber, OntimeEvent, PhaseThreshold, PhaseThresholds } from 'ontime-types';

import { maxDuration } from '../date-utils/conversionUtils.js';
import { parseUserTime } from '../date-utils/parseUserTime.js';
import { millisToString } from '../date-utils/timeFormatting.js';

/** a share of the event duration keeps the phases in proportion on short and long events */
export const defaultPhaseThresholds: Readonly<PhaseThresholds> = {
  warning: { unit: 'percent', value: 20 },
  danger: { unit: 'percent', value: 10 },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

export function parsePhaseThreshold(value: unknown): PhaseThreshold | null {
  if (!isRecord(value) || !isNonNegativeNumber(value.value)) return null;
  if (value.unit === 'time') return { unit: 'time', value: Math.min(Math.round(value.value), maxDuration) };
  if (value.unit === 'percent') return { unit: 'percent', value: Math.min(value.value, 100) };
  return null;
}

const percentInput = /^(\d+(?:[.,]\d+)?)\s*%$/;

/**
 * Parses what a user types in a threshold input
 * - a number followed by % is a percentage of the event duration, eg: 20%
 * - anything else is a time, as in every other time input, eg: 2m or 00:02:00
 * - null when the text is not a threshold
 */
export function parsePhaseThresholdInput(text: string): PhaseThreshold | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  const percent = percentInput.exec(trimmed);
  if (percent) return parsePhaseThreshold({ unit: 'percent', value: Number(percent[1].replace(',', '.')) });
  const time = parsePhaseTimeInput(trimmed);
  return time === null ? null : { unit: 'time', value: time };
}

/** digits with time separators and units, eg: 2m, 1h30 or 00:02:00 */
const timeInput = /^\d[\d\s:.,hms]*$/i;

/**
 * Parses a threshold time a user types, null when the text is not a time
 * the time parser reads anything as a time, so we reject text which can not be one
 */
export function parsePhaseTimeInput(text: string): number | null {
  const trimmed = text.trim();
  if (!timeInput.test(trimmed)) return null;
  return parsePhaseThreshold({ unit: 'time', value: parseUserTime(trimmed) })?.value ?? null;
}

export function formatPhaseThreshold(threshold: PhaseThreshold): string {
  if (threshold.unit === 'percent') return `${threshold.value}%`;
  return millisToString(threshold.value);
}

export function parsePhaseThresholds(value: unknown): PhaseThresholds | null {
  if (!isRecord(value)) return null;
  const warning = parsePhaseThreshold(value.warning);
  const danger = parsePhaseThreshold(value.danger);
  if (!warning || !danger) return null;
  return { warning, danger };
}

/**
 * Parses an untrusted event threshold
 * - null or an empty string inherits from the project
 * - a non-negative number overrides, in milliseconds, 0 disables the phase
 * - anything else keeps the fallback
 */
export function parsePhaseOverride(value: unknown, fallback: MaybeNumber): MaybeNumber {
  if (value === null || value === '') return null;
  if (isNonNegativeNumber(value)) return Math.min(Math.round(value), maxDuration);
  return fallback;
}

export function phaseThresholdToTime(threshold: PhaseThreshold, duration: number): number {
  if (threshold.unit === 'time') return threshold.value;
  return Math.round((duration * threshold.value) / 100);
}

export type ResolvedPhaseThresholds = { timeWarning: number; timeDanger: number };

/**
 * Resolves the remaining time at which an event enters warning and danger
 * Percentages are taken of the planned event duration, so added time does not move them
 */
export function resolvePhaseThresholds(
  event: Pick<OntimeEvent, 'timeWarning' | 'timeDanger' | 'duration'>,
  projectThresholds: PhaseThresholds,
): ResolvedPhaseThresholds {
  return {
    timeWarning: event.timeWarning ?? phaseThresholdToTime(projectThresholds.warning, event.duration),
    timeDanger: event.timeDanger ?? phaseThresholdToTime(projectThresholds.danger, event.duration),
  };
}
