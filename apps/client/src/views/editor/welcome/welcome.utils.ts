import { ProjectFileList, ProjectStartup } from 'ontime-types';

type StartupMessage = { type: 'info' | 'warning'; text: string };

/**
 * Explains which project the server loaded on startup
 * Without a startup reason, eg: the welcome dialog opened from the menu, there is nothing to explain
 * @param isCloud the corrupt files folder is not reachable in Ontime Cloud
 */
export function getStartupMessage(projectStartup: ProjectStartup | null, isCloud: boolean): StartupMessage | null {
  if (!projectStartup) {
    return null;
  }

  switch (projectStartup.reason) {
    case 'first-run':
      return { type: 'info', text: 'The demo project is loaded. Import a project or create a new one to get started.' };
    case 'resumed':
      return { type: 'info', text: `Resumed "${projectStartup.project}" from the last session.` };
    case 'recovered-corrupt': {
      const failure = `"${projectStartup.corruptProject}" could not be loaded. A new empty project "${projectStartup.project}" was started instead.`;
      if (isCloud) {
        return { type: 'warning', text: `${failure} Import a backup of the project to restore it.` };
      }
      if (projectStartup.setAside) {
        return { type: 'warning', text: `${failure} The file was moved to the corrupt files folder.` };
      }
      return { type: 'warning', text: failure };
    }
    default: {
      projectStartup satisfies never;
      return null;
    }
  }
}

/**
 * Demo projects are named by the server, copies get a number: `demo project (1)`
 */
export function isDemoProject(filename: string): boolean {
  return /^demo project( \(\d+\))?$/.test(filename);
}

/**
 * Whether the user has a project of their own: anything but the demos,
 * and the empty project the server started after a failed load
 * Without one, importing their show is the most likely next step
 */
export function hasOwnProjects(projects: ProjectFileList, recoveryProject: string | null): boolean {
  return projects.some(({ filename }) => filename !== recoveryProject && !isDemoProject(filename));
}
