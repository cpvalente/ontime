import {
  DatabaseModel,
  OntimeEventDAO,
  OntimeRundownDAO,
  isOntimeBlock,
  isOntimeDelay,
  isOntimeEvent,
  OntimeRundown,
} from 'ontime-types';

/**
 * Merges a partial ontime project into a given ontime project
 */
export function safeMerge(existing: DatabaseModel, newData: Partial<DatabaseModel>): DatabaseModel {
  const {
    rundown = existing.rundown,
    project = {},
    settings = {},
    viewSettings = {},
    urlPresets = existing.urlPresets,
    customFields = existing.customFields,
    osc = {},
    http = {},
  } = newData;

  return {
    ...existing,
    rundown,
    project: { ...existing.project, ...project },
    settings: { ...existing.settings, ...settings },
    viewSettings: { ...existing.viewSettings, ...viewSettings },
    urlPresets: urlPresets ?? existing.urlPresets,
    customFields: customFields ?? existing.customFields,
    osc: { ...existing.osc, ...osc },
    http: { ...existing.http, ...http },
  };
}

export function rundownToDAO(newData: OntimeRundown): OntimeRundownDAO {
  const databaseRundown = newData.map((entry) => {
    if (isOntimeEvent(entry)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- we use destructuring to remove unwanted keys
      const { delay, custom, ...eventDAO } = entry;
      return { ...eventDAO, custom: { ...custom } } satisfies OntimeEventDAO as OntimeEventDAO;
    }
    if (isOntimeBlock(entry) || isOntimeDelay(entry)) {
      return { ...entry };
    }
    throw new Error('Unknown entry type');
  });

  return databaseRundown;
}
