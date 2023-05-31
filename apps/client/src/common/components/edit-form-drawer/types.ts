type BaseField = {
  title: string;
  description: string;
};

type OptionsField = { type: 'option'; values: string[] };
type StringField = { type: 'string' };
type BooleanField = { type: 'boolean' };
type NumberField = { type: 'number' };

export type Field = BaseField & (StringField | BooleanField | NumberField | OptionsField);
