import { FilterRule, MaybeNumber } from 'ontime-types';
import { millisToString, removeLeadingZero, splitWhitespace, getPropertyFromPath } from 'ontime-utils';

import { Argument } from 'node-osc';

type FilterOperator = 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';

export function isFilterOperator(value: string): value is FilterOperator {
  return ['equals', 'not_equals', 'greater_than', 'less_than', 'contains'].includes(value);
}

export function isFilterRule(value: string): value is FilterRule {
  return value === 'all' || value === 'any';
}

export function stringToOSCArgs(argsString: string | undefined): Argument[] {
  if (typeof argsString === 'undefined' || argsString === '') {
    return new Array<Argument>();
  }
  const matches = splitWhitespace(argsString);

  if (!matches) {
    return new Array<Argument>();
  }

  const parsedArguments: Argument[] = matches.map((argString: string) => {
    const argAsNum = Number(argString);
    // NOTE: number like: 1 2.0 33333
    if (!Number.isNaN(argAsNum)) {
      return { type: argString.includes('.') ? 'float' : 'integer', value: argAsNum };
    }

    if (argString.startsWith('"') && argString.endsWith('"')) {
      // NOTE: "quoted string"
      return { type: 'string', value: argString.substring(1, argString.length - 1) };
    }

    if (argString === 'TRUE') {
      // NOTE: Boolean true
      return { type: 'T', value: true };
    }

    if (argString === 'FALSE') {
      // NOTE: Boolean false
      return { type: 'F', value: false };
    }

    // NOTE: string
    return { type: 'string', value: argString };
  });

  return parsedArguments;
}

// any value inside double curly braces {{val}}
const placeholderRegex = /{{(.*?)}}/g;

/**
 * Parses a templated string to values in a nested object
 */
export function parseTemplateNested(template: string, state: object, humanReadable = quickAliases): string {
  let parsedTemplate = template;
  const matches = Array.from(parsedTemplate.matchAll(placeholderRegex));

  for (const match of matches) {
    const variableName = match[1];
    const variableParts = variableName.split('.');
    let value: string | undefined = undefined;

    if (variableParts[0] === 'human') {
      const lookupKey = variableParts[1];
      if (lookupKey in humanReadable) {
        const newTemplate = `{{${humanReadable[lookupKey].key}}}`;
        const parsed = parseTemplateNested(newTemplate, state, humanReadable);
        value = humanReadable[lookupKey].cb(parsed);
      } else {
        value = undefined;
      }
    } else {
      value = getPropertyFromPath(variableName, state);
    }
    if (value !== undefined) {
      parsedTemplate = parsedTemplate.replace(match[0], value);
    }
  }

  return parsedTemplate;
}

/**
 * Handles the specific case where the MaybeNumber is encoded in a string
 * After parsed, the value is formatted to a human-readable string
 */
function formatDisplayFromString(value: string, hideZero = false): string {
  let valueInNumber: MaybeNumber = null;

  // the value will be a string, so we need to convert it to the Maybe type
  if (value !== 'null') {
    const parsedValue = Number(value);
    if (!Number.isNaN(parsedValue)) {
      valueInNumber = parsedValue;
    }
  }
  let formatted = millisToString(valueInNumber, { fallback: hideZero ? '00:00' : '00:00:00' });
  if (hideZero) {
    formatted = removeLeadingZero(formatted);
  }
  return formatted;
}

type AliasesDefinition = Record<string, { key: string; cb: (value: string) => string }>;

/**
 * This object matches some common RuntimeState paths
 * to a function that formats them to a human-readable string
 */
const quickAliases: AliasesDefinition = {
  clock: { key: 'clock', cb: (value: string) => formatDisplayFromString(value) },
  duration: { key: 'timer.duration', cb: (value: string) => formatDisplayFromString(value, true) },
  expectedEnd: {
    key: 'timer.expectedFinish',
    cb: (value: string) => formatDisplayFromString(value),
  },
  runningTimer: {
    key: 'timer.current',
    cb: (value: string) => formatDisplayFromString(value, true),
  },
  elapsedTime: {
    key: 'timer.elapsed',
    cb: (value: string) => formatDisplayFromString(value, true),
  },
  startedAt: { key: 'timer.startedAt', cb: (value: string) => formatDisplayFromString(value) },
};
