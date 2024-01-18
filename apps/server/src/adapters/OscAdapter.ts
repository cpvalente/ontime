import { LogOrigin, OSCSettings } from 'ontime-types';

import { Server, Client } from 'node-osc';

import { IAdapter } from './IAdapter.js';
import { dispatchFromAdapter, type ChangeOptions } from '../controllers/integrationController.js';
import { logger } from '../classes/Logger.js';

export class OscServer implements IAdapter {
  private readonly osc: Server;

  constructor(config: OSCSettings) {
    this.osc = new Server(config.portIn, '0.0.0.0');

    this.osc.on('error', (error) => logger.error(LogOrigin.Rx, `OSC IN: ${error}`));

    this.osc.on('message', (msg, clientInfo) => {
      // TODO: update this comment
      // message should look like /ontime/{path}/{params?} {args} where
      // ontime: fixed message for app
      // path: command to be called
      // args: extra data, only used on some API entries (delay, goto)

      // split message
      const [, address, path, ...params] = msg[0].split('/');
      const args = msg[1];

      // get first part before (ontime)
      if (address !== 'ontime') {
        logger.error(LogOrigin.Rx, `OSC IN: OSC messages to ontime must start with /ontime/, received: ${msg}`);
        return;
      }

      // get second part (command)
      if (!path) {
        logger.error(LogOrigin.Rx, 'OSC IN: No path found');
        return;
      }

      let transformedPayload: unknown = args;
      // we need to transform the params for the change endpoint
      // OSC: ontime/change/{eventID}/{propertyName} value
      if (path === 'change') {
        if (params.length < 2) {
          logger.error(LogOrigin.Rx, 'OSC IN: No params provided for change');
          return;
        }

        if (args === undefined) {
          logger.error(LogOrigin.Rx, 'OSC IN: No valid payload provided for change');
          return;
        }

        const eventId = params[0];
        const property = params[1];
        const value: string | number | boolean = args as string | number | boolean;

        transformedPayload = {
          eventId,
          property,
          value,
        } satisfies ChangeOptions;
      } else if (params.length) {
        // transform params array into a nested object with args as the value
        // /a/b/c/d 5 will become {a:{b:{c:{d: 5}}}}
        transformedPayload = params.reduceRight(
          (parm, key, index) => (index === params.length - 1 ? { [key]: args } : { [key]: parm }),
          {},
        );
      }

      try {
        const reply = dispatchFromAdapter(
          path,
          {
            payload: transformedPayload,
          },
          'osc',
        );
        //We only send simple types back to the OSC client
        if (typeof reply.payload === 'string' || typeof reply.payload === 'number') {
          const client = new Client(clientInfo.address, clientInfo.port);
          client.send([msg[0], reply.payload]);
          client.close();
        }
      } catch (error) {
        logger.error(LogOrigin.Rx, `OSC IN: ${error}`);
      }
    });
  }

  shutdown() {
    console.log('Shutting down OSC Server');
    this.osc?.close();
  }
}
