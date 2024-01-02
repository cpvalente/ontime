import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join } from 'path';

import { getAppDataPath } from '../setup.js';

interface Config {
  lastLoadedProject: string;
}

class ConfigService {
  private config: Low<Config>;
  private configPath: string;

  constructor() {
    this.configPath = join(getAppDataPath(), 'config.json');
    const adapter = new JSONFile<Config>(this.configPath);
    this.config = new Low<Config>(adapter, null);

    this.init();
  }

  private async init() {
    await this.config.read();
    await this.config.write();
  }

  async getConfig(): Promise<Config> {
    await this.config.read();
    return this.config.data;
  }

  async updateDatabaseConfig(filename: string): Promise<void> {
    if (process.env.IS_TEST) return;

    this.config.data.lastLoadedProject = filename;
    await this.config.write();
  }
}

export const configService = new ConfigService();
