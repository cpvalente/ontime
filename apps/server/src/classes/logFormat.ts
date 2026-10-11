type LogField = string | number | boolean | null | undefined;

/** values which read and search well without quotes */
const bareValue = /^[\w.:/@+-]+$/;

/**
 * Formats a log text as an event name followed by its fields
 * eg: automation.sent title="House lights" cycle=onFinish
 * - absent fields are left out
 * - values with spaces or symbols are quoted, so a line can be split and searched by field
 */
export function formatLogEvent(event: string, fields: Record<string, LogField> = {}): string {
  const parts = [event];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    const text = String(value);
    parts.push(`${key}=${bareValue.test(text) ? text : JSON.stringify(text)}`);
  }
  return parts.join(' ');
}
