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

type ParsingError = {
  context: string;
  message: string;
};

/**
 * @description handles parsing of ontime project file
 * @param {object} jsonData - project file to be parsed
 * @returns {object} - parsed object
 */
export function parseDatabaseModel(jsonData: Partial<DatabaseModel>): {
  data: DatabaseModel;
  errors: ParsingError[];
  migrated: boolean;
} {

  //TODO: TEST THIS!!!!!!!
  let migrated = false;
  if (v3.shouldUseThisMigration(jsonData)) {
    migrated = true;
    logger.warning(LogOrigin.Server, 'The imported project is from v3, trying to migrate');
    //TODO: is this bad?
    jsonData = v3.migrateAllData(jsonData);
  }

  // we need to parse settings first to make sure the data is ours
  // this may throw
  const settings = parseSettings(jsonData);

  const errors: ParsingError[] = [];
  const makeEmitError = (context: string) => (message: string) => {
    logger.error(LogOrigin.Server, `Error parsing ${context}: ${message}`);
    errors.push({ context, message });
  };

  // we need to parse the custom fields first so they can be used in validating events
  const customFields = parseCustomFields(jsonData, makeEmitError('Custom Fields'));
  const rundowns = parseRundowns(jsonData, customFields, makeEmitError('Rundowns'));

  const data: DatabaseModel = {
    rundowns,
    project: parseProjectData(jsonData, makeEmitError('Project')),
    settings,
    viewSettings: parseViewSettings(jsonData, makeEmitError('View Settings')),
    urlPresets: parseUrlPresets(jsonData, makeEmitError('URL Presets')),
    customFields,
    automation: parseAutomationSettings(jsonData),
  };

  return { data, errors, migrated };
}
