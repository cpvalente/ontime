import type { Client } from '../../definitions/Clients.type.js';
import type { Log } from '../../definitions/runtime/Logger.type.js';
import type { RuntimeStore } from '../../definitions/runtime/RuntimeStore.type.js';
import type { MaybeNumber } from '../../utils/utils.type.js';
import type { RefetchKey } from './refetch.type.js';

export enum MessageTag {
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
type PingPacket = { tag: MessageTag.Ping; payload: Date };
type SetClientPacket = { tag: MessageTag.ClientSetPath; payload: string };
type SetClientPathPacket = { tag: MessageTag.ClientSet; payload: Partial<Client> };

// SERVER TO CLIENT
type PongPacket = { tag: MessageTag.Pong; payload: Date };
type InitClientPacket = { tag: MessageTag.ClientInit; payload: { clientId: string; clientName: string } };
type RenameClientPacket = { tag: MessageTag.ClientRename; payload: { target: string; name: string } };
type RedirectClientPacket = { tag: MessageTag.ClientRedirect; payload: { target: string; path: string } };
type DialogPacket = { tag: MessageTag.Dialog; payload: { dialog: string } };
type ListClientPacket = {
  tag: MessageTag.ClientList;
  payload: Record<string, Client>;
};
type RuntimePacket = { tag: MessageTag.RuntimeData; payload: RuntimeStore };
type RuntimePatchPacket = { tag: MessageTag.RuntimePatch; payload: Partial<RuntimeStore> };

type RefetchPacket = {
  tag: MessageTag.Refetch;
  payload: {
    target: RefetchKey;
    revision: MaybeNumber;
  };
};

// SHARED
type LogPacket = { tag: MessageTag.Log; payload: Log };

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
