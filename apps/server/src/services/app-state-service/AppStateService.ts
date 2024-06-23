import { Low } from 'lowdb';
import { JSONFilePreset } from 'lowdb/node';

import { isTest } from '../../setup/index.js';

interface Config {
  lastLoadedProject: string;
}

/**
 * Service manages Ontime's runtime memory between boots
 */

class AppStateService {
  private config: Low<Config>;
  private hasInit = false;

  async init(path: string) {
    this.config = await JSONFilePreset(path, { lastLoadedProject: '' });
    this.hasInit = true;
  }

  async get(path: string): Promise<Config> {
    if (!this.hasInit) {
      await this.init(path);
    }
    return this.config.data;
  }

  async updateDatabaseConfig(path: string, filename: string): Promise<void> {
    if (isTest) return;

    if (!this.hasInit) {
      await this.init(path);
    }

    this.config.data.lastLoadedProject = filename;
    await this.config.write();
  }
}

export const appStateService = new AppStateService();
