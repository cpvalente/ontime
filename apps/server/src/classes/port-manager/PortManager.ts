import { Server } from 'http';
import { config } from '../../setup/config.js';
import { envPort, isOntimeCloud } from '../../setup/environment.js';
import * as appState from '../../services/app-state-service/AppStateService.js';
import { logger } from '../Logger.js';
import { LogOrigin, MaybeNumber } from 'ontime-types';
import { canChangePort, isAddressInfo, isPortInUseError } from './PortManager.utils.js';
import { shouldCrashDev } from '../../utils/development.js';

class PortManager {
  private static port: number;
  private static pendingRestart = false;
  private static newPort: MaybeNumber = null;

  public getPort() {
    return {
      port: PortManager.port,
      pendingRestart: PortManager.pendingRestart,
      newPort: PortManager.newPort,
    };
  }

  public changePort(newPort: number): void {
    if (!canChangePort()) return;
    if (PortManager.port === newPort) return;
    PortManager.newPort = newPort;
    PortManager.pendingRestart = true;
  }

  public migratePortFromProjectFile(port: number) {
    shouldCrashDev(
      PortManager.port !== undefined,
      'this function should not be called after `PortManager.port` has been initialized',
    );
    appState.setServerPort(port);
  }

  public async shutdown() {
    if (PortManager.pendingRestart && PortManager.newPort) {
      logger.info(
        LogOrigin.Server,
        `A port change to ${PortManager.newPort} is pending and will take effect on next start`,
      );
      await appState.setServerPort(PortManager.newPort);
    }
  }

  /**
   * @description tries to open the server with the desired port, and if getting a `EADDRINUSE` will change to an random port assigned by the OS
   * @param {http.Server} server http server object
   * @returns {Promise<number>} the resulting port number
   * @throws any other server errors will result in a throw
   */
  public async attachServer(server: Server): Promise<number> {
    if (isOntimeCloud) {
      PortManager.port = await this.forceCloudPort(server);
    } else {
      PortManager.port = this.parsePort(envPort) || (await appState.getServerPort()) || config.defaultServerPort;
      PortManager.port = await this.tryServerPort(server);
    }
    appState.setServerPort(PortManager.port);
    return PortManager.port;
  }

  private parsePort(port: string | undefined) {
    if (typeof port !== 'string') return null;
    if (port === '') return null;
    const maybePort = Number(port);
    if (isNaN(maybePort)) return null;
    return maybePort;
  }

  private async tryServerPort(server: Server): Promise<number> {
    return new Promise((resolve, reject) => {
      server.once('error', (error) => {
        // we should only move ports if we are in a desktop environment
        if (!canChangePort()) {
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
            `Failed open the desired port: ${PortManager.port} \nMoved to an Ephemeral port: ${address.port}`,
            true,
          );

          resolve(address.port);
        });
      });

      server.listen(PortManager.port, '0.0.0.0', () => {
        const address = server.address();
        if (!isAddressInfo(address)) {
          reject(new Error('Unknown port type, unable to proceed'));
          return;
        }
        resolve(address.port);
      });
    });
  }

  private forceCloudPort(server: Server): Promise<number> {
    return new Promise((resolve, reject) => {
      server.once('error', (error) => {
        reject(error);
      });
      server.listen(config.defaultServerPort, '0.0.0.0', () => {
        const address = server.address();
        if (!isAddressInfo(address)) {
          reject(new Error('Unknown port type, unable to proceed'));
          return;
        }
        resolve(address.port);
      });
    });
  }
}

export const portManager = new PortManager();
