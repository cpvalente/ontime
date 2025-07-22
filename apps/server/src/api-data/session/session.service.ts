import { GetInfo, LinkOptions, OntimeView, SessionStats } from 'ontime-types';

import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { publicDir } from '../../setup/index.js';
import { socket } from '../../adapters/WebsocketAdapter.js';
import { getLastRequest } from '../../api-integration/integration.controller.js';
import { getCurrentProject } from '../../services/project-service/ProjectService.js';
import { runtimeService } from '../../services/runtime-service/RuntimeService.js';
import { getNetworkInterfaces } from '../../utils/network.js';
import { getTimezoneLabel } from '../../utils/time.js';
import { password, routerPrefix } from '../../externals.js';
import { hashPassword } from '../../utils/hash.js';
import { ONTIME_VERSION } from '../../ONTIME_VERSION.js';

const startedAt = new Date();

/** Gathers information related to runtime */
export async function getSessionStats(): Promise<SessionStats> {
  const { connectedClients, lastConnection } = socket.getStats();
  const lastRequest = getLastRequest();
  const { filename } = await getCurrentProject();
  const { playback } = runtimeService.getRuntimeState();

  return {
    startedAt: startedAt.toISOString(),
    connectedClients,
    lastConnection: lastConnection !== null ? lastConnection.toISOString() : null,
    lastRequest: lastRequest !== null ? lastRequest.toISOString() : null,
    projectName: filename,
    playback,
    timezone: getTimezoneLabel(startedAt),
    version: ONTIME_VERSION,
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
export function generateShareUrl(
  baseUrl: string,
  canonicalPath: string,
  { authenticate, lockConfig, lockNav, preset, prefix = routerPrefix, hash = hashedPassword }: LinkOptions,
): URL {
  const url = new URL(baseUrl);

  // if the config is locked and we are in a preset, we hide the canonical path
  const shouldMaskCanonical = Boolean(preset) && (canonicalPath === OntimeView.Cuesheet || lockConfig);
  const maybePresetPath = shouldMaskCanonical ? `preset/${preset}` : canonicalPath;
  url.pathname = prefix ? `${prefix}/${maybePresetPath}` : maybePresetPath;

  if (authenticate && hash) {
    url.searchParams.append('token', hash);
  }

  // TODO: can we make this less obvious eg: n=1
  if (lockNav) {
    url.searchParams.append('lock', 'true');
  }

  // for unlocked presets we keep the preset reference as a parameter
  if (!shouldMaskCanonical && preset) {
    url.searchParams.append('alias', preset);
  }

  return url;
}
