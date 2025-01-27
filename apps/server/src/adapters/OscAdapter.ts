import { LogOrigin } from 'ontime-types';

import { fromBuffer } from 'osc-min';
import * as dgram from 'node:dgram';

import type { IAdapter } from './IAdapter.js';
import { logger } from '../classes/Logger.js';
import { integrationPayloadFromPath } from './utils/parse.js';
import { dispatchFromAdapter } from '../api-integration/integration.controller.js';
import { isOntimeCloud } from '../externals.js';

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
    this.udpSocket.on('message', (buf: ArrayBuffer) => {
      // message should look like /ontime/{command}/{params?} {args} where
      // ontime: fixed message for app
      // command: command to be called
      // params: used to create a nested object to patch with
      // args: extra data, only used on some API entries

      /**
       * TODO: fix ArrayBuffer casting
       */
      const msg = fromBuffer(buf);
      if (msg.oscType === 'bundle') {
        //TODO: manage bundles
        logger.error(LogOrigin.Rx, `OSC IN: We don't take bundles`);
        return;
      }

      const { address, args: oscArgs } = msg;

      // split message
      const [, ontimeKey, command, ...params] = address.split('/');
      const args = oscArgs[0]?.value ?? undefined; //TODO: manage multiple args or mayeb we have no usecase

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
    logger.info(LogOrigin.Rx, `OSC: Closing server`);
    this.udpSocket?.close();
    this.udpSocket = null;
  }
}

export const oscServer = new OscServer();
