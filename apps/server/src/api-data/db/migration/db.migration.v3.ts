import {
  AutomationSettings,
  CustomFields,
  EndAction,
  EntryCustomFields,
  NormalisedAutomation,
  OntimeEntry,
  ProjectData,
  ProjectRundowns,
  Rundown,
  Settings,
  SupportedEntry,
  TimerLifeCycle,
  Trigger,
  URLPreset,
  ViewSettings,
} from 'ontime-types';
import { is } from '../../../utils/is.js';
import { dbModel } from '../../../models/dataModel.js';
import { customFieldLabelToKey, checkRegex, isKnownTimerType, validateEndAction } from 'ontime-utils';
import { event as eventModel } from '../../../models/eventsDefinition.js';

// the methodology of the migrations is to just change the necessary keys to match with v4
// and then let the normal project parser handle ensuring the the file is correct
// we should also avoid relying on the types package as this file should continue to work with old types when things change

export function shouldUseThisMigration(jsonData: object): boolean {
  return (
    is.objectWithKeys(jsonData, ['settings']) &&
    is.object(jsonData.settings) &&
    is.objectWithKeys(jsonData.settings, ['version']) &&
    typeof jsonData.settings.version === 'string' &&
    jsonData.settings.version.split('.')[0] === '3'
  );
}

type old_Settings = {
  version: string;
  serverPort: number;
  editorKey: null | string;
  operatorKey: null | string;
  timeFormat: '12' | '24';
  language: string;
};

/**
 * migrates a settings from v3 to v4.0.0
 * - update the version number
 */
export function migrateSettings(jsonData: object): Settings | undefined {
  if (is.objectWithKeys(jsonData, ['settings']) && is.object(jsonData.settings)) {
    const oldSettings = structuredClone(jsonData.settings) as old_Settings;

    const migrated: Settings = { ...oldSettings, version: '4.0.0' };
    return migrated;
  }
}

type old_ViewSettings = {
  dangerColor: string;
  normalColor: string;
  overrideStyles: boolean;
  warningColor: string;
  freezeEnd: boolean;
  endMessage: string;
};

/**
 * migrates a view settings from v3 to v4.0.0
 * - drop `freezeEnd`
 * - drop `endMessage`
 */
export function migrateViewSettings(jsonData: object): ViewSettings | undefined {
  if (is.objectWithKeys(jsonData, ['viewSettings']) && is.object(jsonData.viewSettings)) {
    const { dangerColor, normalColor, overrideStyles, warningColor } = structuredClone(
      jsonData.viewSettings,
    ) as old_ViewSettings;
    return { dangerColor, normalColor, overrideStyles, warningColor };
  }
}

type old_URLPreset = {
  enabled: boolean;
  alias: string;
  pathAndParams: string;
}[];

/**
 * migrates a url presets from v3 to v4
 * - pathAndParams split into a target and search
 */
export function migrateURLPresets(jsonData: object): URLPreset[] | undefined {
  if (is.objectWithKeys(jsonData, ['urlPresets']) && is.array(jsonData.urlPresets)) {
    const oldURLPresets = structuredClone(jsonData.urlPresets) as old_URLPreset;
    const newURLPreset: URLPreset[] = oldURLPresets.map(({ enabled, alias, pathAndParams }) => {
      const [target, search] = pathAndParams.split('?');
      return { enabled, alias, target, search };
    });
    return newURLPreset;
  }
}

type old_ProjectData = {
  title: string;
  description: string;
  backstageUrl: string;
  backstageInfo: string;
  publicUrl: string;
  publicInfo: string;
  logo?: string; // is not present in old files
  custom?: { title: string; value: string; url: string }[]; // is not present in old files
};

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
    const { title, description, backstageInfo, backstageUrl, logo, custom } = structuredClone(
      jsonData.project,
    ) as old_ProjectData;

    const migrated: ProjectData = {
      title,
      description,
      url: backstageUrl,
      info: backstageInfo,
      logo: logo ?? dbModel.project.logo,
      custom: custom ?? dbModel.project.custom,
    };
    return migrated;
  }
}

// old key -> new key
type CustomFieldsTranslationTable = Map<string, string>;
type old_CustomFields = Record<
  string,
  {
    type: 'string' | 'image';
    colour: string;
    label: string;
  }
>;

/**
 * migrates a custom fields from v3 to v4.0.0
 * - ensure correct case (TODO: could this be removed from the project parser)
 * - ensure that the key is derived from the label (TODO: could this be removed from the project parser)
 * - convert `type` from the string option to the text option
 * - create a translation table for the rundown parser
 */
export function migrateCustomFields(
  jsonData: object,
): { customFields: CustomFields; translationTable: CustomFieldsTranslationTable } | undefined {
  const translationTable: CustomFieldsTranslationTable = new Map();

  if (is.objectWithKeys(jsonData, ['customFields']) && is.object(jsonData.customFields)) {
    // intentionally cast as any so we can extract the values
    const oldCustomFields = structuredClone(jsonData.customFields) as old_CustomFields;
    const customFields: CustomFields = {};

    for (const [originalKey, field] of Object.entries(oldCustomFields)) {
      if (!checkRegex.isAlphanumericWithSpace(field.label)) {
        continue;
      }

      // the key is always made from the label
      const key = customFieldLabelToKey(field.label);

      if (key in customFields) {
        continue;
      }

      translationTable.set(originalKey, key);

      customFields[key] = {
        type: field.type === 'string' ? 'text' : field.type,
        colour: field.colour,
        label: field.label,
      };
    }

    return { customFields, translationTable };
  }
}

export type old_OscSubscription = {
  id: string;
  cycle: TimerLifeCycle;
  address: string;
  payload: string;
  enabled: boolean;
};

export type old_OSCSettings = {
  portIn: number;
  portOut: number;
  targetIP: string;
  enabledIn: boolean;
  enabledOut: boolean;
  subscriptions: old_OscSubscription[];
};

export type old_HttpSubscription = { id: string; cycle: TimerLifeCycle; message: string; enabled: boolean };

export type old_HttpSettings = {
  enabledOut: boolean;
  subscriptions: old_HttpSubscription[];
};

/**
 * migrates a automations from v3 to v4.0.0
 * - in case of a newer v3 project we can just return Automation settings
 * - recover older osc and http subscriptions
 */
export function migrateAutomations(jsonData: object): AutomationSettings | undefined {
  if (is.objectWithKeys(jsonData, ['automation']) && is.object(jsonData.automation)) {
    // For now the automation type used i v3 and in v4 are the same but we will need to update this if it changes at some point
    const oldAutomationSettings = structuredClone(jsonData.automation) as AutomationSettings;
    return oldAutomationSettings;
  }

  let foundOldSetting = false;
  const migratedOldStuff = structuredClone(dbModel.automation);
  const migratedAutomations: NormalisedAutomation = {};
  const migratedTriggers: Trigger[] = [];

  if (is.objectWithKeys(jsonData, ['osc']) && is.object(jsonData.osc)) {
    foundOldSetting = true;
    const { subscriptions, portIn, enabledIn, targetIP, portOut } = structuredClone(jsonData.osc) as old_OSCSettings;
    migratedOldStuff.enabledOscIn = enabledIn;
    migratedOldStuff.oscPortIn = portIn;

    for (const subscription of subscriptions) {
      const { id, cycle, address, payload } = subscription;

      migratedTriggers.push({
        id: `${id}-T`,
        automationId: `${id}-A`,
        title: `Migrated Trigger ${id}`,
        trigger: cycle,
      });

      migratedAutomations[`${id}-A`] = {
        id: `${id}-A`,
        title: `Migrated Automation ${id}`,
        filterRule: 'any',
        filters: [],
        outputs: [{ type: 'osc', address, args: payload, targetIP, targetPort: portOut }],
      };
    }
  }

  if (is.objectWithKeys(jsonData, ['http']) && is.object(jsonData.http)) {
    foundOldSetting = true;
    const { subscriptions } = structuredClone(jsonData.http) as old_HttpSettings;

    for (const subscription of subscriptions) {
      const { id, cycle, message } = subscription;
      migratedTriggers.push({
        id: `${id}-T`,
        automationId: `${id}-A`,
        title: `Migrated Trigger ${id}`,
        trigger: cycle,
      });

      migratedAutomations[`${id}-A`] = {
        id: `${id}-A`,
        title: `Migrated Automation ${id}`,
        filterRule: 'any',
        filters: [],
        outputs: [{ type: 'http', url: message }],
      };
    }
  }

  if (foundOldSetting) {
    migratedOldStuff.automations = migratedAutomations;
    migratedOldStuff.triggers = migratedTriggers;
    return migratedOldStuff;
  }
}

/**
 * migrates a rundown from v3 to v4.0.0
 * -  name the rundown default and place it in the multi rundown object
 * - generate rundown info placeholders (can be somewhat empty as it will be regenerated by the rundown init)
 *
 * - events:
 *  - add flag
 *  - ensure end action is not stop
 *  - move the timer type count-to-end to it owen setting
 *  - ensure triggers
 *  - add parent
 *
 * - block:
 *  - add all the new blocks of the block that is now a group
 */
export function migrateRundown(
  jsonData: object,
  translationTable: CustomFieldsTranslationTable,
): ProjectRundowns | undefined {
  if (is.objectWithKeys(jsonData, ['rundown']) && is.array(jsonData.rundown)) {
    // intentionally cast as any so we can extract the values
    const oldRundown = structuredClone(jsonData.rundown) as any[];
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
      if (entry.type === 'event') {
        const { custom } = entry as { custom: Record<string, string> };
        const newCustom: EntryCustomFields = {};
        Object.entries(custom).map(([key, value]) => {
          const newKey = translationTable.get(key);
          if (newKey) {
            newCustom[newKey] = value;
          }
        });
        append({
          type: SupportedEntry.Event,
          id: entry.id,
          flag: false, // new data point
          cue: entry.cue,
          title: entry.title,
          note: entry.note,
          endAction: validateEndAction(entry.endAction, EndAction.None), // ensure end action is not stop
          timerType: isKnownTimerType(entry.timerType) ? entry.timerType : eventModel.timerType, // ensure the timer type is not count-to-end
          countToEnd: entry.timerType === 'count-to-end', // countToEnd was previously a timer type
          linkStart: Boolean(entry.linkStart), //this has been null/string
          timeStrategy: entry.timeStrategy,
          timeStart: entry.timeStart,
          timeEnd: entry.timeEnd,
          duration: entry.duration,
          skip: entry.skip,
          colour: entry.colour,
          timeWarning: entry.timeWarning,
          timeDanger: entry.timeDanger,
          custom: newCustom,
          triggers: entry.triggers ?? [], // might not be there if the project is a bit older
          parent: null, // new data point
          // !==== RUNTIME METADATA ====! //
          revision: -1,
          delay: 0,
          dayOffset: 0,
          gap: 0,
        });
      } else if (entry.type === 'block') {
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
      } else if (entry.type === 'delay') {
        append({ id: entry.id, type: SupportedEntry.Delay, duration: entry.duration, parent: null });
      }
    }

    return {
      default: newRundown,
    };
  }
}
