import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

import { appStatePath, isTest } from '../../setup/index.js';

interface Config {
  lastLoadedProject: string;
}

/**
 * Manages Ontime's runtime memory between boots
 */

class AppState {
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

  private async get(): Promise<Config> {
    if (!this.didInit) {
      await this.init();
    }
    await this.config.read();
    return this.config.data;
  }

  async isLastLoadedProject(projectName: string): Promise<boolean> {
    const lastLoaded = await this.getLastLoadedProject();
    return lastLoaded === projectName;
  }

  async getLastLoadedProject(): Promise<string> {
    const data = await this.get();
    return data.lastLoadedProject;
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

export const appStateProvider = new AppState(appStatePath);
