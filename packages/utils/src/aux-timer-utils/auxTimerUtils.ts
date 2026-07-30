/** Number of aux timers available in ontime */
export const numberOfAuxTimers = 3;

/** Maximum length of a user given aux timer name */
export const auxTimerNameMaxLength = 30;

/**
 * Normalises user or file provided aux timer names into a
 * fixed length array of trimmed, length capped strings.
 * Missing or malformed entries fallback to an empty string,
 * which consumers render as the default label.
 * Used when parsing project files, when validating API payloads
 * and to generate the default value.
 */
export function normaliseAuxTimerNames(maybeNames?: unknown): string[] {
  const source = Array.isArray(maybeNames) ? maybeNames : [];

  return Array.from({ length: numberOfAuxTimers }, (_, index) => {
    const value = source[index];
    return typeof value === 'string' ? value.trim().slice(0, auxTimerNameMaxLength) : '';
  });
}
