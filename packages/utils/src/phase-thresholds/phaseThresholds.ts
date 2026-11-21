import type { MaybeNumber, OntimeEvent, PhaseThreshold, PhaseThresholds } from 'ontime-types';

import { maxDuration } from '../date-utils/conversionUtils.js';

export const defaultPhaseThresholds: Readonly<PhaseThresholds> = {
  warning: { unit: 'time', value: 120000 },
  danger: { unit: 'time', value: 60000 },
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

export function parsePhaseThresholds(value: unknown): PhaseThresholds | null {
  if (!isRecord(value)) return null;
  const warning = parsePhaseThreshold(value.warning);
  const danger = parsePhaseThreshold(value.danger);
  if (!warning || !danger) return null;
  return { warning, danger };
}

/**
 * Parses an untrusted event threshold
 * - null or an empty string inherits from the group or project
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
  groupThresholds: PhaseThresholds | null,
  projectThresholds: PhaseThresholds,
): ResolvedPhaseThresholds {
  const inherited = groupThresholds ?? projectThresholds;
  return {
    timeWarning: event.timeWarning ?? phaseThresholdToTime(inherited.warning, event.duration),
    timeDanger: event.timeDanger ?? phaseThresholdToTime(inherited.danger, event.duration),
  };
}
