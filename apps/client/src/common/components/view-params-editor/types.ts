import { OptionTitle } from './constants';

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

type MultiselectOption = { value: string; label: string; colour: string };
export type MultiselectOptions = Record<string, MultiselectOption>;
type MultiOptionsField = {
  type: 'multi-option';
  values: MultiselectOptions;
  defaultValue?: string;
};

type StringField = { type: 'string'; defaultValue?: string; prefix?: string; placeholder?: string };
type NumberField = { type: 'number'; defaultValue?: number; prefix?: string; placeholder?: string };
type BooleanField = { type: 'boolean'; defaultValue: boolean };
type ColourField = { type: 'colour'; defaultValue: string; placeholder?: string };
type PersistedField = { type: 'persist'; defaultValue?: string; value: string };

export type ParamField = BaseField &
  (OptionsField | MultiOptionsField | StringField | NumberField | BooleanField | ColourField | PersistedField);

export type ViewOption = {
  title: OptionTitle;
  options: ParamField[];
  collapsible?: boolean;
};
