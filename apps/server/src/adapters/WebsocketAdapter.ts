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

import { WebSocket, WebSocketServer } from 'ws';

import getRandomName from '../utils/getRandomName.js';
import { IAdapter } from './IAdapter.js';
import { eventStore } from '../stores/EventStore.js';
import { dispatchFromAdapter } from '../controllers/integrationController.js';
import { logger } from '../classes/Logger.js';

let instance;

export class SocketServer implements IAdapter {
  private readonly MAX_PAYLOAD = 1024 * 256; // 256Kb

  private wss: WebSocketServer | null;
  private clientIds: Set<string>;

  constructor() {
    if (instance) {
      throw new Error('There can be only one');
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias -- this logic is used to ensure singleton
    instance = this;
    this.clientIds = new Set<string>();
    this.wss = null;
  }

  init(server) {
    this.wss = new WebSocketServer({ path: '/ws', server });

    this.wss.on('connection', (ws) => {
      const clientId = getRandomName();
      this.clientIds.add(clientId);
      logger.info('RX', `${this.wss.clients.size} Connections with new: ${clientId}`);

      // send store payload on connect
      ws.send(
        JSON.stringify({
          type: 'ontime',
          payload: eventStore.poll(),
        }),
      );

      ws.on('error', console.error);

      ws.on('close', () => {
        logger.info('RX', `${this.wss.clients.size} Connections with disconnected: ${clientId}`);
        this.clientIds.delete(clientId);
      });

      ws.on('message', (data) => {
        if (data.length > this.MAX_PAYLOAD) {
          ws.close();
        }

        // TODO: protocol specific stuff should be handled here
        // eg: rename-client
        // socket.on('rename-client', (newName) => {
        //   if (newName) {
        //     const previousName = this._clientNames[socket.id];
        //     this._clientNames[socket.id] = newName;
        //     this.info('CLIENT', `Client ${previousName} renamed to ${newName}`);
        //   }
        // });

        try {
          const message = JSON.parse(data);
          const { type, payload } = message;

          if (type === 'hello') {
            ws.send('hi');
            return;
          }

          if (type === 'ontime-log') {
            if (payload.level && payload.origin && payload.text) {
              logger.emit(payload.level, payload.origin, payload.text);
            }
            return;
          }

          try {
            const reply = dispatchFromAdapter(type, payload, 'ws');
            if (reply) {
              const { topic, payload } = reply;
              ws.send(topic, payload);
            }
          } catch (error) {
            logger.error('RX', `WS IN: ${error}`);
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
      if (client !== this.wss && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  shutdown() {
    this.wss?.close();
  }
}

export const socket = new SocketServer();
