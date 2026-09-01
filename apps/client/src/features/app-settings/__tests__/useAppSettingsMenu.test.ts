import { describe, expect, it } from 'vitest';

import { matchesSettingsOptionQuery } from '../useAppSettingsMenu';

describe('matchesSettingsOptionQuery', () => {
  const option = {
    id: 'settings__general',
    label: 'General settings',
    keywords: ['pin', 'time zone'],
  };

  it('does not match an empty or whitespace-only query', () => {
    expect(matchesSettingsOptionQuery(option, '')).toBe(false);
    expect(matchesSettingsOptionQuery(option, '   ')).toBe(false);
  });

  it('matches keywords case-insensitively', () => {
    expect(matchesSettingsOptionQuery(option, 'PIN')).toBe(true);
    expect(matchesSettingsOptionQuery(option, 'TIME ZONE')).toBe(true);
  });
});
