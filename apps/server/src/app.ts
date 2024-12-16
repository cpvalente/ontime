import { LogOrigin, Playback, SimpleDirection, SimplePlayback } from 'ontime-types';

import 'dotenv/config';
import express from 'express';
import expressStaticGzip from 'express-static-gzip';
import http, { Server } from 'http';
import cors from 'cors';
import serverTiming from 'server-timing';
import { extname } from 'node:path';

// import utils
import { publicDir, srcDir, srcFiles } from './setup/index.js';
import { environment, isOntimeCloud, isProduction, updateRouterPrefix } from './externals.js';
import { ONTIME_VERSION } from './ONTIME_VERSION.js';
import { consoleSuccess, consoleHighlight, consoleError } from './utils/console.js';

// Import Routers
import { appRouter } from './api-data/index.js';
import { integrationRouter } from './api-integration/integration.router.js';

// Import adapters
import { socket } from './adapters/WebsocketAdapter.js';
import { getDataProvider } from './classes/data-provider/DataProvider.js';

// Services
import { integrationService } from './services/integration-service/IntegrationService.js';
import { logger } from './classes/Logger.js';
import { oscIntegration } from './services/integration-service/OscIntegration.js';
import { httpIntegration } from './services/integration-service/HttpIntegration.js';
import { populateStyles } from './setup/loadStyles.js';
import { eventStore } from './stores/EventStore.js';
import { runtimeService } from './services/runtime-service/RuntimeService.js';
import { restoreService } from './services/RestoreService.js';
import * as messageService from './services/message-service/MessageService.js';
import { populateDemo } from './setup/loadDemo.js';
import { getState } from './stores/runtimeState.js';
import { initRundown } from './services/rundown-service/RundownService.js';
import { initialiseProject } from './services/project-service/ProjectService.js';

// Utilities
import { clearUploadfolder } from './utils/upload.js';
import { generateCrashReport } from './utils/generateCrashReport.js';
import { getNetworkInterfaces } from './utils/networkInterfaces.js';
import { timerConfig } from './config/config.js';

console.log('\n');
consoleHighlight(`Starting Ontime version ${ONTIME_VERSION}`);

const canLog = isProduction;
if (!canLog) {
  console.log(`Ontime running in ${environment} environment`);
  console.log(`Ontime source directory at ${srcDir.root} `);
  console.log(`Ontime public directory at ${publicDir.root} `);
}

/**
 * When running in Ontime cloud, the client is not at the root segment
 * ie: https://cloud.getontime.com/client-hash/timer
 * This means:
 * - changing the base path in the index.html file
 * - prepending all express routes with the given prefix
 */
const prefix = updateRouterPrefix();

// Create express APP
const app = express();
if (!isProduction) {
  // log server timings to requests
  app.use(serverTiming());
}
app.disable('x-powered-by');

// setup cors for all routes
app.use(cors());

// enable pre-flight cors
app.options('*', cors());

// Implement middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '1mb' }));

// Implement route endpoints
app.use(`${prefix}/data`, appRouter); // router for application data
app.use(`${prefix}/api`, integrationRouter); // router for integrations

// serve static external files
app.use(`${prefix}/external`, express.static(publicDir.externalDir));
app.use(`${prefix}/external`, (req, res) => {
  // if the user reaches to the root, we show a 404
  res.status(404).send(`${req.originalUrl} not found`);
});
app.use(`${prefix}/user`, express.static(publicDir.userDir));

// serve static - react, in dev/test mode we fetch the React app from module
app.use(
  prefix,
  expressStaticGzip(srcDir.clientDir, {
    enableBrotli: true,
    orderPreference: ['br'],
    // when we build the client the file names contain a unique hash for the build
    // this allows us to use the immutable tag
    // as the contents of a build file will never change without also changing its name
    // meaning that the client does not need to revalidate the contents with the server
    serveStatic: {
      etag: false,
      lastModified: false,
      immutable: true,
      maxAge: '1y',
      setHeaders: (res, file) => {
        // make sure the HTML files are always revalidated
        if (extname(file) === '.html') {
          res.setHeader('Cache-Control', 'public, max-age=0');
        }
      },
    },
  }),
);

app.get(`${prefix}/*`, (_req, res) => {
  res.sendFile(srcFiles.clientIndexHtml);
});

// Implement catch all
app.use((_error, response) => {
  response.status(400).send('Unhandled request');
});

/***************  START SERVICES ***************/

/* Override config
 * ----------------
 *
 * Configuration of services comes from app general config
 * It can be overridden here by the settings in the db
 * It can also be overridden on call
 *
 * Start order
 * ----------------
 *
 * The services need to be started in a certain order,
 * the enum below enforces that
 */

enum OntimeStartOrder {
  Error,
  InitAssets,
  InitServer,
  InitIO,
}

let step = OntimeStartOrder.InitAssets;
let expressServer: Server | null = null;

const checkStart = (currentState: OntimeStartOrder) => {
  if (step !== currentState) {
    step = OntimeStartOrder.Error;
    throw new Error('Init order error: initAssets > startServer > startOsc > startIntegrations');
  } else {
    if (step === 1 || step === 2) {
      step = step + 1;
    }
  }
};

export const initAssets = async () => {
  checkStart(OntimeStartOrder.InitAssets);
  await clearUploadfolder();
  populateStyles();
  populateDemo();
  const project = await initialiseProject();
  logger.info(LogOrigin.Server, `Initialised Ontime with ${project}`);
};

/**
 * Starts servers
 */
export const startServer = async (
  escalateErrorFn?: (error: string) => void,
): Promise<{ message: string; serverPort: number; portError: boolean }> => {
  checkStart(OntimeStartOrder.InitServer);
  const settings = getDataProvider().getSettings();
  const { serverPort: desiredPort } = settings;

  expressServer = http.createServer(app);

  // the express server must be started before the socket otherwise the on error eventlissner will not attach properly
  const resultPort = await serverTryDesiredPort(expressServer, desiredPort);
  const portError = resultPort !== desiredPort;
  await getDataProvider().setSettings({ ...settings, serverPort: resultPort });

  socket.init(expressServer, prefix);

  /**
   * Module initialises the services and provides initial payload for the store
   */
  const state = getState();
  eventStore.init({
    clock: state.clock,
    timer: state.timer,
    onAir: state.timer.playback !== Playback.Stop,
    message: messageService.getState(),
    runtime: state.runtime,
    eventNow: state.eventNow,
    currentBlock: {
      block: null,
      startedAt: null,
    },
    publicEventNow: state.publicEventNow,
    eventNext: state.eventNext,
    publicEventNext: state.publicEventNext,
    auxtimer1: {
      duration: timerConfig.auxTimerDefault,
      current: timerConfig.auxTimerDefault,
      playback: SimplePlayback.Stop,
      direction: SimpleDirection.CountDown,
    },
    ping: -1,
  });

  // initialise logging service, escalateErrorFn is only exists in electron
  logger.init(escalateErrorFn);

  // initialise rundown service
  const persistedRundown = getDataProvider().getRundown();
  const persistedCustomFields = getDataProvider().getCustomFields();
  initRundown(persistedRundown, persistedCustomFields);

  // load restore point if it exists
  const maybeRestorePoint = await restoreService.load();

  // TODO: pass event store to rundownservice
  runtimeService.init(maybeRestorePoint);

  const nif = getNetworkInterfaces();
  consoleSuccess(`Local: http://localhost:${resultPort}${prefix}/editor`);
  for (const key in nif) {
    const address = nif[key].address;
    consoleSuccess(`Network: http://${address}:${resultPort}${prefix}/editor`);
  }

  const returnMessage = `Ontime is listening on port ${resultPort}`;
  logger.info(LogOrigin.Server, returnMessage);

  return {
    message: returnMessage,
    serverPort: resultPort,
    portError,
  };
};

/**
 * starts integrations
 */
export const startIntegrations = async () => {
  checkStart(OntimeStartOrder.InitIO);

  // if a config is not provided, we use the persisted one
  const { osc, http } = getDataProvider().getData();

  if (http) {
    logger.info(LogOrigin.Tx, 'Initialising HTTP Integration...');
    try {
      httpIntegration.init(http);
      integrationService.register(httpIntegration);
    } catch (error) {
      logger.error(LogOrigin.Tx, `HTTP Integration initialisation failed: ${error}`);
    }
  }

  if (isOntimeCloud) {
    logger.info(LogOrigin.Tx, 'Skipping OSC in Cloud environment...');
    return;
  }

  if (osc) {
    logger.info(LogOrigin.Tx, 'Initialising OSC Integration...');
    try {
      oscIntegration.init(osc);
      integrationService.register(oscIntegration);
    } catch (error) {
      logger.error(LogOrigin.Tx, 'OSC Integration initialisation failed');
    }
  }
};

/**
 * @description clean shutdown app services
 * @param {number} exitCode
 * @return {Promise<void>}
 */
export const shutdown = async (exitCode = 0) => {
  consoleHighlight(`Ontime shutting down with code ${exitCode}`);

  // clear the restore file if it was a normal exit
  // 0 means it was a SIGNAL
  // 1 means crash -> keep the file
  // 2 means dev crash -> do nothing
  // 99 means there was a shutdown request from the UI
  if (exitCode === 0 || exitCode === 99) {
    await restoreService.clear();
  }

  expressServer?.close();
  runtimeService.shutdown();
  integrationService.shutdown();
  logger.shutdown();
  socket.shutdown();
  process.exit(exitCode);
};

process.on('exit', (code) => consoleHighlight(`Ontime shutdown with code: ${code}`));

process.on('unhandledRejection', async (error) => {
  if (!isProduction && error instanceof Error && error.stack) {
    consoleError(error.stack);
  }
  generateCrashReport(error);
  logger.crash(LogOrigin.Server, `Uncaught rejection | ${error}`);
  await shutdown(1);
});

process.on('uncaughtException', async (error) => {
  if (!isProduction && error instanceof Error && error.stack) {
    consoleError(error.stack);
  }
  generateCrashReport(error);
  logger.crash(LogOrigin.Server, `Uncaught exception | ${error}`);
  await shutdown(1);
});

// register shutdown signals
process.once('SIGHUP', async () => shutdown(0));
process.once('SIGINT', async () => shutdown(0));
process.once('SIGTERM', async () => shutdown(0));

/**
 * @description tries to open the server with the desired port, and if getting a `EADDRINUSE` will change to an efemeral port
 * @param {http.Server}server http server object
 * @param {number}desiredPort the desired port
 * @returns {number} the resulting port number
 * @throws any other server errors will result in a throw
 */
async function serverTryDesiredPort(server: http.Server, desiredPort: number): Promise<number> {
  return new Promise((res) => {
    expressServer.once('error', (e) => {
      if (testForPortInUser(e)) {
        logger.error(LogOrigin.Server, `Failed open the desired port: ${desiredPort} | to moving to Ephemeral port`);
        server.listen(0, '0.0.0.0', () => {
          // @ts-expect-error TODO: find proper documentation for this api
          const port: number = server.address().port;
          res(port);
        });
      } else {
        throw e;
      }
    });
    server.listen(desiredPort, '0.0.0.0', () => {
      // @ts-expect-error TODO: find proper documentation for this api
      const port: number = server.address().port;
      res(port);
    });
  });
}

function testForPortInUser(err: unknown) {
  if (typeof err === 'object' && 'code' in err && err.code === 'EADDRINUSE') {
    return true;
  }
  return false;
}
