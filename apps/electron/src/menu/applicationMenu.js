const { Menu, shell } = require('electron');

const {
  linkToGitHub,
  linkToDocs,
  linkToDiscord,
  isMac,
  releaseTag,
  projectsPath,
  corruptProjectsPath,
  crashLogPath,
  stylesPath,
  externalPath,
  downloadPath,
} = require('../external');

/**
 * Creates the application menu
 * @param {function} askToQuit - function for quitting process
 * @param {string} clientUrl - base url for the application
 * @param {string} serverUrl - base url for the application
 * @param {function} redirectWindow - function to redirect main window content
 * @param {function} download - function to download a resource from url
 * @returns {Menu} - application menu
 */
function getApplicationMenu(askToQuit, clientUrl, serverUrl, redirectWindow, download) {
  const template = [
    ...(isMac ? [makeMacMenu(askToQuit)] : []),
    makeFileMenu(serverUrl, redirectWindow, download),
    makeViewMenu(clientUrl),
    makeSettingsMenu(redirectWindow),
    makeHelpMenu(redirectWindow),
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
        click: () => askToQuit(),
        accelerator: isMac ? 'Cmd+Q' : 'Alt+F4',
      },
    ],
  };
}

/**
 * Utility function generates the file menu
 * @param {string} serverUrl - base url for the application
 * @param {function} redirectWindow - function to redirect main window content
 * @param {function} download - function to download a resource from url
 * @returns {Object}
 */
function makeFileMenu(serverUrl, redirectWindow, download) {
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
        click: () => redirectWindow('settings=project__manage&create=true'),
      },
      {
        label: 'Edit project info',
        click: () => redirectWindow('editor?settings=project__data'),
      },
      {
        label: 'Manage projects...',
        click: () => redirectWindow('editor?settings=project__manage'),
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
      makeItemOpenInBrowser('Public', `${clientUrl}/public`),
      makeItemOpenInBrowser('Lower Thirds', `${clientUrl}/lower`),
      { type: 'separator' },
      makeItemOpenInBrowser('Timer', `${clientUrl}/timer`),
      makeItemOpenInBrowser('Minimal Timer', `${clientUrl}/minimal`),
      makeItemOpenInBrowser('Clock', `${clientUrl}/clock`),
      makeItemOpenInBrowser('Backstage', `${clientUrl}/backstage`),
      makeItemOpenInBrowser('Timeline (beta)', `${clientUrl}/timeline`),
      makeItemOpenInBrowser('Studio Clock', `${clientUrl}/studio`),
      makeItemOpenInBrowser('Countdown', `${clientUrl}/countdown`),
      { type: 'separator' },
      makeItemOpenInBrowser('Editor', `${clientUrl}/editor`),
      makeItemOpenInBrowser('Cuesheet', `${clientUrl}/cuesheet`),
      makeItemOpenInBrowser('Operator', `${clientUrl}/op`),

      { type: 'separator' },
      { role: 'forceReload' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
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
        label: 'Open settings',
        accelerator: 'CommandOrControl+,',
        click: () => redirectWindow('editor?settings=project'),
      },
      {
        label: 'App settings',
        click: () => redirectWindow('editor?settings=general'),
      },
      {
        label: 'Editor settings',
        click: () => redirectWindow('editor?settings=general__editor'),
      },
      {
        label: 'View settings',
        click: () => redirectWindow('editor?settings=general__view'),
      },
      {
        label: 'Integrations',
        click: () => redirectWindow('editor?settings=integrations'),
      },
      {
        label: 'Network',
        click: () => redirectWindow('editor?settings=network'),
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
        click: () => redirectWindow('editor?settings=about'),
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
