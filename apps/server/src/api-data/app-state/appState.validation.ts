import { z } from 'zod';

import { validateBody } from '../../middleware/validation.js';

export const validateWelcomeDialog = validateBody(z.object({ show: z.boolean() }));
