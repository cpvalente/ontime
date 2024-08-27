/**
 * Build description of tray context menu
 * @param {function} showApp - function for making the window visible
 * @param {function} askToQuit - function for quitting process
 */
function getTrayMenu(showApp, askToQuit) {
  return [
    {
      label: 'Show App',
      click: () => showApp(),
    },
    {
      label: 'Shutdown',
      click: () => askToQuit(),
    },
  ];
}

module.exports = { getTrayMenu };
