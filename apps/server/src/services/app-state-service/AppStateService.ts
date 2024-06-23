import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

import { appStatePath, isTest } from '../../setup/index.js';

interface Config {
  lastLoadedProject: string;
}

/**
 * Service manages Ontime's runtime memory between boots
 */

class AppStateService {
  private config: Low<Config>;
  private pathToFile: string;
  private didInit = false;

  constructor(appStatePath: string) {
    this.pathToFile = appStatePath;
    const adapter = new JSONFile<Config>(this.pathToFile);
    this.config = new Low<Config>(adapter, null);
  }

  private async init() {
    await this.config.read();
    await this.config.write();
    this.didInit = true;
  }

  async get(): Promise<Config> {
    if (!this.didInit) {
      await this.init();
    }
    await this.config.read();
    return this.config.data;
  }

  async updateDatabaseConfig(filename: string): Promise<void> {
    if (isTest) return;

    if (!this.didInit) {
      await this.init();
    }

    this.config.data.lastLoadedProject = filename;
    await this.config.write();
  }
}

export const appStateService = new AppStateService(appStatePath);
