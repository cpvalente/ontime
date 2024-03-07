import { boolean, minLength, object, Output, string, toTrimmed } from 'valibot';

//TODO: the alias and path should be url safe and not collide with other ontime functions
export const AliasSchema = object({
  enabled: boolean(),
  alias: string([toTrimmed(), minLength(1, 'An alias must be provided')]),
  pathAndParams: string([toTrimmed(), minLength(1, 'A path must be provided')]),
});

export type Alias = Output<typeof AliasSchema>;
