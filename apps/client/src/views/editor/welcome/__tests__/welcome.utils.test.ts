import { ProjectStartup } from 'ontime-types';

import { getStartupMessage, getWelcomeTitle } from '../welcome.utils';

describe('getStartupMessage()', () => {
  const recovered: ProjectStartup = { reason: 'recovered', project: 'new project', failedProject: 'my show' };

  it('has nothing to explain without a startup reason', () => {
    expect(getStartupMessage(null, false)).toBeNull();
  });

  it('names the project resumed from the last session', () => {
    expect(getStartupMessage({ reason: 'resumed', project: 'my show' }, false)).toEqual({
      type: 'info',
      text: '"my show" is loaded from your last session.',
    });
  });

  it('warns which project failed to load, and points to the corrupt files folder', () => {
    expect(getStartupMessage(recovered, false)).toEqual({
      type: 'warning',
      text: '"my show" could not be loaded. A new project "new project" was started instead. Check the corrupt files folder for the original file.',
    });
  });

  it('suggests importing a backup in Ontime Cloud, where the folder is not reachable', () => {
    const text = getStartupMessage(recovered, true)?.text;
    expect(text).not.toContain('folder');
    expect(text).toContain('Import a backup');
  });
});

describe('getWelcomeTitle()', () => {
  it('greets a resumed session back', () => {
    expect(getWelcomeTitle({ reason: 'resumed', project: 'my show' })).toBe('Welcome back');
  });

  it.each([null, { reason: 'first-run', project: 'demo project' } as const])('welcomes otherwise', (startup) => {
    expect(getWelcomeTitle(startup)).toBe('Welcome to Ontime');
  });
});
