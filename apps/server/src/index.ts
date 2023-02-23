import { startDb, startIntegrations, startOSCServer, startServer } from './app.js';

async function startOntime() {
  try {
    await startDb();

    const loaded = await startServer();
    console.log(loaded);

    await startOSCServer();
    await startIntegrations();
  } catch (error) {
    console.log('Error starting Ontime');
    console.log(error);
  }
}

startOntime();
