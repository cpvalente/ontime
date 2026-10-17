export type CustomFieldKey = string;

export type CustomField = {
  type: 'text' | 'image';
  colour: string;
  label: string;
};

export type CustomFields = Record<CustomFieldKey, CustomField>;
export type EntryCustomFields = Record<CustomFieldKey, string>;

/** Custom fields as [key, field] pairs, in the project order */
export type OrderedCustomFields = [CustomFieldKey, CustomField][];

/**
 * Project custom fields with their user defined order
 * The order is kept separately since object key order is not reliable for numeric keys
 */
export type ProjectCustomFields = {
  fields: CustomFields;
  order: CustomFieldKey[];
};
