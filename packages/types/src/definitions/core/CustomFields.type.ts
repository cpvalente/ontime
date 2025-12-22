export type CustomFieldKey = string;

export type CustomFieldTTSSettings = {
  enabled: boolean;
  threshold: number; // seconds
  voice: string; // voice URI or name
  language: string; // language code (e.g., 'en-US', 'en-GB')
};

export type CustomField = {
  type: 'text' | 'image';
  colour: string;
  label: string;
  tts?: CustomFieldTTSSettings;
};

export type CustomFields = Record<CustomFieldKey, CustomField>;
export type EntryCustomFields = Record<CustomFieldKey, string>;
