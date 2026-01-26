import { AddressInfo } from 'net';
import { isDocker } from '../../setup/environment.js';

/**
 * Checks whether a given error is a port in use error
 */
export function isPortInUseError(err: Error): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 'EADDRINUSE';
}

/**
 * Guard verifies that the given address is a usable AddressInfo object
 */
export function isAddressInfo(address: string | AddressInfo | null): address is AddressInfo {
  return typeof address === 'object' && address !== null;
}

export function canChangePort(): boolean {
  return !isDocker;
}
