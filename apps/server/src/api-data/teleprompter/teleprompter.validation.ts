import { body } from 'express-validator';
import { teleprompterCharsPerLine } from 'ontime-utils';

import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { requestValidationFunction } from '../../middleware/validation.js';
import {
  isReadableScriptSource,
  teleprompterHeadings,
} from '../../services/teleprompter-service/teleprompter.utils.js';

export const validateTeleprompterSettings = [
  body().isObject({ strict: true }),
  body('script')
    .optional()
    .isString()
    .custom((value: string) => isReadableScriptSource(value, getDataProvider().getCustomFields())),
  body('charsPerLine')
    .optional()
    .custom(
      (value) =>
        Number.isInteger(value) && value >= teleprompterCharsPerLine.min && value <= teleprompterCharsPerLine.max,
    ),
  body('heading').optional().isString().isIn(teleprompterHeadings),
  requestValidationFunction,
];
