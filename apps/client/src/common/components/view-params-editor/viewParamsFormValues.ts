import { createContext, use } from 'react';

import type { ParamField } from './viewParams.types';

type FormValues = {
  /** the value a field holds in the form, before it is applied */
  get: (id: string) => string | null;
  set: (id: string, value: string) => void;
};

/** The values of the fields other fields depend on, kept while the drawer is edited */
export const ViewParamsFormValues = createContext<FormValues>({ get: () => null, set: () => {} });

/** Whether a field is enabled by the values the form holds now */
export function useIsFieldEnabled(field: ParamField): boolean {
  const values = use(ViewParamsFormValues);
  if (!field.enabledWhen) return true;
  const value = values.get(field.enabledWhen.id);
  return value !== null && field.enabledWhen.values.includes(value);
}
