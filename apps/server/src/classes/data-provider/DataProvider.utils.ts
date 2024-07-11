import { DatabaseModel } from 'ontime-types';

/**
 * Merges a partial ontime project into a given ontime project
 */
export function safeMerge(existing: DatabaseModel, newData: Partial<DatabaseModel>): DatabaseModel {
  const { rundown, project, settings, viewSettings, urlPresets, customFields, osc, http } = newData || {};

  return {
    ...existing,
    rundown: rundown ?? existing.rundown,
    project: { ...existing.project, ...project },
    settings: { ...existing.settings, ...settings },
    viewSettings: { ...existing.viewSettings, ...viewSettings },
    urlPresets: urlPresets ?? existing.urlPresets,
    customFields: customFields ?? existing.customFields,
    osc: { ...existing.osc, ...osc },
    http: { ...existing.http, ...http },
  };
}
