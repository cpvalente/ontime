const { Menu, shell } = require('electron');

const {
  linkToGitHub,
  linkToDocs,
  linkToDiscord,
  isProduction,
  isMac,
  releaseTag,
  projectsPath,
  corruptProjectsPath,
  crashLogPath,
  stylesPath,
  externalPath,
  downloadPath,
} = require('../externals.js');

/**
 * Creates the application menu
 * @param {function} askToQuit - function for quitting process
 * @param {string} clientUrl - base url for the application
 * @param {string} serverUrl - base url for the application
 * @param {function} redirectWindow - function to redirect main window content
 * @param {function} showDialog - asks the react app to show a user dialog
 * @param {function} download - function to download a resource from url
 * @returns {Menu} - application menu
 */
function getApplicationMenu(askToQuit, clientUrl, serverUrl, redirectWindow, showDialog, download) {
  const template = [
    ...(isMac ? [makeMacMenu(askToQuit)] : []),
    makeFileMenu(serverUrl, redirectWindow, showDialog, download),
    makeEditMenu(),
    makeViewMenu(clientUrl),
    makeSettingsMenu(redirectWindow),
    makeHelpMenu(redirectWindow),
    ...(isProduction ? [] : [{ label: 'Dev', submenu: [{ role: 'toggleDevTools' }] }]),
  ];
  return Menu.buildFromTemplate(template);
}

/**
 * Utility function generates the app menu (macOS only)
 * @param {function} askToQuit - function for quitting process
 * @returns {Object}
 */
function makeMacMenu(askToQuit) {
  return {
    label: 'Ontime',
    submenu: [
      { role: 'about', label: 'About Ontime' },
      { type: 'separator' },
      { role: 'hide', label: 'Hide Ontime' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      {
        label: 'Quit',
        click: askToQuit,
        accelerator: isMac ? 'Cmd+Q' : 'Alt+F4',
      },
    ],
  };
}

/**
 * Utility function generates the edit menu
 * @returns {Object}
 */
function makeEditMenu() {
  return {
    label: 'Edit',
    submenu: [
      { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
      { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
      { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
      { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectAll' },
    ],
  };
}

/**
 * Utility function generates the file menu
 * @param {string} serverUrl - base url for the application
 * @param {function} redirectWindow - function to redirect main window content
 * @param {function} showDialog - asks the react app to show a user dialog
 * @param {function} download - function to download a resource from url
 * @returns {Object}
 */
function makeFileMenu(serverUrl, redirectWindow, showDialog, download) {
  const downloadProject = () => {
    try {
      download(serverUrl + downloadPath);
    } catch (_error) {
      /** unhandled error */
    }
  };

  return {
    label: 'File',
    submenu: [
      {
        label: 'New project...',
        click: () => redirectWindow('/editor?settings=project__manage&new=true'),
      },
      {
        label: 'Load...',
        click: () => showDialog('welcome'),
      },
      {
        label: 'Quick start...',
        click: () => redirectWindow('/editor?settings=project__create'),
      },
      {
        label: 'Edit project data...',
        click: () => redirectWindow('/editor?settings=settings__data'),
      },
      {
        label: 'Manage projects',
        click: () => redirectWindow('/editor?settings=project__list'),
      },
      {
        label: 'Download project',
        click: downloadProject,
      },
      { type: 'separator' },
      {
        label: 'Open directory',
        submenu: [
          makeItemOpenInDesktop('Projects', projectsPath),
          makeItemOpenInDesktop('Corrupted projects', corruptProjectsPath),
          makeItemOpenInDesktop('Crash logs', crashLogPath),
          makeItemOpenInDesktop('CSS override', stylesPath),
          makeItemOpenInDesktop('External', externalPath),
        ],
      },
      { type: 'separator' },
      { role: isMac ? 'close' : 'quit' },
    ],
  };
}

/**
 * Utility function generates the views menu
 * @param {string} clientUrl - base url for the application
 * @returns {Object}
 */
function makeViewMenu(clientUrl) {
  return {
    label: 'Views',
    submenu: [
      makeItemOpenInBrowser('Editor', `${clientUrl}/editor`),
      makeItemOpenInBrowser('Cuesheet', `${clientUrl}/cuesheet`),
      makeItemOpenInBrowser('Operator', `${clientUrl}/op`),
      { type: 'separator' },
      makeItemOpenInBrowser('Timer', `${clientUrl}/timer`),
      makeItemOpenInBrowser('Backstage', `${clientUrl}/backstage`),
      makeItemOpenInBrowser('Timeline (beta)', `${clientUrl}/timeline`),
      makeItemOpenInBrowser('Studio Clock', `${clientUrl}/studio`),
      makeItemOpenInBrowser('Countdown', `${clientUrl}/countdown`),
      makeItemOpenInBrowser('Project info', `${clientUrl}/info`),
      { type: 'separator' },
      { role: 'forceReload' },
      { type: 'separator' },
      { role: 'resetZoom' },
      // NOTE: I still contend this zoomin mess is an electron bug
      { role: 'zoomIn', accelerator: 'CmdOrCtrl+Plus' },
      { role: 'zoomIn', accelerator: 'CmdOrCtrl+=', visible: false },
      { role: 'zoomIn', accelerator: 'CmdOrCtrl+numadd', visible: false },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' },
    ],
  };
}

/**
 * Utility function generates the settings menu
 * @param {function} redirectWindow - function to redirect main window content
 * @returns {Object}
 */
function makeSettingsMenu(redirectWindow) {
  return {
    label: 'Settings',
    submenu: [
      {
        label: 'Open Settings',
        accelerator: 'CommandOrControl+,',
        click: () => redirectWindow('/editor?settings=settings'),
      },
      {
        label: 'App Settings',
        submenu: [
          {
            label: 'Project data',
            click: () => redirectWindow('/editor?settings=settings__data'),
          },
          {
            label: 'General settings',
            click: () => redirectWindow('/editor?settings=settings__general'),
          },
          {
            label: 'View settings',
            click: () => redirectWindow('/editor?settings=settings__view'),
          },
        ],
      },
      {
        label: 'Project',
        submenu: [
          {
            label: 'Create...',
            click: () => redirectWindow('/editor?settings=project__create'),
          },
          {
            label: 'Manage projects',
            click: () => redirectWindow('/editor?settings=project__list'),
          },
        ],
      },
      {
        label: 'Project data',
        submenu: [
          {
            label: 'Rundown defaults',
            click: () => redirectWindow('/editor?settings=manage__defaults'),
          },
          {
            label: 'Custom fields',
            click: () => redirectWindow('/editor?settings=manage__custom'),
          },
          {
            label: 'Manage rundowns',
            click: () => redirectWindow('/editor?settings=manage__rundowns'),
          },
          {
            label: 'Import spreadsheet',
            click: () => redirectWindow('/editor?settings=manage__sheets'),
          },
          {
            label: 'Sync with Google Sheet',
            click: () => redirectWindow('/editor?settings=manage__sheets'),
          },
        ],
      },
      {
        label: 'Automation',
        submenu: [
          {
            label: 'Automation settings',
            click: () => redirectWindow('/editor?settings=automation__settings'),
          },
          {
            label: 'Manage automations',
            click: () => redirectWindow('/editor?settings=automation__automations'),
          },
          {
            label: 'Manage triggers',
            click: () => redirectWindow('/editor?settings=automation__triggers'),
          },
        ],
      },
      {
        label: 'Sharing and reporting',
        submenu: [
          {
            label: 'URL presets',
            click: () => redirectWindow('/editor?settings=sharing__presets'),
          },
          {
            label: 'Share link',
            click: () => redirectWindow('/editor?settings=sharing__link'),
          },
          {
            label: 'Runtime report',
            click: () => redirectWindow('/editor?settings=sharing__report'),
          },
        ],
      },
      {
        label: 'Network',
        submenu: [
          {
            label: 'Event log',
            click: () => redirectWindow('/editor?settings=network__log'),
          },
          {
            label: 'Manage clients',
            click: () => redirectWindow('/editor?settings=network__clients'),
          },
        ],
      },
    ],
  };
}

/**
 * Utility function generates the help menu
 * @param {function} redirectWindow - function to redirect main window content
 * @returns {Object}
 */
function makeHelpMenu(redirectWindow) {
  return {
    role: 'help',
    submenu: [
      {
        label: `Ontime ${releaseTag}`,
        click: () => redirectWindow('/editor?settings=about'),
      },
      {
        type: 'separator',
      },
      makeItemOpenInBrowser('See on github', linkToGitHub),
      makeItemOpenInBrowser('Online documentation', linkToDocs),
      makeItemOpenInBrowser('Join us on Discord', linkToDiscord),
    ],
  };
}

/**
 * Utility function to safely open a URL in the default browser
 * @param {string} label
 * @param {string} url
 * @returns {object} - MenuItem
 */
function makeItemOpenInBrowser(label, url) {
  return {
    label: `${label} ↗`,
    click: async () => {
      try {
        await shell.openExternal(url);
      } catch (_error) {
        /** unhandled error */
      }
    },
  };
}

/**
 * Utility function to open a file in the OS explorer / finder
 * @param {string} label
 * @param {string} path
 * @returns {object} - MenuItem
 */
function makeItemOpenInDesktop(label, path) {
  return {
    label,
    click: () => {
      try {
        shell.openPath(path);
      } catch (_error) {
        /** unhandled error */
      }
    },
  };
}

module.exports = { getApplicationMenu };
