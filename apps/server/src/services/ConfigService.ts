import { readFileSync, writeFileSync } from 'fs';
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
  private configPath: string;
  private config: Config;

  constructor() {
    this.configPath = this.getConfigPath();

    try {
      this.config = JSON.parse(readFileSync(this.configPath, 'utf8'));
    } catch (err) {
      this.createConfig();
    }
  }

  private createConfig(): void {
    this.config = defaultConfig;

    this.saveConfig();
  }

  private getConfigPath(): string {
    return join(getAppDataPath(), 'config.json');
  }

  getConfig(): Config {
    return this.config;
  }

  updateDatabaseConfig(directory: string, filename: string): void {
    if (process.env.IS_TEST) return;

    this.config.database.directory = directory;
    this.config.database.filename = filename;
    this.saveConfig();
  }

  private saveConfig(): void {
    writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
  }
}

export const configService = new ConfigService();
