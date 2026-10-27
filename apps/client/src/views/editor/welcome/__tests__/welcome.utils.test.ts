import { ProjectStartup } from 'ontime-types';

import { getStartupMessage, hasOwnProjects, isDemoProject } from '../welcome.utils';

describe('getStartupMessage()', () => {
  const recovered: ProjectStartup = {
    reason: 'recovered-corrupt',
    project: 'new project',
    corruptProject: 'my show',
    setAside: true,
  };

  it('has nothing to explain without a startup reason', () => {
    expect(getStartupMessage(null, false)).toBeNull();
  });

  it('points to the corrupt files folder when the file was set aside', () => {
    expect(getStartupMessage(recovered, false)).toEqual({
      type: 'warning',
      text: '"my show" could not be loaded. A new empty project "new project" was started instead. The file was moved to the corrupt files folder.',
    });
  });

  it('does not mention a folder for a file which could not be set aside', () => {
    expect(getStartupMessage({ ...recovered, setAside: false }, false)?.text).not.toContain('folder');
  });

  it('suggests importing a backup in Ontime Cloud, where the folder is not reachable', () => {
    const text = getStartupMessage(recovered, true)?.text;
    expect(text).not.toContain('folder');
    expect(text).toContain('Import a backup');
  });
});

describe('isDemoProject()', () => {
  it.each(['demo project', 'demo project (2)'])('recognises %s', (filename) => {
    expect(isDemoProject(filename)).toBe(true);
  });

  it.each(['my demo project', 'demo project copy'])('does not match %s', (filename) => {
    expect(isDemoProject(filename)).toBe(false);
  });
});

describe('hasOwnProjects()', () => {
  const file = (filename: string) => ({ filename, updatedAt: '2026-01-01T00:00:00.000Z' });

  it('ignores demos and the empty project started after a failed load', () => {
    expect(hasOwnProjects([file('demo project'), file('demo project (1)'), file('new project')], 'new project')).toBe(
      false,
    );
  });

  it('counts a single project of the user, even when it is the loaded one', () => {
    expect(hasOwnProjects([file('my show'), file('demo project')], null)).toBe(true);
  });
});
