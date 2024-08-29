export type CustomFieldLabel = string;

export enum CustomFieldType {
  String = 'string',
  Markdown = 'markdown',
}

export type CustomField = {
  type: CustomFieldType;
  colour: string;
  label: CustomFieldLabel;
};

export type CustomFields = Record<CustomFieldLabel, CustomField>;
export type EventCustomFields = Record<CustomFieldLabel, string>;
