import {
  Automation,
  AutomationFilter,
  AutomationOutput,
  HTTPOutput,
  OntimeAction,
  OSCOutput,
  SecondarySource,
  timerLifecycleValues,
} from 'ontime-types';
import { parseUserTime } from 'ontime-utils';

import type { Request, Response, NextFunction } from 'express';
import { body, oneOf, param, validationResult } from 'express-validator';

import * as assert from '../../utils/assert.js';

import { isFilterOperator, isFilterRule, isOntimeActionAction } from './automation.utils.js';

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
  body('triggers').optional().isArray(),
  body('triggers.*.title').optional().isString().trim(),
  body('triggers.*.trigger').optional().isIn(timerLifecycleValues),
  body('triggers.*.automationId').optional().isString().trim(),
  body('automations').optional().custom(parseAutomation),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const validateTrigger = [
  body('title').exists().isString().trim(),
  body('trigger').exists().isIn(timerLifecycleValues),
  body('automationId').exists().isString().trim(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const validateTriggerPatch = [
  param('id').exists(),
  body('title').optional().isString().trim(),
  body('trigger').optional().isIn(timerLifecycleValues),
  body('automationId').optional().isString().trim(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const validateAutomation = [
  body().custom(parseAutomation),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const validateAutomationPatch = [
  param('id').exists(),
  body().custom(parseAutomation),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

/**
 * Parses and validates a use given automation
 */
export function parseAutomation(maybeAutomation: unknown): Automation {
  assert.isObject(maybeAutomation);
  assert.hasKeys(maybeAutomation, ['title', 'filterRule', 'filters', 'outputs']);

  const { title, filterRule, filters, outputs } = maybeAutomation;
  assert.isString(title);
  assert.isString(filterRule);
  if (!isFilterRule(filterRule)) {
    throw new Error(`Invalid automation: unknown filter rule ${filterRule}`);
  }
  assert.isArray(filters);
  validateFilters(filters);

  assert.isArray(outputs);
  validateOutput(outputs);

  return maybeAutomation as Automation;
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
      throw new Error(`Invalid automation: unknown filter operator ${operator}`);
    }

    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
      throw new Error(`Invalid automation: unhandled filter type ${typeof value}`);
    }
  });
  return true;
}

function validateOutput(output: Array<unknown>): output is AutomationOutput[] {
  output.forEach((payload) => {
    parseOutput(payload);
  });
  return true;
}

export const validateTestPayload = [
  body('type').exists().isIn(['osc', 'http', 'ontime']),

  // validation for OSC message
  oneOf([
    body('targetIP').if(body('type').equals('osc')).isIP(),
    body('targetIP').if(body('type').equals('osc')).isFQDN(),
    body('targetIP').if(body('type').equals('osc')).equals('localhost'),
  ]),
  body('targetPort').if(body('type').equals('osc')).isPort(),
  body('address').if(body('type').equals('osc')).isString().trim(),
  body('args').if(body('type').equals('osc')).isString().trim(),

  // validation for HTTP message
  body('url').if(body('type').equals('http')).isURL({ require_tld: false }).trim(),

  // validation for Ontime actions
  body('action').if(body('type').equals('ontime')).isString().trim(),
  body('text').if(body('type').equals('ontime')).optional().isString().trim(),
  body('time').if(body('type').equals('ontime')).optional().isString().trim(),
  body('visible').if(body('type').equals('ontime')).optional().isString().trim(),
  body('secondarySource').if(body('type').equals('ontime')).optional().isString().trim(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

/**
 * Sanitises an output object
 * @Throws if the output is invalid
 */
export function parseOutput(maybeOutput: unknown): AutomationOutput {
  assert.isObject(maybeOutput);
  assert.hasKeys(maybeOutput, ['type']);

  const { type } = maybeOutput;
  assert.isString(type);

  if (type === 'osc') {
    return parseOSCOutput(maybeOutput);
  } else if (type === 'http') {
    return parseHTTPOutput(maybeOutput);
  } else if (type === 'ontime') {
    return parseOntimeAction(maybeOutput);
  } else {
    throw new Error('Invalid automation output');
  }
}

function parseOSCOutput(maybeOSCOutput: object): OSCOutput {
  assert.hasKeys(maybeOSCOutput, ['targetIP', 'targetPort', 'address', 'args']);
  assert.isString(maybeOSCOutput.targetIP);
  assert.isNumber(maybeOSCOutput.targetPort);
  assert.isString(maybeOSCOutput.address);
  assert.isString(maybeOSCOutput.args);

  return {
    type: 'osc',
    targetIP: maybeOSCOutput.targetIP,
    targetPort: maybeOSCOutput.targetPort,
    address: maybeOSCOutput.address,
    args: maybeOSCOutput.args,
  };
}

function parseHTTPOutput(maybeHTTPOutput: object): HTTPOutput {
  assert.hasKeys(maybeHTTPOutput, ['url']);
  assert.isString(maybeHTTPOutput.url);

  return {
    type: 'http',
    url: maybeHTTPOutput.url,
  };
}

function parseOntimeAction(maybeOntimeAction: object): OntimeAction {
  assert.hasKeys(maybeOntimeAction, ['action']);
  assert.isString(maybeOntimeAction.action);

  if (!isOntimeActionAction(maybeOntimeAction.action)) {
    throw new Error('Invalid Ontime action');
  }

  // we know we have a valid action, deal with special cases

  if (maybeOntimeAction.action === 'aux-set') {
    assert.hasKeys(maybeOntimeAction, ['time']);
    assert.isString(maybeOntimeAction.time);

    return {
      type: 'ontime',
      action: 'aux-set',
      time: parseUserTime(maybeOntimeAction.time),
    };
  }

  if (maybeOntimeAction.action === 'message-set') {
    assert.hasKeys(maybeOntimeAction, ['text', 'visible']);
    assert.isString(maybeOntimeAction.text);
    assert.isString(maybeOntimeAction.visible);

    return {
      type: 'ontime',
      action: 'message-set',
      text: indeterminateText(maybeOntimeAction.text),
      visible: indeterminateBooleanString(maybeOntimeAction.visible),
    };
  }

  if (maybeOntimeAction.action === 'message-secondary') {
    assert.hasKeys(maybeOntimeAction, ['secondarySource']);
    assert.isString(maybeOntimeAction.secondarySource);

    return {
      type: 'ontime',
      action: 'message-secondary',
      secondarySource: chooseSecondarySource(maybeOntimeAction.secondarySource),
    };
  }

  return {
    type: 'ontime',
    action: maybeOntimeAction.action,
  };
}

/**
 * Helper function to parse a text which may be indeterminate
 * "some text" -> string
 * "" -> undefined
 */
function indeterminateText(value: string): string | undefined {
  return value === '' ? undefined : value;
}

/**
 * Helper function to parse boolean values in transit
 * "true" -> true
 * "false" -> false
 * "" | "null" -> undefined
 */
function indeterminateBooleanString(value: string): boolean | undefined {
  return value === '' ? undefined : value === 'true';
}

/**
 * Helper function to validate the secondary source
 */
function chooseSecondarySource(value: string): SecondarySource {
  if (value === 'aux') return 'aux';
  if (value === 'external') return 'external';
  return null;
}
