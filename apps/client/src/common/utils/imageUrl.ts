/**
 * Whether an image field value is a web link which is safe to open
 * other protocols (eg: javascript:) must not be opened
 */
export function isImageUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}
