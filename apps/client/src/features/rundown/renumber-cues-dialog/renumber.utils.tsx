export function validateStartInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return 'Start is required';
  }
  const n = Number(trimmed);
  if (!Number.isFinite(n)) {
    return 'Start must be a valid number';
  }
  return null;
}

export function validateIncrementInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return 'Increment is required';
  }
  const n = Number(trimmed);
  if (!Number.isFinite(n)) {
    return 'Increment must be a valid number';
  }
  return null;
}

