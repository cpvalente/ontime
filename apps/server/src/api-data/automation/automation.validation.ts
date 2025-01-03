import { AutomationBlueprint, AutomationFilter, AutomationOutput, timerLifecycleValues } from 'ontime-types';

import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';

import * as assert from '../../utils/assert.js';

import { isFilterOperator, isFilterRule } from './automation.utils.js';

export const paramContainsId = [
  param('id').exists(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const validateAutomationSettings = [
  body('enabledAutomations').exists().isBoolean(),
  body('enabledOscIn').exists().isBoolean(),
  body('oscPortIn').exists().isPort(),
  body('automations').optional().isArray(),
  body('automations.*.title').optional().isString().trim(),
  body('automations.*.trigger').optional().isIn(timerLifecycleValues),
  body('automations.*.blueprintId').optional().isString().trim(),
  body('blueprints').optional().custom(parseBluePrint),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const validateAutomation = [
  body('title').exists().isString().trim(),
  body('trigger').exists().isIn(timerLifecycleValues),
  body('blueprintId').exists().isString().trim(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const validateAutomationPatch = [
  param('id').exists(),
  body('title').optional().isString().trim(),
  body('trigger').optional().isIn(timerLifecycleValues),
  body('blueprintId').optional().isString().trim(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const validateBlueprint = [
  body().custom(parseBluePrint),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const validateBlueprintPatch = [
  param('id').exists(),
  body().custom(parseBluePrint),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

/**
 * Parses and validates a use given blueprint
 */
export function parseBluePrint(maybeBlueprint: unknown): AutomationBlueprint {
  assert.isObject(maybeBlueprint);
  assert.hasKeys(maybeBlueprint, ['title', 'filterRule', 'filters', 'outputs']);

  const { title, filterRule, filters, outputs } = maybeBlueprint;
  assert.isString(title);
  assert.isString(filterRule);
  if (!isFilterRule(filterRule)) {
    throw new Error(`Invalid blueprint: unknown filter rule ${filterRule}`);
  }
  assert.isArray(filters);
  validateFilters(filters);

  assert.isArray(outputs);
  validateOutput(outputs);

  return maybeBlueprint as AutomationBlueprint;
}

function validateFilters(filters: Array<unknown>): filters is AutomationFilter[] {
  filters.forEach((condition) => {
    assert.isObject(condition);

    assert.hasKeys(condition, ['field', 'operator', 'value']);
    const { field, operator, value } = condition;
    assert.isString(field);
    assert.isString(operator);
    assert.isString(value);
    if (!isFilterOperator(operator)) {
      throw new Error(`Invalid blueprint: unknown filter operator ${operator}`);
    }

    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
      throw new Error(`Invalid automation: unhandled filter type ${typeof value}`);
    }
  });
  return true;
}

function validateOutput(output: Array<unknown>): output is AutomationOutput[] {
  output.forEach((payload) => {
    assert.isObject(payload);
    assert.hasKeys(payload, ['type']);
    const { type } = payload;
    assert.isString(type);

    if (type === 'osc') {
      assert.hasKeys(payload, ['targetIP', 'targetPort', 'address', 'args']);
      const { targetIP, targetPort, address, args } = payload;
      assert.isString(targetIP);
      assert.isNumber(targetPort);
      assert.isString(address);
      if (typeof args !== 'string' && typeof args !== 'number') {
        throw new Error('Invalid automation');
      }
    } else if (type === 'http') {
      assert.hasKeys(payload, ['targetIP', 'address']);
      const { targetIP, address } = payload;
      assert.isString(targetIP);
      assert.isString(address);
    } else if (type === 'companion') {
      assert.hasKeys(payload, ['targetIP', 'address', 'page', 'bank']);
      const { targetIP, address, page, bank } = payload;
      assert.isString(targetIP);
      assert.isString(address);
      assert.isNumber(page);
      assert.isNumber(bank);
    } else {
      throw new Error('Invalid automation');
    }
  });
  return true;
}

export const validateTestPayload = [
  body('type').exists().isIn(['osc', 'http']),

  // validation for OSC message
  body('targetIP').if(body('type').equals('osc')).isIP(),
  body('targetPort').if(body('type').equals('osc')).isPort(),
  body('address').if(body('type').equals('osc')).isString().trim(),
  body('message').if(body('type').equals('osc')).isString().trim(),

  // validation for HTTP message
  body('url').if(body('type').equals('http')).isString().trim(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];
