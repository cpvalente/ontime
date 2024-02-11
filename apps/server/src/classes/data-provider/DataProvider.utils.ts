import { DatabaseModel } from 'ontime-types';

/**
 * Merges two data objects
 * @param {object} existing
 * @param {object} newData
 */
export function safeMerge(existing: DatabaseModel, newData: Partial<DatabaseModel>) {
  const { rundown, project, settings, viewSettings, aliases, userFields, osc, http } = newData || {};

  return {
    ...existing,
    rundown: rundown ?? existing.rundown,
    project: { ...existing.project, ...project },
    settings: { ...existing.settings, ...settings },
    viewSettings: { ...existing.viewSettings, ...viewSettings },
    aliases: aliases ?? existing.aliases,
    userFields: {
      ...existing.userFields,
      ...(userFields && Object.fromEntries(Object.entries(userFields).filter(([_, value]) => value !== null))),
    },
    osc: { ...existing.osc, ...osc },
    http: { ...existing.http, ...http },
  };
}
