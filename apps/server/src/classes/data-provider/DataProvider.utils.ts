import {
  DatabaseModel,
  DatabaseOntimeEvent,
  DatabaseOntimeRundown,
  isOntimeBlock,
  isOntimeDelay,
  isOntimeEvent,
  OntimeBlock,
  OntimeDelay,
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

export function dropNonPersistedKeys(newData: OntimeRundown): DatabaseOntimeRundown {
  const databaseRundown = newData.flatMap((entry) => {
    if (isOntimeEvent(entry)) {
      const databaseEntry: DatabaseOntimeEvent = {
        type: entry.type,
        id: entry.id,
        cue: entry.cue,
        title: entry.title,
        note: entry.note,
        endAction: entry.endAction,
        timerType: entry.timerType,
        countToEnd: entry.countToEnd,
        linkStart: entry.linkStart,
        timeStrategy: entry.timeStrategy,
        timeStart: entry.timeStart,
        timeEnd: entry.timeEnd,
        duration: entry.duration,
        isPublic: entry.isPublic,
        skip: entry.skip,
        colour: entry.colour,
        revision: entry.revision,
        timeWarning: entry.timeWarning,
        timeDanger: entry.timeDanger,
        custom: { ...entry.custom },
      };
      return databaseEntry;
    }
    if (isOntimeBlock(entry)) {
      return { ...entry } as OntimeBlock;
    }
    if (isOntimeDelay(entry)) {
      return { ...entry } as OntimeDelay;
    }
    return []; //This would most likely never happen
  });

  return databaseRundown;
}
