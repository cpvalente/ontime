export type CustomFieldKey = string;

type CustomFieldBase = {
  key: CustomFieldKey;
  label: string;
  colour: string;
};

/** A choice of an option field, entries hold its label */
export type CustomFieldOption = {
  label: string;
  colour: string;
};

/**
 * A custom field, one member per type
 * a type which needs its own settings adds them to its member
 */
export type CustomField =
  | (CustomFieldBase & { type: 'text' })
  | (CustomFieldBase & { type: 'image' })
  | (CustomFieldBase & { type: 'option'; options: CustomFieldOption[] });
export type CustomFieldType = CustomField['type'];

/** The project custom fields, in the user defined order */
export type CustomFields = CustomField[];

/** Values an entry holds for the custom fields, by field key */
export type EntryCustomFields = Record<CustomFieldKey, string>;

/**
 * Changes to an existing field, its type cannot change
 * options replaces the list of an option field, renamedOptions maps old labels to new ones
 * previousOptions are the labels the change started from, the edit is refused if the field no longer holds them
 */
export type CustomFieldPatch = Partial<Pick<CustomFieldBase, 'label' | 'colour'>> & {
  options?: CustomFieldOption[];
  renamedOptions?: Record<string, string>;
  previousOptions?: string[];
};

type WithoutKey<T> = T extends unknown ? Omit<T, 'key'> : never;
/** A field to create, its key comes from the label */
export type NewCustomField = WithoutKey<CustomField>;
