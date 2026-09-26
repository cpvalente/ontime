import { getTimezoneOffsetMinutes, isValidTimezone } from './timezone.js';

describe('isValidTimezone()', () => {
  it('accepts IANA names', () => {
    expect(isValidTimezone('Europe/Lisbon')).toBe(true);
    expect(isValidTimezone('America/New_York')).toBe(true);
    expect(isValidTimezone('UTC')).toBe(true);
  });

  it('rejects unknown or empty values', () => {
    expect(isValidTimezone('')).toBe(false);
    expect(isValidTimezone('Mars/Olympus_Mons')).toBe(false);
  });
});

describe('getTimezoneOffsetMinutes()', () => {
  const winter = Date.UTC(2026, 0, 15, 12);
  const summer = Date.UTC(2026, 6, 15, 12);

  it('returns offsets positive east of UTC', () => {
    expect(getTimezoneOffsetMinutes('UTC', winter)).toBe(0);
    expect(getTimezoneOffsetMinutes('Europe/Berlin', winter)).toBe(60);
    expect(getTimezoneOffsetMinutes('America/New_York', winter)).toBe(-300);
    expect(getTimezoneOffsetMinutes('Asia/Kolkata', winter)).toBe(330);
  });

  it('accounts for DST at the given instant', () => {
    expect(getTimezoneOffsetMinutes('Europe/Lisbon', winter)).toBe(0);
    expect(getTimezoneOffsetMinutes('Europe/Lisbon', summer)).toBe(60);
    expect(getTimezoneOffsetMinutes('America/New_York', summer)).toBe(-240);
  });
});
