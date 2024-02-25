import { OntimeEntryCommonKeys, OntimeEvent } from 'ontime-types';

/**
 * @description set default column order
 */
export const defaultColumnOrder: OntimeEntryCommonKeys[] = [
  'isPublic',
  'cue',
  'timeStart',
  'timeEnd',
  'duration',
  'title',
  'subtitle',
  'presenter',
  'note',
];

/**
 * @description set default hidden columns
 */
export const defaultHiddenColumns: (keyof OntimeEvent)[] = [];
