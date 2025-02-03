import { GetInfo, SessionStats } from 'ontime-types';

import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { publicDir } from '../../setup/index.js';
import { socket } from '../../adapters/WebsocketAdapter.js';
import { getLastRequest } from '../../api-integration/integration.controller.js';
import { getLastLoadedProject } from '../../services/app-state-service/AppStateService.js';
import { runtimeService } from '../../services/runtime-service/RuntimeService.js';
import { getNetworkInterfaces } from '../../utils/network.js';
import { getTimezoneLabel } from '../../utils/time.js';
import { password } from '../../externals.js';
import { hashPassword } from '../../utils/hash.js';

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
    timezone: getTimezoneLabel(startedAt),
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

export const hasPassword = Boolean(password);
export const hashedPassword = hasPassword ? hashPassword(password as string) : undefined;

/**
 * Generates a pre-authenticated URL by injecting a token in the URL params
 */
export function generateAuthenticatedUrl(baseUrl: string, path: string, lock: boolean, authenticate: boolean): URL {
  const url = new URL(path, baseUrl);
  if (authenticate && hashedPassword) {
    url.searchParams.append('token', hashedPassword);
  }
  if (lock) {
    url.searchParams.append('locked', 'true');
  }
  return url;
}
