export type URLAliasType = {
  enabled: boolean;
  alias: string;
  pathAndParams: string;
};

export const aliasPlaceholder: URLAliasType = {
  enabled: false,
  alias: '',
  pathAndParams: '',
};
