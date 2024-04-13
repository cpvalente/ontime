import { integrationPayloadFromPath } from '../parse.js';

describe('objectFromPath()', () => {
  it('start index', () => {
    const arr = ['index'];
    const value = 1;
    const objExpected = { index: 1 };

    const obj = integrationPayloadFromPath(arr, value);
    expect(obj).toStrictEqual(objExpected);
  });
  it('start next', () => {
    const arr = ['next'];
    const value = undefined;
    const objExpected = 'next';

    const obj = integrationPayloadFromPath(arr, value);
    expect(obj).toStrictEqual(objExpected);
  });
  it('set timer message text', () => {
    const arr = ['timer', 'text'];
    const value = 'hello';
    const objExpected = { timer: { text: value } };

    const obj = integrationPayloadFromPath(arr, value);
    expect(obj).toStrictEqual(objExpected);
  });
  it('set timer message text and visible', () => {
    const arr = ['timer'];
    const value = { text: 'hello', visible: true };
    const objExpected = { timer: value };

    const obj = integrationPayloadFromPath(arr, value);
    expect(obj).toStrictEqual(objExpected);
  });

  it('nests object with undefined value', () => {
    const arr = ['a', 'b', 'c', 'd'];
    const objExpected = { a: { b: { c: 'd' } } };

    const obj = integrationPayloadFromPath(arr);
    expect(obj).toStrictEqual(objExpected);
  });
  it('empty array creates undefined object', () => {
    const arr: string[] = [];
    const value = '1234567890';
    const objExpected = null;

    const obj = integrationPayloadFromPath(arr, value);
    expect(obj).toStrictEqual(objExpected);
  });
});
