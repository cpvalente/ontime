import { OptionTitle } from './constants';

type BaseField = {
  id: string;
  title: string;
  description: string;
  /**
   * Keeps the field enabled only while an option field of the form holds one of the values
   * A disabled field shows the reason instead of its description, and is not applied
   */
  enabledWhen?: { id: string; values: string[]; reason: string };
};

type OptionsField = {
  type: 'option';
  values: { value: string; label: string }[];
  defaultValue?: string;
};

export type MultiselectOption = { value: string; label: string; colour: string };
type MultiOptionsField = {
  type: 'multi-option';
  values: MultiselectOption[];
  defaultValue?: string[];
};

type StringField = { type: 'string'; defaultValue?: string; placeholder?: string };
type NumberField = { type: 'number'; defaultValue?: number; placeholder?: string };
type BooleanField = { type: 'boolean'; defaultValue: boolean };
type ColourField = { type: 'colour'; defaultValue: string; placeholder?: string };
type PersistedField = { type: 'persist'; defaultValue?: string[]; values: string[] };

export type ParamField = BaseField &
  (OptionsField | MultiOptionsField | StringField | NumberField | BooleanField | ColourField | PersistedField);

export type ViewOption = {
  title: OptionTitle;
  options: ParamField[];
  collapsible?: boolean;
};
