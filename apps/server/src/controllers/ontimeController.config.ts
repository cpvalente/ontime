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

export const sanitizeProjectFilename = (req, res, next) => {
  const { projectFilename, newProjectFilename } = req.body;
  const { projectName } = req.params;

  if (projectFilename) {
    req.body.projectFilename = projectFilename.includes('.json') ? projectFilename : `${projectFilename}.json`;
  }

  if (newProjectFilename) {
    req.body.newProjectFilename = newProjectFilename.includes('.json')
      ? newProjectFilename
      : `${newProjectFilename}.json`;
  }

  if (projectName) {
    req.params.projectName = projectName.includes('.json') ? projectName : `${projectName}.json`;
  }

  next();
};
