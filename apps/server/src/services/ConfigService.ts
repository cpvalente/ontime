import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join } from 'path';

import { getAppDataPath } from '../setup.js';
import { defaultConfig } from '../config/defaultConfig.js';

interface Config {
  database: {
    testdb: string;
    directory: string;
    filename: string;
  };
  styles: {
    directory: string;
    filename: string;
  };
  restoreFile: string;
}

export class ConfigService {
  private config: Low<Config>;
  private configPath: string;

  constructor() {
    this.configPath = join(getAppDataPath(), 'config.json');
    const adapter = new JSONFile<Config>(this.configPath);
    this.config = new Low<Config>(adapter);

    this.init();
  }

  private async init() {
    await this.config.read();
    this.config.data ||= defaultConfig;
    await this.config.write();
  }

  async getConfig(): Promise<Config> {
    await this.config.read();
    return this.config.data;
  }

  async updateDatabaseConfig(directory: string, filename: string): Promise<void> {
    if (process.env.IS_TEST) return;

    this.config.data.database.directory = directory;
    this.config.data.database.filename = filename;
    await this.config.write();
  }
}

export const configService = new ConfigService();
