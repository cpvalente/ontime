/**
 * DESIGN BY CONTRACT
 * ===================
 * All websocket calls are expected to follow the defined format,
 * otherwise they will be ignored by Ontime server
 *
 * Messages should be in JSON format with two top level objects
 * {
 *   type: ...
 *   payload: ...
 * }
 *
 * Type: describes the action to be performed as enumerated in the API design
 * Payload: adds necessary payload for the request to be completed
 */

import { Client, LogOrigin, WebSocketPacketToClient, WsType } from 'ontime-types';

import { WebSocket, WebSocketServer } from 'ws';
import type { Server } from 'http';

import getRandomName from '../utils/getRandomName.js';
import type { IAdapter } from './IAdapter.js';
import { eventStore } from '../stores/EventStore.js';
import { logger } from '../classes/Logger.js';
import { dispatchFromAdapter } from '../api-integration/integration.controller.js';
import { generateId } from 'ontime-utils';
import { authenticateSocket } from '../middleware/authenticate.js';

let instance: SocketServer | null = null;

class SocketServer implements IAdapter {
  private readonly MAX_PAYLOAD = 1024 * 256; // 256Kb

  private wss: WebSocketServer | null;
  private readonly clients: Map<string, Client>;
  private lastConnection: Date | null = null;
  private shouldShowWelcome = true;

  constructor() {
    if (instance) {
      throw new Error('There can be only one');
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias -- this logic is used to ensure singleton
    instance = this;
    this.clients = new Map<string, Client>();
    this.wss = null;
  }

  init(server: Server, showWelcome: boolean, prefix?: string) {
    this.shouldShowWelcome = showWelcome;
    this.wss = new WebSocketServer({ path: `${prefix}/ws`, server, maxPayload: this.MAX_PAYLOAD });

    this.wss.on('connection', (ws, req) => {
      authenticateSocket(ws, req, (error) => {
        if (error) {
          ws.close(1008, 'Unauthorized');
        }
      });
      const clientId = generateId();
      const clientName = getRandomName();
      const sendPacket = (packet: WebSocketPacketToClient) => {
        ws.send(JSON.stringify(packet));
      };

      this.clients.set(clientId, {
        type: 'unknown',
        identify: false,
        name: clientName,
        origin: '',
        path: '',
      });

      this.lastConnection = new Date();
      logger.info(LogOrigin.Client, `${this.clients.size} Connections with new: ${clientId}`);

      sendPacket({
        type: WsType.CLIENT_INIT,
        payload: {
          clientId,
          clientName,
        },
      });

      this.sendClientList();

      // send store payload on connect
      ws.send(
        JSON.stringify({
          type: MessageType.RuntimeData,
          payload: eventStore.poll(),
        }),
      );

      ws.on('error', console.error);

      ws.on('close', () => {
        this.clients.delete(clientId);
        logger.info(LogOrigin.Client, `${this.clients.size} Connections with disconnected: ${clientId}`);
        this.sendClientList();
      });

      ws.on('message', (data) => {
        try {
          // @ts-expect-error -- this works fine
          const message = JSON.parse(data) as WebSocketPacketToServer;
          const { type, payload } = message;

          switch (type) {
            case WsType.PING: {
              sendPacket({ type: WsType.PONG, payload });
              break;
            }
            case WsType.CLIENT_SET: {
              const previousData = this.getOrCreateClient(clientId);
              this.clients.set(clientId, { ...previousData, ...payload });
              this.sendClientList();
              break;
            }
            case WsType.CLIENT_SET_PATH: {
              const previousData = this.getOrCreateClient(clientId);
              previousData.path = payload;
              this.clients.set(clientId, previousData);
              if (payload.includes('editor') && this.shouldShowWelcome) {
                this.shouldShowWelcome = false;
                sendPacket({
                  type: WsType.DIALOG,
                  payload: { dialog: 'welcome' },
                });
              }
              this.sendClientList();
              break;
            }
            case WsType.ONTIME_LOG: {
              logger.emit(payload.level, payload.origin, payload.text);
              break;
            }
            default: {
              // Protocol specific stuff handled above
              try {
                const reply = dispatchFromAdapter(type, payload, 'ws');
                if (reply) {
                  ws.send(
                    JSON.stringify({
                      type,
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
          return;
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

  private getOrCreateClient(clientId: string): Client {
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
    this.sendAsJson({ type: WsType.CLIENT_LIST, payload });
  }

  public getClientList(): string[] {
    return Array.from(this.clients.keys());
  }

  public renameClient(target: string, name: string) {
    const previousData = this.clients.get(target);
    if (!previousData) {
      throw new Error(`Client "${target}" not found`);
    }
    logger.info(LogOrigin.Client, `Client ${previousData.name} renamed to ${name}`);
    this.clients.set(target, { ...previousData, name });
    this.sendAsJson({
      type: WsType.CLIENT_RENAME,
      payload: { name, target },
    });
    this.sendClientList();
  }

  public redirectClient(target: string, path: string) {
    const previousData = this.clients.get(target);
    if (!previousData) {
      throw new Error(`Client "${target}" not found`);
    }
    this.sendAsJson({ type: WsType.CLIENT_REDIRECT, payload: { target, path } });
  }

  public identifyClient(target: string, identify: boolean) {
    const previousData = this.clients.get(target);
    if (!previousData) {
      throw new Error(`Client "${target}" not found`);
    }
    this.clients.set(target, { ...previousData, identify });
    this.sendClientList();
  }

  // message is any serializable value
  public sendAsJson(message: WebSocketPacketToClient) {
    try {
      const stringifiedMessage = JSON.stringify(message);
      this.wss?.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(stringifiedMessage);
        }
      });
    } catch (_) {
      /** We do not handle this error */
    }
  }

  shutdown() {
    this.wss?.close();
  }
}

export const socket = new SocketServer();
