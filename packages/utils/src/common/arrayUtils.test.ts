import { deleteAtIndex, insertAtIndex, mergeAtIndex, reorderArray } from './arrayUtils.js';

describe('insertAtIndex', () => {
  it('should insert an item at the beginning of the array', () => {
    const array = [2, 3, 4];
    const result = insertAtIndex(0, 1, array);
    expect(result).toEqual([1, 2, 3, 4]);
  });

  it('should insert an item at the end of the array', () => {
    const array = [1, 2, 3];
    const result = insertAtIndex(3, 4, array);
    expect(result).toEqual([1, 2, 3, 4]);
  });

  it('should insert an item in the middle of the array', () => {
    const array = [1, 2, 4];
    const result = insertAtIndex(2, 3, array);
    expect(result).toEqual([1, 2, 3, 4]);
  });

  it('should return a new array and not modify the original array', () => {
    const array = [1, 2, 3];
    const result = insertAtIndex(1, 5, array);
    expect(result).toEqual([1, 5, 2, 3]);
    expect(array).toEqual([1, 2, 3]);
  });
});

describe('mergeAtIndex', () => {
  it('should insert an item at the beginning of the array', () => {
    const array = ['1', '2', '3'];
    const result = mergeAtIndex(0, ['a', 'b'], array);
    expect(result).toEqual(['a', 'b', '1', '2', '3']);
  });

  it('should insert an item at the end of the array', () => {
    const array = ['1', '2', '3'];
    const result = mergeAtIndex(3, ['a', 'b'], array);
    expect(result).toEqual(['1', '2', '3', 'a', 'b']);
  });

  it('should insert an item in the middle of the array', () => {
    const array = ['1', '2', '3'];
    const result = mergeAtIndex(2, ['a', 'b'], array);
    expect(result).toEqual(['1', '2', 'a', 'b', '3']);
  });

  it('should return a new array and not modify the original array', () => {
    const array = ['1', '2', '3'];
    const result = mergeAtIndex(5, ['a', 'b'], array);
    expect(result).toEqual(['1', '2', '3', 'a', 'b']);
    expect(array).toEqual(['1', '2', '3']);
  });
});

describe('deleteAtIndex', () => {
  it('should delete an item at the beginning of the array', () => {
    const array = [1, 2, 3, 4];
    const result = deleteAtIndex(0, array);
    expect(result).toEqual([2, 3, 4]);
  });

  it('should delete an item at the end of the array', () => {
    const array = [1, 2, 3, 4];
    const result = deleteAtIndex(3, array);
    expect(result).toEqual([1, 2, 3]);
  });

  it('should delete an item in the middle of the array', () => {
    const array = [1, 2, 3, 4];
    const result = deleteAtIndex(2, array);
    expect(result).toEqual([1, 2, 4]);
  });

  it('should return a new array and not modify the original array', () => {
    const array = [1, 2, 3, 4];
    const result = deleteAtIndex(1, array);
    expect(result).toEqual([1, 3, 4]);
    expect(array).toEqual([1, 2, 3, 4]); // Original array should remain unchanged
  });

  it('should return the original array if the index is out of bounds', () => {
    const array = [1, 2, 3, 4];
    const result = deleteAtIndex(10, array);
    expect(result).toEqual([1, 2, 3, 4]);
  });
});

describe('reorderArray', () => {
  it('should reorder an item in the array (up)', () => {
    const array = ['a', 'b', 'c', 'd'];
    const result = reorderArray(array, 1, 3);
    expect(result).toEqual(['a', 'c', 'd', 'b']);
  });

  it('should reorder an item in the array (down)', () => {
    const array = ['a', 'b', 'c', 'd'];
    const result = reorderArray(array, 3, 1);
    expect(result).toEqual(['a', 'd', 'b', 'c']);
  });

  it('should return the original array if fromIndex and toIndex are the same', () => {
    const array = ['a', 'b', 'c'];
    const result = reorderArray(array, 1, 1);
    expect(result).toEqual(array);
  });

  it('should handle reordering to the beginning of the array', () => {
    const array = ['a', 'b', 'c'];
    const result = reorderArray(array, 2, 0);
    expect(result).toEqual(['c', 'a', 'b']);
  });

  it('should handle reordering to the end of the array', () => {
    const array = ['a', 'b', 'c'];
    const result = reorderArray(array, 0, 2);
    expect(result).toEqual(['b', 'c', 'a']);
  });
});
