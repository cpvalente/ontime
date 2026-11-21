import type { CustomFields } from 'ontime-types';
import { customFieldOfScriptSource, scriptSourceOfCustomField } from 'ontime-utils';

export function makeScriptSourceOptions(customFields: CustomFields): { value: string; label: string }[] {
  return [
    { value: 'note', label: 'Note' },
    { value: 'title', label: 'Title' },
    ...Object.entries(customFields)
      .filter(([, field]) => field.type === 'text')
      .map(([key, field]) => ({ value: scriptSourceOfCustomField(key), label: field.label })),
  ];
}

export function getScriptSourceLabel(source: string, customFields: CustomFields): string {
  if (source === 'note') return 'Note';
  if (source === 'title') return 'Title';
  const key = customFieldOfScriptSource(source);
  return (key !== null && customFields[key]?.label) || source;
}
