import { WsType } from 'ontime-types';
import { socket } from './WebsocketAdapter.js';

export enum RefetchTargets {
  Rundown = 'rundown',
  Report = 'report',
}

/**
 * Utility function to notify clients that the REST data is stale
 * @param payload -- possible patch payload
 */
export function sendRefetch(payload: unknown = null) {
  socket.sendAsJson({
    type: WsType.ONTIME_REFETCH,
    payload,
  });
}
