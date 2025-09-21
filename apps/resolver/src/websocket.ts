import { ApiAction, ApiActionTag, MessageTag, WsPacketToClient, WsPacketToServer } from 'ontime-types';

/**
 * A helper type for sending correct websocket messages to ontime
 */
export type SocketSender = <T extends MessageTag | ApiActionTag>(
  tag: T,
  payload: T extends MessageTag
    ? Pick<WsPacketToServer & { tag: T }, 'payload'>['payload']
    : Pick<ApiAction & { tag: T }, 'payload'>['payload'],
) => void;

/**
 * a soft type guard for WS packets
 */
export function isWsPacketToClient(data: unknown): data is WsPacketToClient {
  return typeof data === 'object' && data !== null && 'tag' in data && 'payload' in data;
}
