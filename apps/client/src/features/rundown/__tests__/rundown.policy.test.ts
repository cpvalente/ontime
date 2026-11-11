import { getRundownPolicy } from '../rundown.policy';

const loaded = { isLoaded: true, isPlaying: false, locked: false };

describe('getRundownPolicy()', () => {
  test('is open with full access when nothing restricts it', () => {
    const policy = getRundownPolicy(loaded);

    expect(policy).toMatchObject({
      status: 'open',
      canToggleLock: true,
      canCreateEntries: true,
      canEditEntries: true,
      canFlag: true,
    });
    expect(policy.canRead('title')).toBe(true);
    expect(policy.canWrite('title')).toBe(true);
  });

  test('is guarded while the loaded rundown plays, and keeps edits', () => {
    const policy = getRundownPolicy({ ...loaded, isPlaying: true });

    expect(policy).toMatchObject({ status: 'guarded', canCreateEntries: true, canEditEntries: true });
    expect(policy.canWrite('title')).toBe(true);
  });

  test('a rundown that is not loaded is open while another plays', () => {
    expect(getRundownPolicy({ ...loaded, isLoaded: false, isPlaying: true }).status).toBe('open');
  });

  test.each([false, true])('a lock makes the loaded rundown read only (playing: %s)', (isPlaying) => {
    const policy = getRundownPolicy({ ...loaded, isPlaying, locked: true });

    expect(policy).toMatchObject({
      status: 'locked',
      canToggleLock: true,
      canCreateEntries: false,
      canEditEntries: false,
      canFlag: false,
    });
    expect(policy.canRead('title')).toBe(true);
    expect(policy.canWrite('title')).toBe(false);
  });

  test('a lock leaves a rundown that is not loaded editable', () => {
    const policy = getRundownPolicy({ ...loaded, isLoaded: false, locked: true });

    expect(policy.status).toBe('open');
    expect(policy.canEditEntries).toBe(true);
  });

  test('a preset without write access is always locked and cannot unlock', () => {
    const policy = getRundownPolicy({ ...loaded, isLoaded: false, read: 'full', write: '-' });

    expect(policy.status).toBe('locked');
    expect(policy.canToggleLock).toBe(false);
    expect(policy.canWrite('title')).toBe(false);
  });

  test.each([false, true])('field permissions limit writes to the listed keys (playing: %s)', (isPlaying) => {
    const policy = getRundownPolicy({ ...loaded, isPlaying, read: 'cue,title', write: 'title,flag' });

    expect(policy).toMatchObject({
      canToggleLock: true,
      canFlag: true,
      canCreateEntries: false,
      canEditEntries: false,
    });
    expect(policy.canRead('cue')).toBe(true);
    expect(policy.canRead('duration')).toBe(false);
    expect(policy.canWrite('title')).toBe(true);
    // write access does not depend on read access
    expect(policy.canWrite('flag')).toBe(true);
    expect(policy.canWrite('cue')).toBe(false);
  });

  test('a lock removes field level write access', () => {
    const policy = getRundownPolicy({ ...loaded, write: 'title,flag', locked: true });

    expect(policy.canWrite('title')).toBe(false);
    expect(policy.canFlag).toBe(false);
  });
});
