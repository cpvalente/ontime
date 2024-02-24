import { stringify } from 'csv-stringify/browser/esm/sync';
import { CustomFields, OntimeEntryCommonKeys, OntimeRundown, ProjectData } from 'ontime-types';
import { millisToString } from 'ontime-utils';

/**
 * @description parses a field for export
 * @param {string} field
 * @param {*} data
 * @return {string}
 */

export const parseField = <T extends OntimeEntryCommonKeys>(field: T, data: unknown): string => {
  let val;
  switch (field) {
    case 'timeStart':
    case 'timeEnd':
      val = millisToString(data as number | null);
      break;
    case 'isPublic':
    case 'skip':
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
 * @param {ProjectData} headerData
 * @param {OntimeRundown} rundown
 * @param {CustomFields} customFields
 * @return {(string[])[]}
 */
export const makeTable = (headerData: ProjectData, rundown: OntimeRundown, customFields: CustomFields): string[][] => {
  const data = [['Ontime · Rundown export']];
  if (headerData.title) data.push([`Project title: ${headerData.title}`]);
  if (headerData.description) data.push([`Project description: ${headerData.description}`]);

  // TODO: add custom fields to header
  const fieldOrder: OntimeEntryCommonKeys[] = [
    'timeStart',
    'timeEnd',
    'title',
    'presenter',
    'subtitle',
    'isPublic',
    'note',
    'colour',
    'endAction',
    'timerType',
    'skip',
  ];

  // TODO: is this up to date?
  const fieldTitles = [
    'Time Start',
    'Time End',
    'Event Title',
    'Presenter Name',
    'Event Subtitle',
    'Is Public? (x)',
    'Note',
    'Colour',
    'End Action',
    'Timer Type',
    'Skip?',
  ];

  for (const field in customFields) {
    const fieldValue = customFields[field as keyof CustomFields];
    const displayName = `${field}${fieldValue !== field && fieldValue !== '' ? `:${fieldValue}` : ''}`;
    fieldTitles.push(displayName);
  }

  data.push(fieldTitles);

  rundown.forEach((entry) => {
    const row: string[] = [];
    // @ts-expect-error -- not sure how to type this
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
  const stringifiedData = stringify(arrayOfArrays);
  return stringifiedData;
};
