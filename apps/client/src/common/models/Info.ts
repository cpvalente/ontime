import { GetInfo, Playback, SessionStats } from 'ontime-types';

export const ontimePlaceholderInfo: GetInfo = {
  networkInterfaces: [],
  version: '4.0.0',
  serverPort: 4001,
  publicDir: '',
};

export const ontimePlaceholderSessionStats: SessionStats = {
  startedAt: '',
  connectedClients: 0,
  lastConnection: null,
  lastRequest: null,
  projectName: '',
  playback: Playback.Stop,
  timezone: '',
  version: '4.0.0',
};
