import {
  EntryId,
  FilterRule,
  MaybeNumber,
  OntimeAction,
  ProjectRundowns,
  RundownEntries,
  isOntimeEvent,
  ontimeActionKeyValues,
} from 'ontime-types';
import { getPropertyFromPath, millisToString, removeLeadingZero, splitWhitespace } from 'ontime-utils';
import type { OscArgInput, OscArgOrArrayInput } from 'osc-min';

type FilterOperator = 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';

export function isFilterOperator(value: string): value is FilterOperator {
  return ['equals', 'not_equals', 'greater_than', 'less_than', 'contains'].includes(value);
}

export function isFilterRule(value: string): value is FilterRule {
  return value === 'all' || value === 'any';
}

export function isOntimeActionAction(value: string): value is OntimeAction['action'] {
  return ontimeActionKeyValues.includes(value);
}

function toOscValue(argString: string): OscArgInput {
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
    return { type: 'true' };
  }

  if (argString === 'FALSE') {
    // NOTE: Boolean false
    return { type: 'false' };
  }

  // NOTE: string
  return { type: 'string', value: argString };
}

export function stringToOSCArgs(argsString: string | undefined): OscArgInput | OscArgOrArrayInput[] | undefined {
  if (typeof argsString === 'undefined' || argsString === '') return;

  const matches = splitWhitespace(argsString);

  if (!matches) return;

  if (matches.length === 1) {
    return toOscValue(matches[0]);
  }

  const parsedArguments: OscArgOrArrayInput[] = matches.map(toOscValue);

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
      // we cast to string since this will be used in a string context
      value = getPropertyFromPath(variableName, state) as string;
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

export function isEquivalent(a: unknown, b: string): boolean {
  // handle the case where we are comparing boolean strings
  if (typeof a === 'boolean') {
    return isBooleanEquals(a, b);
  }
  // make string comparisons case insensitive
  if (typeof a === 'string') {
    return a.toLowerCase() === b;
  }
  // overload the edge case where we use empty string to check if a value does not exist
  // this also avoids the case where 0 == ''
  if (b === '') {
    return a === null || a === undefined;
  }
  return a == b;
}

export function isContained(a: unknown, b: string): boolean {
  // handle the case where we are comparing boolean strings
  if (typeof a === 'boolean') {
    return false;
  }
  // make string comparisons case insensitive
  if (typeof a === 'string') {
    return a.toLowerCase().includes(b);
  }
  if (typeof a === 'number') {
    return a.toString().toLowerCase().includes(b);
  }
  return false;
}

/**
 * Utility encapsulates logic for comparing two strings which may encode numbers
 * @example isGreaterThan('10', '5') // true
 * @example isGreaterThan('5', '10') // false
 * @example isGreaterThan('Ontime', 'Cool') // false
 */
export function isGreaterThan(a: unknown, b: string): boolean {
  // If either value is not a number, there is no logical comparison to be made
  if (typeof a !== 'number') {
    return false;
  }

  const bValue = Number(b);
  if (isNaN(bValue)) {
    return false;
  }

  return a > bValue;
}

/**
 * Utility encapsulates logic for comparing two strings which may encode numbers
 * @example isLessThan('10', '5') // false
 * @example isLessThan('5', '10') // true
 * @example isLessThan('Ontime', 'Cool') // false
 */
export function isLessThan(a: unknown, b: string): boolean {
  // If either value is not a number, there is no logical comparison to be made
  if (typeof a !== 'number') {
    return false;
  }

  const bValue = Number(b);
  if (isNaN(bValue)) {
    return false;
  }

  return a < bValue;
}

/**
 * Utility encapsulates logic for comparing two strings which may encode booleans
 * @example isBooleanEquals(true, 'true') // true
 * @example isBooleanEquals(true, 'false') // false
 * @example isBooleanEquals(true, 'something') // false
 */
export function isBooleanEquals(a: boolean, b: string): boolean {
  if (b === 'true') {
    return a === true;
  }

  if (b === 'false') {
    return a === false;
  }
  return false;
}

/**
 * Checks is an automation is used in a rundown
 */
function isAutomationUsedInRundown(
  entries: RundownEntries,
  flatOrder: EntryId[],
  automationId: string,
): EntryId | undefined {
  for (let i = 0; i < flatOrder.length; i++) {
    const eventId = flatOrder[i];
    const entry = entries[eventId];

    // only ontime events can contain triggers
    if (isOntimeEvent(entry) && entry.triggers) {
      for (const trigger of entry.triggers) {
        if (trigger.automationId === automationId) {
          return entry.id;
        }
      }
    }
  }
}

/**
 * Checks if an automation is used in any of the project rundowns
 */
export function isAutomationUsed(
  projectRundowns: ProjectRundowns,
  automationId: string,
): [string, EntryId] | undefined {
  for (const rundownId in projectRundowns) {
    const rundown = projectRundowns[rundownId];
    const usedInEvent = isAutomationUsedInRundown(rundown.entries, rundown.flatOrder, automationId);

    if (usedInEvent) {
      return [rundown.title, usedInEvent];
    }
  }
}
