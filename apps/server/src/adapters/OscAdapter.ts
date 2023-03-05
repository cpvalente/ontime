import { Server } from 'node-osc';
import { OSCSettings } from 'ontime-types';

import { IAdapter } from './IAdapter.js';
import { dispatchFromAdapter } from '../controllers/integrationController.js';
import { logger } from '../classes/Logger.js';

export class OscServer implements IAdapter {
  private osc: Server;

  constructor(config: OSCSettings) {
    this.osc = new Server(config.portIn, '0.0.0.0');

    this.osc.on('error', console.error);

    this.osc.on('message', (msg) => {
      // message should look like /ontime/{path} {args} where
      // ontime: fixed message for app
      // path: command to be called
      // args: extra data, only used on some API entries (delay, goto)

      // split message
      const [, address, path] = msg[0].split('/');
      const args = msg[1];

      // get first part before (ontime)
      if (address !== 'ontime') {
        logger.error('RX', `OSC IN: OSC messages to ontime must start with /ontime/, received: ${msg}`);
        return;
      }

      // get second part (command)
      if (!path) {
        logger.error('RX', 'OSC IN: No path found');
        return;
      }

      try {
        const reply = dispatchFromAdapter(path, args, 'osc');
        if (reply) {
          const { topic, payload } = reply;
          this.osc.emit(topic, payload);
        }
      } catch (error) {
        logger.error('RX', `OSC IN: ${error}`);
      }
    });
  }

  shutdown() {
    console.log('Shutting down OSC Server');
    this.osc?.close();
  }
}
