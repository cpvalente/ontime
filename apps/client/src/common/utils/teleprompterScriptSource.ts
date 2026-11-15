import type { CustomFields } from 'ontime-types';
import { customFieldOfScriptSource, findCustomField, scriptSourceOfCustomField } from 'ontime-utils';

export function makeScriptSourceOptions(customFields: CustomFields): { value: string; label: string }[] {
  return [
    { value: 'note', label: 'Note' },
    { value: 'title', label: 'Title' },
    ...customFields
      .filter((field) => field.type === 'text')
      .map((field) => ({ value: scriptSourceOfCustomField(field.key), label: field.label })),
  ];
}

export function getScriptSourceLabel(source: string, customFields: CustomFields): string {
  if (source === 'note') return 'Note';
  if (source === 'title') return 'Title';
  const key = customFieldOfScriptSource(source);
  return (key !== null && findCustomField(customFields, key)?.label) || source;
}
