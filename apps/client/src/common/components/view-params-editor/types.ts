type BaseField = {
  id: string;
  title: string;
  description: string;
};

type OptionsField = {
  type: 'option';
  values: Record<string, string>;
  defaultValue: string | undefined;
};
type StringField = { type: 'string'; defaultValue: string };
type BooleanField = { type: 'boolean'; defaultValue: boolean };
type NumberField = { type: 'number'; defaultValue: number };

export type ParamField = BaseField & (StringField | BooleanField | NumberField | OptionsField);
