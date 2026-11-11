import type { CustomFields, OrderedCustomFields } from 'ontime-types';
import { customFieldOfScriptSource, scriptSourceOfCustomField } from 'ontime-utils';

/** The fields a teleprompter script can be read from: the note, the title and the text custom fields */
export function makeScriptSourceOptions(customFields: OrderedCustomFields): { value: string; label: string }[] {
  return [
    { value: 'note', label: 'Note' },
    { value: 'title', label: 'Title' },
    ...customFields
      .filter(([, field]) => field.type === 'text')
      .map(([key, field]) => ({ value: scriptSourceOfCustomField(key), label: field.label })),
  ];
}

/** The name of the field a script source reads */
export function getScriptSourceLabel(source: string, customFields: CustomFields): string {
  if (source === 'note') return 'Note';
  if (source === 'title') return 'Title';
  const key = customFieldOfScriptSource(source);
  return (key !== null && customFields[key]?.label) || source;
}
