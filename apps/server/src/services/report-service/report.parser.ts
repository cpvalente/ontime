import type { OntimeEventReport, ProjectReports, RunSummary, ShowRun } from 'ontime-types';

import { is } from '../../utils/is.js';

/**
 * Validates the contents of a report sidecar file.
 * A file which fails validation is discarded rather than repaired: reports are
 * a record, and a partially understood record is worse than an empty one.
 */
export function isProjectReports(value: unknown): value is ProjectReports {
  if (!is.object(value)) {
    return false;
  }

  if (!is.objectWithKeys(value, ['runs'])) {
    return false;
  }

  if (!is.array(value.runs)) {
    return false;
  }

  return value.runs.every(isShowRun);
}

function isShowRun(value: unknown): value is ShowRun {
  if (!is.object(value)) {
    return false;
  }

  if (
    !is.objectWithKeys(value, [
      'id',
      'rundownId',
      'rundownTitle',
      'label',
      'startedAt',
      'endedAt',
      'report',
      'summary',
    ])
  ) {
    return false;
  }

  if (!is.string(value.id) || !is.string(value.rundownId) || !is.string(value.rundownTitle)) {
    return false;
  }

  if (!is.string(value.label)) {
    return false;
  }

  if (!is.number(value.startedAt)) {
    return false;
  }

  if (!is.number(value.endedAt) && value.endedAt !== null) {
    return false;
  }

  if (!isOntimeReport(value.report)) {
    return false;
  }

  return isRunSummary(value.summary);
}

function isOntimeReport(value: unknown): value is Record<string, OntimeEventReport> {
  if (!is.object(value)) {
    return false;
  }

  return Object.values(value).every(isEventReport);
}

function isEventReport(value: unknown): value is OntimeEventReport {
  if (!is.object(value)) {
    return false;
  }

  if (!is.objectWithKeys(value, ['startedAt', 'endedAt', 'scheduledStart', 'scheduledDuration', 'playCount'])) {
    return false;
  }

  if (!is.number(value.startedAt) && value.startedAt !== null) {
    return false;
  }

  if (!is.number(value.endedAt) && value.endedAt !== null) {
    return false;
  }

  return is.number(value.scheduledStart) && is.number(value.scheduledDuration) && is.number(value.playCount);
}

function isRunSummary(value: unknown): value is RunSummary {
  if (!is.object(value)) {
    return false;
  }

  const numericKeys = [
    'eventsRun',
    'eventsPlanned',
    'scheduledDuration',
    'actualDuration',
    'drift',
    'eventsOver',
    'eventsUnder',
    'eventsOnTime',
  ] as const;

  if (!is.objectWithKeys(value, [...numericKeys, 'worstOverrun'])) {
    return false;
  }

  if (!numericKeys.every((key) => is.number(value[key]))) {
    return false;
  }

  if (value.worstOverrun === null) {
    return true;
  }

  if (!is.object(value.worstOverrun) || !is.objectWithKeys(value.worstOverrun, ['id', 'delta'])) {
    return false;
  }

  return is.string(value.worstOverrun.id) && is.number(value.worstOverrun.delta);
}
