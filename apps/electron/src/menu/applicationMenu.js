const { Menu, shell } = require('electron');

const { linkToGitHub, linkToDocs, linkToDiscord, isMac, releaseTag, downloadPath } = require('../external');

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
      makeItemOpenInShell('Public', `${clientUrl}/public`),
      makeItemOpenInShell('Lower Thirds', `${clientUrl}/lower`),
      { type: 'separator' },
      makeItemOpenInShell('Timer', `${clientUrl}/timer`),
      makeItemOpenInShell('Minimal Timer', `${clientUrl}/minimal`),
      makeItemOpenInShell('Clock', `${clientUrl}/clock`),
      makeItemOpenInShell('Backstage', `${clientUrl}/backstage`),
      makeItemOpenInShell('Timeline (beta)', `${clientUrl}/timeline`),
      makeItemOpenInShell('Studio Clock', `${clientUrl}/studio`),
      makeItemOpenInShell('Countdown', `${clientUrl}/countdown`),
      { type: 'separator' },
      makeItemOpenInShell('Editor', `${clientUrl}/editor`),
      makeItemOpenInShell('Cuesheet', `${clientUrl}/cuesheet`),
      makeItemOpenInShell('Operator', `${clientUrl}/op`),

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
      makeItemOpenInShell('See on github', linkToGitHub),
      makeItemOpenInShell('Online documentation', linkToDocs),
      makeItemOpenInShell('Join us on Discord', linkToDiscord),
    ],
  };
}

/**
 * Utility function to safely open a URL in the default browser
 * @param {string} label
 * @param {string} url
 * @returns {object} - MenuItem
 */
function makeItemOpenInShell(label, url) {
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

module.exports = { getApplicationMenu };
