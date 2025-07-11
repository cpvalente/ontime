import { body } from 'express-validator';
import { requestValidationFunction } from '../validation-utils/validationFunction.js';

export const validatePostTranslation = [body('translation').isObject(), requestValidationFunction];
