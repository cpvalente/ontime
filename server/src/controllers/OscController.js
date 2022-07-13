import { Server } from 'node-osc';

let oscServer = null;

/**
 * @description utilty function to shutdown osc server
 */
export const shutdownOSCServer = () => {
  if (oscServer != null) oscServer.close();
};

/**
 * @description initialises OSC server
 * @param config
 */
export const initiateOSC = (config) => {
  oscServer = new Server(config.port, '0.0.0.0');

  // error
  oscServer.on('error', console.error);

  oscServer.on('message', function (msg) {
    // message should look like /ontime/{path}/{args} where
    // ontime: fixed message for app
    // path: command to be called
    // args: extra data, only used on some of the API entries (delay, goto)

    // split message
    const [, address, path] = msg[0].split('/');
    const args = msg[1];

    // get first part before (ontime)
    if (address !== 'ontime') {
      console.error(`OSC IN: Message address ${address} not recognised`);
      return;
    }

    if (path == null) {
      console.error('OSC IN: No path found');
      return;
    }

    // get second part (command)
    switch (path.toLowerCase()) {
      case 'onair': {
        global.timer.setonAir(true);
        break;
      }
      case 'offair': {
        global.timer.setonAir(false);
        break;
      }
      case 'play': {
        global.timer.trigger('start');
        break;
      }
      case 'start': {
        try {
          const eventIndex = Number(args);
          if (isNaN(eventIndex)) {
            global.timer.error('RX', `OSC IN: event index not recognised ${args}`);
            return;
          }
          const success = global.timer.trigger('startByIndex', eventIndex);
          if (!success) {
            global.timer.error('RX', `OSC IN: event index not recognised ${args}`);
          }
        } catch (error) {
          console.log('error parsing: ', error);
        }
        break;
      }
      case 'startid': {
        const success = global.timer.trigger('startById', args);
        if (!success) {
          global.timer.error('RX', `OSC IN: event ID not recognised ${args}`);
        }
        break;
      }
      case 'pause': {
        global.timer.trigger('pause');
        break;
      }
      case 'prev': {
        global.timer.trigger('previous');
        break;
      }
      case 'next': {
        global.timer.trigger('next');
        break;
      }
      case 'unload':
      case 'stop': {
        global.timer.trigger('unload');
        break;
      }
      case 'reload': {
        global.timer.trigger('reload');
        break;
      }
      case 'roll': {
        global.timer.trigger('roll');
        break;
      }
      case 'delay': {
        try {
          const t = parseInt(args, 10);
          if (isNaN(t)) {
            global.timer.error('RX', `OSC IN: delay time not recognised ${args}`);
            return;
          }
          global.timer.increment(t * 1000 * 60);
        } catch (error) {
          console.log('error parsing: ', error);
        }
        break;
      }
      case 'goto':
      case 'load': {
        try {
          const eventIndex = parseInt(args, 10);
          if (isNaN(eventIndex) || eventIndex <= 0) {
            global.timer.error(
              'RX',
              `OSC IN: event index not recognised or out of range ${eventIndex}`
            );
          }
          global.timer.loadEventByIndex(eventIndex - 1);
        } catch (error) {
          global.timer.error('RX', `OSC IN: error calling goto ${error}`);
        }
        break;
      }
      case 'gotoid':
      case 'loadid': {
        if (args == null) {
          global.timer.error('RX', `OSC IN: event id not recognised or out of range ${args}}`);
          return;
        }
        try {
          global.timer.loadEventById(args.toString().toLowerCase());
        } catch (error) {
          global.timer.error('RX', `OSC IN: error calling goto ${error}`);
        }
        break;
      }

      default: {
        global.timer.warning('RX', `OSC IN: unhandled message ${path}`);
        break;
      }
    }
  });
};
