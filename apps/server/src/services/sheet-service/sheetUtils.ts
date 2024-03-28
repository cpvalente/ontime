import { isOntimeBlock, isOntimeEvent, OntimeRundownEntry } from 'ontime-types';
import { millisToString } from 'ontime-utils';

import { sheets_v4 } from '@googleapis/sheets';

// we expect client secret file to contain the following keys
const requiredClientKeys = [
  'client_id',
  'auth_uri',
  'token_uri',
  'token_uri',
  'auth_provider_x509_cert_url',
  'client_secret',
];

export type ClientSecret = {
  installed: {
    client_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_secret: string;
  };
};

/**
 * Guard validates a given client secrets file
 * @param clientSecret
 * @returns
 */
export function validateClientSecret(clientSecret: object): clientSecret is ClientSecret {
  return requiredClientKeys.every((key) => Object.keys(clientSecret['installed']).includes(key));
}

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

  const returnRows: sheets_v4.Schema$CellData[] = tmp.map(([key, _]) => {
    return getCellData(key, event);
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

function getCellData(key: string, event: OntimeRundownEntry) {
  if (isOntimeEvent(event)) {
    if (key === 'blank') {
      return {};
    }
    if (key === 'colour') {
      return { userEnteredValue: { stringValue: event[key] } };
    }

    const dataType = typeof event[key];
    if (dataType === 'number') {
      return { userEnteredValue: { stringValue: millisToString(event[key]) } };
    }
    if (dataType === 'string') {
      return { userEnteredValue: { stringValue: event[key] } };
    }
    if (dataType === 'boolean') {
      return { userEnteredValue: { boolValue: event[key] } };
    }
  }

  if (isOntimeBlock(event)) {
    if (key === 'title') {
      return { userEnteredValue: { stringValue: event[key] } };
    }
    if (key === 'timerType') {
      return { userEnteredValue: { stringValue: 'block' } };
    }
  }

  return {};
}
