import { MaybeNumber } from 'ontime-types';
import { millisToString, removeLeadingZero } from 'ontime-utils';

// any value inside double curly braces {{val}}
const placeholderRegex = /{{(.*?)}}/g;

function formatDisplayFromString(value: string, hideZero = false): string {
  let valueInNumber: MaybeNumber = null;

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
const quickAliases: AliasesDefinition = {
  clock: { key: 'timer.clock', cb: (value: string) => formatDisplayFromString(value) },
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
      // iterate through variable parts, and look for the property in the state object
      value = variableParts.reduce((obj, key) => obj?.[key], state);
    }
    if (value !== undefined) {
      parsedTemplate = parsedTemplate.replace(match[0], value);
    }
  }

  return parsedTemplate;
}
