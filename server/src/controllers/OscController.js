import { Server } from 'node-osc';

let oscServer = null;

export const shutdownOSCServer = () => {
  if (oscServer != null) oscServer.close();
};

export const initiateOSC = (config) => {
  oscServer = new Server(config.port, '0.0.0.0', () => {
    console.log(`OSC Server is listening on port ${config.port}`);
  });

  // error
  oscServer.on('error', console.error);

  oscServer.on('message', function (msg) {
    // message should look like /ontime/{path}/{args} where
    // ontime: fixed message for app
    // path: command to be called
    // args: extra data, only used on some of the API entries (delay, goto)
    console.log('OSC received', msg);

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
      case 'start':
      case 'play':
        console.log('calling play');
        global.timer.trigger('start');
        break;
      case 'pause':
        console.log('calling pause');
        global.timer.trigger('pause');
        break;
      case 'prev':
        console.log('calling prev');
        global.timer.trigger('previous');
        break;
      case 'next':
        console.log('calling next');
        global.timer.trigger('next');
        break;
      case 'unload':
      case 'stop':
        console.log('calling unload');
        global.timer.trigger('unload');
        break;
      case 'reload':
        console.log('calling reload');
        global.timer.trigger('reload');
        break;
      case 'roll':
        console.log('calling roll');
        global.timer.trigger('roll');
        break;
      case 'delay':
        console.log('calling delay with', args);
        try {
          const t = parseInt(args);
          if (isNaN(t)) {
            console.error(`OSC IN: delay time not recognised ${args}`);
            return;
          }
          global.timer.increment(t * 1000 * 60);
        } catch (error) {
          console.log('error parsing: ', error);
        }
        break;
      case 'goto':
        console.log('calling goto with', args);
        try {
          const eventIndex = parseInt(args);
          if (isNaN(eventIndex) || eventIndex <= 0 || eventIndex == null) {
            console.error(
              `OSC IN: event index not recognised or out of range ${eventIndex}`
            );
          }
          global.timer.loadEventByIndex(eventIndex - 1);
        } catch (error) {
          console.log('error calling goto: ', error);
        }
        break;
      case 'gotoid':
        console.log('calling gotoid with', args);
        if (args == null) {
          console.error(
            `OSC IN: event id not recognised or out of range ${args}`
          );
          return;
        }
        try {
          global.timer.loadEventById(args.toString().toLowerCase());
        } catch (error) {
          console.log('error calling goto: ', error);
        }
        break;

      default:
        console.log(`Error: unhandled message ${path}`);
        break;
    }
  });
};
