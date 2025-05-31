import type { Client } from '../definitions/Clients.type.js';
import type { Log } from '../definitions/runtime/Logger.type.js';
import type { RuntimeStore } from '../definitions/runtime/RuntimeStore.type.js';

export enum WsType {
  PING = 'ping',
  PONG = 'pong',
  CLIENT_INIT = 'client-init',
  CLIENT_SET = 'client-set',
  CLIENT_SET_PATH = 'client-set-path',
  CLIENT_RENAME = 'client-rename',
  CLIENT_REDIRECT = 'client-redirect',
  CLIENT_LIST = 'client-list',
  DIALOG = 'dialog',
  ONTIME_LOG = 'ontime-log',
  ONTIME = 'ontime',
  ONTIME_PATCH = 'ontime-patch',
  ONTIME_REFETCH = 'ontime-refetch',
}

//TO SERVER
type pingPacket = { type: WsType.PING; payload: Date };
type setClientPacket = { type: WsType.CLIENT_SET_PATH; payload: string };
type setClientPathPacket = { type: WsType.CLIENT_SET; payload: Partial<Client> };

//TO CLIENT
type pongPacket = { type: WsType.PONG; payload: Date };
type initClientPacket = { type: WsType.CLIENT_INIT; payload: { clientId: string; clientName: string } };
type renameClientPacket = { type: WsType.CLIENT_RENAME; payload: { target: string; name: string } };
type redirectClientPacket = { type: WsType.CLIENT_REDIRECT; payload: { target: string; path: string } };
type dialogPacket = { type: WsType.DIALOG; payload: { dialog: string } };
type listClientPacket = {
  type: WsType.CLIENT_LIST;
  payload: Record<string, Client>;
};
type ontimePacket = { type: WsType.ONTIME; payload: RuntimeStore };
type ontimePatchPacket = { type: WsType.ONTIME_PATCH; payload: Partial<RuntimeStore> };

type ontimeRefetchPacket = {
  type: WsType.ONTIME_REFETCH;
  payload: any; //{ reload?: boolean; target?: string; revision?: number };
};

// SHARED
type logPacket = { type: WsType.ONTIME_LOG; payload: Log };

export type WebSocketPacketToServer = pingPacket | setClientPacket | setClientPathPacket | logPacket;
export type WebSocketPacketToClient =
  | pongPacket
  | initClientPacket
  | renameClientPacket
  | redirectClientPacket
  | dialogPacket
  | logPacket
  | listClientPacket
  | ontimePacket
  | ontimePatchPacket
  | ontimeRefetchPacket;
