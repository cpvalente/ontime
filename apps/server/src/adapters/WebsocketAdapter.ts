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

import { Client, LogOrigin, RuntimeStore } from 'ontime-types';

import { WebSocket, WebSocketServer } from 'ws';
import type { Server } from 'http';

import getRandomName from '../utils/getRandomName.js';
import { IAdapter } from './IAdapter.js';
import { eventStore } from '../stores/EventStore.js';
import { logger } from '../classes/Logger.js';
import { dispatchFromAdapter } from '../api-integration/integration.controller.js';
import { generateId } from 'ontime-utils';
import { authenticateSocket } from '../middleware/authenticate.js';

let instance: SocketServer | null = null;

export class SocketServer implements IAdapter {
  private readonly MAX_PAYLOAD = 1024 * 256; // 256Kb

  private wss: WebSocketServer | null;
  private readonly clients: Map<string, Client>;
  private lastConnection: Date | null = null;
  private shouldShowWelcome = true;

  //should we be tacking versions
  private readonly patchClients: Map<string, WebSocket>;
  private readonly keyClients: Map<string, WebSocket>;

  constructor() {
    if (instance) {
      throw new Error('There can be only one');
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias -- this logic is used to ensure singleton
    instance = this;
    this.clients = new Map<string, Client>();
    this.keyClients = new Map<string, WebSocket>();
    this.patchClients = new Map<string, WebSocket>();
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

      this.clients.set(clientId, {
        type: 'unknown',
        identify: false,
        name: getRandomName(),
        path: '',
      });

      this.keyClients.set(clientId, ws);

      this.lastConnection = new Date();
      logger.info(LogOrigin.Client, `${this.clients.size} Connections with new: ${clientId}`);

      ws.send(
        JSON.stringify({
          type: 'client-id',
          payload: clientId,
        }),
      );

      ws.send(
        JSON.stringify({
          type: 'client-name',
          payload: this.clients.get(clientId).name,
        }),
      );

      this.sendClientList();

      // send store payload on connect
      ws.send(
        JSON.stringify({
          type: 'ontime',
          payload: eventStore.poll(),
        }),
      );

      ws.on('error', console.error);

      ws.on('close', () => {
        this.clients.delete(clientId);
        this.patchClients.delete(clientId);
        this.keyClients.delete(clientId);

        logger.info(LogOrigin.Client, `${this.clients.size} Connections with disconnected: ${clientId}`);
        this.sendClientList();
      });

      ws.on('message', (data) => {
        try {
          // @ts-expect-error -- ??
          const message = JSON.parse(data);
          const { type, payload } = message;

          if (type === 'ping') {
            ws.send(
              JSON.stringify({
                type: 'pong',
                payload,
              }),
            );
            return;
          }

          if (type === 'get-client-name') {
            ws.send(
              JSON.stringify({
                type: 'client-name',
                payload: this.clients.get(clientId).name,
              }),
            );
            return;
          }

          if (type === 'set-client-type') {
            if (payload && typeof payload == 'string') {
              const previousData = this.clients.get(clientId);
              this.clients.set(clientId, { ...previousData, type: payload });
            }
            this.sendClientList();
            return;
          }

          if (type === 'set-client-path') {
            if (payload && typeof payload == 'string') {
              const previousData = this.clients.get(clientId);
              previousData.path = payload;
              this.clients.set(clientId, previousData);

              if (payload.includes('editor') && this.shouldShowWelcome) {
                this.shouldShowWelcome = false;
                ws.send(
                  JSON.stringify({
                    type: 'dialog',
                    payload: { dialog: 'welcome' },
                  }),
                );
              }
            }

            this.sendClientList();
            return;
          }

          if (type === 'set-client-name') {
            if (payload) {
              const previousData = this.clients.get(clientId);
              logger.info(LogOrigin.Client, `Client ${previousData.name} renamed to ${payload}`);
              this.clients.set(clientId, { ...previousData, name: payload });
              ws.send(
                JSON.stringify({
                  type: 'client-name',
                  payload: this.clients.get(clientId).name,
                }),
              );
            }
            this.sendClientList();
            return;
          }

          if (type === 'ontime-log') {
            if (payload.level && payload.origin && payload.text) {
              logger.emit(payload.level, payload.origin, payload.text);
            }
            return;
          }

          if (type === 'set-client-use-patch') {
            this.keyClients.delete(clientId);
            this.patchClients.set(clientId, ws);
            return;
          }

          if (type === 'set-client-use-key') {
            this.patchClients.delete(clientId);
            this.keyClients.set(clientId, ws);
            return;
          }

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

  private sendClientList(): void {
    const payload = Object.fromEntries(this.clients.entries());
    this.sendAsJson({ type: 'client-list', payload });
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
      type: 'client-rename',
      payload: { name, target },
    });
    this.sendClientList();
  }

  public redirectClient(target: string, path: string) {
    const previousData = this.clients.get(target);
    if (!previousData) {
      throw new Error(`Client "${target}" not found`);
    }
    this.sendAsJson({ type: 'client-redirect', payload: { target, path } });
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
  public sendAsJson(message: unknown) {
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

  public sendRuntimeStoreUpdate(keys: (keyof RuntimeStore)[], store: Partial<RuntimeStore>) {
    const patch = {};
    keys.map((key) => {
      Object.assign(patch, { [key]: store[key] });
    });
    const stringifiedPatch = JSON.stringify({ type: 'ontime-patch', payload: patch });
    this.patchClients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(stringifiedPatch);
      }
    });

    while (keys.length) {
      const key = keys.pop();
      const stringifiedMessage = JSON.stringify({ type: `ontime-${key}`, payload: store[key] });
      this.keyClients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(stringifiedMessage);
        }
      });
    }
  }

  shutdown() {
    this.wss?.close();
  }
}

export const socket = new SocketServer();
