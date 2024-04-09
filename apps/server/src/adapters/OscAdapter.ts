import { LogOrigin } from 'ontime-types';

import { Server } from 'node-osc';

import { IAdapter } from './IAdapter.js';
import { logger } from '../classes/Logger.js';
import { integrationPayloadFromPath } from './utils/parse.js';
import { dispatchFromAdapter } from '../api-integration/integration.controller.js';

export class OscServer implements IAdapter {
  private readonly osc: Server;

  constructor(portIn: number) {
    this.osc = new Server(portIn, '0.0.0.0');

    this.osc.on('error', (error) => logger.error(LogOrigin.Rx, `OSC IN: ${error}`));

    this.osc.on('message', (msg) => {
      // message should look like /ontime/{command}/{params?} {args} where
      // ontime: fixed message for app
      // command: command to be called
      // params: used to create a nested object to patch with
      // args: extra data, only used on some API entries

      // split message
      const [, address, command, ...params] = msg[0].split('/');
      const args = msg[1];

      // get first part before (ontime)
      if (address !== 'ontime') {
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
  }

  shutdown() {
    this.osc?.close();
  }
}
