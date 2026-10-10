import type { EntryId } from './OntimeEntry.js';

export type TeleprompterHeading = 'title' | 'cue' | 'both' | 'none';

/** Settings which shape the script, so every screen breaks lines and ends events in the same places */
export type TeleprompterSettings = {
  /** field which holds the script: note, title or custom-{key} of a text custom field */
  script: string;
  charsPerLine: number;
  heading: TeleprompterHeading;
  showGroups: boolean;
  hideEmpty: boolean;
  /** cued mode, where loading an event moves the reader and playback stops at the end of each event */
  followLoaded: boolean;
};

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
