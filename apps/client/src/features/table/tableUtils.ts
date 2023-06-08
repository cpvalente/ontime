import { stringify } from 'csv-stringify/browser/esm/sync';
import { EventData, OntimeEntryCommonKeys, OntimeRundown, UserFields } from 'ontime-types';
import { millisToString } from 'ontime-utils';

/**
 * @description parses a field for export
 * @param {string} field
 * @param {*} data
 * @return {string}
 */

export const parseField = (field: keyof OntimeRundown, data: unknown): string => {
  let val;
  switch (field) {
    case 'timeStart':
    case 'timeEnd':
      val = millisToString(data as number | null);
      break;
    case 'isPublic':
      val = data ? 'x' : '';
      break;
    default:
      val = data;
      break;
  }
  if (typeof data === 'undefined') {
    return '';
  }
  // all other values are strings
  return val as string;
};

/**
 * @description Creates an array of arrays usable by xlsx for export
 * @param {object} headerData
 * @param {array} rundown
 * @param {object} userFields
 * @return {(string[])[]}
 */
export const makeTable = (headerData: EventData, rundown: OntimeRundown, userFields: UserFields): string[][] => {
  const data = [
    ['Ontime · Schedule Template'],
    ['Event Name', headerData?.title || ''],
    ['Public URL', headerData?.publicUrl || ''],
    ['Backstage URL', headerData?.backstageUrl || ''],
    [],
  ];

  const fieldOrder: OntimeEntryCommonKeys[] = [
    'timeStart',
    'timeEnd',
    'title',
    'presenter',
    'subtitle',
    'isPublic',
    'note',
    'colour',
    'user0',
    'user1',
    'user2',
    'user3',
    'user4',
    'user5',
    'user6',
    'user7',
    'user8',
    'user9',
  ];

  const fieldTitles = [
    'Time Start',
    'Time End',
    'Event Title',
    'Presenter Name',
    'Event Subtitle',
    'Is Public? (x)',
    'Notes',
    'Colour',
  ];

  for (const field in userFields) {
    const fieldValue = userFields[field as keyof UserFields];
    const displayName = `${field}${fieldValue !== field && fieldValue !== '' ? `:${fieldValue}` : ''}`;
    fieldTitles.push(displayName);
  }

  data.push(fieldTitles);

  rundown.forEach((entry) => {
    const row: string[] = [];
    fieldOrder.forEach((field) => row.push(parseField(field, entry[field])));
    data.push(row);
  });

  return data;
};

/**
 * @description Converts an array of arrays to a csv file
 * @param {array[]} arrayOfArrays
 * @return {string}
 */
export const makeCSV = (arrayOfArrays: string[][]) => {
  const csvData = 'data:text/csv;charset=utf-8,';
  const stringifiedData = stringify(arrayOfArrays);
  return csvData + stringifiedData;
};
