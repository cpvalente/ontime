import { GetInfo, SessionStats } from 'ontime-types';

import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { publicDir } from '../../setup/index.js';
import { socket } from '../../adapters/WebsocketAdapter.js';
import { getLastRequest } from '../../api-integration/integration.controller.js';
import { getLastLoadedProject } from '../../services/app-state-service/AppStateService.js';
import { runtimeService } from '../../services/runtime-service/RuntimeService.js';
import { getNetworkInterfaces } from '../../utils/network.js';

const startedAt = new Date();

/** Gathers information related to runtime */
export async function getSessionStats(): Promise<SessionStats> {
  const { connectedClients, lastConnection } = socket.getStats();
  const lastRequest = getLastRequest();
  const projectName = await getLastLoadedProject();
  const { playback } = runtimeService.getRuntimeState();

  return {
    startedAt: startedAt.toISOString(),
    connectedClients,
    lastConnection: lastConnection !== null ? lastConnection.toISOString() : null,
    lastRequest: lastRequest !== null ? lastRequest.toISOString() : null,
    projectName,
    playback,
    timezone: startedAt.getTimezoneOffset(),
  };
}

/**
 * Adds business logic to gathering data for the info endpoint
 */
export async function getInfo(): Promise<GetInfo> {
  const { version, serverPort } = getDataProvider().getSettings();

  // get nif and inject localhost
  const ni = getNetworkInterfaces();
  ni.unshift({ name: 'localhost', address: '127.0.0.1' });

  return {
    networkInterfaces: ni,
    version,
    serverPort,
    publicDir: publicDir.root,
  };
}
