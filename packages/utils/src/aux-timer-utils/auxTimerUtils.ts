/** Maximum length of a user given aux timer name */
export const auxTimerNameMaxLength = 30;

function sanitiseAuxTimerName(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, auxTimerNameMaxLength) : '';
}

/**
 * Ontime has three aux timers. Given whatever was found on disk or in a request body,
 * returns a name for each of them, so callers never need to deal with a missing
 * or malformed auxTimerNames (eg. a project file saved before this feature existed).
 */
export function sanitiseAuxTimerNames(names?: unknown): [string, string, string] {
  const source = Array.isArray(names) ? names : [];
  return [sanitiseAuxTimerName(source[0]), sanitiseAuxTimerName(source[1]), sanitiseAuxTimerName(source[2])];
}
