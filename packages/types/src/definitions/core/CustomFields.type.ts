export type CustomFieldLabel = string;

export type CustomField = {
  type: 'string';
  colour: string;
  label: CustomFieldLabel;
};

export type CustomFields = Record<CustomFieldLabel, CustomField>;
export type EventCustomFields = Record<CustomFieldLabel, { value: string }>;
