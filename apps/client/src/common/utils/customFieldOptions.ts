import type { CustomField, CustomFieldOption } from 'ontime-types';

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

/** A row of the options editor, original is the label it had when the form opened, null for a new row */
export type OptionRow = { label: string; colour: string; original: string | null };

/** Rows left empty are not options */
export function getFilledRows(rows: OptionRow[]): OptionRow[] {
  return rows.filter((row) => row.label.trim() !== '');
}

/**
 * What saving the option rows does to the options the field started with
 * a filled row with a new label renames its option, an option with no filled row and no new row of its label is removed
 * removing matches the server, which clears the values of removed options from every entry
 */
export function getOptionChanges(rows: OptionRow[], initialOptions: CustomFieldOption[]) {
  const filledRows = getFilledRows(rows);
  const renamed: Record<string, string> = {};
  for (const row of filledRows) {
    if (row.original !== null && row.original !== row.label.trim()) {
      renamed[row.original] = row.label.trim();
    }
  }
  const keptOptions = new Set(filledRows.map((row) => row.original));
  const newLabels = new Set(filledRows.map((row) => row.label.trim()));
  const removed = initialOptions.filter((option) => !keptOptions.has(option.label) && !newLabels.has(option.label));
  return { renamed, removed };
}
