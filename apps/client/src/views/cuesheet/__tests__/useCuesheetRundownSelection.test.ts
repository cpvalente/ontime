import { getCuesheetRundownStorageKey, resolveSelectedRundownId } from '../useCuesheetRundownSelection';

describe('useCuesheetRundownSelection helpers', () => {
  it('builds a project-scoped storage key', () => {
    expect(getCuesheetRundownStorageKey('http://localhost:4001', 'My Project')).toBe(
      'cuesheet-selected-rundown:http://localhost:4001:My Project',
    );
  });

  it('falls back to the loaded rundown when the stored selection is missing', () => {
    expect(resolveSelectedRundownId('missing', 'loaded', new Set(['loaded', 'other']))).toBe('loaded');
  });

  it('keeps the stored selection when it still exists in the current project', () => {
    expect(resolveSelectedRundownId('other', 'loaded', new Set(['loaded', 'other']))).toBe('other');
  });
});
