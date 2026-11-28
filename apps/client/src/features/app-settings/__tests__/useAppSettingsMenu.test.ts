import { describe, expect, it } from 'vitest';

import { filterSettingsOptions, matchesSettingsOptionQuery, staticOptions } from '../useAppSettingsMenu';

describe('matchesSettingsOptionQuery', () => {
  const option = {
    id: 'sharing__general',
    label: 'General settings',
    keywords: ['pin', 'time format'],
  };

  it('does not match an empty or whitespace-only query', () => {
    expect(matchesSettingsOptionQuery(option, '')).toBe(false);
    expect(matchesSettingsOptionQuery(option, '   ')).toBe(false);
  });

  it('matches keywords case-insensitively', () => {
    expect(matchesSettingsOptionQuery(option, 'PIN')).toBe(true);
    expect(matchesSettingsOptionQuery(option, 'TIME FORMAT')).toBe(true);
  });
});

describe('settings menu', () => {
  it('has children whose id starts with their group id', () => {
    for (const option of staticOptions) {
      if ('secondary' in option) {
        option.secondary.forEach((child) => expect(child.id.startsWith(`${option.id}__`)).toBe(true));
      }
    }
  });

  it.each([
    ['manage projects', 'project__list'],
    ['manage rundowns', 'rundown__rundowns'],
    ['share link', 'sharing__link'],
    ['global triggers', 'integrations__automations'],
    ['manage clients', 'server__clients'],
  ])('finds an item by its old name %j', (query, id) => {
    const found = filterSettingsOptions(staticOptions, query).flatMap((option) => option.secondary ?? []);
    expect(found.map((option) => option.id)).toContain(id);
  });
});
