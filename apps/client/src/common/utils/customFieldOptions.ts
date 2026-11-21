import type { CustomField, CustomFieldOption } from 'ontime-types';
import { findCustomFieldOption } from 'ontime-utils';

import type { SelectOption } from '../components/select/Select';
import { getAccessibleColour } from './styleUtils';

type OptionField = Extract<CustomField, { type: 'option' }>;

/**
 * The choices to pick a value of an option field: none to clear it, then the field options
 * a value which is not an option is kept as a disabled choice, so it is shown rather than hidden
 */
export function makeOptionSelectItems(field: OptionField, value: string): SelectOption[] {
  // every item has a colour, so labels line up whether or not an option has one
  const items: SelectOption[] = [{ value: '', label: 'None', colour: '' }];
  for (const option of field.options) {
    items.push({ value: option.label, label: option.label, colour: option.colour });
  }
  if (value && !field.options.some((option) => option.label === value)) {
    items.push({ value, label: `${value} (not in list)`, disabled: true, colour: '' });
  }
  return items;
}

/**
 * The background and text colours of a value tinted with its option colour, nothing for a value without one
 */
export function getOptionTint(field: OptionField, value: string) {
  const colour = findCustomFieldOption(field, value)?.colour;
  return colour ? getAccessibleColour(colour) : undefined;
}

/** A row of the options editor, original is the label it had when the form opened, null for a new row */
export type OptionRow = { label: string; colour: string; original: string | null };

/**
 * What saving the option rows gives: the options, in order, and what happens to the options the field started with
 * rows left empty are not options; a filled row with a new label renames its option
 * an option with no filled row and no new row of its label is removed, as the server clears its values from every entry
 */
export function getOptionChanges(rows: OptionRow[], initialOptions: CustomFieldOption[]) {
  const filledRows = rows.filter((row) => row.label.trim() !== '');
  const options = filledRows.map((row) => ({ label: row.label.trim(), colour: row.colour }));
  const renamed: Record<string, string> = {};
  for (const row of filledRows) {
    if (row.original !== null && row.original !== row.label.trim()) {
      renamed[row.original] = row.label.trim();
    }
  }
  const keptOptions = new Set(filledRows.map((row) => row.original));
  const newLabels = new Set(options.map((option) => option.label));
  const removed = initialOptions.filter((option) => !keptOptions.has(option.label) && !newLabels.has(option.label));
  return { options, renamed, removed };
}
