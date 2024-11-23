import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';

import * as assert from '../../utils/assert.js';

import { isFilterOperator, isFilterRule } from './automation.utils.js';
import type { Automation, AutomationFilter, AutomationOutput } from './automation.service.js';

export const validateTestPayload = [
  body('type').exists().isIn(['osc', 'http', 'companion']),

  // validation for OSC message
  body('targetIP').if(body('type').equals('osc')).isIP(),
  body('targetPort').if(body('type').equals('osc')).isPort(),
  body('address').if(body('type').equals('osc')).isString().trim(),
  body('args').if(body('type').equals('osc')).isString().trim(),

  // validation for HTTP message
  body('targetIP').if(body('type').equals('http')).isIP(),
  body('address').if(body('type').equals('http')).isString().trim(),

  // validation for OSC message
  body('targetIP').if(body('type').equals('companion')).isIP(),
  body('address').if(body('type').equals('companion')).isString().trim(),
  body('page').if(body('type').equals('companion')).isInt({ min: 0 }),
  body('bank').if(body('type').equals('companion')).isInt({ min: 0 }),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const validateAutomation = [
  body().custom(parseAutomation),

  (_req: Request, _res: Response, next: NextFunction) => {
    next();
  },
];

export const paramContainsAutomationId = [
  param('automationId').exists(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

/**
 * Parses and validates a potential automation entry
 */
export function parseAutomation(maybeAutomation: unknown): Automation {
  assert.isObject(maybeAutomation);
  assert.hasKeys(maybeAutomation, ['title', 'filterRule', 'filter', 'output']);

  const { title, filterRule, filter, output } = maybeAutomation;
  assert.isString(title);
  assert.isString(filterRule);
  if (!isFilterRule(filterRule)) {
    throw new Error('Invalid automation');
  }
  assert.isArray(filter);
  validateFilter(filter);

  assert.isArray(output);
  validateOutput(output);

  return maybeAutomation as Automation;
}

function validateFilter(filter: Array<unknown>): filter is AutomationFilter[] {
  filter.forEach((condition) => {
    assert.isObject(condition);

    assert.hasKeys(condition, ['field', 'operator', 'value']);
    const { field, operator, value } = condition;
    assert.isString(field);
    assert.isString(operator);
    assert.isString(value);
    !isFilterOperator(operator);

    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
      throw new Error('Invalid automation');
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
