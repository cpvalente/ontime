import { objectFromPath } from '../parse.js';

describe('nestedObjectFromArray()', () => {
  it('nests object with string value', () => {
    const arr = ['a', 'b', 'c', 'd'];
    const value = '1234567890';
    const objExpected = { a: { b: { c: { d: value } } } };

    const obj = objectFromPath(arr, value);
    expect(obj).toStrictEqual(objExpected);
  });
  it('nests object with number value', () => {
    const arr = ['a', 'b', 'c', 'd'];
    const value = 1234567890;
    const objExpected = { a: { b: { c: { d: value } } } };

    const obj = objectFromPath(arr, value);
    expect(obj).toStrictEqual(objExpected);
  });
  it('nests object with object value', () => {
    const arr = ['a', 'b', 'c', 'd'];
    const value = { test: { test1: '1234' } };
    const objExpected = { a: { b: { c: { d: value } } } };

    const obj = objectFromPath(arr, value);
    expect(obj).toStrictEqual(objExpected);
  });
  it('nests object with array value', () => {
    const arr = ['a', 'b', 'c', 'd'];
    const value = [1, 2, 3, 4];
    const objExpected = { a: { b: { c: { d: value } } } };

    const obj = objectFromPath(arr, value);
    expect(obj).toStrictEqual(objExpected);
  });
  it('nests object with undefined value', () => {
    const arr = ['a', 'b', 'c', 'd'];
    const objExpected = { a: { b: { c: { d: undefined } } } };

    const obj = objectFromPath(arr);
    expect(obj).toStrictEqual(objExpected);
  });
  it('empty array creates undefinde object', () => {
    const arr = [];
    const value = '1234567890';
    const objExpected = null;

    const obj = objectFromPath(arr, value);
    expect(obj).toStrictEqual(objExpected);
  });
});
