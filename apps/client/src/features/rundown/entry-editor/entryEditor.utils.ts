/** Shown in place of a value when the entries being edited do not agree */
export const mixedPlaceholder = 'Mixed';

/** Returns the label of a switch which may represent values that do not agree */
export function switchLabel(value: boolean | undefined): string {
  if (value === undefined) {
    return mixedPlaceholder;
  }
  return value ? 'On' : 'Off';
}
