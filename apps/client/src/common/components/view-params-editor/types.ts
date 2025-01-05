type ParamSection = {
  section: string;
};

type BaseField = {
  id: string;
  title: string;
  description: string;
};

type OptionsField = {
  type: 'option';
  values: Record<string, string>;
  defaultValue?: string;
};

type MultiOptionsField = {
  type: 'multi-option';
  values: { value: string; label: string }[];
  defaultValue?: string;
};

type StringField = { type: 'string'; defaultValue?: string; prefix?: string; placeholder?: string };
type NumberField = { type: 'number'; defaultValue?: number; prefix?: string; placeholder?: string };
type BooleanField = { type: 'boolean'; defaultValue: boolean };
type ColourField = { type: 'colour'; defaultValue: string; placeholder?: string };
type PersistedField = { type: 'persist'; defaultValue?: string; value: string };

export type ParamField = BaseField &
  (OptionsField | MultiOptionsField | StringField | NumberField | BooleanField | ColourField | PersistedField);
export type ViewOption = ParamSection | ParamField;

/**
 * Type assertion utility checks whether an entry is a section separator
 */
export function isSection(entry: ViewOption): entry is ParamSection {
  return 'section' in entry;
}
