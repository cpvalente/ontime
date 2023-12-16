import { DatabaseModel } from 'ontime-types';

/**
 * Merges two data objects
 * @param {object} existing
 * @param {object} newData
 */
export function safeMerge(existing: DatabaseModel, newData: Partial<DatabaseModel>) {
  const { rundown, project, settings, viewSettings, osc, aliases, userFields } = newData || {};
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
    osc: {
      ...existing.osc,
      ...osc,
      subscriptions: {
        ...existing.osc?.subscriptions,
        ...(newData?.osc?.subscriptions || {}),
        ...(existing.osc?.subscriptions && newData?.osc?.subscriptions
          ? Object.keys(existing.osc.subscriptions).reduce((acc, key) => {
              if (!(key in newData.osc.subscriptions)) {
                acc[key] = existing.osc.subscriptions[key];
              }
              return acc;
            }, {})
          : {}),
      },
    },
  };
}
