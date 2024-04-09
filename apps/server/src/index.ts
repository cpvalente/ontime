/* eslint-disable no-console */
import { initAssets, startIntegrations, startServer } from './app.js';

async function startOntime() {
  try {
    console.log('Request: Initialise assets...');
    await initAssets();
    console.log('Request: Start server...');
    await startServer();
    console.log('Request: Start integrations...');
    await startIntegrations();
  } catch (error) {
    console.log(`Request failed: ${error}`);
  }
}

startOntime();
