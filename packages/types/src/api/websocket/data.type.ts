import type { Client } from '../../definitions/Clients.type.js';
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
  RuntimeData = 'runtime-data',
  Refetch = 'refetch',
}

// CLIENT TO SERVER
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
type RuntimePacket = { tag: MessageTag.RuntimeData; payload: Partial<RuntimeStore> };

type RefetchPacket = {
  tag: MessageTag.Refetch;
  payload: {
    target: RefetchKey;
    revision: MaybeNumber;
    rundownId?: string; // undefined means refetch all rundowns
  };
};

export type WsPacketToServer = PingPacket | SetClientPacket | SetClientPathPacket;
export type WsPacketToClient =
  | PongPacket
  | InitClientPacket
  | RenameClientPacket
  | RedirectClientPacket
  | DialogPacket
  | ListClientPacket
  | RuntimePacket
  | RefetchPacket;
