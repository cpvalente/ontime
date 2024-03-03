import { networkInterfaces } from 'os';

/**
 * @description Gets information on IPV4 non-internal interfaces
 * @returns {array} - Array of objects {name: ip}
 */
export function getNetworkInterfaces(): { name: string; address: string }[] {
  const nets = networkInterfaces();
  const results: { name: string; address: string }[] = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
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
