import { GetInfo, IdleState, LinkOptions, OntimeView, Playback, SessionStats } from 'ontime-types';

import { socket } from '../../adapters/WebsocketAdapter.js';
import { getLastRequest } from '../../api-integration/integration.controller.js';
import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { portManager } from '../../classes/port-manager/PortManager.js';
import { password, routerPrefix } from '../../externals.js';
import { ONTIME_VERSION } from '../../ONTIME_VERSION.js';
import { getLastActivity } from '../../services/activity-service/activity.service.js';
import { getCurrentProject } from '../../services/project-service/ProjectService.js';
import { runtimeService } from '../../services/runtime-service/runtime.service.js';
import { publicDir } from '../../setup/index.js';
import { hashPassword } from '../../utils/hash.js';
import { getNetworkInterfaces } from '../../utils/network.js';
import { getTimezoneLabel } from '../../utils/time.js';

const startedAt = new Date();

/** Gathers information related to runtime */
export async function getSessionStats(): Promise<SessionStats> {
  const { connectedClients, lastConnection, lastDisconnection } = socket.getStats();
  const lastRequest = getLastRequest();
  const { filename } = await getCurrentProject();
  const { playback } = runtimeService.getRuntimeState();

  return {
    startedAt: startedAt.toISOString(),
    connectedClients,
    lastConnection: lastConnection !== null ? lastConnection.toISOString() : null,
    lastDisconnection: lastDisconnection !== null ? lastDisconnection.toISOString() : null,
    lastRequest: lastRequest !== null ? lastRequest.toISOString() : null,
    projectName: filename,
    playback,
    timezone: getTimezoneLabel(startedAt),
    version: ONTIME_VERSION,
  };
}

/**
 * Reports whether the instance is currently in use
 *
 * An instance is in use while a client is connected or while a timer is running.
 * Once neither is true, we report the time of the last known interaction so that
 * a hosted environment can decide when a stage has been unattended for long enough
 * to be suspended.
 *
 * Note that we consider Playback.Armed idle: the runtime is restored on startup,
 * so a loaded event survives the instance being stopped and started again.
 */
export function getIdleState(): IdleState {
  const { connectedClients, lastConnection, lastDisconnection } = socket.getStats();
  const { playback } = runtimeService.getRuntimeState();

  const isRunning = playback === Playback.Play || playback === Playback.Pause || playback === Playback.Roll;
  if (connectedClients > 0 || isRunning) {
    return { idle: false, idleSince: null };
  }

  // we are idle since whichever interaction happened last
  const interactions = [lastConnection, lastDisconnection, getLastRequest(), getLastActivity()].filter(
    (date): date is Date => date !== null,
  );
  const idleSince = interactions.length ? new Date(Math.max(...interactions.map((date) => date.getTime()))) : startedAt;

  return { idle: true, idleSince: idleSince.toISOString() };
}

/**
 * Adds business logic to gathering data for the info endpoint
 */
export function getInfo(): GetInfo {
  const { version } = getDataProvider().getSettings();
  const { port } = portManager.getPort();

  // get nif and inject localhost
  const ni = getNetworkInterfaces();
  ni.unshift({ name: 'localhost', address: '127.0.0.1' });

  return {
    networkInterfaces: ni,
    version,
    serverPort: port,
    publicDir: publicDir.root,
  };
}

export const hasPassword = Boolean(password);
export const hashedPassword = hasPassword ? hashPassword(password as string) : undefined;

/**
 * Generates a pre-authenticated URL by injecting a token in the URL params
 */
export function generateShareUrl(
  baseUrl: string,
  canonicalPath: string,
  { authenticate, lockConfig, lockNav, preset, prefix = routerPrefix, hash = hashedPassword }: LinkOptions,
): URL {
  /**
   * URL constructor will throw if given an IP address without protocol
   * for the case of IP addresses, we expect that the base URL provides protocol and port
   * eg: http://192.168.10.1:4001
   */
  const url = new URL(baseUrl);

  // companion links point to the root
  if (canonicalPath !== '<<companion>>') {
    // if the config is locked and we are in a preset, we hide the canonical path
    const shouldMaskPath = Boolean(preset) && (canonicalPath === OntimeView.Cuesheet || lockConfig);
    const maybePresetPath = shouldMaskPath ? `preset/${preset}` : preset || canonicalPath;
    url.pathname = prefix ? `${prefix}/${maybePresetPath}` : maybePresetPath;

    if (lockNav) {
      url.searchParams.append('n', '1');
    }
  }

  if (authenticate && hash) {
    url.searchParams.append('token', hash);
  }

  return url;
}
