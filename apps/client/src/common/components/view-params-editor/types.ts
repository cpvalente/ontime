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
  values: Record<string, { value: string; label: string; colour: string }>;
  defaultValue?: string;
};

type StringField = { type: 'string'; defaultValue?: string; prefix?: string; placeholder?: string };
type NumberField = { type: 'number'; defaultValue?: number; prefix?: string; placeholder?: string };
type BooleanField = { type: 'boolean'; defaultValue: boolean };
type PersistedField = { type: 'persist'; defaultValue?: string; value: string };

export type ParamField = BaseField &
  (StringField | BooleanField | NumberField | OptionsField | MultiOptionsField | PersistedField);
export type ViewOption = ParamSection | ParamField;

/**
 * Type assertion utility checks whether an entry is a section separator
 */
export function isSection(entry: ViewOption): entry is ParamSection {
  return 'section' in entry;
}
