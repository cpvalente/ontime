import type { CustomField, CustomFieldKey, OntimeEntry } from 'ontime-types';
import { isOntimeEvent, isOntimeMilestone } from 'ontime-types';
import type { ImportMap } from 'ontime-utils';
import { millisToString } from 'ontime-utils';

import { builtInFieldDefs } from '../importMapUtils';

type BuiltInImportKey = keyof Omit<ImportMap, 'worksheet' | 'custom'>;

const importKeyByLabel = new Map<string, BuiltInImportKey>(builtInFieldDefs.map((def) => [def.label, def.importKey]));

function booleanToText(value?: boolean): string {
  return value ? 'Yes' : '';
}

function getBuiltInValue(label: string, entry: OntimeEntry): string {
  const importKey = importKeyByLabel.get(label);
  if (!importKey) return '';

  switch (importKey) {
    case 'flag':
      return isOntimeEvent(entry) ? booleanToText(entry.flag) : '';
    case 'timeStart':
      return 'timeStart' in entry ? millisToString(entry.timeStart) : '';
    case 'linkStart':
      return isOntimeEvent(entry) ? booleanToText(entry.linkStart) : '';
    case 'timeEnd':
      return isOntimeEvent(entry) ? millisToString(entry.timeEnd) : '';
    case 'duration':
      return isOntimeEvent(entry) ? millisToString(entry.duration) : '';
    case 'cue':
      return isOntimeEvent(entry) || isOntimeMilestone(entry) ? entry.cue : '';
    case 'title':
      return 'title' in entry ? entry.title : '';
    case 'countToEnd':
      return isOntimeEvent(entry) ? booleanToText(entry.countToEnd) : '';
    case 'skip':
      return isOntimeEvent(entry) ? booleanToText(entry.skip) : '';
    case 'note':
      return 'note' in entry ? (entry.note ?? '') : '';
    case 'colour':
      return 'colour' in entry ? (entry.colour ?? '') : '';
    case 'endAction':
      return isOntimeEvent(entry) ? entry.endAction : '';
    case 'timerType':
      return isOntimeEvent(entry) ? entry.timerType : '';
    case 'timeWarning':
      return isOntimeEvent(entry) ? millisToString(entry.timeWarning) : '';
    case 'timeDanger':
      return isOntimeEvent(entry) ? millisToString(entry.timeDanger) : '';
    case 'id':
      return entry.id;
    default:
      return '';
  }
}

export function getCellValue(
  label: string,
  entry: OntimeEntry,
  customFieldKeyByLabel: Map<CustomField['label'], CustomFieldKey>,
): string {
  const customFieldId = customFieldKeyByLabel.get(label);
  if (customFieldId && 'custom' in entry) {
    return entry.custom?.[customFieldId] ?? '';
  }
  return getBuiltInValue(label, entry);
}
