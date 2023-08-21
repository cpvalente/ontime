type BaseField = {
  id: string;
  title: string;
  description: string;
};

type OptionsField = { type: 'option'; values: Record<string, string> };
type StringField = { type: 'string' };
type BooleanField = { type: 'boolean' };
type NumberField = { type: 'number' };

export type ParamField = BaseField & (StringField | BooleanField | NumberField | OptionsField);
