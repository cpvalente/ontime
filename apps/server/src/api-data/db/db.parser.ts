import { DatabaseModel, LogOrigin } from 'ontime-types';

import { logger } from '../../classes/Logger.js';

import { parseAutomationSettings } from '../automation/automation.parser.js';
import { parseProjectData } from '../project-data/projectData.parser.js';
import { parseRundowns } from '../rundown/rundown.parser.js';
import { parseSettings } from '../settings/settings.parser.js';
import { parseUrlPresets } from '../url-presets/urlPresets.parser.js';
import { parseViewSettings } from '../view-settings/viewSettings.parser.js';
import { parseCustomFields } from '../custom-fields/customFields.parser.js';
import { migrate_v3_to_v4 } from './migration/db.migration.v3.js';

type ParsingError = {
  context: string;
  message: string;
};

/**
 * @description handles parsing of ontime project file
 * @param {object} jsonData - project file to be parsed
 * @returns {object} - parsed object
 */
export function parseDatabaseModel(jsonData: Partial<DatabaseModel>): { data: DatabaseModel; errors: ParsingError[] } {
  const errors: ParsingError[] = [];
  const makeEmitError = (context: string) => (message: string) => {
    logger.error(LogOrigin.Server, `Error parsing ${context}: ${message}`);
    errors.push({ context, message });
  };

  const migratedData = migrate_v3_to_v4(jsonData, makeEmitError('Migration'));

  const settings = parseSettings(migratedData);

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

  return { data, errors };
}
