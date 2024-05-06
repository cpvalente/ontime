export type CustomFieldLabel = string;

export enum ClientTypes {
  Unknown = 'unknown',
  React = 'react',
}

export type Client = {
  name: string;
  type: ClientTypes;
  identify: boolean;
  redirect: string;
  rename: string;
};

export type Clients = Record<string, Client>;
