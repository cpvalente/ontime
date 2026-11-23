export type ClientType = 'unknown' | 'ontime' | string;

export type Client = {
  name: string;
  type: ClientType;
  identify: boolean;
  origin: string;
  path: string;
};

export type ClientList = Record<string, Client>;

/**
 * What a request or a socket may do
 * read: make GET requests and follow the show
 * write: everything, including sending commands
 */
export const Access = {
  read: 'read',
  write: 'write',
} as const;
export type AccessScope = (typeof Access)[keyof typeof Access];
