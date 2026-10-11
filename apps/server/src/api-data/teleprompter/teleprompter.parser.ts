import type { DatabaseModel, TeleprompterHeading, TeleprompterSettings } from 'ontime-types';
import { teleprompterCharsPerLine } from 'ontime-utils';

import { getPartialProject } from '../../models/dataModel.js';

export function parseTeleprompter(data: Partial<DatabaseModel>): TeleprompterSettings {
  return parseTeleprompterSettings(data.teleprompter, getPartialProject('teleprompter'));
}

const headings: TeleprompterHeading[] = ['title', 'cue', 'both', 'none'];

/**
 * Parses teleprompter settings from a project file or a request body
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
  };
}

function parseCharsPerLine(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.round(value), teleprompterCharsPerLine.min), teleprompterCharsPerLine.max);
}
