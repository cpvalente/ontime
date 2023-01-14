import { existsSync, mkdirSync } from 'fs';
import path from 'path';

/**
 * @description Creates a directory if it doesnt exist
 * @param directory
 */
export function ensureDirectory(directory) {
  if (!existsSync(directory)) {
    try {
      mkdirSync(directory, { recursive: true });
    } catch (err) {
      throw new Error(`Could not create directory: ${err}`);
    }
  }
}

/**
 * @description Returns public path depending on OS
 * @return {string|*}
 */
export function getAppDataPath() {
  // handle docker
  if (process.env.ONTIME_DATA) {
    return path.join(process.env.ONTIME_DATA);
  }

  switch (process.platform) {
    case 'darwin': {
      return path.join(process.env.HOME, 'Library', 'Application Support', 'Ontime');
    }
    case 'win32': {
      return path.join(process.env.APPDATA, 'Ontime');
    }
    case 'linux': {
      return path.join(process.env.HOME, '.Ontime');
    }
    default: {
      throw new Error('Could not resolve public folder for platform');
    }
  }
}
