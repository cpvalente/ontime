import { DatabaseModel, RundownDefaults, Settings } from 'ontime-types';
import {
  dayInMs,
  parsePhaseThresholds,
  sanitiseAuxTimerNames,
  validateEndAction,
  validateTimeStrategy,
  validateTimerType,
} from 'ontime-utils';

import { getPartialProject } from '../../models/dataModel.js';

/**
 * Parse settings portion of a project file
 */
export function parseSettings(data: Partial<DatabaseModel>): Settings {
  const defaultSettings: Settings = getPartialProject('settings');

  // skip if file definition is missing
  // TODO: skip parsing if the version is not correct
  if (!data.settings || data.settings?.version == null) {
    throw new Error('ERROR: unable to parse settings, missing or incorrect version');
  }

  return {
    version: defaultSettings.version,
    editorKey: data.settings.editorKey ?? defaultSettings.editorKey,
    operatorKey: data.settings.operatorKey ?? defaultSettings.operatorKey,
    timeFormat: data.settings.timeFormat ?? defaultSettings.timeFormat,
    language: data.settings.language ?? defaultSettings.language,
    auxTimerNames: sanitiseAuxTimerNames(data.settings.auxTimerNames),
    phaseThresholds: parsePhaseThresholds(data.settings.phaseThresholds) ?? defaultSettings.phaseThresholds,
    rundownDefaults: parseRundownDefaults(data.settings.rundownDefaults, defaultSettings.rundownDefaults),
  };
}

/**
 * Files from before v5 have none, each field falls back to its default
 */
function parseRundownDefaults(maybeDefaults: unknown, defaults: RundownDefaults): RundownDefaults {
  if (typeof maybeDefaults !== 'object' || maybeDefaults === null) {
    return { ...defaults };
  }

  const { duration, linkPrevious, timeStrategy, timerType, endAction, inheritGroupColour } = maybeDefaults as Partial<
    Record<keyof RundownDefaults, unknown>
  >;

  return {
    duration: isDuration(duration) ? duration : defaults.duration,
    linkPrevious: typeof linkPrevious === 'boolean' ? linkPrevious : defaults.linkPrevious,
    timeStrategy: validateTimeStrategy(timeStrategy, defaults.timeStrategy),
    timerType: validateTimerType(timerType, defaults.timerType),
    endAction: validateEndAction(endAction, defaults.endAction),
    inheritGroupColour: typeof inheritGroupColour === 'boolean' ? inheritGroupColour : defaults.inheritGroupColour,
  };
}

function isDuration(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= dayInMs;
}
