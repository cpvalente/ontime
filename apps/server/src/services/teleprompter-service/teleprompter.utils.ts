import {
  type CustomFields,
  type EntryId,
  isOntimeEvent,
  isOntimeGroup,
  type OntimeEvent,
  type Rundown,
  type TeleprompterHeading,
  type TeleprompterLine,
  type TeleprompterScriptEvent,
  type TeleprompterSettings,
} from 'ontime-types';
import { wrapText } from 'ontime-utils';

/**
 * Builds the script from the rundown, in rundown order, as the rows every screen shows
 * Only the note, the title or a text custom field hold a script, anything else gives an empty one
 */
export function buildScriptEvents(
  rundown: Readonly<Rundown>,
  customFields: Readonly<CustomFields>,
  settings: TeleprompterSettings,
): TeleprompterScriptEvent[] {
  const readText = getTextReader(settings.script, customFields);
  if (!readText) return [];

  const events: TeleprompterScriptEvent[] = [];
  let lastGroupId: EntryId | null = null;

  for (const id of rundown.flatOrder) {
    const entry = rundown.entries[id];
    if (!isOntimeEvent(entry) || entry.skip) continue;

    const text = readText(entry);
    const textLines = typeof text === 'string' ? wrapText(text, settings.charsPerLine) : [];
    if (settings.hideEmpty && textLines.length === 0) continue;

    const lines: TeleprompterLine[] = [];
    const parent = entry.parent ? rundown.entries[entry.parent] : undefined;
    const group = settings.showGroups && isOntimeGroup(parent) && parent.title ? parent : null;
    if (group && group.id !== lastGroupId) {
      lines.push({ kind: 'group', text: group.title });
    }
    lastGroupId = entry.parent;

    const heading = makeHeading(settings.heading, entry.cue, entry.title);
    if (heading) lines.push({ kind: 'heading', text: heading });

    for (const { text, start, indent } of textLines) {
      lines.push(indent > 0 ? { kind: 'text', text, start, indent } : { kind: 'text', text, start });
    }
    lines.push({ kind: 'blank' });

    events.push(
      group
        ? { id, cue: entry.cue, title: entry.title, group: group.title, lines }
        : { id, cue: entry.cue, title: entry.title, lines },
    );
  }

  return events;
}

function getTextReader(script: string, customFields: Readonly<CustomFields>): ((event: OntimeEvent) => unknown) | null {
  if (script === 'note') return (event: OntimeEvent) => event.note;
  if (script === 'title') return (event: OntimeEvent) => event.title;

  const key = script.startsWith('custom-') ? script.slice('custom-'.length) : null;
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
