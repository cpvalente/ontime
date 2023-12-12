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
type StringField = { type: 'string'; defaultValue?: string; prefix?: string; placeholder?: string };
type NumberField = { type: 'number'; defaultValue?: number; prefix?: string; placeholder?: string };
type BooleanField = { type: 'boolean'; defaultValue: boolean };

export type ParamField = BaseField & (StringField | BooleanField | NumberField | OptionsField);
