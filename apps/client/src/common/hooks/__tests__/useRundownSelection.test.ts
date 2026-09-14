import {
  FOLLOW_LOADED_RUNDOWN_ID,
  getRundownSelectionStorageKey,
  resolveSelectedRundownId,
} from '../useRundownSelection';

describe('useRundownSelection helpers', () => {
  it('builds a namespace and project scoped storage key', () => {
    expect(getRundownSelectionStorageKey('cuesheet', 'http://localhost:4001', 'My Project')).toBe(
      'rundown-selection:cuesheet:http://localhost:4001:My Project',
    );
  });

  it('falls back to the follow loaded rundown when the stored selection is missing', () => {
    expect(resolveSelectedRundownId('missing', new Set(['loaded', 'other']))).toBe(FOLLOW_LOADED_RUNDOWN_ID);
  });

  it('keeps the stored selection when it still exists in the current project', () => {
    expect(resolveSelectedRundownId('other', new Set(['loaded', 'other']))).toBe('other');
  });
});
