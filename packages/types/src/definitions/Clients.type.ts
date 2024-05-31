export type CustomFieldLabel = string;

export enum ClientTypes {
  Unknown = 'unknown',
  Ontime = 'ontime',
}

export type Client = {
  name: string;
  type: ClientTypes | string;
  identify: boolean;
  path: string;
};

export type ClientList = Record<string, Client>;
