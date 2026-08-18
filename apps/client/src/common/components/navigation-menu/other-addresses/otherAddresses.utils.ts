import { type NetworkInterface } from 'ontime-types';

/** Returns network addresses other than the localhost address injected by the info endpoint. */
export function getExternalInterfaces(interfaces: NetworkInterface[]) {
  return interfaces.filter((networkInterface) => networkInterface.name !== 'localhost');
}
