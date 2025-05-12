import { isOntimeBlock, isOntimeEvent, OntimeEvent, OntimeEntry } from 'ontime-types';
import { millisToString } from 'ontime-utils';

import type { sheets_v4 } from '@googleapis/sheets';
import { is } from '../../utils/is.js';

import Color from 'color';
import { logger } from '../../classes/Logger.js';

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
 * @throws
 */
export function isClientSecret(clientSecret: object): clientSecret is ClientSecret {
  if (!('installed' in clientSecret)) {
    return false;
  }

  const { installed } = clientSecret;
  if (!is.object(installed)) {
    return false;
  }

  // we expect client secret file to contain the following keys
  return is.objectWithKeys(installed, [
    'client_id',
    'auth_uri',
    'token_uri',
    'token_uri',
    'auth_provider_x509_cert_url',
    'client_secret',
  ]);
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
 * @param {OntimeEntry} event
 * @param {number} index - index of the event
 * @param {number} worksheetId
 * @param {object} metadata - object with all the cell positions of the title of each attribute
 * @returns {sheets_v4.Schema} - list of update requests
 */
export function cellRequestFromEvent(
  event: OntimeEntry,
  index: number,
  worksheetId: number,
  metadata: object,
): sheets_v4.Schema$Request {
  const rowData = Object.entries(metadata)
    .filter(([_, value]) => value !== undefined)
    .sort(([_a, a], [_b, b]) => a['col'] - b['col']) as [keyof OntimeEvent | 'blank', { col: number; row: number }][];

  const titleCol = rowData[0][1].col;

  for (const [index, e] of rowData.entries()) {
    if (index !== 0) {
      const prevCol = rowData[index - 1][1].col;
      const thisCol = e[1].col;
      const diff = thisCol - prevCol;
      if (diff > 1) {
        const fillArr = new Array<(typeof rowData)[0]>(1).fill(['blank', { row: e[1].row, col: prevCol + 1 }]);
        rowData.splice(index, 0, ...fillArr);
      }
    }
  }

  const returnRows: sheets_v4.Schema$CellData[] = rowData.map(([key, _]) => {
    return getCellData(key, event);
  });

  return {
    updateCells: {
      start: {
        sheetId: worksheetId,
        rowIndex: index + rowData[0][1]['row'] + 1,
        columnIndex: titleCol,
      },
      fields: 'userEnteredValue,userEnteredFormat',
      rows: [
        {
          values: returnRows,
        },
      ],
    },
  };
}

enum colorFor {
  BACKGROUND = 0,
  TEXT = 1,
  BORDER = 2
}

function getCellData(key: keyof OntimeEvent | 'blank', event: OntimeEntry) {
  if (!isOntimeEvent(event) && !isOntimeBlock(event)) return {};

  const cellColor = {
    userEnteredFormat: {
      backgroundColor: getSheetFormatColor(event['colour'], colorFor.BACKGROUND),
      textFormat: {
        foregroundColor: getSheetFormatColor(event['colour'], colorFor.TEXT)
      },
      borders: {
        right: {
          style: 'SOLID',
          color: getSheetFormatColor(event['colour'], colorFor.BORDER)
        },
        bottom: {
          style: 'SOLID',
          color: getSheetFormatColor(event['colour'], colorFor.BORDER)
        }
      }
    },
  } as sheets_v4.Schema$CellData;

  if (isOntimeEvent(event)) {
    if (key === 'blank') {
      return cellColor;
    }
    if (key === 'colour') {
      return { userEnteredValue: { stringValue: event[key] }, ...cellColor };
    }
    if (key.startsWith('custom')) {
      const customKey = key.split(':')[1];
      return { userEnteredValue: { stringValue: event.custom[customKey] }, ...cellColor };
    }

    if (typeof event[key] === 'number') {
      return { userEnteredValue: { stringValue: millisToString(event[key]) }, ...cellColor };
    }
    if (typeof event[key] === 'string') {
      return { userEnteredValue: { stringValue: event[key] }, ...cellColor };
    }
    if (typeof event[key] === 'boolean') {
      return { userEnteredValue: { boolValue: event[key] }, ...cellColor };
    }
  }

  else if (isOntimeBlock(event)) {
    if (key === 'title') {
      return { userEnteredValue: { stringValue: event[key] }, ...cellColor };
    }
    if (key === 'timerType') {
      return { userEnteredValue: { stringValue: 'block' }, ...cellColor };
    }
  }

  return cellColor;
}

function getSheetFormatColor(col: string, isBg: colorFor): { [key in 'red' | 'green' | 'blue']: number } {
  const FinalColor = Color(getAccessibleColour(col)[isBg])
  return {
    red: FinalColor.red() / 255,
    green: FinalColor.green() / 255,
    blue: FinalColor.blue() / 255
  };
}

const getAccessibleColour = (bgColour?: string): [string, string, string] => {
  if (bgColour) {
    try {
      const originalColour = Color(bgColour);
      const backgroundColorMix = originalColour.alpha(1).mix(Color('#1a1a1a'), 1 - originalColour.alpha());
      const textColor = backgroundColorMix.isLight() ? 'black' : '#fffffa';
      const borderColor = backgroundColorMix.alpha(1).mix(Color(textColor), 0.2);
      return [backgroundColorMix.hexa(), textColor, borderColor.hexa()];
    } catch (_error) {
      /* we do not handle errors here */
    }
  }
  return ['#1a1a1a', '#fffffa', '#484847'];
};