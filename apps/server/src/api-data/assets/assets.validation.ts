import { body } from 'express-validator';
import { requestValidationFunction } from '../validation-utils/validationFunction.js';

export const validatePostCss = [body('css').isString().trim(), requestValidationFunction];
