export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Obfuscate a string
 * Uses a variation of ROT13 that handles numeric values
 * @param str
 * @returns
 */
export function obfuscate(str: string): string {
  const obfuscated = str.replace(/[a-zA-Z0-9]/g, (c) => {
    if (/[a-zA-Z]/.test(c)) {
      // @ts-expect-error -- we use some javascript magic here
      return String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26);
    } else {
      // @ts-expect-error -- we use some javascript magic here

      return String.fromCharCode((c <= '4' ? 57 : 48) >= (c = c.charCodeAt(0) + 5) ? c : c - 10);
    }
  });
  if (str.startsWith('_')) {
    return obfuscated.replace('_', '');
  }
  return `_${obfuscated}`;
}

/**
 * Unobfoscate a string
 * Uses a variation of ROT13 that handles numeric values
 * @param str
 * @returns
 */
export function unobfuscate(str: string): string {
  if (str.startsWith('_')) {
    return obfuscate(str);
  }
  return str;
}
