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
    backstageUrl: data.project.backstageUrl ?? dbModel.project.backstageUrl,
    backstageInfo: data.project.backstageInfo ?? dbModel.project.backstageInfo,
    projectLogo: data.project.projectLogo ?? dbModel.project.projectLogo,
    custom: data.project.custom ?? dbModel.project.custom,
  };
}
