import type { MaybeString } from 'ontime-types';

export type HeadingSource = 'none' | 'title' | 'cue' | 'both';

export type ScriptBlock = {
  id: string;
  heading: string;
  text: string;
  groupTitle: MaybeString;
  isLoaded: boolean;
};

/**
 * Where playback stopped of its own accord: at the end of the segment being
 * read, or at the end of the whole script. Null while it has somewhere to go.
 */
export type ParkedAt = 'segment' | 'script' | null;

export type TeleprompterOptions = {
  scriptSource: string;
  heading: HeadingSource;
  onlyPlaying: boolean;
  hideEmpty: boolean;
  showGroups: boolean;
  /** lines per minute */
  speed: number;
  followLoaded: boolean;
  fontSize: number;
  lineHeight: number;
  textWidth: number;
  readingLine: boolean;
  readingLinePos: number;
  flipH: boolean;
  flipV: boolean;
};

export type TeleprompterAction =
  | { type: 'togglePlay' }
  | { type: 'nudge'; lines: number }
  | { type: 'page'; direction: 1 | -1 }
  | { type: 'jumpEvent'; direction: 1 | -1 }
  | { type: 'speed'; delta: number }
  | { type: 'rewind' }
  | { type: 'rewindAndPause' }
  | { type: 'jumpToEnd' }
  | { type: 'flip'; axis: 'h' | 'v' }
  | { type: 'fontSize'; steps: number }
  | { type: 'resetFontSize' }
  | { type: 'reengageFollow' }
  | { type: 'toggleHelp' };

export type TeleprompterController = {
  togglePlay: () => void;
  nudge: (lines: number) => void;
  page: (direction: 1 | -1) => void;
  jumpEvent: (direction: 1 | -1) => void;
  changeSpeed: (delta: number) => void;
  rewind: (alsoPause?: boolean) => void;
  jumpToEnd: () => void;
  reengageFollow: () => void;
};
