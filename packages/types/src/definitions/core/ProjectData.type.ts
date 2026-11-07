export type ProjectData = {
  title: string;
  description: string;
  url: string;
  info: string;
  logo: string | null;
  custom: { title: string; value: string; url: string }[];
};

/**
 * Why the server loaded its project on startup, names exclude the file extension
 * - first-run: there was no previous project, the demo was loaded
 * - resumed: the project from the last session was loaded
 * - recovered: the project from the last session failed to load, a new project was loaded instead
 */
export type ProjectStartup =
  | { reason: 'first-run'; project: string }
  | { reason: 'resumed'; project: string }
  | { reason: 'recovered'; project: string; failedProject: string };
