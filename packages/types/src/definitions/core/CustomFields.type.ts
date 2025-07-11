export type CustomFieldKey = string;

export type CustomField = {
  type: 'text' | 'image';
  colour: string;
  label: string;
};

export type CustomFields = Record<CustomFieldKey, CustomField>;
export type EntryCustomFields = Record<CustomFieldKey, string>;
