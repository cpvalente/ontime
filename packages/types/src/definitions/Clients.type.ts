export type CustomFieldLabel = string;

export enum ClientTypes {
  Unknown = 'unknown',
  Ontime = 'ontime',
  Companion = 'companion',
  Chataigne = 'chataigne',
}

export type Client = {
  name: string;
  type: ClientTypes;
  identify: boolean;
};

export type Clients = Record<string, Client>;
