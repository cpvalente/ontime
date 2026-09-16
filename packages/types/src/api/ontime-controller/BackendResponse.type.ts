import type { Playback } from '../../definitions/runtime/Playback.type.js';
import type { MaybeString } from '../../utils/utils.type.js';

export type NetworkInterface = {
  name: string;
  address: string;
};

export type PortInfo = {
  port: number;
  pendingRestart: boolean;
};

export interface SessionStats {
  startedAt: string;
  connectedClients: number;
  lastConnection: MaybeString;
  /** time the last client disconnected, null if a client was never connected */
  lastDisconnection: MaybeString;
  lastRequest: MaybeString;
  projectName: string;
  playback: Playback;
  timezone: string;
  version: string;
}

/**
 * Whether the instance is currently being used
 * Allows hosted environments to suspend instances which have been left unattended
 */
export interface IdleState {
  idle: boolean;
  /** time since the instance has been idle, null if it is in use */
  idleSince: MaybeString;
}

export interface GetInfo {
  networkInterfaces: NetworkInterface[];
  version: string;
  serverPort: number;
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
