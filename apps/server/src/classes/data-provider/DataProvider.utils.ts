import { DatabaseModel } from 'ontime-types';

/**
 * Merges a partial ontime project into a given ontime project
 */
export function safeMerge(existing: DatabaseModel, newData: Partial<DatabaseModel>): DatabaseModel {
  const deepExisting = structuredClone(existing);
  const deepNewData = structuredClone(newData);

  const {
    rundown = deepExisting.rundown,
    project = {},
    settings = {},
    viewSettings = {},
    urlPresets = deepExisting.urlPresets,
    customFields = deepExisting.customFields,
    automation = deepExisting.automation,
  } = deepNewData;

  return {
    ...deepExisting,
    rundown,
    project: { ...deepExisting.project, ...project },
    settings: { ...deepExisting.settings, ...settings },
    viewSettings: { ...deepExisting.viewSettings, ...viewSettings },
    urlPresets: urlPresets ?? deepExisting.urlPresets,
    customFields: customFields ?? deepExisting.customFields,
    automation: { ...deepExisting.automation, ...automation },
  };
}
