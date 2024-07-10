import type { OSCSettings } from '../../definitions/core/OscSettings.type.js';
import type { OntimeRundown } from '../../definitions/core/Rundown.type.js';

export type NetworkInterface = {
  name: string;
  address: string;
};

export interface GetInfo {
  networkInterfaces: NetworkInterface[];
  version: string;
  serverPort: number;
  osc: OSCSettings;
  cssOverride: string;
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

export type ErrorResponse = MessageResponse;

export type AuthenticationStatus = 'authenticated' | 'not_authenticated' | 'pending';

export type RundownPaginated = {
  rundown: OntimeRundown;
  total: number;
};
