import {
  DatabaseModel,
  DatabaseOntimeEvent,
  DatabaseOntimeRundown,
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

export function rundownToDatabaseRundown(newData: OntimeRundown): DatabaseOntimeRundown {
  const databaseRundown = newData.map((entry) => {
    const entryClone = structuredClone(entry);
    if (isOntimeEvent(entryClone)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { delay, ...dbEvent } = entryClone;
      return dbEvent satisfies DatabaseOntimeEvent as DatabaseOntimeEvent;
    }
    if (isOntimeBlock(entryClone) || isOntimeDelay(entryClone)) {
      return entryClone;
    }
    throw new Error('Unknown entry type');
  });

  return databaseRundown;
}
