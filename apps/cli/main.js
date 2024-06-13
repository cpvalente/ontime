#!/usr/bin/env node

// NOTE: for now the following needs to be in place: ./server/index.cjs, ./client, ./external

const ontimeServer = require('./server/index.cjs');
const { initAssets, startServer, startIntegrations, shutdown } = ontimeServer;

async function startOntime() {
  await initAssets();

  await startServer();

  await startIntegrations();
}

startOntime();

process.on(['SIGHUP', 'SIGINT', 'SIGTERM'], () => {
  shutdown();
});
