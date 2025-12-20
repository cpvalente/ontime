import { DatabaseModel } from 'ontime-types';

/**
 * Merges a partial ontime project into a given ontime project
 */
export function safeMerge(existing: DatabaseModel, newData: Partial<DatabaseModel>): DatabaseModel {
  const deepExisting = structuredClone(existing);
  const deepNewData = structuredClone(newData);

  // destructure each property to simplify merging not provided ie: ...{} has no effect
  const {
    rundowns = {},
    project = {},
    settings = {},
    viewSettings = {},
    urlPresets = [],
    customFields = {},
    automation,
  } = deepNewData;

  return {
    rundowns: { ...existing.rundowns, ...rundowns },
    project: { ...deepExisting.project, ...project },
    settings: { ...deepExisting.settings, ...settings },
    viewSettings: { ...deepExisting.viewSettings, ...viewSettings },
    // URL presets are independent and we can append them together
    urlPresets: [...deepExisting.urlPresets, ...urlPresets],
    // custom fields can be merged
    customFields: { ...deepExisting.customFields, ...customFields },
    // trigger and automation are coupled and cannot be changed individually so we replace the whole automation
    automation: automation ?? deepExisting.automation,
  };
}
