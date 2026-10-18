import { DatabaseModel } from 'ontime-types';

import { parseCustomFieldOrder } from '../../api-data/custom-fields/customFields.parser.js';

/**
 * Merges a partial ontime project into a given ontime project
 */
export function safeMerge(existing: DatabaseModel, newData: Partial<DatabaseModel>): DatabaseModel {
  // rundowns are merged separately below by reference (only the top-level map is copied,
  // same as the other properties here) - deep-cloning them here would be wasted work,
  // since a project's rundowns are by far the largest part of this object
  const { rundowns: existingRundowns, ...existingRest } = existing;
  const { rundowns: newRundowns = {}, ...newDataRest } = newData;

  const deepExisting = structuredClone(existingRest);
  const deepNewData = structuredClone(newDataRest);

  // destructure each property to simplify merging not provided ie: ...{} has no effect
  const { project = {}, settings = {}, viewSettings = {}, urlPresets = [], customFields, automation } = deepNewData;

  const fields = { ...deepExisting.customFields.fields, ...customFields?.fields };

  return {
    rundowns: { ...existingRundowns, ...newRundowns },
    project: { ...deepExisting.project, ...project },
    settings: { ...deepExisting.settings, ...settings },
    viewSettings: { ...deepExisting.viewSettings, ...viewSettings },
    // URL presets are independent and we can append them together
    urlPresets: [...deepExisting.urlPresets, ...urlPresets],
    // custom fields can be merged
    customFields: {
      fields,
      order: parseCustomFieldOrder([...deepExisting.customFields.order, ...(customFields?.order ?? [])], fields),
    },
    // trigger and automation are coupled and cannot be changed individually so we replace the whole automation
    automation: automation ?? deepExisting.automation,
  };
}
