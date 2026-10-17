import * as dgram from 'node:dgram';

import { LogOrigin } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';
import { type OscPacketOutput, fromBuffer } from 'osc-min';

import * as logger from '../api-data/logs/logs.service.js';
import { dispatchFromAdapter } from '../api-integration/integration.controller.js';
import { isOntimeCloud } from '../setup/environment.js';
import type { IAdapter } from './IAdapter.js';
import { integrationPayloadFromPath } from './utils/parse.js';

class OscServer implements IAdapter {
  private udpSocket: dgram.Socket | null = null;

  init(port: number) {
    if (isOntimeCloud) {
      // cloud instances are reached over HTTP only, we never bind the UDP socket
      logger.warning(LogOrigin.Api, 'OSC input skipped', { reason: 'cloud' });
      return;
    }
    this.udpSocket?.close();
    logger.info(LogOrigin.Api, 'OSC input started', { port });
    this.udpSocket = dgram.createSocket('udp4');
    this.udpSocket.on('error', (error) => logger.error(LogOrigin.Api, 'OSC input failed', { error: error.message }));
    this.udpSocket.on('message', (buf) => {
      // message should look like /ontime/{command}/{params?} {args} where
      // ontime: fixed message for app
      // command: command to be called
      // params: used to create a nested object to patch with
      // args: extra data, only used on some API entries

      let msg: OscPacketOutput;
      try {
        msg = fromBuffer(buf);
      } catch (_e) {
        logger.error(LogOrigin.Api, 'OSC message rejected', { reason: 'invalid' });
        return;
      }

      if (msg.oscType === 'bundle') {
        logger.error(LogOrigin.Api, 'OSC message rejected', { reason: 'bundle' });
        return;
      }

      const { address, args: oscArgs } = msg;

      // split message
      const [, ontimeKey, command, ...params] = address.split('/');
      const args = oscArgs[0]?.value ?? undefined;

      // get first part (ontime)
      if (ontimeKey !== 'ontime') {
        logger.error(LogOrigin.Api, 'OSC message rejected', { reason: 'wrong-prefix', address });
        return;
      }

      // get second part (command)
      if (!command) {
        logger.error(LogOrigin.Api, 'OSC message rejected', { reason: 'no-command', address });
        return;
      }

      let transformedPayload: unknown = args;
      // we need to transform the params for the more complex endpoints
      if (params.length) {
        transformedPayload = integrationPayloadFromPath(params, args);
      }

      try {
        dispatchFromAdapter(command, transformedPayload, 'osc');
      } catch (error) {
        logger.error(LogOrigin.Api, 'OSC message failed', { address, error: getErrorMessage(error) });
      }
    });
    this.udpSocket.bind(port);
  }
  shutdown(): Promise<void> {
    const socket = this.udpSocket;
    this.udpSocket = null;
    if (!socket) {
      return Promise.resolve();
    }

    logger.info(LogOrigin.Api, 'OSC input stopped');
    return new Promise((resolve) => {
      socket.close(() => resolve());
    });
  }
}

export const oscServer = new OscServer();
