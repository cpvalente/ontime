import { startIntegrations, startOSCServer, startServer } from './app.js';

async function startOntime() {
  try {
    // Start express server
    const loaded = await startServer();
    console.log(loaded);

    // Start OSC Server (API)
    await startOSCServer();
    await startIntegrations();
  } catch (error) {
    console.log('Error starting Ontime');
    console.log(error);
  }
}

startOntime();
