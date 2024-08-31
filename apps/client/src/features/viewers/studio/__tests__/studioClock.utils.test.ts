import { OntimeEvent } from 'ontime-types';

import { trimRundown } from '../studioClock.utils';

describe('test trimEventlist function', () => {
  const limit = 8;
  const testData = [
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
    { id: '5' },
    { id: '6' },
    { id: '7' },
    { id: '8' },
    { id: '9' },
    { id: '10' },
    { id: '11' },
    { id: '12' },
  ];

  it('when we use the first item', () => {
    const selectedId = '1';
    const expected = [
      { id: '1' },
      { id: '2' },
      { id: '3' },
      { id: '4' },
      { id: '5' },
      { id: '6' },
      { id: '7' },
      { id: '8' },
    ];

    const l = trimRundown(testData as OntimeEvent[], selectedId, limit);
    expect(l.length).toBe(limit);
    expect(l).toStrictEqual(expected);
  });

  it('when we use the third item', () => {
    const selectedId = '3';
    const expected = [
      { id: '3' },
      { id: '4' },
      { id: '5' },
      { id: '6' },
      { id: '7' },
      { id: '8' },
      { id: '9' },
      { id: '10' },
    ];

    const l = trimRundown(testData as OntimeEvent[], selectedId, limit);
    expect(l.length).toBe(limit);
    expect(l).toStrictEqual(expected);
  });

  it('when we use the fourth item', () => {
    const selectedId = '4';
    const expected = [
      { id: '4' },
      { id: '5' },
      { id: '6' },
      { id: '7' },
      { id: '8' },
      { id: '9' },
      { id: '10' },
      { id: '11' },
    ];

    const l = trimRundown(testData as OntimeEvent[], selectedId, limit);
    expect(l.length).toBe(limit);
    expect(l).toStrictEqual(expected);
  });

  it('result array is smaller than limit', () => {
    const selectedId = '8';
    const expected = [{ id: '8' }, { id: '9' }, { id: '10' }, { id: '11' }, { id: '12' }];

    const l = trimRundown(testData as OntimeEvent[], selectedId, limit);
    expect(l.length).toBe(expected.length);
    expect(l).toStrictEqual(expected);
  });

  it('if selected is not found', () => {
    const selectedId = '15';
    const expected = [
      { id: '1' },
      { id: '2' },
      { id: '3' },
      { id: '4' },
      { id: '5' },
      { id: '6' },
      { id: '7' },
      { id: '8' },
    ];

    const l = trimRundown(testData as OntimeEvent[], selectedId, limit);
    expect(l.length).toBe(limit);
    expect(l).toStrictEqual(expected);
  });

  it('if there is nothing selected', () => {
    const selectedId = null;
    const expected = [
      { id: '1' },
      { id: '2' },
      { id: '3' },
      { id: '4' },
      { id: '5' },
      { id: '6' },
      { id: '7' },
      { id: '8' },
    ];

    const l = trimRundown(testData as OntimeEvent[], selectedId, limit);
    expect(l.length).toBe(limit);
    expect(l).toStrictEqual(expected);
  });
});
