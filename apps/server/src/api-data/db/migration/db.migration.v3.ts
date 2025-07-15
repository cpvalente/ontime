import {
  AutomationSettings,
  CustomFields,
  EndAction,
  isOntimeBlock,
  isOntimeDelay,
  isOntimeEvent,
  OntimeEntry,
  ProjectData,
  ProjectRundowns,
  Rundown,
  Settings,
  SupportedEntry,
  URLPreset,
  ViewSettings,
} from 'ontime-types';
import { is } from '../../../utils/is.js';
import { dbModel } from '../../../models/dataModel.js';
import { customFieldLabelToKey, isAlphanumericWithSpace, isKnownTimerType, validateEndAction } from 'ontime-utils';
import { event as eventModel } from '../../../models/eventsDefinition.js';

// the methodology of the migrations is to just change the necessary keys to match with v4
// and then let the normal project parser handle ensuring the the file is correct

export function shouldUseThisMigration(jsonData: object): boolean {
  return (
    is.objectWithKeys(jsonData, ['settings']) &&
    is.object(jsonData.settings) &&
    is.objectWithKeys(jsonData.settings, ['version']) &&
    typeof jsonData.settings.version === 'string' &&
    jsonData.settings.version.split('.')[0] === '3'
  );
}

/**
 * migrates a settings from v3 to v4.0.0
 * - update the version number
 */
export function migrateSettings(jsonData: object): Settings | undefined {
  if (is.objectWithKeys(jsonData, ['settings']) && is.object(jsonData.settings)) {
    // intentionally cast as any so we can extract the values
    const oldSettings = structuredClone(jsonData.settings) as any;
    const migrated: Settings = {
      version: '4.0.0',
      serverPort: oldSettings.serverPort ?? dbModel.settings.serverPort,
      editorKey: oldSettings.editorKey ?? dbModel.settings.editorKey,
      operatorKey: oldSettings.operatorKey ?? dbModel.settings.operatorKey,
      timeFormat: oldSettings.timeFormat ?? dbModel.settings.timeFormat,
      language: oldSettings.language ?? dbModel.settings.language,
    };
    return migrated;
  }
}

/**
 * migrates a view settings from v3 to v4.0.0
 * - drop `freezeEnd`
 * - drop `endMessage`
 */
export function migrateViewSettings(jsonData: object): ViewSettings | undefined {
  if (is.objectWithKeys(jsonData, ['viewSettings']) && is.object(jsonData.viewSettings)) {
    // intentionally cast as any so we can extract the values
    const oldViewSettings = structuredClone(jsonData.viewSettings) as any;
    const migrated: ViewSettings = {
      dangerColor: oldViewSettings.dangerColor ?? dbModel.viewSettings.dangerColor,
      normalColor: oldViewSettings.normalColor ?? dbModel.viewSettings.normalColor,
      overrideStyles: oldViewSettings.overrideStyles ?? dbModel.viewSettings.overrideStyles,
      warningColor: oldViewSettings.warningColor ?? dbModel.viewSettings.warningColor,
    };
    return migrated;
  }
}

/**
 * migrates a url presets from v3 to v4
 * - nothing changed
 */
export function migrateURLPresets(jsonData: object): URLPreset[] | undefined {
  if (is.objectWithKeys(jsonData, ['urlPresets']) && is.array(jsonData.urlPresets)) {
    const oldURLPresets = structuredClone(jsonData.urlPresets) as URLPreset[];
    return oldURLPresets;
  }
}

/**
 * migrates a url presets from v3 to v4.0.0
 * - `backstageUrl` -> `url`
 * - `backstageInfo` -> `info`
 * - drop `publicUrl`
 * - drop `publicInfo`
 * - ensure `logo`
 * - ensure `custom`
 */
export function migrateProjectData(jsonData: object): ProjectData | undefined {
  if (is.objectWithKeys(jsonData, ['project']) && is.object(jsonData.project)) {
    // intentionally cast as any so we can extract the values
    const oldProjectData = structuredClone(jsonData.project) as any;
    const migrated: ProjectData = {
      title: oldProjectData.title ?? dbModel.project.title,
      description: oldProjectData.description ?? dbModel.project.description,
      url: oldProjectData.backstageUrl ?? dbModel.project.url,
      info: oldProjectData.backstageInfo ?? dbModel.project.info,
      logo: oldProjectData.logo ?? dbModel.project.logo,
      custom: oldProjectData.custom ?? dbModel.project.custom,
    };
    return migrated;
  }
}

/**
 * migrates a custom fields from v3 to v4.0.0
 * - ensure correct case (TODO: could this be removed from the project parser)
 * - ensure that the key is derived from the label (TODO: could this be removed from the project parser)
 * - convert `type` from the string option to the text option
 * TODO: we might need a translation table to use when parsing the rundown
 */
export function migrateCustomFields(jsonData: object): CustomFields | undefined {
  if (is.objectWithKeys(jsonData, ['customFields']) && is.object(jsonData.customFields)) {
    // intentionally cast as any so we can extract the values
    const oldCustomFields = structuredClone(jsonData.customFields) as CustomFields;
    const newCustomFields: CustomFields = {};

    for (const [_originalKey, field] of Object.entries(oldCustomFields)) {
      if (!isAlphanumericWithSpace(field.label)) {
        continue;
      }

      // the key is always made from the label
      const key = customFieldLabelToKey(field.label);

      if (key in newCustomFields) {
        continue;
      }

      newCustomFields[key] = {
        //@ts-expect-error - we know this should not be the case in the migrated db
        type: field.type === 'string' ? 'text' : field.type,
        colour: field.colour,
        label: field.label,
      };
    }

    return newCustomFields;
  }
}

/**
 * migrates a automations from v3 to v4.0.0
 * - in case of a newer v3 project we can just return Automation settings
 * - TODO: recover older osc and http subscriptions
 */
export function migrateAutomations(jsonData: object): AutomationSettings | undefined {
  if (is.objectWithKeys(jsonData, ['automation']) && is.object(jsonData.automation)) {
    const oldProjectData = structuredClone(jsonData.automation) as AutomationSettings;
    return oldProjectData;
  }
}

/**
 * migrates a rundown from v3 to v4.0.0
 * - TODO: place in multi rundown object
 * - TODO: generate rundown info placeholders (can be somewhat empty as it will be regenerated by the rundown init)
 *
 * - events:
 *  -
 */
export function migrateRundown(jsonData: object): ProjectRundowns | undefined {
  if (is.objectWithKeys(jsonData, ['rundown']) && is.array(jsonData.rundown)) {
    // intentionally cast as any so we can extract the values
    const oldRundown = structuredClone(jsonData.rundown) as any[];
    const rundowns: ProjectRundowns = {};
    const newRundown: Rundown = {
      id: 'default',
      title: 'Default',
      order: [],
      flatOrder: [],
      entries: {},
      revision: 0,
    };

    const append = (entry: OntimeEntry) => {
      newRundown.order.push(entry.id);
      newRundown.flatOrder.push(entry.id);
      newRundown.entries[entry.id] = entry;
    };

    for (const entry of oldRundown) {
      if (isOntimeEvent(entry)) {
        append({
          type: SupportedEntry.Event,
          id: entry.id,
          flag: false, // new data point
          cue: entry.cue,
          title: entry.title,
          note: entry.note,
          endAction: validateEndAction(entry.endAction, EndAction.None), // ensure end action is not stop
          timerType: isKnownTimerType(entry.timerType) ? entry.timerType : eventModel.timerType, // ensure the timer type is not count-to-end
          //@ts-expect-error - we know this should not be the case in the migrated db
          countToEnd: entry.timerType === 'count-to-end', // countToEnd was previusly a timer type
          linkStart: Boolean(entry.linkStart), //this has been null/string
          timeStrategy: entry.timeStrategy, //TODO:
          timeStart: entry.timeStart,
          timeEnd: entry.timeEnd,
          duration: entry.duration,
          skip: entry.skip,
          colour: entry.colour,
          timeWarning: entry.timeWarning,
          timeDanger: entry.timeDanger,
          custom: entry.custom, //TODO: some keys might have been renamed
          triggers: entry.triggers ?? [], // might not be there if the project is a bit older
          parent: null, // new data point
          // !==== RUNTIME METADATA ====! //
          revision: -1,
          delay: 0,
          dayOffset: 0,
          gap: 0,
        });
      } else if (isOntimeBlock(entry)) {
        append({
          id: entry.id,
          type: SupportedEntry.Block,
          title: entry.title,
          note: '', // leave blank
          entries: [], // leave empty
          targetDuration: null,
          colour: '', //leave default colour
          custom: {}, // leave empty
          // !==== RUNTIME METADATA ====! //
          revision: -1,
          timeStart: null,
          timeEnd: null,
          duration: 0,
          isFirstLinked: false,
        });
      } else if (isOntimeDelay(entry)) {
        append({ id: entry.id, type: SupportedEntry.Delay, duration: entry.duration, parent: null });
      }
    }

    return {
      default: newRundown,
    };
  }
}
