import { isImportMap } from 'ontime-utils';

import { body } from 'express-validator';
import {
  requestValidationFunction,
  requestValidationFunctionWithFile,
} from '../validation-utils/validationFunction.js';

export const validateFileExists = [requestValidationFunctionWithFile];

export const validateImportMapOptions = [
  body('options')
    .isObject()
    .custom((content) => {
      return isImportMap(content);
    }),

  requestValidationFunction,
];
