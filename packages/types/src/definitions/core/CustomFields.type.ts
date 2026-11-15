export type CustomFieldKey = string;

type CustomFieldBase = {
  key: CustomFieldKey;
  label: string;
  colour: string;
};

/**
 * A custom field, one member per type
 * a type which needs its own settings adds them to its member, eg: { type: 'option'; options: string[] }
 */
export type CustomField = (CustomFieldBase & { type: 'text' }) | (CustomFieldBase & { type: 'image' });
export type CustomFieldType = CustomField['type'];

/** The project custom fields, in the user defined order */
export type CustomFields = CustomField[];

/** Values an entry holds for the custom fields, by field key */
export type EntryCustomFields = Record<CustomFieldKey, string>;

/** Changes to an existing field, its type cannot change */
export type CustomFieldPatch = Partial<Pick<CustomField, 'label' | 'colour'>>;

type WithoutKey<T> = T extends unknown ? Omit<T, 'key'> : never;
/** A field to create, its key comes from the label */
export type NewCustomField = WithoutKey<CustomField>;
