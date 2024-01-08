import { sheets_v4 } from '@googleapis/sheets';
import { millisToString } from 'ontime-utils';
import { OntimeRundownEntry, ProjectData, isOntimeEvent } from 'ontime-types';

/**
 *
 * @param {number} row - The row number of the cell reference. Row 1 is row number 0.
 * @param {number} column - The column number of the cell reference. A is column number 0.
 * @returns {string} - Returns a cell reference as a string using A1 Notation
 * @author https://www.labnol.org/convert-column-a1-notation-210601
 * @example
 *
 *   getA1Notation(2, 4) returns "E3"
 *   getA1Notation(99, 26) returns "AA100"
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
 * @returns {sheets_v4.Schema} - list of update requests
 */
export function cellRequestFromEvent(
  event: OntimeRundownEntry,
  index: number,
  worksheetId: number,
  metadata,
): sheets_v4.Schema$Request {
  const returnRows: sheets_v4.Schema$CellData[] = [];
  const tmp = Object.entries(metadata)
    .filter(([_, value]) => value !== undefined)
    .sort(([_a, a], [_b, b]) => a['col'] - b['col']) as [string, { col: number; row: number }][];

  const titleCol = tmp[0][1].col;

  for (const [index, e] of tmp.entries()) {
    if (index !== 0) {
      const prevCol = tmp[index - 1][1].col;
      const thisCol = e[1].col;
      const diff = thisCol - prevCol;
      if (diff > 1) {
        const fillArr = new Array<(typeof tmp)[0]>(1).fill(['blank', { row: e[1].row, col: prevCol + 1 }]);
        tmp.splice(index, 0, ...fillArr);
      }
    }
  }

  tmp.forEach(([key, _]) => {
    if (isOntimeEvent(event)) {
      if (key === 'blank') {
        returnRows.push({});
      } else if (key === 'colour') {
        returnRows.push({
          userEnteredValue: { stringValue: event.colour },
        });
      } else if (typeof event[key] === 'number') {
        returnRows.push({
          userEnteredValue: { stringValue: millisToString(event[key], true) },
        });
      } else if (typeof event[key] === 'string') {
        returnRows.push({
          userEnteredValue: { stringValue: event[key] },
        });
      } else if (typeof event[key] === 'boolean') {
        returnRows.push({
          userEnteredValue: { stringValue: event[key] ? 'x' : '' },
        });
      } else {
        returnRows.push({});
      }
    }
  });
  return {
    updateCells: {
      start: {
        sheetId: worksheetId,
        rowIndex: index + tmp[0][1]['row'] + 1,
        columnIndex: titleCol,
      },
      fields: 'userEnteredValue',
      rows: [
        {
          values: returnRows,
        },
      ],
    },
  };
}

/**
 * @description - creates updateCells request from ontime event
 * @param {ProjectData} projectData
 * @param {number} worksheetId
 * @param {any} metadata - object with all the cell positions of the title of each attribute
 * @returns {sheets_v4.Schema} - list of update requests
 */
export function cellRequenstFromProjectData(
  projectData: ProjectData,
  worksheetId: number,
  metadata,
): sheets_v4.Schema$Request {
  const returnRows: sheets_v4.Schema$RowData[] = [];
  const tmp = Object.entries(metadata)
    .filter(([_, value]) => value !== undefined)
    .sort(([_a, a], [_b, b]) => a['col'] - b['col']) as [string, { col: number; row: number }][];

  const minRow = Object.values(metadata).reduce(
    (accumulator: number, val) => Math.min(accumulator, val['row']),
    Number.MAX_VALUE,
  ) as number;
  const minCol = tmp[0][1].col + 1;

  for (const [index, e] of tmp.entries()) {
    if (index != 0) {
      const prevRow = tmp[index - 1][1].row;
      const thisRow = e[1].row;
      const diff = thisRow - prevRow;
      if (diff > 1) {
        const fillArr = new Array<(typeof tmp)[0]>(1).fill(['blank', { row: prevRow + 1, col: e[1].col }]);
        tmp.splice(index, 0, ...fillArr);
      }
    }
  }
  tmp.forEach(([key, _]) => {
    if (key == 'blank') {
      returnRows.push({});
    } else {
      returnRows.push({
        values: [
          {
            userEnteredValue: { stringValue: projectData[key] },
          },
        ],
      });
    }
  });

  return {
    updateCells: {
      start: {
        sheetId: worksheetId,
        rowIndex: minRow,
        columnIndex: minCol,
      },
      fields: 'userEnteredValue',
      rows: returnRows,
    },
  };
}
