import {
  CustomFields,
  isOntimeDelay,
  isOntimeEvent,
  MaybeNumber,
  OntimeEntryCommonKeys,
  OntimeRundown,
  ProjectData,
} from 'ontime-types';
import { millisToString } from 'ontime-utils';

type CsvHeaderKey = OntimeEntryCommonKeys | keyof CustomFields;

/**
 * @description parses a field for export
 * @param {string} field
 * @param {*} data
 * @return {string}
 */

export const parseField = (field: CsvHeaderKey, data: unknown): string => {
  if (field === 'timeStart' || field === 'timeEnd' || field === 'duration') {
    return millisToString(data as MaybeNumber);
  }

  if (field === 'isPublic' || field === 'skip') {
    return data ? 'x' : '';
  }

  return String(data ?? '');
};

/**
 * @description Creates an array of arrays usable by xlsx for export
 * @param {ProjectData} headerData
 * @param {OntimeRundown} rundown
 * @param {CustomFields} customFields
 * @return {(string[])[]}
 */
export const makeTable = (headerData: ProjectData, rundown: OntimeRundown, customFields: CustomFields): string[][] => {
  // create metadata header row
  const data = [['Ontime · Rundown export']];
  if (headerData.title) data.push([`Project title: ${headerData.title}`]);
  if (headerData.description) data.push([`Project description: ${headerData.description}`]);

  const customFieldKeys = Object.keys(customFields).map((key) => `custom-${key}`);
  const customFieldLabels = Object.keys(customFields);

  // we chose not to expose internals of the application
  const fieldOrder: CsvHeaderKey[] = [
    'timeStart',
    'timeEnd',
    'duration',
    'id',
    'colour',
    'cue',
    'title',
    'note',
    'isPublic',
    'skip',
    ...customFieldKeys,
  ];

  const fieldTitles = [
    'Time Start',
    'Time End',
    'Duration',
    'ID',
    'Colour',
    'Cue',
    'Title',
    'Note',
    'Is Public? (x)',
    'Skip?',
    ...customFieldLabels,
  ];

  // add header row to data
  data.push(fieldTitles);
  rundown.forEach((entry) => {
    if (isOntimeDelay(entry)) return;

    const row: string[] = [];
    fieldOrder.forEach((field) => {
      if (isOntimeEvent(entry)) {
        // for custom fields, we need to extract the value from the custom object
        if (field.startsWith('custom-')) {
          const fieldLabel = field.split('custom-')[1];
          const value = entry.custom[fieldLabel];
          row.push(parseField(fieldLabel, value));
        } else {
          // @ts-expect-error -- it is ok, we will just not have the data for other fields
          row.push(parseField(field, entry[field]));
        }
        return;
      }
      // @ts-expect-error -- it is ok, we will just not have the data for other fields
      row.push(parseField(field, entry[field]));
    });
    data.push(row);
  });

  return data;
};
