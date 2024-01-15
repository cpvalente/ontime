import { body, check, validationResult } from 'express-validator';
import { join } from 'path';
import { existsSync } from 'fs';

import {
  validateHttpSubscriptionObject,
  validateOscSubscriptionObject,
  validateOscSubscriptionCycle,
} from '../utils/parserFunctions.js';
import { uploadsFolderPath } from '../setup.js';

/**
 * @description Validates object for POST /ontime/views
 */
export const viewValidator = [
  check('overrideStyles').isBoolean().withMessage('overrideStyles value must be boolean'),
  check('endMessage').isString().trim().withMessage('endMessage value must be string'),
  check('normalColor').isString().trim().withMessage('normalColor value must be string'),
  check('warningColor').isString().trim().withMessage('warningColor value must be string'),
  check('dangerColor').isString().trim().withMessage('dangerColor value must be string'),
  check('warningThreshold').isNumeric().withMessage('warningThreshold value must be a number'),
  check('dangerThreshold').isNumeric().withMessage('dangerThreshold value must a number'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

/**
 * @description Validates object for POST /ontime/aliases
 */
export const validateAliases = [
  body().isArray(),
  body('*.enabled').isBoolean(),
  body('*.alias').isString().trim(),
  body('*.pathAndParams').isString().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

/**
 * @description Validates object for POST /ontime/userfields
 */
export const validateUserFields = [
  body('user0').exists().isString().trim(),
  body('user1').exists().isString().trim(),
  body('user2').exists().isString().trim(),
  body('user3').exists().isString().trim(),
  body('user4').exists().isString().trim(),
  body('user5').exists().isString().trim(),
  body('user6').exists().isString().trim(),
  body('user7').exists().isString().trim(),
  body('user8').exists().isString().trim(),
  body('user9').exists().isString().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

/**
 * @description Validates object for POST /ontime/settings
 */
export const validateSettings = [
  body('editorKey').isString().isLength({ min: 0, max: 4 }).optional({ nullable: true }),
  body('operatorKey').isString().isLength({ min: 0, max: 4 }).optional({ nullable: true }),
  body('timeFormat').isString().isIn(['12', '24']),
  body('language').isString(),
  body('serverPort').isPort().optional(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

/**
 * @description Validates object for POST /ontime/osc
 */
export const validateOSC = [
  body('portIn').exists().isInt({ min: 1024, max: 65535 }),
  body('portOut').exists().isInt({ min: 1024, max: 65535 }),
  body('targetIP').exists().isIP(),
  body('enabledIn').exists().isBoolean(),
  body('enabledOut').exists().isBoolean(),
  body('subscriptions')
    .isObject()
    .custom((value) => validateOscSubscriptionObject(value)),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

/**
 * @description Validates object for POST /ontime/http
 */
export const validateHTTP = [
  body('enabledOut').exists().isBoolean(),
  body('subscriptions')
    .isObject()
    .custom((value) => validateHttpSubscriptionObject(value)),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

/**
 * @description Validates object for POST /ontime/osc-subscriptions
 */
export const validateOscSubscription = [
  body('onLoad')
    .isArray()
    .custom((value) => validateOscSubscriptionCycle(value)),
  body('onStart')
    .isArray()
    .custom((value) => validateOscSubscriptionCycle(value)),
  body('onPause')
    .isArray()
    .custom((value) => validateOscSubscriptionCycle(value)),
  body('onStop')
    .isArray()
    .custom((value) => validateOscSubscriptionCycle(value)),
  body('onUpdate')
    .isArray()
    .custom((value) => validateOscSubscriptionCycle(value)),
  body('onFinish')
    .isArray()
    .custom((value) => validateOscSubscriptionCycle(value)),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const validatePatchProjectFile = [
  body('rundown').isArray().optional({ nullable: false }),
  body('project').isObject().optional({ nullable: false }),
  body('settings').isObject().optional({ nullable: false }),
  body('viewSettings').isObject().optional({ nullable: false }),
  body('aliases').isArray().optional({ nullable: false }),
  body('userFields').isObject().optional({ nullable: false }),
  body('osc').isObject().optional({ nullable: false }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

/**
 * @description Validates the filename for loading a project file.
 */
export const validateLoadProjectFile = [
  body('filename').exists().withMessage('Filename is required').isString().withMessage('Filename must be a string'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    next();
  },
];

/**
 * @description Validates the filenames for duplicating a project.
 */
export const validateProjectDuplicate = [
  body('newFilename')
    .exists()
    .withMessage('New project filename is required')
    .isString()
    .withMessage('New project filename must be a string')
    .isLength({ min: 1, max: 255 })
    .withMessage('New project filename must be between 1 and 255 characters'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    next();
  },
];

/**
 * @description Validates the filenames for renaming a project.
 */
export const validateProjectRename = [
  body('newFilename')
    .exists()
    .withMessage('Duplicate project filename is required')
    .isString()
    .withMessage('Duplicate project filename must be a string')
    .isLength({ min: 1, max: 255 })
    .withMessage('Duplicate project filename must be between 1 and 255 characters'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    next();
  },
];

/**
 * @description Validates the filename for creating a project file.
 */
export const validateProjectCreate = [
  body('filename')
    .exists()
    .withMessage('Filename is required')
    .isString()
    .withMessage('Filename must be a string')
    .isLength({ min: 1, max: 255 })
    .withMessage('Filename must be between 1 and 255 characters'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    next();
  },
];

/**
 * @description Validates the existence of project files.
 * @param {object} projectFiles
 * @param {string} projectFiles.projectFilename
 * @param {string} projectFiles.newFilename
 *
 * @returns {Promise<Array<string>>} Array of errors
 *
 */
export const validateProjectFiles = (projectFiles: { filename?: string; newFilename?: string }): Array<string> => {
  const errors = [];

  if (projectFiles.filename) {
    const projectFilePath = join(uploadsFolderPath, projectFiles.filename);

    if (!existsSync(projectFilePath)) {
      errors.push('Project file does not exist');
    }
  }

  if (projectFiles.newFilename) {
    const projectFilePath = join(uploadsFolderPath, projectFiles.newFilename);

    if (existsSync(projectFilePath)) {
      errors.push('New project file already exists');
    }
  }

  return errors;
};

export const validateSheetid = [
  body('id').exists().isString(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const validateWorksheet = [
  body('id').exists().isString(),
  body('worksheet').exists().isString(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const validateSheetOptions = [
  body('id').exists().isString(),
  // body('options').exists().isObject(), TODO:
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];
