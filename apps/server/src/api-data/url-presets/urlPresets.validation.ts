import { OntimeView, type OntimeViewPresettable } from 'ontime-types';
import { z } from 'zod';

import { validateBody, validateParams } from '../validation-utils/validate.js';

// URL presets cannot target the editor (see OntimeViewPresettable) — the previous
// express-validator check allowed any OntimeView value including 'editor', which URLPreset's
// own type never permitted; narrowed here now that the field is properly typed end to end.
const presettableViews = Object.values(OntimeView).filter(
  (view): view is OntimeViewPresettable => view !== OntimeView.Editor,
);

const presetOptionsSchema = z.record(z.string(), z.string()).optional();

/**
 * validate array of URL preset objects
 */
const newPresetSchema = z.object({
  enabled: z.boolean(),
  alias: z.string().trim().min(1),
  target: z.enum(presettableViews),
  search: z.string().trim(),
  displayInNav: z.boolean(),
  // options are currently only provided for cuesheet presets
  options: presetOptionsSchema,
});
export type NewPresetInput = z.infer<typeof newPresetSchema>;
export const validateNewPreset = validateBody(newPresetSchema);

const presetAliasParamSchema = z.object({ alias: z.string().trim().min(1) });
export type PresetAliasParam = z.infer<typeof presetAliasParamSchema>;
export const validatePresetParam = validateParams(presetAliasParamSchema);

// update reuses the same body shape as create, plus the alias param check
export type UpdatePresetInput = NewPresetInput;
export const validateUpdatePreset = [validateParams(presetAliasParamSchema), validateBody(newPresetSchema)];
