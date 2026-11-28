import { z } from 'zod';

import { validateBody } from '../../middleware/validation.js';

export const validateServerPort = validateBody(z.object({ serverPort: z.number().int().min(0).max(65535) }));
