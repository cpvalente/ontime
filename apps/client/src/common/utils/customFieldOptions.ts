import type { CustomField } from 'ontime-types';

import type { SelectOption } from '../components/select/Select';

type OptionField = Extract<CustomField, { type: 'option' }>;

/**
 * The choices to pick a value of an option field: none to clear it, then the field options
 * a value which is not an option is kept as a disabled choice, so it is shown rather than hidden
 */
export function makeOptionSelectItems(field: OptionField, value: string): SelectOption[] {
  const items: SelectOption[] = [{ value: '', label: 'None' }];
  for (const option of field.options) {
    items.push({ value: option.label, label: option.label });
  }
  if (value && !field.options.some((option) => option.label === value)) {
    items.push({ value, label: `${value} (not in list)`, disabled: true });
  }
  return items;
}
