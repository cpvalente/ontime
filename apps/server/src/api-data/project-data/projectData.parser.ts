import { DatabaseModel, ProjectData } from 'ontime-types';

import { ErrorEmitter } from '../../utils/parserUtils.js';
import { getPartialProject } from '../../models/dataModel.js';

/**
 * Parse event portion of an entry
 */
export function parseProjectData(data: Partial<DatabaseModel>, emitError?: ErrorEmitter): ProjectData {
  const defaultProject: ProjectData = getPartialProject('project');

  if (!data.project) {
    emitError?.('No data found to import');
    return defaultProject;
  }

  console.log('Found project data, importing...');

  return {
    title: data.project.title ?? defaultProject.title,
    description: data.project.description ?? defaultProject.description,
    url: data.project.url ?? defaultProject.url,
    info: data.project.info ?? defaultProject.info,
    logo: data.project.logo ?? defaultProject.logo,
    custom: data.project.custom ?? defaultProject.custom,
  };
}
