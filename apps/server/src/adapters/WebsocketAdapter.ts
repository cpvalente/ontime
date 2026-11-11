/**
 * DESIGN BY CONTRACT
 * ===================
 * All websocket calls are expected to follow the defined format,
 * otherwise they will be ignored by Ontime server
 *
 * Messages should be in JSON format with two top level objects
 * {
 *   tag: ...
 *   payload: ...
 * }
 *
 * Type: describes the action to be performed as enumerated in the API design
 * Payload: adds necessary payload for the request to be completed
 */

import type { Server } from 'http';

import {
  Client,
  LogOrigin,
  MaybeNumber,
  MessageTag,
  ProjectStartup,
  RefetchKey,
  WsPacketToClient,
  WsPacketToServer,
} from 'ontime-types';
import { generateId, getErrorMessage } from 'ontime-utils';
import { WebSocket, WebSocketServer } from 'ws';

import * as logger from '../api-data/logs/logs.service.js';
import { dispatchFromAdapter } from '../api-integration/integration.controller.js';
import { now } from '../lib/time-core/timeCore.js';
import { Access, type AccessScope } from '../middleware/access.js';
import { authenticateSocket } from '../middleware/authenticate.js';
import { eventStore } from '../stores/EventStore.js';
import getRandomName from '../utils/getRandomName.js';
import type { IAdapter } from './IAdapter.js';

type ClientId = string;
let instance: SocketServer | null = null;

class SocketServer implements IAdapter {
  private readonly MAX_PAYLOAD = 1024 * 256; // 256Kb

  private wss: WebSocketServer | null;
  private readonly clients: Map<ClientId, Client>;
  /** the socket of each client and what it may do */
  private readonly connections: Map<ClientId, { ws: WebSocket; scope: AccessScope }>;
  private lastConnection: Date | null = null;
  /** sent once, to the first editor which connects */
  private welcome: ProjectStartup | null = null;

  constructor() {
    if (instance) {
      throw new Error('There can be only one');
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias -- this logic is used to ensure singleton
    instance = this;
    this.clients = new Map<ClientId, Client>();
    this.connections = new Map();
    this.wss = null;
  }

  init(server: Server, welcome: ProjectStartup | null, prefix?: string) {
    this.welcome = welcome;
    this.wss = new WebSocketServer({ path: `${prefix}/ws`, server, maxPayload: this.MAX_PAYLOAD });

    this.wss.on('connection', (ws, req) => {
      // Rejected sockets can emit an error while their close handshake is in progress.
      ws.on('error', console.error);

      const connectionScope = authenticateSocket(req);
      if (!connectionScope) {
        ws.close(1008, 'Unauthorized');
        return;
      }

      const clientId = generateId();
      const clientName = getRandomName();
      function sendPacket<T extends MessageTag>(
        tag: T,
        payload: Pick<WsPacketToClient & { tag: T }, 'payload'>['payload'],
      ) {
        ws.send(JSON.stringify({ tag, payload }));
      }

      this.clients.set(clientId, {
        type: 'unknown',
        identify: false,
        name: clientName,
        origin: '',
        path: '',
      });
      this.connections.set(clientId, { ws, scope: connectionScope });

      this.lastConnection = new Date();
      logger.info(LogOrigin.Client, 'Client connected', { client: clientName, clients: this.clients.size });

      sendPacket(MessageTag.ClientInit, { clientId, clientName });

      this.sendClientList();

      // send store payload on connect
      sendPacket(MessageTag.RuntimeData, eventStore.poll());

      ws.on('close', () => {
        this.clients.delete(clientId);
        this.connections.delete(clientId);
        logger.info(LogOrigin.Client, 'Client disconnected', { client: clientName, clients: this.clients.size });
        this.sendClientList();
      });

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString()) as WsPacketToServer;
          const { tag, payload } = message;

          switch (tag) {
            case MessageTag.Ping: {
              const pong: WsPacketToClient = { tag: MessageTag.Pong, payload, epoch: now() };
              ws.send(JSON.stringify(pong));
              break;
            }
            case MessageTag.ClientSet: {
              const previousData = this.getOrCreateClient(clientId);
              const updatedClient = { ...previousData, ...pickClientFields(payload) };
              this.clients.set(clientId, updatedClient);
              this.maybeSendWelcome(connectionScope, updatedClient.path, sendPacket);
              this.sendClientList();
              break;
            }
            case MessageTag.ClientSetPath: {
              const previousData = this.getOrCreateClient(clientId);
              previousData.path = typeof payload === 'string' ? removeToken(payload.slice(0, maxPathLength)) : '';
              this.clients.set(clientId, previousData);
              this.maybeSendWelcome(connectionScope, previousData.path, sendPacket);
              this.sendClientList();
              break;
            }
            default: {
              tag satisfies never;
              // Protocol specific stuff handled above
              // commands change things, so read sockets may not send them, except to rename or identify themselves
              if (connectionScope !== Access.write && !isSelfTarget(tag, payload, clientId)) {
                logger.warning(LogOrigin.Client, 'Command not allowed', {
                  tag,
                  client: this.clients.get(clientId)?.name,
                });
                break;
              }
              try {
                const reply = await dispatchFromAdapter(tag, payload, 'ws', this.clients.get(clientId)?.name);
                if (reply) {
                  ws.send(
                    JSON.stringify({
                      tag,
                      payload: reply.payload,
                    }),
                  );
                }
              } catch (error) {
                logger.error(LogOrigin.Api, 'WebSocket message failed', { tag, error: getErrorMessage(error) });
              }
              break;
            }
          }
        } catch (_) {
          // we ignore unknown
        }
      });
    });
  }

  getStats() {
    return {
      connectedClients: this.clients.size,
      lastConnection: this.lastConnection,
    };
  }

  private getOrCreateClient(clientId: ClientId): Client {
    if (!this.clients.has(clientId)) {
      this.clients.set(clientId, {
        type: 'unknown',
        identify: false,
        name: getRandomName(),
        origin: '',
        path: '',
      });
    }
    return this.clients.get(clientId) as Client;
  }

  /**
   * Write sockets see every client, so they can rename, redirect and identify them
   * Read sockets only see themselves, which is what the identify overlay needs
   */
  private sendClientList(): void {
    const fullList = Object.fromEntries(this.clients.entries());
    this.sendToWritersAnd(null, MessageTag.ClientList, fullList, (clientId) => {
      const self = this.clients.get(clientId);
      return self ? { [clientId]: self } : {};
    });
  }

  /**
   * Sends a packet to every write socket and to the target client
   * With otherPayload, every other client gets its own version of the packet instead
   */
  private sendToWritersAnd<T extends MessageTag>(
    target: ClientId | null,
    tag: T,
    payload: Pick<WsPacketToClient & { tag: T }, 'payload'>['payload'],
    otherPayload?: (clientId: ClientId) => Pick<WsPacketToClient & { tag: T }, 'payload'>['payload'],
  ): void {
    const message = JSON.stringify({ tag, payload });
    for (const [clientId, { ws, scope }] of this.connections) {
      if (ws.readyState !== WebSocket.OPEN) {
        continue;
      }
      if (scope === Access.write || clientId === target) {
        ws.send(message);
      } else if (otherPayload) {
        ws.send(JSON.stringify({ tag, payload: otherPayload(clientId) }));
      }
    }
  }

  /** the project startup dialog goes once, to the first write socket which opens the editor */
  private maybeSendWelcome(
    scope: AccessScope,
    path: string | undefined,
    sendPacket: (tag: MessageTag.Dialog, payload: { dialog: 'welcome' } & ProjectStartup) => void,
  ) {
    if (this.welcome && scope === Access.write && path?.toLowerCase().includes('editor')) {
      sendPacket(MessageTag.Dialog, { dialog: 'welcome', ...this.welcome });
      this.welcome = null;
    }
  }

  public getClientList(): ClientId[] {
    return Array.from(this.clients.keys());
  }

  public renameClient(target: ClientId, rename: string) {
    const name = rename.slice(0, maxFieldLength);
    const previousData = this.clients.get(target);
    if (!previousData) {
      throw new Error(`Client "${target}" not found`);
    }
    logger.info(LogOrigin.Client, 'Client renamed', { from: previousData.name, to: name });
    this.clients.set(target, { ...previousData, name });
    this.sendToWritersAnd(target, MessageTag.ClientRename, { name, target });
    this.sendClientList();
  }

  public redirectClient(target: ClientId, path: string) {
    const previousData = this.clients.get(target);
    if (!previousData) {
      throw new Error(`Client "${target}" not found`);
    }
    this.sendToWritersAnd(target, MessageTag.ClientRedirect, { target, path: removeToken(path) });
  }

  public identifyClient(target: ClientId, identify: boolean) {
    const previousData = this.clients.get(target);
    if (!previousData) {
      throw new Error(`Client "${target}" not found`);
    }
    this.clients.set(target, { ...previousData, identify });
    this.sendClientList();
  }

  // message is any serializable value
  public sendAsJson<T extends MessageTag>(tag: T, payload: Pick<WsPacketToClient & { tag: T }, 'payload'>['payload']) {
    try {
      const stringifiedMessage = JSON.stringify({ tag, payload });
      this.wss?.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(stringifiedMessage);
        }
      });
    } catch (_) {
      /** We do not handle this error */
    }
  }

  shutdown(): Promise<void> {
    const wss = this.wss;
    if (!wss) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      // Notify clients first so they can reconnect gracefully
      for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN || client.readyState === WebSocket.CONNECTING) {
          client.close(1001, 'Server shutting down');
        }
      }

      wss.close(() => {
        this.wss = null;
        this.clients.clear();
        this.connections.clear();
        resolve();
      });
    });
  }
}

export const socket = new SocketServer();

const maxFieldLength = 100;
const maxPathLength = 2048;

/**
 * Keeps the fields a client may set about itself, capped in length since other screens show them
 */
function pickClientFields(payload: unknown): Partial<Client> {
  if (!payload || typeof payload !== 'object') return {};
  const { name, type, origin, path } = payload as Record<string, unknown>;
  const fields: Partial<Client> = {};
  if (typeof name === 'string') fields.name = name.slice(0, maxFieldLength);
  if (typeof type === 'string') fields.type = type.slice(0, maxFieldLength) as Client['type'];
  if (typeof origin === 'string') fields.origin = origin.slice(0, maxFieldLength);
  if (typeof path === 'string') fields.path = removeToken(path.slice(0, maxPathLength));
  return fields;
}

/**
 * Paths are shown to write sockets and used to redirect, they must not carry the credentials of the screen
 * Drops the fragment, and every token parameter while keeping the others as they were written
 * Exported for tests
 */
export function removeToken(path: string): string {
  const withoutHash = path.split('#')[0];
  const queryStart = withoutHash.indexOf('?');
  if (queryStart === -1) {
    return withoutHash;
  }
  const params = withoutHash
    .slice(queryStart + 1)
    .split('&')
    .filter((param) => !isTokenParam(param));
  const base = withoutHash.slice(0, queryStart);
  return params.length > 0 ? `${base}?${params.join('&')}` : base;
}

function isTokenParam(param: string): boolean {
  const key = param.split('=')[0];
  try {
    return decodeURIComponent(key.replace(/\+/g, ' ')) === 'token';
  } catch (_) {
    return false;
  }
}

/**
 * Any client may rename itself and turn its own identify overlay on or off
 * Redirecting stays with write sockets, even for itself, since a screen has no use for it
 */
function isSelfTarget(tag: string, payload: unknown, clientId: ClientId): boolean {
  return (
    tag.toLowerCase() === 'client' &&
    typeof payload === 'object' &&
    payload !== null &&
    (payload as { target?: unknown }).target === clientId &&
    !('redirect' in payload)
  );
}

/**
 * Utility function to notify clients that the REST data is stale
 */
export function sendRefetch(target: RefetchKey, revision: MaybeNumber = null, rundownId?: string) {
  socket.sendAsJson(MessageTag.Refetch, { target, revision, rundownId });
}
