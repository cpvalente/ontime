import { body } from 'express-validator';
import { z } from 'zod';

import { requestValidationFunction, validateBody } from '../../middleware/validation.js';

export const validateGenerateUrl = [
  body('baseUrl')
    .isString()
    .trim()
    .custom((value: string) => URL.canParse(value))
    .withMessage('baseUrl must be a full URL, eg: http://192.168.10.1:4001'),
  body('path').isString().trim().notEmpty(),

  body('authenticate').isBoolean(),
  body('lockConfig').isBoolean(),
  body('lockNav').isBoolean(),
  body('preset').optional().isString().trim().notEmpty().toLowerCase(),

  requestValidationFunction,
];

export const validateServerPort = validateBody(z.object({ serverPort: z.number().int().min(1024).max(65535) }));

export const validateWelcomeDialog = validateBody(z.object({ show: z.boolean() }));
