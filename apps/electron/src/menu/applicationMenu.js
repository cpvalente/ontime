const { shell } = require('electron');
/**
 * Build description of application menu
 * @param {boolean} isMac - Whether the target platform is mac
 * @param {function} askToQuit - function for quitting process
 */
function getApplicationMenu(isMac, askToQuit) {
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
                label: 'quit',
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
                await shell.openExternal('http://localhost:4001/timer');
              },
            },
            {
              label: 'Clock',
              click: async () => {
                await shell.openExternal('http://localhost:4001/clock');
              },
            },
            {
              label: 'Minimal Timer',
              click: async () => {
                await shell.openExternal('http://localhost:4001/minimal');
              },
            },
            {
              label: 'Backstage',
              click: async () => {
                await shell.openExternal('http://localhost:4001/backstage');
              },
            },
            {
              label: 'Public',
              click: async () => {
                await shell.openExternal('http://localhost:4001/public');
              },
            },
            {
              label: 'Lower Thirds',
              click: async () => {
                await shell.openExternal('http://localhost:4001/lower');
              },
            },
            {
              label: 'Studio Clock',
              click: async () => {
                await shell.openExternal('http://localhost:4001/studio');
              },
            },
            {
              label: 'Countdown',
              click: async () => {
                await shell.openExternal('http://localhost:4001/countdown');
              },
            },
            { type: 'separator' },
            {
              label: 'Editor',
              click: async () => {
                await shell.openExternal('http://localhost:4001/editor');
              },
            },
            {
              label: 'Cuesheet',
              click: async () => {
                await shell.openExternal('http://localhost:4001/cuesheet');
              },
            },
            {
              label: 'Operator',
              click: async () => {
                await shell.openExternal('http://localhost:4001/operator');
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
