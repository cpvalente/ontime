import { stringify } from 'csv-stringify/browser/esm/sync';
import { millisToString } from 'ontime-utils';

/**
 * @description parses a field for export
 * @param {string} field
 * @param {*} data
 * @return {string}
 */

export const parseField = (field, data) => {
  let val;
  switch (field) {
    case 'timeStart':
    case 'timeEnd':
      val = millisToString(data);
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
  return val;
};

/**
 * @description Creates an array of arrays usable by xlsx for export
 * @param {object} headerData
 * @param {array} tableData
 * @param {object} userFields
 * @return {(string[])[]}
 */
export const makeTable = (headerData, tableData, userFields) => {
  const data = [
    ['Ontime · Schedule Template'],
    ['Event Name', headerData?.title || ''],
    ['Public URL', headerData?.publicUrl || ''],
    ['Backstage URL', headerData?.backstageUrl || ''],
    [],
  ];

  const fieldOrder = [
    'timeStart',
    'timeEnd',
    'title',
    'presenter',
    'subtitle',
    'isPublic',
    'notes',
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
    const fieldValue = userFields[field];
    const displayName = `${field}${fieldValue !== field && fieldValue !== '' ? `:${fieldValue}` : ''}`;
    fieldTitles.push(displayName);
  }

  data.push(fieldTitles);

  tableData.forEach((entry) => {
    const row = [];
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
export const makeCSV = (arrayOfArrays) => {
  let csvData = 'data:text/csv;charset=utf-8,';
  const stringifiedData = stringify(arrayOfArrays);
  return csvData + stringifiedData;
};
