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
export type VersionResponse = {
  tag: 'version';
  payload: string;
};

export type PollAction = {
  tag: 'poll';
  payload: undefined;
};
export type PollResponse = {
  tag: 'poll';
  payload: RuntimeStore;
};

export type ChangeAction = {
  tag: 'change';
  payload: { [x: string]: Partial<OntimeEvent> };
};
export type ChangeResponse = {
  tag: 'change';
  payload: 'success' | 'throttled';
};

export type MessageAction = {
  tag: 'message';
  payload: DeepPartial<MessageState>;
};
export type MessageResponse = {
  tag: 'message';
  payload: MessageState;
};

export type StartAction = {
  tag: 'start';
  payload: undefined | { index: number } | { id: string } | { cue: string } | 'next' | 'previous';
};
export type StartResponse = {
  tag: 'start';
  payload: 'success';
};

export type PauseAction = {
  tag: 'pause';
  payload: undefined;
};
export type PauseResponse = {
  tag: 'pause';
  payload: 'success';
};

export type StopAction = {
  tag: 'stop';
  payload: undefined;
};
export type StopResponse = {
  tag: 'stop';
  payload: 'success';
};

export type ReloadAction = {
  tag: 'reload';
  payload: undefined;
};
export type ReloadResponse = {
  tag: 'reload';
  payload: 'success';
};

export type RollAction = {
  tag: 'roll';
  payload: undefined;
};
export type RollResponse = {
  tag: 'roll';
  payload: 'success';
};

export type LoadAction = {
  tag: 'load';
  payload: { index: number } | { id: string } | { cue: string } | 'next' | 'previous';
};
export type LoadResponse = {
  tag: 'load';
  payload: 'success';
};

export type AddtimeAction = {
  tag: 'addtime';
  payload: { add: number } | { remove: number } | number;
};
export type AddtimeResponse = {
  tag: 'addtime';
  payload: 'success';
};

export type AuxtimerAction = {
  tag: 'auxtimer';
  payload:
    | {
        ['1']?: SimplePlayback | { duration?: number; addtime?: number; direction?: SimpleDirection };
      }
    | {
        ['2']?: SimplePlayback | { duration?: number; addtime?: number; direction?: SimpleDirection };
      }
    | {
        ['3']?: SimplePlayback | { duration?: number; addtime?: number; direction?: SimpleDirection };
      };
};

export type AuxtimerResponse = {
  tag: 'auxtimer';
  payload: 'success';
};

export type ClientAction = {
  tag: 'client';
  payload: { target: string } & ({ rename: string } | { redirect: string } | { identify: string });
};
export type ClientResponse = {
  tag: 'client';
  payload: 'success';
};

export type OffsetmodeAction = {
  tag: 'offsetmode';
  payload: OffsetMode;
};
export type OffsetmodeResponse = {
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

export type ApiResponse =
  | VersionResponse
  | PollResponse
  | ChangeResponse
  | MessageResponse
  | StartResponse
  | PauseResponse
  | StopResponse
  | ReloadResponse
  | RollResponse
  | LoadResponse
  | AddtimeResponse
  | AuxtimerResponse
  | ClientResponse
  | OffsetmodeResponse;

export type ApiActionTag = ApiAction['tag'];
