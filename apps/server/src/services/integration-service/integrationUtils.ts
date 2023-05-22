// any value inside double curly braces {{val}}
const placeholderRegex = /{{(.*?)}}/g;

const quickAliases: Record<string, string> = {
  clock: 'timer.clock',
  duration: 'timer.duration',
  expectEnd: 'timer.expectedFinish',
  runningTimer: 'timer.current',
  elapsedTime: 'timer.elapsed',
  startedAt: 'timer.startedAt',
};

/**
 * Parses a templated string to values in a nested object
 */
export function parseTemplateNested(template: string, state: object, aliases = quickAliases): string {
  if (template.startsWith('{{alias.')) {
    return resolveAliasData(template, state, aliases);
  }

  let parsedTemplate = template;
  let match;
  while ((match = placeholderRegex.exec(template)) !== null) {
    const variableName = match[1];
    const variableParts = variableName.split('.');
    // iterate through variable parts, and look for the property in the state object
    const value = variableParts.reduce((obj, key) => obj && obj[key], state);
    if (value !== undefined) {
      parsedTemplate = parsedTemplate.replace(match[0], value);
    }
  }

  return parsedTemplate;
}

export function resolveAliasData(template: string, state: object, aliases: Record<string, string>): string {
  const lookupKey = template.replace('alias.', '');
  const cleanKey = lookupKey.replace('{{', '').replace('}}', '');
  if (cleanKey in aliases) {
    return parseTemplateNested(`{{${aliases[cleanKey]}}}`, state, aliases);
  }
  return 'not-found';
}
