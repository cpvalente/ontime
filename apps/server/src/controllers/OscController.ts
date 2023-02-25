import { Server } from 'node-osc';
import { OSCSettings } from 'ontime-types';

import { PlaybackService } from '../services/PlaybackService.js';
import { messageManager } from '../classes/message-manager/MessageManager.js';
import { socketProvider } from '../classes/socket/SocketController.js';

let oscServer = null;

/**
 * @description utility function to shut down osc server
 */
export const shutdownOSCServer = () => {
  if (oscServer != null) oscServer.close();
};

/**
 * Initialises OSC server
 */
export const initiateOSC = (config: OSCSettings) => {
  oscServer = new Server(config.portIn, '0.0.0.0');

  oscServer.on('error', console.error);

  oscServer.on('message', function (msg) {
    // message should look like /ontime/{path} {args} where
    // ontime: fixed message for app
    // path: command to be called
    // args: extra data, only used on some API entries (delay, goto)

    // split message
    const [, address, path] = msg[0].split('/');
    const args = msg[1];

    // get first part before (ontime)
    if (address !== 'ontime') {
      console.error('RX', `OSC IN: Message address ${address} not recognised`, msg);
      return;
    }

    // get second part (command)
    if (!path) {
      console.error('RX', 'OSC IN: No path found');
      return;
    }

    switch (path.toLowerCase()) {
      case 'onair': {
        messageManager.setOnAir(true);
        break;
      }
      case 'offair': {
        messageManager.setOnAir(false);
        break;
      }
      case 'play': {
        PlaybackService.start();
        break;
      }
      case 'start': {
        try {
          const eventIndex = Number(args);
          if (isNaN(eventIndex)) {
            socketProvider.error('RX', `OSC IN: event index not recognised ${args}`);
            return;
          }
          PlaybackService.startByIndex(eventIndex);
        } catch (error) {
          console.log('Error loading event: ', error);
        }
        break;
      }
      case 'startid': {
        if (!args) {
          socketProvider.error('RX', `OSC IN: No ID in request`);
          return;
        }
        PlaybackService.loadById(args);
        break;
      }
      case 'pause': {
        PlaybackService.pause();
        break;
      }
      case 'prev': {
        PlaybackService.loadPrevious();
        break;
      }
      case 'next': {
        PlaybackService.loadNext();
        break;
      }
      case 'unload':
      case 'stop': {
        PlaybackService.stop();
        break;
      }
      case 'reload': {
        PlaybackService.reload();
        break;
      }
      case 'roll': {
        PlaybackService.roll();
        break;
      }
      case 'delay': {
        try {
          const delayTime = Number(args);
          if (isNaN(delayTime)) {
            socketProvider.error('RX', `OSC IN: delay time not recognised ${args}`);
            return;
          }
          PlaybackService.setDelay(delayTime);
        } catch (error) {
          console.log('Error adding delay: ', error);
        }
        break;
      }
      case 'goto':
      case 'load': {
        try {
          const eventIndex = Number(args);
          if (isNaN(eventIndex) || eventIndex <= 0) {
            socketProvider.error('RX', `OSC IN: event index not recognised or out of range ${eventIndex}`);
          } else {
            PlaybackService.loadByIndex(eventIndex - 1);
          }
        } catch (error) {
          socketProvider.error('RX', `OSC IN: error calling goto ${error}`);
        }
        break;
      }
      case 'gotoid':
      case 'loadid': {
        if (!args) {
          socketProvider.error('RX', `OSC IN: event ID not recognised: ${args}}`);
          return;
        }
        try {
          PlaybackService.loadById(args.toString().toLowerCase());
        } catch (error) {
          socketProvider.error('RX', `OSC IN: error calling goto ${error}`);
        }
        break;
      }

      case 'get-playback': {
        const playback = global.timer.state;
        global.timer.sendOsc('playback', playback);
        break;
      }

      default: {
        socketProvider.warning('RX', `OSC IN: unhandled message ${path}`);
        break;
      }
    }
  });
};
