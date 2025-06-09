import type { Client } from '../definitions/Clients.type.js';
import type { Log } from '../definitions/runtime/Logger.type.js';
import type { RuntimeStore } from '../definitions/runtime/RuntimeStore.type.js';
import type { MaybeNumber } from '../utils/utils.type.js';
import type { RefetchKey } from './refetch.type.js';

export enum MessageType {
  Ping = 'ping',
  Pong = 'pong',
  ClientInit = 'client-init',
  ClientSet = 'client-set',
  ClientSetPath = 'client-set-path',
  ClientRename = 'client-rename',
  ClientRedirect = 'client-redirect',
  ClientList = 'client-list',
  Dialog = 'dialog',
  Log = 'log',
  RuntimeData = 'runtime-data',
  RuntimePatch = 'runtime-patch',
  Refetch = 'refetch',
}

//CLIENT TO SERVER
type PingPacket = { type: MessageType.Ping; payload: Date };
type SetClientPacket = { type: MessageType.ClientSetPath; payload: string };
type SetClientPathPacket = { type: MessageType.ClientSet; payload: Partial<Client> };

// SERVER TO CLIENT
type PongPacket = { type: MessageType.Pong; payload: Date };
type InitClientPacket = { type: MessageType.ClientInit; payload: { clientId: string; clientName: string } };
type RenameClientPacket = { type: MessageType.ClientRename; payload: { target: string; name: string } };
type RedirectClientPacket = { type: MessageType.ClientRedirect; payload: { target: string; path: string } };
type DialogPacket = { type: MessageType.Dialog; payload: { dialog: string } };
type ListClientPacket = {
  type: MessageType.ClientList;
  payload: Record<string, Client>;
};
type RuntimePacket = { type: MessageType.RuntimeData; payload: RuntimeStore };
type RuntimePatchPacket = { type: MessageType.RuntimePatch; payload: Partial<RuntimeStore> };

type RefetchPacket = {
  type: MessageType.Refetch;
  payload: {
    target: RefetchKey;
    revision: MaybeNumber;
  };
};

// SHARED
type LogPacket = { type: MessageType.Log; payload: Log };

export type WsPacketToServer = PingPacket | SetClientPacket | SetClientPathPacket | LogPacket;
export type WsPacketToClient =
  | PongPacket
  | InitClientPacket
  | RenameClientPacket
  | RedirectClientPacket
  | DialogPacket
  | LogPacket
  | ListClientPacket
  | RuntimePacket
  | RuntimePatchPacket
  | RefetchPacket;
