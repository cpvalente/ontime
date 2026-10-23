import {
  type CustomFields,
  isOntimeEvent,
  type OntimeEvent,
  type Rundown,
  type TeleprompterHeading,
  type TeleprompterLine,
  type TeleprompterScriptEvent,
  type TeleprompterSettings,
} from 'ontime-types';
import { customFieldOfScriptSource, teleprompterCharsPerLine } from 'ontime-utils';

import { wrapText } from './teleprompter.wrap.js';

/**
 * Builds the script from the rundown, in rundown order, as the rows every screen shows
 * Only the note, the title or a text custom field hold a script, anything else gives an empty one
 * Events without text have nothing to read and are left out
 */
export function buildScriptEvents(
  rundown: Readonly<Rundown>,
  customFields: Readonly<CustomFields>,
  settings: TeleprompterSettings,
): TeleprompterScriptEvent[] {
  const readText = getTextReader(settings.script, customFields);
  if (!readText) return [];

  const events: TeleprompterScriptEvent[] = [];
  for (const id of rundown.flatOrder) {
    const entry = rundown.entries[id];
    if (!isOntimeEvent(entry) || entry.skip) continue;

    const text = readText(entry);
    const textLines = typeof text === 'string' ? wrapText(text, settings.charsPerLine) : [];
    if (textLines.length === 0) continue;

    const lines: TeleprompterLine[] = [];
    const heading = makeHeading(settings.heading, entry.cue, entry.title);
    if (heading) lines.push({ kind: 'heading', text: heading });

    for (const { text, start, indent } of textLines) {
      lines.push(indent > 0 ? { kind: 'text', text, start, indent } : { kind: 'text', text, start });
    }
    lines.push({ kind: 'blank' });

    events.push({ id, cue: entry.cue, title: entry.title, lines });
  }

  return events;
}

/** Whether a script source names something the script can be built from: the note, the title or a text custom field */
export function isReadableScriptSource(script: string, customFields: Readonly<CustomFields>): boolean {
  return getTextReader(script, customFields) !== null;
}

function getTextReader(script: string, customFields: Readonly<CustomFields>): ((event: OntimeEvent) => unknown) | null {
  if (script === 'note') return (event: OntimeEvent) => event.note;
  if (script === 'title') return (event: OntimeEvent) => event.title;

  const key = customFieldOfScriptSource(script);
  if (key && Object.hasOwn(customFields, key) && customFields[key].type === 'text') {
    return (event: OntimeEvent) => (event.custom && Object.hasOwn(event.custom, key) ? event.custom[key] : '');
  }
  return null;
}

function makeHeading(heading: TeleprompterHeading, cue: string, title: string): string {
  switch (heading) {
    case 'title':
      return title;
    case 'cue':
      return cue;
    case 'both':
      return [cue, title].filter(Boolean).join(' · ');
    case 'none':
      return '';
  }
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
