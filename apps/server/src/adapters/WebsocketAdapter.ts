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
  RefetchKey,
  WsPacketToClient,
  WsPacketToServer,
} from 'ontime-types';
import { generateId } from 'ontime-utils';
import { WebSocket, WebSocketServer } from 'ws';

import { dispatchFromAdapter } from '../api-integration/integration.controller.js';
import { logger } from '../classes/Logger.js';
import { authenticateSocket } from '../middleware/authenticate.js';
import { eventStore } from '../stores/EventStore.js';
import getRandomName from '../utils/getRandomName.js';
import type { IAdapter } from './IAdapter.js';

type ClientId = string;
let instance: SocketServer | null = null;

/** Timestamp of the last sign of life received from a client. */
type LastSeen = number;

class SocketServer implements IAdapter {
  private readonly MAX_PAYLOAD = 1024 * 256; // 256Kb
  private readonly HEARTBEAT_INTERVAL = 5000;
  private readonly HEARTBEAT_TIMEOUT = 15000;

  private wss: WebSocketServer | null;
  private readonly clients: Map<ClientId, Client>;
  /** Liveness state is keyed by socket because the heartbeat iterates sockets. */
  private readonly connections: Map<WebSocket, LastSeen>;
  private heartbeat: NodeJS.Timeout | null = null;
  private lastConnection: Date | null = null;
  private shouldShowWelcome = true;

  constructor() {
    if (instance) {
      throw new Error('There can be only one');
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias -- this logic is used to ensure singleton
    instance = this;
    this.clients = new Map<ClientId, Client>();
    this.connections = new Map<WebSocket, LastSeen>();
    this.wss = null;
  }

  init(server: Server, showWelcome: boolean, prefix?: string) {
    this.shouldShowWelcome = showWelcome;
    this.wss = new WebSocketServer({ path: `${prefix}/ws`, server, maxPayload: this.MAX_PAYLOAD });
    this.startHeartbeat();

    this.wss.on('connection', (ws, req) => {
      // Rejected sockets can emit an error while their close handshake is in progress.
      ws.on('error', console.error);

      let isAuthenticated = false;
      authenticateSocket(ws, req, (error) => {
        if (error) {
          ws.close(1008, 'Unauthorized');
          return;
        }
        isAuthenticated = true;
      });

      if (!isAuthenticated) {
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
      this.connections.set(ws, Date.now());

      this.lastConnection = new Date();
      logger.info(LogOrigin.Client, `${this.clients.size} Connections with new: ${clientName}`);

      sendPacket(MessageTag.ClientInit, { clientId, clientName });

      this.sendClientList();

      // send store payload on connect
      sendPacket(MessageTag.RuntimeData, eventStore.poll());

      // Browser WebSockets reply to protocol pings automatically.
      ws.on('pong', () => {
        this.connections.set(ws, Date.now());
      });
      ws.on('close', () => {
        this.clients.delete(clientId);
        this.connections.delete(ws);
        logger.info(LogOrigin.Client, `${this.clients.size} Connections with disconnected: ${clientName}`);
        this.sendClientList();
      });

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString()) as WsPacketToServer;
          const { tag, payload } = message;

          switch (tag) {
            case MessageTag.Ping: {
              sendPacket(MessageTag.Pong, payload);
              break;
            }
            case MessageTag.ClientSet: {
              const previousData = this.getOrCreateClient(clientId);
              const updatedClient = { ...previousData, ...payload };
              this.clients.set(clientId, updatedClient);
              if (this.shouldShowWelcome && updatedClient.path?.toLowerCase().includes('editor')) {
                this.shouldShowWelcome = false;
                sendPacket(MessageTag.Dialog, { dialog: 'welcome' });
              }
              this.sendClientList();
              break;
            }
            case MessageTag.ClientSetPath: {
              const previousData = this.getOrCreateClient(clientId);
              previousData.path = payload;
              this.clients.set(clientId, previousData);
              if (this.shouldShowWelcome && payload.toLowerCase().includes('editor')) {
                this.shouldShowWelcome = false;
                sendPacket(MessageTag.Dialog, { dialog: 'welcome' });
              }
              this.sendClientList();
              break;
            }
            case MessageTag.Log: {
              logger.emit(payload.level, payload.origin, payload.text);
              break;
            }
            default: {
              tag satisfies never;
              // Protocol specific stuff handled above
              try {
                const reply = await dispatchFromAdapter(tag, payload, 'ws');
                if (reply) {
                  ws.send(
                    JSON.stringify({
                      tag,
                      payload: reply.payload,
                    }),
                  );
                }
              } catch (error) {
                logger.error(LogOrigin.Rx, `WS IN: ${error}`);
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

  /** Terminates connections that stop answering protocol pings. */
  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeat = setInterval(() => {
      const now = Date.now();
      this.wss?.clients.forEach((client) => {
        const lastSeen = this.connections.get(client) ?? 0;

        if (now - lastSeen > this.HEARTBEAT_TIMEOUT) {
          logger.warning(LogOrigin.Client, 'Terminating unresponsive client');
          // A non-responsive socket cannot complete a close handshake.
          client.terminate();
          return;
        }

        if (client.readyState === WebSocket.OPEN) {
          client.ping();
        }
      });
    }, this.HEARTBEAT_INTERVAL);

    // The HTTP server, not this interval, owns process lifetime.
    this.heartbeat.unref();
  }

  private stopHeartbeat() {
    if (this.heartbeat) {
      clearInterval(this.heartbeat);
      this.heartbeat = null;
    }
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

  private sendClientList(): void {
    const payload = Object.fromEntries(this.clients.entries());
    this.sendAsJson(MessageTag.ClientList, payload);
  }

  public getClientList(): ClientId[] {
    return Array.from(this.clients.keys());
  }

  public renameClient(target: ClientId, name: string) {
    const previousData = this.clients.get(target);
    if (!previousData) {
      throw new Error(`Client "${target}" not found`);
    }
    logger.info(LogOrigin.Client, `Client ${previousData.name} renamed to ${name}`);
    this.clients.set(target, { ...previousData, name });
    this.sendAsJson(MessageTag.ClientRename, { name, target });
    this.sendClientList();
  }

  public redirectClient(target: ClientId, path: string) {
    const previousData = this.clients.get(target);
    if (!previousData) {
      throw new Error(`Client "${target}" not found`);
    }
    this.sendAsJson(MessageTag.ClientRedirect, { target, path });
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
    this.stopHeartbeat();
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
        this.connections.clear();
        resolve();
      });
    });
  }
}

export const socket = new SocketServer();

/**
 * Utility function to notify clients that the REST data is stale
 */
export function sendRefetch(target: RefetchKey, revision: MaybeNumber = null, rundownId?: string) {
  socket.sendAsJson(MessageTag.Refetch, { target, revision, rundownId });
}
