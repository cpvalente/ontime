import { DatabaseModel, LogOrigin } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import { portManager } from '../../classes/port-manager/PortManager.js';
import { parseAutomationSettings } from '../automation/automation.parser.js';
import { parseProjectCustomFields } from '../custom-fields/customFields.parser.js';
import * as logger from '../logs/logs.service.js';
import { parseProjectData } from '../project-data/projectData.parser.js';
import { parseRundowns } from '../rundown/rundown.parser.js';
import { parseSettings } from '../settings/settings.parser.js';
import { parseUrlPresets } from '../url-presets/urlPresets.parser.js';
import { parseViewSettings } from '../view-settings/viewSettings.parser.js';
import * as v3 from './migration/db.migration.v3.js';
import * as v4 from './migration/db.migration.v4.js';
import * as v5 from './migration/db.migration.v5.js';

type ParsingError = {
  context: string;
  message: string;
};

/**
 * @description handles parsing of ontime project file
 * @param {object} jsonData - project file to be parsed
 * @returns {object} parsed object
 */
export function parseDatabaseModel(
  jsonData: object,
  initialLoad = false,
): {
  data: DatabaseModel;
  errors: ParsingError[];
  migrated: boolean;
} {
  let migrated = false;
  let migratedData: object = jsonData;
  const errors: ParsingError[] = [];

  if (v3.shouldUseThisMigration(jsonData)) {
    try {
      migrated = true;
      migratedData = v3.migrateAllData(jsonData);
    } catch (error) {
      const message = getErrorMessage(error);
      logger.error(LogOrigin.Server, 'Project migration failed', { from: 'v3', error: message });
      errors.push({ context: 'v3 migration', message });
      migratedData = jsonData;
    }
  }

  if (v4.shouldMigrateServerPort(migratedData)) {
    try {
      migrated = true;
      const { db, serverPort } = v4.migrateServerPort(migratedData);
      if (initialLoad && serverPort) portManager.migratePortFromProjectFile(serverPort);
      migratedData = db;
    } catch (error) {
      const message = getErrorMessage(error);
      logger.error(LogOrigin.Server, 'Settings migration failed', { key: 'serverPort', error: message });
      errors.push({ context: 'v4 migration', message });
      migratedData = jsonData;
    }
  }

  if (v5.shouldUseThisMigration(migratedData)) {
    migratedData = v5.migrateAllData(migratedData);
    migrated = true;
  }

  // we need to parse settings first to make sure the data is ours
  // this may throw
  const settings = parseSettings(migratedData);

  const makeEmitError = (context: string) => (message: string) => {
    logger.error(LogOrigin.Server, 'Project parse failed', { section: context, error: message });
    errors.push({ context, message });
  };

  // we need to parse the custom fields first so they can be used in validating events
  const customFields = parseProjectCustomFields(migratedData, makeEmitError('Custom Fields'));
  const rundowns = parseRundowns(migratedData, customFields.fields, makeEmitError('Rundowns'));

  const data: DatabaseModel = {
    rundowns,
    project: parseProjectData(migratedData, makeEmitError('Project')),
    settings,
    viewSettings: parseViewSettings(migratedData, makeEmitError('View Settings')),
    urlPresets: parseUrlPresets(migratedData, makeEmitError('URL Presets')),
    customFields,
    automation: parseAutomationSettings(migratedData),
  };

  return { data, errors, migrated };
}
