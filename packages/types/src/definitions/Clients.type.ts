export type ClientType = 'unknown' | 'ontime' | 'sync' | string;

export type Client = {
  name: string;
  type: ClientType;
  identify: boolean;
  origin: string;
  path: string;
};

export type ClientList = Record<string, Client>;
