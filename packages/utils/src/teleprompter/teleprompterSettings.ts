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
 * Only these two helpers know it, so the format changes in one place
 */
const customFieldPrefix = 'custom-';

/** The script source which reads a custom field */
export function scriptSourceOfCustomField(key: CustomFieldKey): string {
  return `${customFieldPrefix}${key}`;
}

/**
 * A script source follows its custom field when the field's key changes, and falls back to the note when it is deleted
 * @returns the source, unchanged when it reads anything else
 */
export function renameScriptSource(source: string, oldKey: CustomFieldKey, newKey: CustomFieldKey | null): string {
  if (source !== scriptSourceOfCustomField(oldKey)) return source;
  return newKey ? scriptSourceOfCustomField(newKey) : defaultTeleprompterSettings.script;
}

/** The custom field a script source reads, or null for the note, the title or anything else */
export function customFieldOfScriptSource(source: string): CustomFieldKey | null {
  return source.startsWith(customFieldPrefix) ? source.slice(customFieldPrefix.length) : null;
}
