const { Menu } = require('electron');

/**
 * Creates the application tray menu
 * @param {function} showApp - function for making the window visible
 * @param {function} askToQuit - function for quitting process
 * @returns {Menu} - application tray menu
 */
function getTrayMenu(showApp, askToQuit) {
  return Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: showApp,
    },
    {
      label: 'Shutdown',
      click: askToQuit,
    },
  ]);
}

module.exports = { getTrayMenu };
