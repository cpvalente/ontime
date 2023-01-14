const {
  app,
  BrowserWindow,
  Menu,
  globalShortcut,
  Tray,
  dialog,
  ipcMain,
  shell,
  Notification,
} = require('electron');
const path = require('path');
const electronConfig = require('./electron.config');

const env = process.env.NODE_ENV || 'production';
const isProduction = env === 'production';
const isMac = process.platform === 'darwin';
const isWindows = process.platform === 'win32';

// path to server
const nodePath = isProduction
  ? path.join('file://', __dirname, '../', 'extraResources', 'src/app.js')
  : path.join('file://', __dirname, 'src/app.js');

// path to icons
const trayIcon = path.join(__dirname, './assets/background.png');
const appIcon = path.join(__dirname, './assets/logo.png');
let loaded = 'Nothing loaded';
let isQuitting = false;

// initialise
let win;
let splash;
let tray = null;

(async () => {
  try {
    const loadDepPath = isProduction
      ? path.join('file://', __dirname, '../', 'extraResources', 'src/modules/loadDb.js')
      : path.join('file://', __dirname, 'src/modules/loadDb.js');

    const dbLoader = await import(loadDepPath);

    await dbLoader.promise;
    const { startServer, startOSCServer } = await import(nodePath);
    // Start express server
    loaded = await startServer();

    // Start OSC Server
    await startOSCServer();
  } catch (error) {
    loaded = error;
  }
})();

/**
 * @description utility function to create a notification
 * @param title
 * @param text
 */
function showNotification(title, text) {
  new Notification({
    title,
    body: text,
    silent: true,
  }).show();
}

function appShutdown() {
  // terminate node service
  (async () => {
    const { shutdown } = await import(nodePath);
    // Shutdown service
    await shutdown();
  })();

  isQuitting = true;
  tray.destroy();
  win.destroy();
  app.quit();
}

function askToQuit() {
  win.show();
  win.focus();
  win.send('user-request-shutdown');
}

// Ensure there isn't another instance of the app running already
const lock = app.requestSingleInstanceLock();
if (!lock) {
  dialog.showErrorBox('Multiple instances', 'An instance if the App is already running.');
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, we should focus our window.
    if (win) {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    }
  });
}

function createWindow() {
  splash = new BrowserWindow({
    width: 333,
    height: 333,
    transparent: true,
    icon: appIcon,
    resizable: false,
    frame: false,
    alwaysOnTop: true,
    focusable: false,
    skipTaskbar: true,
  });
  splash.setIgnoreMouseEvents(true);
  splash.loadURL(`file://${__dirname}/electron/splash/splash.html`);

  win = new BrowserWindow({
    width: 1920,
    height: 1000,
    minWidth: 525,
    minHeight: 405,
    maxWidth: 1920,
    maxHeight: 1440,
    backgroundColor: '#202020',
    icon: appIcon,
    show: false,
    textAreasAreResizable: false,
    enableWebSQL: false,
    darkTheme: true,
    webPreferences: {
      preload: path.join(__dirname, './electron/preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  win.setMenu(null);
}

app.disableHardwareAcceleration();
app.whenReady().then(() => {
  // Set app title in windows
  if (isWindows) {
    app.setAppUserModelId(app.name);
  }

  createWindow();

  // register global shortcuts
  // (available regardless of whether app is in focus)
  // bring focus to window
  globalShortcut.register('Alt+1', () => {
    win.show();
    win.focus();
  });

  // give the nodejs server some time
  setTimeout(() => {
    // Load page served by node
    const reactApp = isProduction
      ? electronConfig.reactAppUrl.production
      : electronConfig.reactAppUrl.development;

    win.loadURL(reactApp).then(() => {
      win.webContents.setBackgroundThrottling(false);

      win.show();
      win.focus();

      splash.destroy();

      if (typeof loaded === 'string') {
        tray.setToolTip(loaded);
      } else {
        tray.setToolTip('Initialising error: please restart ontime');
      }
    });
  }, electronConfig.appIni.mainWindowWait);

  // recreate window if no others open
  app.on('activate', () => {
    win.show();
  });

  // Hide on close
  win.on('close', function (event) {
    event.preventDefault();
    if (!isQuitting) {
      showNotification('Window Closed', 'App running in background');
      win.hide();
    }
  });

  // create tray
  tray = new Tray(trayIcon);

  // Define context menu
  const trayMenuTemplate = [
    {
      label: 'Show App (Alt + 1)',
      click: () => {
        win.show();
        win.focus();
      },
    },
    {
      label: 'Shutdown',
      click: () => askToQuit(),
    },
  ];

  const trayContextMenu = Menu.buildFromTemplate(trayMenuTemplate);
  tray.setContextMenu(trayContextMenu);
});

const template = [
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
            label: 'PiP',
            click: async () => {
              await shell.openExternal('http://localhost:4001/pip');
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
          await shell.openExternal('https://cpvalente.gitbook.io/ontime/');
        },
      },
    ],
  },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

// unregister shortcuts before quitting
app.once('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Get messages from react
// Test message
ipcMain.on('test-message', (event, arg) => {
  showNotification('Test Message', 'test from react', arg);
});

// Ask for main window reload
// Test message
ipcMain.on('reload', () => {
  if (win) {
    win.reload();
  }
});

// Terminate
ipcMain.on('shutdown', () => {
  console.log('Got IPC shutdown');
  appShutdown();
});

// Window manipulation
ipcMain.on('set-window', (event, arg) => {
  console.log('Got IPC set-window', arg);

  if (arg === 'to-max') {
    // window full
    win.maximize();
  } else if (arg === 'to-tray') {
    // window to tray
    win.hide();
  } else if (arg === 'show-dev') {
    // Show dev tools
    win.webContents.openDevTools({ mode: 'detach' });
  }
});

// Open links external
ipcMain.on('send-to-link', (event, arg) => {
  console.log('Got IPC send-to-link', arg);

  // send to help URL
  if (arg === 'help') {
    shell.openExternal(electronConfig.externalUrls.help);
  } else {
    shell.openExternal(arg);
  }
});
