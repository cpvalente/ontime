import { CustomField, CustomFields, DatabaseModel, ProjectData, Settings, URLPreset, ViewSettings } from 'ontime-types';
import { customFieldLabelToKey, isAlphanumericWithSpace } from 'ontime-utils';

import { dbModel } from '../models/dataModel.js';

import { type ErrorEmitter } from './parser.js';

/**
 * Parse event portion of an entry
 */
export function parseProject(data: Partial<DatabaseModel>, emitError?: ErrorEmitter): ProjectData {
  if (!data.project) {
    emitError?.('No data found to import');
    return { ...dbModel.project };
  }

  console.log('Found project data, importing...');

  return {
    title: data.project.title ?? dbModel.project.title,
    description: data.project.description ?? dbModel.project.description,
    publicUrl: data.project.publicUrl ?? dbModel.project.publicUrl,
    publicInfo: data.project.publicInfo ?? dbModel.project.publicInfo,
    backstageUrl: data.project.backstageUrl ?? dbModel.project.backstageUrl,
    backstageInfo: data.project.backstageInfo ?? dbModel.project.backstageInfo,
    projectLogo: data.project.projectLogo ?? dbModel.project.projectLogo,
  };
}

/**
 * Parse settings portion of an entry
 */
export function parseSettings(data: Partial<DatabaseModel>): Settings {
  // skip if file definition is missing
  // TODO: skip parsing if the version is not correct
  if (!data.settings || data.settings?.version == null) {
    throw new Error('ERROR: unable to parse settings, missing or incorrect version');
  }

  console.log('Found settings, importing...');

  return {
    version: dbModel.settings.version,
    serverPort: data.settings.serverPort ?? dbModel.settings.serverPort,
    editorKey: data.settings.editorKey ?? null,
    operatorKey: data.settings.operatorKey ?? null,
    timeFormat: data.settings.timeFormat ?? '24',
    language: data.settings.language ?? 'en',
  };
}

/**
 * Parse view settings portion of an entry
 */
export function parseViewSettings(data: Partial<DatabaseModel>, emitError?: ErrorEmitter): ViewSettings {
  if (!data.viewSettings) {
    emitError?.('No data found to import');
    return { ...dbModel.viewSettings };
  }

  console.log('Found view settings, importing...');

  return {
    dangerColor: data.viewSettings.dangerColor ?? dbModel.viewSettings.dangerColor,
    endMessage: data.viewSettings.endMessage ?? dbModel.viewSettings.endMessage,
    freezeEnd: data.viewSettings.freezeEnd ?? dbModel.viewSettings.freezeEnd,
    normalColor: data.viewSettings.normalColor ?? dbModel.viewSettings.normalColor,
    overrideStyles: data.viewSettings.overrideStyles ?? dbModel.viewSettings.overrideStyles,
    warningColor: data.viewSettings.warningColor ?? dbModel.viewSettings.warningColor,
  };
}

/**
 * Parse URL preset portion of an entry
 */
export function parseUrlPresets(data: Partial<DatabaseModel>, emitError?: ErrorEmitter): URLPreset[] {
  if (!data.urlPresets) {
    emitError?.('No data found to import');
    return [];
  }

  console.log('Found URL presets, importing...');

  const newPresets: URLPreset[] = [];

  for (const preset of data.urlPresets) {
    const newPreset = {
      enabled: preset.enabled ?? false,
      alias: preset.alias ?? '',
      pathAndParams: preset.pathAndParams ?? '',
    };
    newPresets.push(newPreset);
  }

  console.log(`Uploaded ${newPresets.length} preset(s)`);

  return newPresets;
}

/**
 * Parse customFields entry
 */
export function parseCustomFields(data: Partial<DatabaseModel>, emitError?: ErrorEmitter): CustomFields {
  if (typeof data.customFields !== 'object') {
    emitError?.('No data found to import');
    return {};
  }
  console.log('Found Custom Fields, importing...');

  const customFields = sanitiseCustomFields(data.customFields);
  if (Object.keys(customFields).length !== Object.keys(data.customFields).length) {
    emitError?.('Skipped invalid custom fields');
  }
  return customFields;
}

export function sanitiseCustomFields(data: object): CustomFields {
  const newCustomFields: CustomFields = {};

  for (const [originalKey, field] of Object.entries(data)) {
    if (!isValidField(field)) {
      continue;
    }

    if (!isAlphanumericWithSpace(field.label)) {
      continue;
    }

    // Test label and key cohesion
    const key = (() => {
      const keyFromLabel = customFieldLabelToKey(field.label);
      if (keyFromLabel === null) {
        return originalKey;
      }
      return originalKey.toLowerCase() === keyFromLabel.toLowerCase() ? originalKey : keyFromLabel;
    })();

    if (key in newCustomFields) {
      continue;
    }

    newCustomFields[key] = {
      type: field.type,
      colour: field.colour,
      label: field.label,
    };
  }

  function isValidField(data: unknown): data is CustomField {
    return (
      typeof data === 'object' &&
      data !== null &&
      'label' in data &&
      data.label !== '' &&
      'colour' in data &&
      typeof data.colour === 'string' &&
      'type' in data &&
      (data.type === 'string' || data.type === 'image')
    );
  }

  return newCustomFields;
}
