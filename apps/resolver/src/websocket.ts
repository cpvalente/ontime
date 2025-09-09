import { ApiAction, MessageTag, WsPacketToClient, WsPacketToServer } from 'ontime-types';
import Websocket from 'ws';
/**
 * Send a web socket message to the ontime server
 * @param tag
 * @param payload
 * @param ws pass in the websocket to be used to send the message
 */
export function sendWebSocket<T extends MessageTag | ApiAction>(
  tag: T,
  payload: T extends MessageTag ? Pick<WsPacketToServer & { tag: T }, 'payload'>['payload'] : unknown,
  ws: Websocket,
): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ tag, payload }));
  }
}

/**
 * a soft type guard for WS packets
 */
export function isWsPacketToClient(data: unknown): data is WsPacketToClient {
  return typeof data === 'object' && data !== null && 'tag' in data && 'payload' in data;
}
