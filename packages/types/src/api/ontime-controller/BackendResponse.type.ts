import type { Playback } from '../../definitions/runtime/Playback.type.js';
import type { MaybeString } from '../../utils/utils.type.js';

export type NetworkInterface = {
  name: string;
  address: string;
};

export interface SessionStats {
  startedAt: string;
  connectedClients: number;
  lastConnection: MaybeString;
  lastRequest: MaybeString;
  projectName: string;
  playback: Playback;
  timezone: string;
  version: string;
}

export interface GetInfo {
  networkInterfaces: NetworkInterface[];
  version: string;
  publicDir: string;
}

export interface GetUrl {
  url: string;
}

export type ProjectFile = {
  filename: string;
  updatedAt: string;
};

export type ProjectFileList = ProjectFile[];

export type ProjectFileListResponse = {
  files: ProjectFileList;
  lastLoadedProject: string;
};

export type MessageResponse = {
  message: string;
};

export type ProjectLogoResponse = {
  logoFilename: string;
};

export type ErrorResponse = MessageResponse;

export type AuthenticationStatus = 'authenticated' | 'not_authenticated' | 'pending';
