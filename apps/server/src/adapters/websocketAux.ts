import { RefetchKey, MessageType } from 'ontime-types';
import { socket } from './WebsocketAdapter.js';

/**
 * Utility function to notify clients that the REST data is stale
 */
export function sendRefetch(target: RefetchKey, extra: unknown = null) {
  socket.sendAsJson({
    type: MessageType.Refetch,
    payload: { target, extra },
  });
}
