import { socket } from './WebsocketAdapter.js';

/**
 * Utility function to notify clients that the REST data is stale
 * @param payload -- possible patch payload
 */
export function sendRefetch(payload: unknown = null) {
  socket.sendAsJson({
    type: 'ontime-refetch',
    payload,
  });
}
