import { body, param } from 'express-validator';
import { isImportMap } from 'ontime-utils';

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

export const validateRundownExport = [param('rundownId').isString().trim().notEmpty(), requestValidationFunction];
