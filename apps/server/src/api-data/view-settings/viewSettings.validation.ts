import type { ViewSettings } from 'ontime-types';
import { z } from 'zod';

import { validateBody } from '../../middleware/validation.js';

const viewSettingsSchema = z.object({
  overrideStyles: z.boolean(),
}) satisfies z.ZodType<ViewSettings>;

export const validateViewSettings = validateBody(viewSettingsSchema);
