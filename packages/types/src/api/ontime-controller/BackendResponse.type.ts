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

export type PlanTimezone = {
  /** IANA name of the timezone the rundown is planned in */
  zone: string;
  /** UTC offset of the zone at the reference date, in minutes, positive east of UTC */
  utcOffsetMinutes: number;
  /** ISO 8601 instant the offset was resolved at, anchors DST for display conversions */
  referenceDate: string;
};

export interface SessionStats {
  startedAt: string;
  connectedClients: number;
  lastConnection: MaybeString;
  lastRequest: MaybeString;
  projectName: string;
  playback: Playback;
  timezone: string;
  planTimezone: PlanTimezone;
  version: string;
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
