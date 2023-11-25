import { sheets_v4 } from '@googleapis/sheets';
import { millisToString } from 'ontime-utils';
import { OntimeRundownEntry, isOntimeEvent } from 'ontime-types';

/**
 *
 * @param {number} row - The row number of the cell reference. Row 1 is row number 0.
 * @param {number} column - The column number of the cell reference. A is column number 0.
 * @returns {string} - Returns a cell reference as a string using A1 Notation
 * @author https://www.labnol.org/convert-column-a1-notation-210601
 * @example
 *
 *   getA1Notation(2, 4) returns "E3"
 *   getA1Notation(26, 4) returns "AA3"
 *
 */
export function getA1Notation(row: number, column: number): string {
  if (row < 0 || column < 0) {
    throw new Error('Index can not be less than 0');
  }
  const a1Notation = [`${row + 1}`];
  const totalAlphabets = 'Z'.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
  let block = column;
  while (block >= 0) {
    a1Notation.unshift(String.fromCharCode((block % totalAlphabets) + 'A'.charCodeAt(0)));
    block = Math.floor(block / totalAlphabets) - 1;
  }
  return a1Notation.join('');
}

/**
 * @description - creates updateCells request from ontime event
 * @param {OntimeRundownEntry} event
 * @param {number} index - index of the event
 * @param {number} worksheetId
 * @param {any} metadata - object with all the cell positions of the title of each attribute
 * @param {number} titleCol - smallest col index
 * @returns {sheets_v4.Schema} - list of update requests
 */
export function cellRequenstFromEvent(
  event: OntimeRundownEntry,
  index: number,
  worksheetId: number,
  metadata,
  titleCol: number,
): sheets_v4.Schema$Request {
  const r: sheets_v4.Schema$CellData[] = [];
  const tmp = Object.entries(metadata)
    .filter(([_, value]) => value !== undefined)
    .sort(([_a, a], [_b, b]) => a['col'] - b['col']);

  tmp.forEach(([_, value], index, arr) => {
    if (index != 0) {
      if (arr[index - 1][1]['col'] + 1 < value['col']) {
        arr.splice(index, 0, ['blank', { col: arr[index - 1][1]['col'] + 1 }]);
      }
    }
  });

  tmp.forEach(([key, _]) => {
    if (isOntimeEvent(event)) {
      if (key === 'blank') {
        r.push({});
      } else if (key === 'colour') {
        r.push({
          userEnteredValue: { stringValue: event.colour },
        });
      } else if (typeof event[key] === 'number') {
        r.push({
          userEnteredValue: { stringValue: millisToString(event[key], true) },
        });
      } else if (typeof event[key] === 'string') {
        r.push({
          userEnteredValue: { stringValue: event[key] },
        });
      } else if (typeof event[key] === 'boolean') {
        r.push({
          userEnteredValue: { stringValue: event[key] ? 'x' : '' },
        });
      } else {
        r.push({});
      }
    }
  });
  return {
    updateCells: {
      start: {
        sheetId: worksheetId,
        rowIndex: index + Object.values(metadata)[0]['row'] + 1,
        columnIndex: titleCol,
      },
      fields: 'userEnteredValue',
      rows: [
        {
          values: r,
        },
      ],
    },
  };
}
