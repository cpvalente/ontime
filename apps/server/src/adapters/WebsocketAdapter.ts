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

import { LogOrigin } from 'ontime-types';

import { WebSocket, WebSocketServer } from 'ws';
import type { Server } from 'http';

import getRandomName from '../utils/getRandomName.js';
import { IAdapter } from './IAdapter.js';
import { eventStore } from '../stores/EventStore.js';
import { logger } from '../classes/Logger.js';
import { dispatchFromAdapter } from '../api-integration/integration.controller.js';

let instance: SocketServer | null = null;

export class SocketServer implements IAdapter {
  private readonly MAX_PAYLOAD = 1024 * 256; // 256Kb

  private wss: WebSocketServer | null;
  private readonly clientIds: Set<string>;

  constructor() {
    if (instance) {
      throw new Error('There can be only one');
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias -- this logic is used to ensure singleton
    instance = this;
    this.clientIds = new Set<string>();
    this.wss = null;
  }

  init(server: Server) {
    this.wss = new WebSocketServer({ path: '/ws', server, maxPayload: this.MAX_PAYLOAD });

    this.wss.on('connection', (ws) => {
      let clientId = getRandomName();
      this.clientIds.add(clientId);
      logger.info(LogOrigin.Client, `${this.clientIds.size} Connections with new: ${clientId}`);

      // send store payload on connect
      ws.send(
        JSON.stringify({
          type: 'ontime',
          payload: eventStore.poll(),
        }),
      );

      ws.send(
        JSON.stringify({
          type: 'client-name',
          payload: clientId,
        }),
      );

      ws.send(
        JSON.stringify({
          type: 'client-list',
          payload: Array.from(this.clientIds),
        }),
      );

      ws.on('error', console.error);

      ws.on('close', () => {
        this.clientIds.delete(clientId);
        logger.info(LogOrigin.Client, `${this.clientIds.size} Connections with disconnected: ${clientId}`);
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          const { type, payload } = message;

          if (type === 'get-client-name') {
            ws.send(
              JSON.stringify({
                type: 'client-name',
                payload: clientId,
              }),
            );
            return;
          }

          if (type === 'set-client-name') {
            if (payload) {
              const previousName = clientId;
              clientId = payload;
              this.clientIds.delete(previousName);
              this.clientIds.add(clientId);
              logger.info(LogOrigin.Client, `Client ${previousName} renamed to ${clientId}`);
            }
            ws.send(
              JSON.stringify({
                type: 'client-name',
                payload: clientId,
              }),
            );
            return;
          }

          if (type === 'get-client-list') {
            ws.send(
              JSON.stringify({
                type: 'client-list',
                payload: Array.from(this.clientIds),
              }),
            );
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

  // message is any serializable value
  sendAsJson(message: unknown) {
    this.wss?.clients.forEach((client) => {
      try {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
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
