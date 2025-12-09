import type { ApiAction, ApiActionTag, MessageTag, WsPacketToClient, WsPacketToServer } from 'ontime-types';

/**
 * Helper type for sending websocket messages to ontime server
 * @template T - The message tag type (MessageTag or ApiActionTag)
 */
export type SocketSender = <T extends MessageTag | ApiActionTag>(
  tag: T,
  payload: T extends MessageTag
    ? WsPacketToServer extends { tag: T; payload: infer P } ? P : never
    : ApiAction extends { tag: T; payload: infer P } ? P : never,
) => void;

/**
 * Type guard to check if data is a valid WebSocket packet from server
 * @param data - Unknown data to check
 * @returns Type predicate indicating if data is WsPacketToClient
 */
export function isWsPacketToClient(data: unknown): data is WsPacketToClient {
  return typeof data === 'object' && data !== null && 'tag' in data && 'payload' in data;
}
