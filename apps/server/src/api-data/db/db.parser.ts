import { DatabaseModel, LogOrigin } from 'ontime-types';

import { logger } from '../../classes/Logger.js';

import { parseAutomationSettings } from '../automation/automation.parser.js';
import { parseProjectData } from '../project-data/projectData.parser.js';
import { parseRundowns } from '../rundown/rundown.parser.js';
import { parseSettings } from '../settings/settings.parser.js';
import { parseUrlPresets } from '../url-presets/urlPresets.parser.js';
import { parseViewSettings } from '../view-settings/viewSettings.parser.js';
import { parseCustomFields } from '../custom-fields/customFields.parser.js';
import * as v3 from './migration/db.migration.v3.js';
import * as v4 from './migration/db.migration.v4.js';
import { portManager } from '../../classes/port-manager/PortManager.js';
import { getErrorMessage } from 'ontime-utils';

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
  jsonData: Partial<DatabaseModel>,
  initialLoad = false,
): {
  data: DatabaseModel;
  errors: ParsingError[];
  migrated: boolean;
} {

  let migrated = false;
  let migratedData = jsonData;
  const errors: ParsingError[] = [];

  if (v3.shouldUseThisMigration(jsonData)) {
    try {
      migrated = true;
      logger.warning(LogOrigin.Server, 'The imported project is from v3, trying to migrate');
      migratedData = v3.migrateAllData(jsonData);
    } catch (error) {
      logger.error(LogOrigin.Server, 'Failed to migrate the data');
      errors.push({ context: 'v3 migration', message: getErrorMessage(error) });
      migratedData = jsonData;
    };

  }


  if (v4.shouldMigrateServerPort(migratedData)) {
    try {
      migrated = true;
      logger.warning(LogOrigin.Server, 'Migrating serverPort from settings to AppState');
      const { db, serverPort } = v4.migrateServerPort(migratedData);
      if (initialLoad && serverPort) portManager.migratePortFromProjectFile(serverPort);
      migratedData = db;
    } catch (error) {
      logger.error(LogOrigin.Server, 'Failed to migrate serverPort');
      errors.push({ context: 'v4 migration', message: getErrorMessage(error) });
      migratedData = jsonData;

    }
  }

  // we need to parse settings first to make sure the data is ours
  // this may throw
  const settings = parseSettings(migratedData);

  const makeEmitError = (context: string) => (message: string) => {
    logger.error(LogOrigin.Server, `Error parsing ${context}: ${message}`);
    errors.push({ context, message });
  };

  // we need to parse the custom fields first so they can be used in validating events
  const customFields = parseCustomFields(migratedData, makeEmitError('Custom Fields'));
  const rundowns = parseRundowns(migratedData, customFields, makeEmitError('Rundowns'));

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
