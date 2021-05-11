const osc = require('node-osc');

const initiateOSC = (config) => {
  const oscServer = new osc.Server(config.port, '0.0.0.0', () => {
    console.log(`OSC Server is listening on port ${config.port}`);
  });

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
    if (address !== 'ontime') return;

    // get second part (command)
    switch (path) {
      case 'start':
      case 'play':
        console.log('calling play');
        global.timer.start();
        break;
      case 'pause':
        console.log('calling pause');
        global.timer.pause();
        break;
      case 'prev':
        console.log('calling prev');
        global.timer.previous();
        break;
      case 'next':
        console.log('calling next');
        global.timer.next();
        break;
      case 'unload':
        console.log('calling unload');
        global.timer.unload();
        break;
      case 'reload':
        console.log('calling reload');
        global.timer.reload();
        break;
      case 'roll':
        console.log('calling roll');
        break;
      case 'delay':
        console.log('calling delay with', args);
        let t = parseInt(args);
        if (!isNaN(t)) global.timer.increment(t * 1000 * 60);
        break;
      case 'goto':
        console.log('calling goto with', args);
        global.timer.loadEventById(args.toLowerCase());
        break;

      default:
        console.log('Error: not recognised');
        break;
    }
  });
};

module.exports = { initiateOSC };
