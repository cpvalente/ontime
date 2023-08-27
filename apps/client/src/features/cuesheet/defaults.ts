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

/**
 * @description set default hidden columns
 */
export const defaultHiddenColumns: (keyof OntimeEvent)[] = [
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
