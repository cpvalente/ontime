import { LogOrigin } from 'ontime-types';

import { type OscPacketOutput, fromBuffer } from 'osc-min';
import * as dgram from 'node:dgram';

import { logger } from '../classes/Logger.js';
import { dispatchFromAdapter } from '../api-integration/integration.controller.js';
import { isOntimeCloud } from '../setup/environment.js';

import { integrationPayloadFromPath } from './utils/parse.js';
import type { IAdapter } from './IAdapter.js';

class OscServer implements IAdapter {
  private udpSocket: dgram.Socket | null = null;

  init(port: number) {
    if (isOntimeCloud) {
      logger.warning(LogOrigin.Rx, 'OSC: Skip starting server in cloud environment');
    }
    this.udpSocket?.close();
    logger.info(LogOrigin.Rx, `OSC: Starting server on port ${port}`);
    this.udpSocket = dgram.createSocket('udp4');
    this.udpSocket.on('error', (error) => logger.error(LogOrigin.Rx, `OSC IN: ${error}`));
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
        logger.error(LogOrigin.Rx, 'OSC IN: Received invalid OSC message');
        return;
      }

      if (msg.oscType === 'bundle') {
        logger.error(LogOrigin.Rx, 'OSC IN: Ontime is unable to handle OSC bundles');
        return;
      }

      const { address, args: oscArgs } = msg;

      // split message
      const [, ontimeKey, command, ...params] = address.split('/');
      const args = oscArgs[0]?.value ?? undefined;

      // get first part (ontime)
      if (ontimeKey !== 'ontime') {
        logger.error(LogOrigin.Rx, `OSC IN: OSC messages to ontime must start with /ontime/, received: ${msg}`);
        return;
      }

      // get second part (command)
      if (!command) {
        logger.error(LogOrigin.Rx, 'OSC IN: No path found');
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
        logger.error(LogOrigin.Rx, `OSC IN: ${error}`);
      }
    });
    this.udpSocket.bind(port);
  }
  shutdown() {
    logger.info(LogOrigin.Rx, 'OSC: Closing server');
    this.udpSocket?.close();
    this.udpSocket = null;
  }
}

export const oscServer = new OscServer();
