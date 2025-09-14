import type { DeepPartial } from 'ts-essentials';

import type { OntimeEvent } from '../../definitions/core/OntimeEntry.js';
import type { SimpleDirection, SimplePlayback } from '../../definitions/runtime/AuxTimer.type.js';
import type { MessageState } from '../../definitions/runtime/MessageControl.type.js';
import type { OffsetMode } from '../../definitions/runtime/Offset.type.js';
import type { RuntimeStore } from '../../definitions/runtime/RuntimeStore.type.js';

export type VersionAction = {
  tag: 'version';
  payload: undefined;
};
export type VersionResponds = {
  tag: 'version';
  payload: string;
};

export type PollAction = {
  tag: 'poll';
  payload: undefined;
};
export type PollResponds = {
  tag: 'poll';
  payload: RuntimeStore;
};

export type ChangeAction = {
  tag: 'change';
  payload: { [x: string]: Partial<OntimeEvent> };
};
export type ChangeResponds = {
  tag: 'change';
  payload: 'success' | 'throttled';
};

export type MessageAction = {
  tag: 'message';
  payload: DeepPartial<MessageState>;
};
export type MessageResponds = {
  tag: 'message';
  payload: MessageState;
};

export type StartAction = {
  tag: 'start';
  payload: undefined | { index: number } | { id: string } | { cue: string } | 'next' | 'previous';
};
export type StartResponds = {
  tag: 'start';
  payload: 'success';
};

export type PauseAction = {
  tag: 'pause';
  payload: undefined;
};
export type PauseResponds = {
  tag: 'pause';
  payload: 'success';
};

export type StopAction = {
  tag: 'stop';
  payload: undefined;
};
export type StopResponds = {
  tag: 'stop';
  payload: 'success';
};

export type ReloadAction = {
  tag: 'reload';
  payload: undefined;
};
export type ReloadResponds = {
  tag: 'reload';
  payload: 'success';
};

export type RollAction = {
  tag: 'roll';
  payload: undefined;
};
export type RollResponds = {
  tag: 'roll';
  payload: 'success';
};

export type LoadAction = {
  tag: 'load';
  payload: { index: number } | { id: string } | { cue: string } | 'next' | 'previous';
};
export type LoadResponds = {
  tag: 'load';
  payload: 'success';
};

export type AddtimeAction = {
  tag: 'addtime';
  payload: { add: number } | { remove: number } | number;
};
export type AddtimeResponds = {
  tag: 'addtime';
  payload: 'success';
};

export type AuxtimerAction = {
  tag: 'auxtimer';
  payload:
    | { '1': SimplePlayback }
    | { '1': { duration?: number; addtime?: number; direction?: SimpleDirection } }
    | { '2': SimplePlayback }
    | { '2': { duration?: number; addtime?: number; direction?: SimpleDirection } }
    | { '3': SimplePlayback }
    | { '3': { duration?: number; addtime?: number; direction?: SimpleDirection } };
};

export type AuxtimerResponds = {
  tag: 'auxtimer';
  payload: 'success';
};

export type ClientAction = {
  tag: 'client';
  payload: { target: string } & ({ rename: string } | { redirect: string } | { identify: string });
};
export type ClientResponds = {
  tag: 'client';
  payload: 'success';
};

export type OffsetmodeAction = {
  tag: 'offsetmode';
  payload: OffsetMode;
};
export type OffsetmodeResponds = {
  tag: 'offsetmode';
  payload: 'success';
};

export type ApiAction =
  | VersionAction
  | PollAction
  | ChangeAction
  | MessageAction
  | StartAction
  | PauseAction
  | StopAction
  | ReloadAction
  | RollAction
  | LoadAction
  | AddtimeAction
  | AuxtimerAction
  | ClientAction
  | OffsetmodeAction;

  export type ApiResponds =
  | VersionResponds
  | PollResponds
  | ChangeResponds
  | MessageResponds
  | StartResponds
  | PauseResponds
  | StopResponds
  | ReloadResponds
  | RollResponds
  | LoadResponds
  | AddtimeResponds
  | AuxtimerResponds
  | ClientResponds
  | OffsetmodeResponds;

export type ApiActionTag = ApiAction['tag'];
