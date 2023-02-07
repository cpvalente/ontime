// import { promise } from './modules/loadDb.js';
import { startOSCServer, startServer } from './app.js';

async function startOntime() {
  try {
    // await promise;

    // Start express server
    const loaded = await startServer();
    console.log(loaded);

    // Start OSC Server (API)
    await startOSCServer();
  } catch (error) {
    console.log('Error starting Ontime');
    console.log(error);
  }
}

startOntime();
