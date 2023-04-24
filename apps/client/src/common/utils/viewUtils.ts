export function isStringBoolean(text: string | null) {
  if (text === null) {
    return false;
  }
  return text?.toLowerCase() === 'true' || text === '1';
}
