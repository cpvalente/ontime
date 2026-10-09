import type { EntryId, TeleprompterAnchor, TeleprompterScriptEvent } from 'ontime-types';

/** Where an event's lines sit in the script, by row */
export type TeleprompterLayoutEvent = {
  id: EntryId;
  cue: string;
  /** the event's first row, its group title or heading when it has one */
  firstRow: number;
  /** where reading the event starts: its first line of text, or where its text would be */
  startRow: number;
  /** reached once every line of the event has been read */
  endRow: number;
  /** row after the last one of the event */
  nextRow: number;
  /** the event's lines of text, by row, with their position in the event's text */
  text: { row: number; start: number }[];
};

export type TeleprompterLayout = {
  rowCount: number;
  events: TeleprompterLayoutEvent[];
};

export function makeTeleprompterLayout(events: TeleprompterScriptEvent[]): TeleprompterLayout {
  const layoutEvents: TeleprompterLayoutEvent[] = [];
  let row = 0;

  for (const event of events) {
    const firstRow = row;
    const text: TeleprompterLayoutEvent['text'] = [];
    let headingRows = 0;

    event.lines.forEach((line, index) => {
      if (line.kind === 'text') {
        text.push({ row: firstRow + index, start: line.start });
      } else if ((line.kind === 'group' || line.kind === 'heading') && text.length === 0) {
        headingRows++;
      }
    });

    const startRow = text.length > 0 ? text[0].row : firstRow + headingRows;
    const endRow = text.length > 0 ? text[text.length - 1].row + 1 : startRow;
    row += event.lines.length;
    layoutEvents.push({ id: event.id, cue: event.cue, firstRow, startRow, endRow, nextRow: row, text });
  }

  return { rowCount: row, events: layoutEvents };
}

/** The anchor at the start of an event, which puts its first line of text on the reading line */
export function startOfEvent(eventId: EntryId): TeleprompterAnchor {
  return { eventId, charOffset: 0, lines: 0 };
}

/**
 * The row an anchor points at, as a fraction while between rows
 * @returns null if its event is not in the script
 */
export function rowOfAnchor(layout: TeleprompterLayout, anchor: TeleprompterAnchor): number | null {
  const event = layout.events.find((candidate) => candidate.id === anchor.eventId);
  if (!event) return null;
  if (event.text.length === 0) return event.startRow + anchor.lines;

  let line = event.text[0];
  for (const candidate of event.text) {
    if (candidate.start > anchor.charOffset) break;
    line = candidate;
  }
  return line.row + anchor.lines;
}

/** The event which a row belongs to, counting its headings and the gap after it */
export function eventAtRow(layout: TeleprompterLayout, row: number): TeleprompterLayoutEvent | null {
  let owner: TeleprompterLayoutEvent | null = layout.events[0] ?? null;
  for (const event of layout.events) {
    if (event.firstRow > row) break;
    owner = event;
  }
  return owner;
}

/**
 * The anchor for a row, so the position survives edits
 * @returns null for an empty script
 */
export function anchorAtRow(layout: TeleprompterLayout, row: number): TeleprompterAnchor | null {
  const event = eventAtRow(layout, row);
  if (!event) return null;
  if (event.text.length === 0) return { eventId: event.id, charOffset: 0, lines: row - event.startRow };

  const first = event.text[0];
  const last = event.text[event.text.length - 1];
  const line = event.text.find((candidate) => candidate.row === Math.floor(row));
  // above its text, or in the gap after it
  const nearest = line ?? (row < first.row ? first : last);
  return { eventId: event.id, charOffset: nearest.start, lines: row - nearest.row };
}

/**
 * Maps a position in a text through an edit, found by comparing the old and new text from both ends
 * - a change after the position leaves it in place
 * - a change before the position shifts it by the difference in length
 * - a change around the position moves it to the start of the change
 */
export function mapOffsetThroughEdit(previous: string, next: string, offset: number): number {
  const shortest = Math.min(previous.length, next.length);
  let prefix = 0;
  while (prefix < shortest && previous[prefix] === next[prefix]) prefix++;
  let suffix = 0;
  while (suffix < shortest - prefix && previous.at(-1 - suffix) === next.at(-1 - suffix)) suffix++;

  if (offset <= prefix) return offset;
  if (offset >= previous.length - suffix) return offset + next.length - previous.length;
  return prefix;
}

/**
 * Moves an anchor from one version of the script to the next
 * - an event which moved takes the reader with it
 * - an edit to the reader's event is mapped through its text
 * - a deleted event leaves the reader where its text used to begin
 * - with nothing of the previous script left, such as after loading another project, the reader goes to the top
 * @returns null for an empty script
 */
export function reanchor(
  previous: TeleprompterScriptEvent[],
  next: TeleprompterScriptEvent[],
  anchor: TeleprompterAnchor | null,
): TeleprompterAnchor | null {
  if (next.length === 0) return null;
  const top = startOfEvent(next[0].id);
  if (!anchor) return top;

  const nextEvent = next.find((event) => event.id === anchor.eventId);
  const previousIndex = previous.findIndex((event) => event.id === anchor.eventId);

  if (nextEvent) {
    if (previousIndex === -1) return anchor;
    const charOffset = mapOffsetThroughEdit(
      textOfLines(previous[previousIndex]),
      textOfLines(nextEvent),
      anchor.charOffset,
    );
    return { ...anchor, charOffset };
  }

  if (previousIndex === -1) return top;

  const nextIds = new Set(next.map((event) => event.id));
  const following = previous.slice(previousIndex + 1).find((event) => nextIds.has(event.id));
  if (following) return startOfEvent(following.id);

  const preceding = previous.slice(0, previousIndex).findLast((event) => nextIds.has(event.id));
  if (!preceding) return top;
  const layout = makeTeleprompterLayout(next);
  const precedingLayout = layout.events.find((event) => event.id === preceding.id) as TeleprompterLayoutEvent;
  return anchorAtRow(layout, precedingLayout.endRow);
}

/**
 * The event's text as its lines show it, with every character at its position in the text.
 * What the lines leave out (the spaces used up at a break, line breaks, indentation) is filled with spaces,
 * so a space which ends a line in one version matches the same space inside a line in another,
 * which is enough to compare two versions of a text from both ends.
 */
function textOfLines(event: TeleprompterScriptEvent): string {
  let text = '';
  for (const line of event.lines) {
    if (line.kind !== 'text') continue;
    text += ' '.repeat(Math.max(0, line.start - text.length)) + line.text;
  }
  return text;
}
