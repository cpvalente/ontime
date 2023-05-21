// any value inside double curly braces {{val}}
const placeholderRegex = /{{(.*?)}}/g;

/**
 * Parses a templated string to values in a nested object
 */
export function parseTemplateNested(template: string, state: object): string {
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
