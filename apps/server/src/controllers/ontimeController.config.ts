export const emptyProject = {
  rundown: [],
  project: {
    title: '',
    description: '',
    publicUrl: '',
    publicInfo: '',
    backstageUrl: '',
    backstageInfo: '',
  },
  settings: {
    app: '',
    version: '',
    serverPort: 0,
    timeFormat: '24',
    language: 'en',
  },
  viewSettings: {
    overrideStyles: false,
    normalColor: '',
    warningColor: '',
    warningThreshold: 0,
    dangerColor: '',
    dangerThreshold: 0,
    endMessage: '',
  },
  aliases: [
    {
      enabled: false,
      alias: '',
      pathAndParams: '',
    },
  ],
  userFields: {},
  osc: {
    portIn: 0,
    portOut: 0,
    targetIP: '127.0.0.1',
    enabledIn: false,
    enabledOut: false,
    subscriptions: {},
  },
  http: {
    enabledOut: false,
    subscriptions: {},
  },
};

export const sanitizeProjectName = (projectName: string): string => {
  // if already has a .json extension, return it
  if (projectName.includes('.json')) {
    return projectName;
  }

  // if no extension, add it
  return `${projectName}.json`;
};
