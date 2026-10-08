import type { EntryId } from './OntimeEntry.js';

/** A row of the teleprompter script, so every screen counts the same lines */
export type TeleprompterLine =
  | { kind: 'group'; text: string }
  | { kind: 'heading'; text: string }
  | {
      kind: 'text';
      /** the characters on the line, exactly as typed, without its indentation */
      text: string;
      /** position of the first character in the event's text */
      start: number;
      /** spaces shown before the text, when the line the user typed was indented */
      indent?: number;
    }
  | { kind: 'blank' };

export type TeleprompterScriptEvent = {
  id: EntryId;
  cue: string;
  title: string;
  lines: TeleprompterLine[];
};

export type TeleprompterScript = {
  revision: number;
  charsPerLine: number;
  events: TeleprompterScriptEvent[];
};

/**
 * A place in the script, kept as a place in an event's text so it survives edits.
 * Line numbers are only ever calculated from it.
 */
export type TeleprompterAnchor = {
  eventId: EntryId;
  /** position in the event's text, which edits move */
  charOffset: number;
  /**
   * distance in lines from the line holding charOffset:
   * a fraction between lines, negative in the headings above the text, past the last line in the gap after it
   */
  lines: number;
};
