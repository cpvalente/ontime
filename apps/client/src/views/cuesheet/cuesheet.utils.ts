import { CustomFields, MaybeNumber, OntimeEntryCommonKeys } from 'ontime-types';
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
    return millisToString(data as MaybeNumber, { fallback: '' });
  }

  if (field === 'skip') {
    return data ? 'x' : '';
  }

  return String(data ?? '');
};
