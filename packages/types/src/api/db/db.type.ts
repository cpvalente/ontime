import { type DatabaseModel } from '../../definitions/DataModel.type.js';

export interface QuickStartData {
  project: Pick<DatabaseModel['project'], 'title'>;
  settings: Pick<DatabaseModel['settings'], 'timeFormat' | 'language'>;
}

/**
 * Sections of a project that can be cloned on their own into a template project:
 * a small project holding, say, only automations, which can be shared and then
 * applied to another project with a partial load
 */
export const templateSections = [
  'project',
  'rundowns',
  'customFields',
  'viewSettings',
  'urlPresets',
  'automation',
] as const satisfies ReadonlyArray<keyof DatabaseModel>;

export type TemplateSection = (typeof templateSections)[number];

export function isTemplateSection(value: string): value is TemplateSection {
  return (templateSections as ReadonlyArray<string>).includes(value);
}
