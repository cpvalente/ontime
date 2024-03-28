/* eslint-disable no-console */
import { initAssets, startIntegrations, startOSCServer, startServer } from './app.js';

async function startOntime() {
  try {
    console.log('Request: Initialise assets...');
    await initAssets();
    console.log('Request: Start server...');
    await startServer();
    console.log('Request: Start OSC server...');
    await startOSCServer();
    console.log('Request: Start OSC integrations...');
    await startIntegrations();
  } catch (error) {
    console.log(`Request failed: ${error}`);
  }
}

startOntime();
