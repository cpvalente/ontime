export function isNumeric(num: any) {
  if (typeof num === 'number' && !isNaN(num)) {
    return true;
  }

  if (typeof num === 'string' && num.trim() !== '') {
    return !isNaN(parseFloat(num));
  }

  return false;
}
