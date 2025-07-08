import { DatabaseModel, ProjectData } from 'ontime-types';

import { dbModel } from '../../models/dataModel.js';
import { ErrorEmitter } from '../../utils/parserUtils.js';

/**
 * Parse event portion of an entry
 */
export function parseProjectData(data: Partial<DatabaseModel>, emitError?: ErrorEmitter): ProjectData {
  if (!data.project) {
    emitError?.('No data found to import');
    return { ...dbModel.project };
  }

  console.log('Found project data, importing...');

  return {
    title: data.project.title ?? dbModel.project.title,
    description: data.project.description ?? dbModel.project.description,
    url: data.project.url ?? dbModel.project.url,
    info: data.project.info ?? dbModel.project.info,
    logo: data.project.logo ?? dbModel.project.logo,
    custom: data.project.custom ?? dbModel.project.custom,
  };
}
