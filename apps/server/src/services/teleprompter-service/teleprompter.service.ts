import { MessageTag, type TeleprompterState } from 'ontime-types';

import { socket } from '../../adapters/WebsocketAdapter.js';
import type { TeleprompterCommand } from '../../api-integration/integration.teleprompter.js';
import { eventStore } from '../../stores/EventStore.js';

/**
 * Playback and speed are kept in the runtime store, so views which connect later converge on them.
 * A nudge is relative to where each view is, so it is only relayed.
 */
export function applyTeleprompterCommand(command: TeleprompterCommand): TeleprompterState {
  const state = eventStore.get('teleprompter') as TeleprompterState;

  switch (command.type) {
    case 'nudge':
      socket.sendAsJson(MessageTag.TeleprompterNudge, command.value);
      return state;
    case 'play':
      return publish({ ...state, playback: 'playing' });
    case 'pause':
      return publish({ ...state, playback: 'paused' });
    case 'speed':
      return publish({ ...state, speed: command.value });
  }
}

function publish(state: TeleprompterState): TeleprompterState {
  eventStore.set('teleprompter', state);
  return state;
}
