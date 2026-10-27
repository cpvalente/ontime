export type ProjectData = {
  title: string;
  description: string;
  url: string;
  info: string;
  logo: string | null;
  custom: { title: string; value: string; url: string }[];
};

/**
 * How the server came to load its project on startup, names exclude the file extension
 * - first-run: no previous project, the demo was loaded
 * - resumed: the previous project was loaded
 * - recovered-corrupt: the previous project failed to load, a new project was loaded instead
 *   setAside tells whether the failed file was moved to the corrupt files folder
 */
export type ProjectStartup =
  | { reason: 'first-run' | 'resumed'; project: string }
  | { reason: 'recovered-corrupt'; project: string; corruptProject: string; setAside: boolean };
