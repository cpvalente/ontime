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
 * Inserts an array into another one of the same type at a given index
 */
export function mergeAtIndex<T>(index: number, newArray: T[], currentArray: T[]): T[] {
  // Insert at beginning
  if (index === 0) {
    return [...newArray, ...currentArray];
  }

  // insert at end
  else if (index >= currentArray.length) {
    return [...currentArray, ...newArray];
  }

  // insert in the middle
  return currentArray.toSpliced(index, 0, ...newArray);
}

/**
 * Deletes array element at a given index
 * @param index
 * @param array
 */
export function deleteAtIndex<T>(index: number, array: T[]) {
  return array.filter((_, i) => i !== index);
}

/**
 * Reorders two objects in an array
 */
export function reorderArray<T>(array: T[], fromIndex: number, toIndex: number): T[] {
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
