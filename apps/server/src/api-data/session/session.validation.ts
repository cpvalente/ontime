import { z } from 'zod';

import { validateBody } from '../validation-utils/validate.js';

const generateUrlSchema = z.object({
  baseUrl: z.string().trim().min(1),
  path: z.string().trim().min(1),
  authenticate: z.boolean(),
  lockConfig: z.boolean(),
  lockNav: z.boolean(),
  preset: z.string().trim().min(1).optional(),
});
export type GenerateUrlInput = z.infer<typeof generateUrlSchema>;
export const validateGenerateUrl = validateBody(generateUrlSchema);
