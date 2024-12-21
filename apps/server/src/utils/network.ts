import { LogOrigin } from 'ontime-types';
import { logger } from '../classes/Logger.js';
import { isDocker } from '../externals.js';
import http from 'http';

import { networkInterfaces } from 'os';

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
 * @description tries to open the server with the desired port, and if getting a `EADDRINUSE` will change to an efemeral port
 * @param {http.Server}server http server object
 * @param {number}desiredPort the desired port
 * @returns {number} the resulting port number
 * @throws any other server errors will result in a throw
 */
export async function serverTryDesiredPort(server: http.Server, desiredPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    server.once('error', (e) => {
      if (isDocker) reject('test rejection'); // we should only move ports if we are in a desktop environment
      if (testForPortInUser(e)) {
        server.listen(0, '0.0.0.0', () => {
          const address = server.address();
          if (typeof address !== 'object') {
            reject('unknown port type, can not proceed');
            return; // the return is needed here to let TS know that we wont continue
          }
          const port = address.port;
          logger.error(
            LogOrigin.Server,
            `Failed open the desired port: ${desiredPort} \nMoved to an Ephemeral port: ${port}`,
            true,
          );

          resolve(port);
        });
      } else {
        throw e;
      }
    });
    server.listen(desiredPort, '0.0.0.0', () => {
      const address = server.address();
      if (typeof address !== 'object') {
        reject('unknown port type, can not proceed');
        return; // the return is needed here to let TS know that we wont continue
      }
      const port = address.port;
      resolve(port);
    });
  });
}

function testForPortInUser(err: unknown) {
  if (typeof err === 'object' && 'code' in err && err.code === 'EADDRINUSE') {
    return true;
  }
  return false;
}
