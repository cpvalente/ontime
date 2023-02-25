// any value inside double curly braces {{val}}
const placeholderRegex = /{{(.*?)}}/g;

/**
 * Parses a templated string
 */
export function parseTemplate(template: string, state: object): string {
  let parsedTemplate = template;
  let match;
  while ((match = placeholderRegex.exec(template)) !== null) {
    const variableName = match[1];
    if (Object.hasOwn(state, variableName)) {
      parsedTemplate = parsedTemplate.replace(match[0], state[variableName]);
    }
  }

  return parsedTemplate;
}
