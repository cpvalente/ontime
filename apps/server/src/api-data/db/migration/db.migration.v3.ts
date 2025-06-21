import {
  AutomationSettings,
  CustomFields,
  DatabaseModel,
  isOntimeBlock,
  isOntimeEvent,
  OntimeEntry,
  OntimeEvent,
  ProjectData,
  Rundown,
  RundownEntries,
  Settings,
  SupportedEntry,
  URLPreset,
  ViewSettings,
} from 'ontime-types';
import { customFieldLabelToKey } from 'ontime-utils';
import { ONTIME_VERSION } from '../../../ONTIME_VERSION.js';
import { versionCheck } from './versionCheck.js';
import { ErrorEmitter } from '../../../utils/parserUtils.js';

/**
 * Changes from v3 to v4
 * PROJECT-DATA
 * - must have logo
 * - must have custom array
 * - public url and info is removed
 *
 * CUSTOM-FIELD
 *  - keys must be derived from label
 *
 * EVENT
 * - trigger is not optional
 * - parent is not  optional
 * - isPublic is removed
 * - TODO: has the end action of events ben changed?
 *
 * BLOCK
 * - add fields           
          note: '',
          events: [],
          skip: false,
          colour: '',
          custom: {},
          revision: 0,
          startTime: null,
          endTime: null,
          duration: 0,
          isFirstLinked: false,
 *
 * RUNDOWN
 * - there are now multiple rundowns
 * - new rundown format
 *
 */

export function migrate_v3_to_v4(jsonData: object, emitError?: ErrorEmitter): Partial<DatabaseModel> {
  const version = versionCheck(jsonData);
  if (version === null) {
    emitError?.('No version field found, can not migrate data');
    return jsonData;
  }

  if (version.major > 3) {
    return jsonData;
  }

  console.log('Found v3 project, migrating...');

  const migratedDb = {} as Partial<DatabaseModel>;

  if ('settings' in jsonData) {
    migratedDb.settings = structuredClone(jsonData.settings) as Settings;
    migratedDb.settings.version = ONTIME_VERSION;
    console.log('\t..settings');
  }

  if ('project' in jsonData) {
    migratedDb.project = structuredClone(jsonData.project) as ProjectData;
    if (!('projectLogo' in migratedDb.project)) {
      Object.assign(migratedDb.project, { projectLogo: null });
    }
    if (!('custom' in migratedDb.project)) {
      Object.assign(migratedDb.project, { custom: [] });
    }

    if ('publicInfo' in migratedDb.project) {
      delete migratedDb.project.publicInfo;
    }

    if ('publicUrl' in migratedDb.project) {
      delete migratedDb.project.publicUrl;
    }
    console.log('\t..project');
  }

  if ('viewSettings' in jsonData) {
    migratedDb.viewSettings = structuredClone(jsonData.viewSettings) as ViewSettings;
    console.log('\t..viewSettings');
  }

  if ('urlPresets' in jsonData) {
    migratedDb.urlPresets = structuredClone(jsonData.urlPresets) as URLPreset[];
    console.log('\t..urlPresets');
  }

  if ('automation' in jsonData) {
    migratedDb.automation = structuredClone(jsonData.automation) as AutomationSettings;
    console.log('\t..automation');
  }

  const renamedCustomFields: Record<string, string> = {};
  if ('customFields' in jsonData) {
    const newCustomFields: CustomFields = {};
    for (const [originalKey, field] of Object.entries(structuredClone(jsonData.customFields) as CustomFields)) {
      const key = customFieldLabelToKey(field.label);
      if (originalKey !== key) {
        renamedCustomFields[originalKey] = key;
      }
      newCustomFields[key] = field;
    }

    migratedDb.customFields = newCustomFields;
    console.log('\t..customFields', Object.keys(newCustomFields).length);
  }

  if ('rundown' in jsonData) {
    const oldRundown = structuredClone(jsonData.rundown) as OntimeEntry[];
    const order = oldRundown.map((entry) => entry.id);
    const entries: RundownEntries = {};

    oldRundown.forEach((entry) => {
      if (isOntimeEvent(entry)) {
        entry.parent = null;
        entry.triggers = [];
        Object.entries(entry.custom).forEach(([oldKey, value]) => {
          if (oldKey in renamedCustomFields) {
            (entry as OntimeEvent).custom[renamedCustomFields[oldKey]] = value;
            delete (entry as OntimeEvent).custom[oldKey];
          }
        });
        if ('isPublic' in entry) {
          delete entry.isPublic;
        }
      }
      if (isOntimeBlock(entry)) {
        entry = {
          type: SupportedEntry.Block,
          id: entry.id,
          title: entry.title,
          note: '',
          events: [],
          skip: false,
          colour: '',
          custom: {},
          revision: 0,
          startTime: null,
          endTime: null,
          duration: 0,
          isFirstLinked: false,
        };
      }
      entries[entry.id] = { ...entry };
    });

    const rundown: Rundown = {
      id: 'default',
      title: 'Default',
      order,
      flatOrder: order,
      entries,
      revision: 0,
    };

    migratedDb.rundowns = { default: rundown };
    console.log('\t..rundown', order.length);
  }

  return migratedDb;
}
