/* eslint-disable no-console */
import { consoleHighlight, consoleRed } from './utils/console.js';
import { initAssets, startIntegrations, startServer } from './app.js';

async function startOntime() {
  try {
    console.log('\n');
    consoleHighlight('Request: Initialise assets...');
    await initAssets();

    console.log('\n');
    consoleHighlight('Request: Start server...');
    await startServer();

    console.log('\n');
    consoleHighlight('Request: Start integrations...');
    await startIntegrations();
  } catch (error) {
    consoleRed(`Request failed: ${error}`);
  }
}

startOntime();
