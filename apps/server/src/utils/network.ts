import { LogOrigin } from 'ontime-types';

import type { Server } from 'http';
import { networkInterfaces } from 'os';
import type { AddressInfo } from 'net';

import { isDocker, isOntimeCloud, isProduction } from '../externals.js';
import { logger } from '../classes/Logger.js';

/**
 * @description Gets information on IPV4 non-internal interfaces
 * @returns {array} - Array of objects {name: ip}
 */
export function getNetworkInterfaces(): { name: string; address: string }[] {
  const nets = networkInterfaces();
  const results: { name: string; address: string }[] = [];

  for (const name of Object.keys(nets)) {
    const netObjects = nets[name];
    if (!netObjects) {
      continue;
    }
    for (const net of netObjects) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        results.push({
          name,
          address: net.address,
        });
      }
    }
  }

  return results;
}

/**
 * @description tries to open the server with the desired port, and if getting a `EADDRINUSE` will change to an random port assigned by the OS
 * @param {http.Server} server http server object
 * @param {number} desiredPort the desired port
 * @returns {number} the resulting port number
 * @throws any other server errors will result in a throw
 */
export function serverTryDesiredPort(server: Server, desiredPort: number): Promise<number> {
  if (isOntimeCloud) {
    return forceCloudPort(server);
  }

  return new Promise((resolve, reject) => {
    server.once('error', (error) => {
      // we should only move ports if we are in a desktop environment
      if (isDocker || !isProduction) {
        reject(error);
        return;
      }

      if (!isPortInUseError(error)) {
        reject(error);
        return;
      }

      // if we get an address in use error, we will try to open the server in an ephemeral port
      // port 0 will assign an ephemeral port
      server.listen(0, '0.0.0.0', () => {
        const address = server.address();
        if (!isAddressInfo(address)) {
          reject(new Error('Unknown port type, unable to proceed'));
          return;
        }
        logger.error(
          LogOrigin.Server,
          `Failed open the desired port: ${desiredPort} \nMoved to an Ephemeral port: ${address.port}`,
          true,
        );

        resolve(address.port);
      });
    });

    server.listen(desiredPort, '0.0.0.0', () => {
      const address = server.address();
      if (!isAddressInfo(address)) {
        reject(new Error('Unknown port type, unable to proceed'));
        return;
      }
      resolve(address.port);
    });
  });
}

function forceCloudPort(server: Server): Promise<number> {
  return new Promise((resolve, reject) => {
    server.listen(4001, '0.0.0.0', () => {
      const address = server.address();
      if (!isAddressInfo(address)) {
        reject(new Error('Unknown port type, unable to proceed'));
        return;
      }
      resolve(address.port);
    });
  });
}

/**
 * Guard verifies that the given address is a usable AddressInfo object
 */
function isAddressInfo(address: string | AddressInfo | null): address is AddressInfo {
  return typeof address === 'object' && address !== null;
}

/**
 * Checks whether a given error is a port in use error
 */
function isPortInUseError(err: Error): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 'EADDRINUSE';
}
