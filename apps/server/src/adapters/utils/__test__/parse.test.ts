import { objectFromPath } from '../parse.js';

describe('objectFromPath()', () => {
  it('start index', () => {
    const arr = ['index'];
    const value = 1;
    const objExpected = { index: 1 };

    const obj = objectFromPath(arr, value);
    expect(obj).toStrictEqual(objExpected);
  });
  it('set timer message text', () => {
    const arr = ['timer', 'text'];
    const value = 'hello';
    const objExpected = { timer: { text: value } };

    const obj = objectFromPath(arr, value);
    expect(obj).toStrictEqual(objExpected);
  });
  it('set timer message text and visible', () => {
    const arr = ['timer'];
    const value = { text: 'hello', visible: true };
    const objExpected = { timer: value };

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
