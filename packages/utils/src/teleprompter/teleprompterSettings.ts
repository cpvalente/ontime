import type { CustomFieldKey, TeleprompterSettings } from 'ontime-types';

export const teleprompterCharsPerLine = {
  min: 10,
  max: 80,
} as const;

export const defaultTeleprompterSettings: Readonly<TeleprompterSettings> = {
  script: 'note',
  charsPerLine: 32,
  heading: 'title',
};

/**
 * Script sources store a custom field as custom-{key}
 * Only these two helpers know it, so the field ids planned for custom fields change it in one place
 */
const customFieldPrefix = 'custom-';

/** The script source which reads a custom field */
export function scriptSourceOfCustomField(key: CustomFieldKey): string {
  return `${customFieldPrefix}${key}`;
}

/** The custom field a script source reads, or null for the note, the title or anything else */
export function customFieldOfScriptSource(source: string): CustomFieldKey | null {
  return source.startsWith(customFieldPrefix) ? source.slice(customFieldPrefix.length) : null;
}
