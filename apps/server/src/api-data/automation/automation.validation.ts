import { isIP } from 'node:net';

import { body, param } from 'express-validator';
import {
  Automation,
  AutomationFilter,
  AutomationOutput,
  AutomationTriggerDTO,
  HTTPOutput,
  OSCOutput,
  OntimeAction,
  SecondarySource,
  isTimerLifeCycle,
  timerLifecycleValues,
} from 'ontime-types';

import * as assert from '../../utils/assert.js';
import { requestValidationFunction } from '../validation-utils/validationFunction.js';
import { isFilterOperator, isFilterRule, isOntimeActionAction } from './automation.utils.js';

export const validateAutomationSettings = [
  body('enabledAutomations').isBoolean(),
  body('enabledOscIn').isBoolean(),
  body('oscPortIn').isPort(),
  body('triggers').optional().isArray(),
  body('triggers.*.title').optional().isString().trim(),
  body('triggers.*.trigger').optional().isIn(timerLifecycleValues),
  body('triggers.*.automationId').optional().isString().trim(),
  body('automations').optional().custom(parseAutomation),

  requestValidationFunction,
];

export const validateTrigger = [
  body('title').isString().trim().notEmpty(),
  body('trigger').isIn(timerLifecycleValues),
  body('automationId').isString().trim().notEmpty(),

  requestValidationFunction,
];

export const validateTriggerPatch = [
  param('id').isString().notEmpty(),
  body('title').optional().isString().trim().notEmpty(),
  body('trigger').optional().isIn(timerLifecycleValues),
  body('automationId').optional().isString().trim().notEmpty(),

  requestValidationFunction,
];

export const validateAutomation = [
  body().custom(parseAutomation),
  body('triggers').optional().custom(parseAutomationTriggers),
  requestValidationFunction,
];

export const validateAutomationPatch = [
  param('id').isString().notEmpty(),
  body().custom(parseAutomation),
  body('triggers').optional().custom(parseAutomationTriggers),

  requestValidationFunction,
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

export function parseAutomationTriggers(maybeTriggers: unknown): AutomationTriggerDTO[] {
  assert.isArray(maybeTriggers);
  return maybeTriggers.map((maybeTrigger) => {
    assert.isObject(maybeTrigger);
    assert.hasKeys(maybeTrigger, ['title', 'trigger']);
    assert.isString(maybeTrigger.title);
    assert.isString(maybeTrigger.trigger);
    if (!maybeTrigger.title.trim() || !isTimerLifeCycle(maybeTrigger.trigger)) {
      throw new Error('Invalid automation trigger');
    }
    return { title: maybeTrigger.title.trim(), trigger: maybeTrigger.trigger };
  });
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
  body().custom(parseOutput),

  requestValidationFunction,
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

  const targetIP = maybeOSCOutput.targetIP.trim();
  const target = replaceAutomationTemplates(targetIP, 'template.local');
  const isHostname = /^(?=.{1,253}$)[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?(?:\.[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?)*$/i.test(
    target,
  );
  if (isIP(target) !== 4 && !isHostname) {
    throw new Error('Invalid OSC target');
  }
  if (
    !Number.isInteger(maybeOSCOutput.targetPort) ||
    maybeOSCOutput.targetPort < 1 ||
    maybeOSCOutput.targetPort > 65535
  ) {
    throw new Error('Invalid OSC port');
  }

  return {
    type: 'osc',
    targetIP,
    targetPort: maybeOSCOutput.targetPort,
    address: maybeOSCOutput.address,
    args: maybeOSCOutput.args,
  };
}

function parseHTTPOutput(maybeHTTPOutput: object): HTTPOutput {
  assert.hasKeys(maybeHTTPOutput, ['url']);
  assert.isString(maybeHTTPOutput.url);

  try {
    const url = new URL(replaceAutomationTemplates(maybeHTTPOutput.url, 'template'));
    if ((url.protocol !== 'http:' && url.protocol !== 'https:') || !url.hostname) {
      throw new Error('Invalid HTTP URL');
    }
  } catch {
    throw new Error('Invalid HTTP URL');
  }

  return {
    type: 'http',
    url: maybeHTTPOutput.url,
  };
}

function replaceAutomationTemplates(value: string, replacement: string): string {
  return value.replace(/{{.*?}}/g, replacement);
}

function parseOntimeAction(maybeOntimeAction: object): OntimeAction {
  assert.hasKeys(maybeOntimeAction, ['action']);
  assert.isString(maybeOntimeAction.action);

  if (!isOntimeActionAction(maybeOntimeAction.action)) {
    throw new Error('Invalid Ontime action');
  }

  // we know we have a valid action, deal with special cases

  if (
    maybeOntimeAction.action === 'aux1-set' ||
    maybeOntimeAction.action === 'aux2-set' ||
    maybeOntimeAction.action === 'aux3-set'
  ) {
    assert.hasKeys(maybeOntimeAction, ['time']);
    assert.isString(maybeOntimeAction.time);

    return {
      type: 'ontime',
      action: maybeOntimeAction.action,
      time: maybeOntimeAction.time,
    };
  }

  if (maybeOntimeAction.action === 'message-set') {
    assert.hasKeys(maybeOntimeAction, ['text']);
    assert.isString(maybeOntimeAction.text);
    let visible: boolean | undefined = undefined;
    if ('visible' in maybeOntimeAction) {
      assert.isBoolean(maybeOntimeAction.visible);
      visible = maybeOntimeAction.visible;
    }

    return {
      type: 'ontime',
      action: 'message-set',
      text: indeterminateText(maybeOntimeAction.text),
      visible,
    };
  }

  if (maybeOntimeAction.action === 'message-secondary') {
    // the secondary text is optional, an empty string is treated as no change
    let text: string | undefined = undefined;
    if ('text' in maybeOntimeAction) {
      assert.isString(maybeOntimeAction.text);
      text = indeterminateText(maybeOntimeAction.text);
    }

    if (!('secondarySource' in maybeOntimeAction) || maybeOntimeAction.secondarySource === undefined) {
      return {
        type: 'ontime',
        action: 'message-secondary',
        text,
      };
    }

    // null is used to clear the secondary source
    if (maybeOntimeAction.secondarySource === null) {
      return {
        type: 'ontime',
        action: 'message-secondary',
        secondarySource: null,
        text,
      };
    }

    assert.isString(maybeOntimeAction.secondarySource);
    return {
      type: 'ontime',
      action: 'message-secondary',
      secondarySource: chooseSecondarySource(maybeOntimeAction.secondarySource),
      text,
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
 * Helper function to validate the secondary source
 */
function chooseSecondarySource(value: string): SecondarySource {
  if (value === 'aux1') return 'aux1';
  if (value === 'aux2') return 'aux2';
  if (value === 'aux3') return 'aux3';
  if (value === 'secondary') return 'secondary';
  return null;
}
