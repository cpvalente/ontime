import { Playback } from './Playback.type.js';
import { Message } from './MessageControl.type.js';
import { TimerState } from './TimerState.type.js';
import { TitleBlock } from './TitleBlock.type.js';
import { Loaded } from './Playlist.type.js';

export type RuntimeStore = {
  // timer service
  timer: TimerState;
  playback: Playback;

  // messages service
  timerMessage: Message;
  publicMessage: Message;
  lowerMessage: Message;
  onAir: boolean;

  // event loader
  loaded: Loaded;
  titles: TitleBlock;
  titlesPublic: TitleBlock;
};
