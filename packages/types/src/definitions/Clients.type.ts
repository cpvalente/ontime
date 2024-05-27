export type CustomFieldLabel = string;

export enum ClientTypes {
  Unknown = 'unknown',
  Ontime = 'ontime',
}

export type Client = {
  name: string;
  type: ClientTypes;
  identify: boolean;
};

export type Clients = Record<string, Client>;
