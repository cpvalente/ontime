import type { sheets_v4 } from '@googleapis/sheets';
import {
  OntimeEntry,
  OntimeEntryCommonKeys,
  RGBColour,
  isOntimeDelay,
  isOntimeGroup,
  isOntimeMilestone,
} from 'ontime-types';
import { cssOrHexToColour, isLightColour, millisToString, mixColours } from 'ontime-utils';

import { is } from '../../utils/is.js';

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
 * @param {OntimeEntry} entry
 * @param {number} index - index of the event
 * @param {number} worksheetId
 * @param {object} metadata - object with all the cell positions of the title of each attribute
 * @returns {sheets_v4.Schema} - list of update requests
 */
export function cellRequestFromEvent(
  entry: OntimeEntry,
  index: number,
  worksheetId: number,
  metadata: object,
): sheets_v4.Schema$Request {
  const rowData = Object.entries(metadata) // check what headings are available in the sheet
    .filter(([_, value]) => value !== undefined) // drop anything that is undefined
    .sort(([_a, a], [_b, b]) => a['col'] - b['col']) as [
    OntimeEntryCommonKeys | 'blank',
    { col: number; row: number },
  ][]; // sort the array by the column index

  // inset blank data is there is spacing between relevant ontime columns
  for (const [index, e] of rowData.entries()) {
    if (index === 0) continue;
    const prevCol = rowData[index - 1][1].col;
    const thisCol = e[1].col;
    const diff = thisCol - prevCol;
    if (diff > 1) {
      // TODO: we need to clarify this logic
      const fillArr = new Array<(typeof rowData)[0]>(1).fill(['blank', { row: e[1].row, col: prevCol + 1 }]);
      rowData.splice(index, 0, ...fillArr);
    }
  }

  const colours = 'colour' in entry ? getAccessibleColour(entry.colour) : undefined;
  const cellColor: sheets_v4.Schema$CellData = !colours
    ? {}
    : {
        userEnteredFormat: {
          backgroundColor: toSheetColourLevel(colours.background),
          textFormat: {
            foregroundColor: toSheetColourLevel(colours.text),
          },
          borders: {
            bottom: {
              style: 'SOLID',
              color: toSheetColourLevel(colours.border),
            },
          },
        },
      };

  const returnRows: sheets_v4.Schema$CellData[] = rowData.map(([key, _]) => {
    return { ...getCellData(key, entry), ...cellColor };
  });

  const headerLocation = rowData[0][1];

  return {
    updateCells: {
      start: {
        sheetId: worksheetId,
        rowIndex: index + headerLocation.row + 1,
        columnIndex: headerLocation.col,
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

function getCellData(key: OntimeEntryCommonKeys | 'blank', entry: OntimeEntry) {
  if (isOntimeDelay(entry) || key === 'blank') {
    return {};
  }

  // we need to remap the event type to timer type in the case of groups and milestones
  if (key === 'timerType') {
    if (isOntimeGroup(entry))
      return { userEnteredValue: { stringValue: entry.id.startsWith('group-end') ? 'group-end' : 'group' } };
    if (isOntimeMilestone(entry)) return { userEnteredValue: { stringValue: 'milestone' } };
    return { userEnteredValue: { stringValue: entry.timerType } };
  }

  // all other data is not relevant for the group end entry
  if (entry.id.startsWith('group-end')) {
    return {};
  }

  // we need to flatten the milestones
  if (key.startsWith('custom')) {
    const customKey = key.split(':')[1];
    return { userEnteredValue: { stringValue: entry.custom[customKey] } };
  }

  // typescript cannot guarantee that the key exists for every entry
  // so we check for the key existence and assert the type
  if (!(key in entry)) return {};
  const value = entry[key as keyof OntimeEntry];

  if (typeof value === 'number') {
    return { userEnteredValue: { stringValue: millisToString(value) } };
  }
  if (typeof value === 'string') {
    return { userEnteredValue: { stringValue: value } };
  }
  if (typeof value === 'boolean') {
    return { userEnteredValue: { boolValue: value } };
  }
}

type googleSheetCellColour = {
  background: RGBColour;
  text: RGBColour;
  border: RGBColour;
};

function getAccessibleColour(bgColour?: string): googleSheetCellColour | undefined {
  if (!bgColour) return undefined;

  const background = cssOrHexToColour(bgColour);
  if (!background) return undefined;

  const text = isLightColour(background) ? BLACK : WHITE;
  const border = mixColours(background, text, 0.2);

  return { background, text, border };
}

const BLACK: RGBColour = { red: 0, green: 0, blue: 0, alpha: 1 };
const WHITE: RGBColour = { red: 255, green: 255, blue: 255, alpha: 0.98 };

// sheets use color values from 0 to 1
function toSheetColourLevel(colour: RGBColour): RGBColour {
  return { red: colour.red / 255, green: colour.green / 255, blue: colour.blue / 255, alpha: colour.alpha };
}
