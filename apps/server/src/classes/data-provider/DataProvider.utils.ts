import { DatabaseModel, ProjectRundowns } from 'ontime-types';
import { generateId } from 'ontime-utils';

/**
 * Resolves rundown ID conflicts by generating new IDs for colliding rundowns
 * Returns a new rundowns object with unique IDs
 * @private exported for testing
 */
export function resolveRundownConflicts(existing: ProjectRundowns, incoming: ProjectRundowns): ProjectRundowns {
  const resolved: ProjectRundowns = {};

  for (const [id, rundown] of Object.entries(incoming)) {
    if (id in existing) {
      // Collision detected - generate a new unique ID
      let newId = generateId();
      while (newId in existing || newId in resolved) {
        newId = generateId();
      }
      // Deep clone to avoid mutating the incoming data
      const clonedRundown = structuredClone(rundown);
      clonedRundown.id = newId;
      resolved[newId] = clonedRundown;
    } else {
      resolved[id] = rundown;
    }
  }

  return resolved;
}

/**
 * Merges a partial ontime project into a given ontime project
 * Handles rundown ID collisions by generating new IDs
 */
export function safeMerge(existing: DatabaseModel, newData: Partial<DatabaseModel>): DatabaseModel {
  const deepExisting = structuredClone(existing);
  const deepNewData = structuredClone(newData);

  const {
    rundowns = {},
    project = {},
    settings = {},
    viewSettings = {},
    urlPresets = deepExisting.urlPresets,
    customFields = deepExisting.customFields,
    automation = deepExisting.automation,
  } = deepNewData;

  // resolve any rundown ID conflicts before merging
  const resolvedRundowns = resolveRundownConflicts(deepExisting.rundowns, rundowns);

  return {
    ...deepExisting,
    rundowns: { ...existing.rundowns, ...resolvedRundowns },
    project: { ...deepExisting.project, ...project },
    settings: { ...deepExisting.settings, ...settings },
    viewSettings: { ...deepExisting.viewSettings, ...viewSettings },
    urlPresets: urlPresets ?? deepExisting.urlPresets,
    customFields: customFields ?? deepExisting.customFields,
    automation: { ...deepExisting.automation, ...automation },
  };
}
