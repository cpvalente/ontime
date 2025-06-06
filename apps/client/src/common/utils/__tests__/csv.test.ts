import { OntimeEntry, ProjectRundowns, Rundown } from 'ontime-types';

import { aggregateRundowns, makeCSVFromArrayOfArrays } from '../csv';

describe('makeCSVFromArrayOfArrays()', () => {
  it('joins an array of arrays with commas and newlines', () => {
    const testdata = [['field'], ['after newline', 'after comma'], ['', 'after empty']];
    expect(makeCSVFromArrayOfArrays(testdata)).toMatchInlineSnapshot(`
"field
after newline,after comma
,after empty
"
`);
  });
});

describe('aggregateRundowns()', () => {
  it('flattens an object of rundowns into a single array', () => {
    const rundowns = {
      first: {
        id: '',
        title: '',
        revision: 0,
        order: ['1', '2'],
        flatOrder: ['1', '2'],
        entries: {
          '1': { id: '1' } as OntimeEntry,
          '2': { id: '2' } as OntimeEntry,
        },
      },
      second: {
        id: '',
        title: '',
        revision: 0,
        order: ['3', '4'],
        flatOrder: ['3', '4'],
        entries: {
          '3': { id: '3' } as OntimeEntry,
          '4': { id: '4' } as OntimeEntry,
        },
      } as Rundown,
    } as ProjectRundowns;

    expect(aggregateRundowns(rundowns)).toStrictEqual([{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }]);
  });
});
