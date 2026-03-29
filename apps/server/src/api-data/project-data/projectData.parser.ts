import { DatabaseModel, ProjectData } from 'ontime-types';

import { getPartialProject } from '../../models/dataModel.js';
import { ErrorEmitter } from '../../utils/parserUtils.js';

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
    custom: parseCustomProjectData(data.project.custom, defaultProject.custom, emitError),
  };
}

function isProjectCustomEntry(entry: unknown): entry is ProjectData['custom'][number] {
  if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
    return false;
  }

  const { title, value, url } = entry as Record<string, unknown>;

  return typeof title === 'string' && typeof value === 'string' && (url === undefined || typeof url === 'string');
}

function parseCustomProjectData(
  data: unknown,
  defaultCustomData: ProjectData['custom'],
  emitError?: ErrorEmitter,
): ProjectData['custom'] {
  if (!Array.isArray(data)) {
    if (data !== undefined) {
      emitError?.('Project custom data is invalid, using defaults');
    }
    return defaultCustomData;
  }

  const parsed: ProjectData['custom'] = [];
  let skippedInvalidEntry = false;

  for (let i = 0; i < data.length; i++) {
    const entry = data[i];

    if (!isProjectCustomEntry(entry)) {
      skippedInvalidEntry = true;
      continue;
    }

    parsed.push({
      title: entry.title,
      value: entry.value,
      url: entry.url ?? '',
    });
  }

  if (skippedInvalidEntry) {
    emitError?.('Project custom data contained invalid entries, skipping them');
  }

  return parsed;
}
