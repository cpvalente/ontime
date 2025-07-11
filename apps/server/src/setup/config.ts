import { MILLIS_PER_MINUTE } from 'ontime-utils';

export const timerConfig = {
  skipLimit: 1000, // threshold of skip for recalculating, values lower than updateRate can cause issues with rolling over midnight
  updateRate: 32, // how often do we update the timer
  notificationRate: 1000, // how often do we notify clients and integrations
  triggerAhead: 10, // how far ahead do we trigger the end event
  auxTimerDefault: 5 * MILLIS_PER_MINUTE, // default aux timer duration
};

export const config = {
  appState: 'app-state.json',
  corrupt: 'corrupt files',
  migrate: 'migrated files',
  crash: 'crash logs',
  demoProject: 'demo project.json',
  newProject: 'new project.json',
  database: {
    directory: 'db',
    filename: 'db.json',
  },
  external: 'external',
  demo: 'demo',
  projects: 'projects',
  sheets: {
    directory: 'sheets',
  },
  restoreFile: 'ontime.restore',
  user: 'user',
  styles: {
    directory: 'styles',
    filename: 'override.css',
  },
  uploads: 'uploads',
  logo: 'logo',
  translations: {
    directory: 'translations',
    filename: 'translations.json',
  }
};
