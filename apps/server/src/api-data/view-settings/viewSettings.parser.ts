import { DatabaseModel, TeleprompterHeading, TeleprompterSettings, ViewSettings } from 'ontime-types';
import { teleprompterCharsPerLine } from 'ontime-utils';

import { getPartialProject } from '../../models/dataModel.js';
import { ErrorEmitter } from '../../utils/parserUtils.js';

/**
 * Parse viewSettings portion of a project file
 */
export function parseViewSettings(data: Partial<DatabaseModel>, emitError?: ErrorEmitter): ViewSettings {
  const defaultViewSettings: ViewSettings = getPartialProject('viewSettings');

  if (!data.viewSettings) {
    emitError?.('No data found to import');
    return defaultViewSettings;
  }

  console.log('Found view settings, importing...');

  return {
    dangerColor: data.viewSettings.dangerColor ?? defaultViewSettings.dangerColor,
    normalColor: data.viewSettings.normalColor ?? defaultViewSettings.normalColor,
    overrideStyles: data.viewSettings.overrideStyles ?? defaultViewSettings.overrideStyles,
    warningColor: data.viewSettings.warningColor ?? defaultViewSettings.warningColor,
    teleprompter: parseTeleprompterSettings(data.viewSettings.teleprompter, defaultViewSettings.teleprompter),
  };
}

const headings: TeleprompterHeading[] = ['title', 'cue', 'both', 'none'];

/**
 * Parses teleprompter settings from a project file, a request body or the query of a request
 * Values which are missing or invalid are taken from the fallback
 */
export function parseTeleprompterSettings(data: unknown, fallback: TeleprompterSettings): TeleprompterSettings {
  if (!data || typeof data !== 'object') {
    return { ...fallback };
  }

  const input = data as Record<string, unknown>;
  return {
    script: typeof input.script === 'string' ? input.script : fallback.script,
    charsPerLine: parseCharsPerLine(input.charsPerLine, fallback.charsPerLine),
    heading: headings.find((heading) => heading === input.heading) ?? fallback.heading,
    showGroups: parseBoolean(input.showGroups, fallback.showGroups),
    hideEmpty: parseBoolean(input.hideEmpty, fallback.hideEmpty),
    followLoaded: parseBoolean(input.followLoaded, fallback.followLoaded),
  };
}

function parseCharsPerLine(value: unknown, fallback: number): number {
  // values in a query arrive as strings
  const parsed = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof parsed !== 'number' || !Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.round(parsed), teleprompterCharsPerLine.min), teleprompterCharsPerLine.max);
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return fallback;
}
