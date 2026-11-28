const { Menu, shell } = require('electron');

const {
  linkToGitHub,
  linkToDocs,
  linkToDiscord,
  isProduction,
  isMac,
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
 * @param {{ version: string, url: string } | null} availableUpdate - newer release, if one was found
 * @param {function} checkForUpdates - function to manually check for a newer release
 * @returns {Menu} - application menu
 */
function getApplicationMenu(
  askToQuit,
  clientUrl,
  serverUrl,
  redirectWindow,
  showDialog,
  download,
  availableUpdate,
  checkForUpdates,
) {
  const template = [
    ...(isMac ? [makeMacMenu(askToQuit)] : []),
    makeFileMenu(askToQuit, serverUrl, redirectWindow, showDialog, download),
    makeEditMenu(),
    makeViewMenu(clientUrl),
    makeSettingsMenu(redirectWindow),
    makeHelpMenu(redirectWindow, download, availableUpdate, checkForUpdates),
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
        accelerator: 'Cmd+Q',
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
function makeFileMenu(askToQuit, serverUrl, redirectWindow, showDialog, download) {
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
        label: 'New Project…',
        accelerator: 'CmdOrCtrl+N',
        click: () => redirectWindow('/editor?settings=project__create'),
      },
      {
        label: 'Open Project…',
        accelerator: 'CmdOrCtrl+O',
        click: () => showDialog('welcome'),
      },
      {
        label: 'Manage Projects…',
        click: () => redirectWindow('/editor?settings=project__list'),
      },
      { type: 'separator' },
      {
        label: 'Edit Project Data…',
        click: () => redirectWindow('/editor?settings=project__data'),
      },
      {
        label: 'Export Project…',
        click: downloadProject,
      },
      { type: 'separator' },
      {
        label: 'Open Data Folder',
        submenu: [
          makeItemOpenInDesktop('Projects', projectsPath),
          makeItemOpenInDesktop('Corrupted projects', corruptProjectsPath),
          makeItemOpenInDesktop('Crash logs', crashLogPath),
          makeItemOpenInDesktop('CSS override', stylesPath),
          makeItemOpenInDesktop('External', externalPath),
        ],
      },
      { type: 'separator' },
      isMac ? { role: 'close', label: 'Close Window' } : { label: 'Quit', click: askToQuit, accelerator: 'Alt+F4' },
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
      makeItemOpenInBrowser('Teleprompter', `${clientUrl}/teleprompter`),
      { type: 'separator' },
      makeItemOpenInBrowser('Timer', `${clientUrl}/timer`),
      makeItemOpenInBrowser('Backstage', `${clientUrl}/backstage`),
      makeItemOpenInBrowser('Timeline', `${clientUrl}/timeline`),
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
        click: () => redirectWindow('/editor?settings=project'),
      },
      {
        label: 'Project',
        submenu: [
          {
            label: 'Project data',
            click: () => redirectWindow('/editor?settings=project__data'),
          },
          {
            label: 'Manage projects',
            click: () => redirectWindow('/editor?settings=project__list'),
          },
        ],
      },
      {
        label: 'Rundown',
        submenu: [
          {
            label: 'Manage rundowns',
            click: () => redirectWindow('/editor?settings=rundown__rundowns'),
          },
          {
            label: 'Import spreadsheet',
            click: () => redirectWindow('/editor?settings=rundown__sheets'),
          },
          {
            label: 'Sync with Google Sheet',
            click: () => redirectWindow('/editor?settings=rundown__sheets'),
          },
          {
            label: 'Custom fields',
            click: () => redirectWindow('/editor?settings=rundown__custom'),
          },
          {
            label: 'Rundown defaults',
            click: () => redirectWindow('/editor?settings=rundown__defaults'),
          },
          {
            label: 'Aux timers',
            click: () => redirectWindow('/editor?settings=rundown__aux-timers'),
          },
          {
            label: 'Runtime report',
            click: () => redirectWindow('/editor?settings=rundown__report'),
          },
        ],
      },
      {
        label: 'Views',
        submenu: [
          {
            label: 'Display (time format and language)',
            click: () => redirectWindow('/editor?settings=views__display'),
          },
          {
            label: 'View settings',
            click: () => redirectWindow('/editor?settings=views__view'),
          },
          {
            label: 'Teleprompter',
            click: () => redirectWindow('/editor?settings=views__teleprompter'),
          },
          {
            label: 'Custom views',
            click: () => redirectWindow('/editor?settings=views__custom-views'),
          },
        ],
      },
      {
        label: 'Sharing and access',
        submenu: [
          {
            label: 'URL Presets',
            click: () => redirectWindow('/editor?settings=sharing__presets'),
          },
          {
            label: 'Share link',
            click: () => redirectWindow('/editor?settings=sharing__link'),
          },
          {
            label: 'Access (pin codes)',
            click: () => redirectWindow('/editor?settings=sharing__access'),
          },
        ],
      },
      {
        label: 'Integrations',
        submenu: [
          {
            label: 'Automations',
            click: () => redirectWindow('/editor?settings=integrations__automations'),
          },
          {
            label: 'MCP Server',
            click: () => redirectWindow('/editor?settings=integrations__mcp'),
          },
        ],
      },
      {
        label: 'Server',
        submenu: [
          {
            label: 'Manage clients',
            click: () => redirectWindow('/editor?settings=server__clients'),
          },
          {
            label: 'Event log',
            click: () => redirectWindow('/editor?settings=server__log'),
          },
          {
            label: 'Server port',
            click: () => redirectWindow('/editor?settings=server'),
          },
        ],
      },
    ],
  };
}

/**
 * Utility function generates the help menu
 * @param {function} redirectWindow - function to redirect main window content
 * @param {function} download - function to download a resource from url
 * @param {{ version: string, url: string } | null} availableUpdate - newer release, if one was found
 * @param {function} checkForUpdates - function to manually check for a newer release
 * @returns {Object}
 */
function makeHelpMenu(redirectWindow, download, availableUpdate, checkForUpdates) {
  return {
    role: 'help',
    submenu: [
      {
        label: 'About Ontime',
        click: () => redirectWindow('/editor?settings=about'),
      },
      availableUpdate
        ? { label: `Download Ontime ${availableUpdate.version}`, click: () => download(availableUpdate.url) }
        : { label: 'Check for Updates', click: checkForUpdates },
      {
        type: 'separator',
      },
      makeItemOpenInBrowser('Documentation', linkToDocs),
      makeItemOpenInBrowser('Community', linkToDiscord),
      makeItemOpenInBrowser('View on GitHub', linkToGitHub),
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
