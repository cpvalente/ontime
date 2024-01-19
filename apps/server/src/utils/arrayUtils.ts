/**
 * Inserts an item in an array at a given index
 * @param index
 * @param item
 * @param array
 */
export function insertAtIndex<T>(index: number, item: T, array: T[]): T[] {
  const modifiedArray = [...array];

  // Insert at beginning
  if (index === 0) {
    modifiedArray.unshift(item);
  }

  // insert at end
  else if (index >= modifiedArray.length) {
    modifiedArray.push(item);
  }

  // insert in the middle
  else {
    modifiedArray.splice(index, 0, item);
  }

  return modifiedArray;
}

/**
 * Deletes array element at a given index
 * @param index
 * @param array
 */
export function deleteAtIndex<T>(index: number, array: T[]) {
  return array.filter((_, i) => i !== index);
}

export function reorderArray<T>(array: T[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) {
    return array; // No change needed, return the original array
  }

  const modifiedArray = [...array];

  // delete in from
  const [reorderedItem] = modifiedArray.splice(fromIndex, 1);

  // reinsert item at to
  modifiedArray.splice(toIndex, 0, reorderedItem);
  return modifiedArray;
}

/**
 * @description Sorts an array of objects by given property
 * @param {array} arr - array to be sorted
 * @param {string} property - property to compare
 * @returns {array} copy of array sorted in ascending order
 */

export const sortArrayByProperty = <T>(arr: T[], property: string): T[] => {
  return [...arr].sort((a, b) => {
    return a[property] - b[property];
  });
};

/**
 * @description Creates a nested object with keys from an array and assigns the `value` to the last key
 * @param {array} arr - array to be nested
 * @param {string} value - value to assign
 * @returns {object | null} nested object or null if no object was created
 */
export const nestedObjectFromArray = (arr: string[], value?: unknown): object | null => {
  const obj = arr.reduceRight((result, key) => ({ [key]: result }), value);
  if (typeof obj === 'object') return obj;
  return null;
};
