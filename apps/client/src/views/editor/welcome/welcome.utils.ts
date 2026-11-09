import { ProjectStartup } from 'ontime-types';

type StartupMessage = { type: 'info' | 'warning'; text: string };

/**
 * Explains which project the server loaded on startup
 * Without a startup reason, eg: the dialog opened from the menu, there is nothing to explain
 * @param isCloud the corrupt files folder is not reachable in Ontime Cloud
 */
export function getStartupMessage(projectStartup: ProjectStartup | null, isCloud: boolean): StartupMessage | null {
  switch (projectStartup?.reason) {
    case 'first-run':
      return { type: 'info', text: 'The demo project is loaded. Import a project or create a new one to get started.' };
    case 'resumed':
      return { type: 'info', text: `"${projectStartup.project}" is loaded from your last session.` };
    case 'recovered': {
      const failure = `"${projectStartup.failedProject}" could not be loaded. A new project "${projectStartup.project}" was started instead.`;
      const recovery = isCloud
        ? 'Import a backup of the project to restore it.'
        : 'Check the corrupt files folder for the original file.';
      return { type: 'warning', text: `${failure} ${recovery}` };
    }
    default:
      return null;
  }
}

/**
 * A resumed session greets the user back, so it does not read as a fresh start
 */
export function getWelcomeTitle(projectStartup: ProjectStartup | null): string {
  return projectStartup?.reason === 'resumed' ? 'Welcome back' : 'Welcome to Ontime';
}
