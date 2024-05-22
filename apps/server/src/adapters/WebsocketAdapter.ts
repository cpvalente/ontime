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

import { Client, ClientTypes, LogOrigin } from 'ontime-types';

import { WebSocket, WebSocketServer } from 'ws';
import type { Server } from 'http';

import getRandomName from '../utils/getRandomName.js';
import { IAdapter } from './IAdapter.js';
import { eventStore } from '../stores/EventStore.js';
import { logger } from '../classes/Logger.js';
import { dispatchFromAdapter } from '../api-integration/integration.controller.js';
import { generateId } from 'ontime-utils';

let instance: SocketServer | null = null;

type WsClient = Client & { ws: WebSocket };

export class SocketServer implements IAdapter {
  private readonly MAX_PAYLOAD = 1024 * 256; // 256Kb

  private wss: WebSocketServer | null;
  private readonly clients: Map<string, WsClient>;

  constructor() {
    if (instance) {
      throw new Error('There can be only one');
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias -- this logic is used to ensure singleton
    instance = this;
    this.clients = new Map<string, WsClient>();
    this.wss = null;
  }

  init(server: Server) {
    this.wss = new WebSocketServer({ path: '/ws', server, maxPayload: this.MAX_PAYLOAD });

    this.wss.on('connection', (ws) => {
      const clientId = generateId();

      this.clients.set(clientId, {
        type: ClientTypes.Unknown,
        identify: false,
        name: getRandomName(),
        ws,
      });
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
        logger.info(LogOrigin.Client, `${this.clients.size} Connections with disconnected: ${clientId}`);
        this.sendClientList();
      });

      ws.on('message', (data) => {
        try {
          // @ts-expect-error -- ??
          const message = JSON.parse(data);
          const { type, payload } = message;

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
            if (payload) {
              const previousData = this.clients.get(clientId);
              previousData.type = payload;
              this.clients.set(clientId, previousData);
            }
            this.sendClientList();
            return;
          }

          if (type === 'set-client-name') {
            if (payload) {
              const previousData = this.clients.get(clientId);
              logger.info(LogOrigin.Client, `Client ${previousData.name} renamed to ${payload}`);
              previousData.name = payload;
              this.clients.set(clientId, previousData);
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

          if (type === 'set-client-identify') {
            if (payload) {
              const targetClient = this.clients.get(payload.target);
              this.clients.set(payload.target, { ...targetClient, identify: payload.state });
              this.sendClientList();
            }
            return;
          }

          if (type === 'set-client-redirect') {
            if (payload && this.clients.has(payload.target)) {
              this.sendAsJson({ type: 'client-redirect', payload });
            }
            return;
          }

          if (type === 'set-client-rename') {
            if (payload && this.clients.has(payload.target)) {
              const targetID = payload.target;
              const newName = payload.name;
              const previousData = this.clients.get(targetID);
              logger.info(LogOrigin.Client, `Client ${previousData.name} renamed to ${newName}`);
              previousData.name = newName;
              this.clients.set(targetID, previousData);
              this.sendAsJson({
                type: 'client-rename',
                payload: { name: newName, id: targetID },
              });
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

  sendClientList(): void {
    const payload = Array.from(this.clients.entries()).reduce((acc, [key, data]) => {
      //We have to remove the WS part from the list before sending it to the clients
      const { ws: _, ...dataExcludingWs } = data;
      return Object.assign(acc, { [key]: dataExcludingWs });
    }, {});
    this.sendAsJson({ type: 'client-list', payload });
  }

  public getClientList(): string[] {
    return Array.from(this.clients.keys());
  }

  // message is any serializable value
  sendAsJson(message: unknown) {
    const stringifyed = JSON.stringify(message);
    this.wss?.clients.forEach((client) => {
      try {
        if (client.readyState === WebSocket.OPEN) {
          client.send(stringifyed);
        }
      } catch (_) {
        /** We do not handle this error */
      }
    });
  }

  shutdown() {
    this.wss?.close();
  }
}

export const socket = new SocketServer();
