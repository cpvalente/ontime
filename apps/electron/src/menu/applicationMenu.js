const { shell } = require('electron');
/**
 * Build description of application menu
 * @param {boolean} isMac - Whether the target platform is mac
 * @param {function} askToQuit - function for quitting process
 */
function getApplicationMenu(isMac, askToQuit, urlBase, redirectCb) {
  return [
    ...(isMac
      ? [
          {
            label: 'Ontime',
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              {
                label: 'Quit',
                click: () => askToQuit(),
                accelerator: 'Cmd+Q',
              },
            ],
          },
        ]
      : []),
    {
      label: 'File',
      submenu: [isMac ? { role: 'close' } : { role: 'quit' }],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac
          ? [
              { role: 'pasteAndMatchStyle' },
              { role: 'delete' },
              { role: 'selectAll' },
              { type: 'separator' },
              {
                label: 'Speech',
                submenu: [{ role: 'startSpeaking' }, { role: 'stopSpeaking' }],
              },
            ]
          : [{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }]),
      ],
    },
    {
      label: 'Views',
      submenu: [
        {
          label: 'Ontime Views (opens in browser)',
          submenu: [
            {
              label: 'Timer',
              accelerator: 'CmdOrCtrl+V',
              click: async () => {
                await shell.openExternal(`${urlBase}/timer`);
              },
            },
            {
              label: 'Clock',
              click: async () => {
                await shell.openExternal(`${urlBase}/clock`);
              },
            },
            {
              label: 'Minimal Timer',
              click: async () => {
                await shell.openExternal(`${urlBase}/minimal`);
              },
            },
            {
              label: 'Backstage',
              click: async () => {
                await shell.openExternal(`${urlBase}/backstage`);
              },
            },
            {
              label: 'Public',
              click: async () => {
                await shell.openExternal(`${urlBase}/public`);
              },
            },
            {
              label: 'Lower Thirds',
              click: async () => {
                await shell.openExternal(`${urlBase}/lower`);
              },
            },
            {
              label: 'Studio Clock',
              click: async () => {
                await shell.openExternal(`${urlBase}/studio`);
              },
            },
            {
              label: 'Countdown',
              click: async () => {
                await shell.openExternal(`${urlBase}/countdown`);
              },
            },
            { type: 'separator' },
            {
              label: 'Editor',
              click: async () => {
                await shell.openExternal(`${urlBase}/editor`);
              },
            },
            {
              label: 'Cuesheet',
              click: async () => {
                await shell.openExternal(`${urlBase}/cuesheet`);
              },
            },
            {
              label: 'Operator',
              click: async () => {
                await shell.openExternal(`${urlBase}/op`);
              },
            },
          ],
        },
        { type: 'separator' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [{ type: 'separator' }, { role: 'front' }, { type: 'separator' }, { role: 'window' }]
          : [{ role: 'close' }]),
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'About',
          click: async () => {
            redirectCb('editor?settings=about');
          },
        },
        {
          label: 'See on github',
          click: async () => {
            await shell.openExternal('https://github.com/cpvalente/ontime');
          },
        },
        {
          label: 'Online documentation',
          click: async () => {
            await shell.openExternal('https://docs.getontime.no/');
          },
        },
      ],
    },
  ];
}

module.exports = { getApplicationMenu };
