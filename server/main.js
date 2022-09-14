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

if (process.env.NODE_ENV === undefined) {
  process.env.NODE_ENV = 'production';
}
const env = process.env.NODE_ENV;

let loaded = 'Nothing loaded';
let isQuitting = false;

const nodePath =
  env !== 'production'
    ? path.join('file://', __dirname, 'src/app.js')
    : path.join('file://', __dirname, '../', 'extraResources', 'src/app.js');

(async () => {
  try {
    const { startServer, startOSCServer } = await import(nodePath);
    // Start express server
    loaded = await startServer();

    // Start OSC Server (API)
    await startOSCServer();
  } catch (error) {
    console.log(error);
    loaded = error;
  }
})();

// Load Icons
const trayIcon = path.join(__dirname, './assets/background.png');
const appIcon = path.join(__dirname, './assets/logo.png');

/**
 * @description utility function to create a notification
 * @param title
 * @param text
 */
function showNotification(title, text) {
  new Notification({
    title: title,
    body: text,
    silent: true,
  }).show();
}

let win;
let splash;
let tray = null;

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
  // create a new `splash`-Window
  splash = new BrowserWindow({
    width: 333,
    height: 333,
    transparent: true,
    icon: appIcon,
    resizable: false,
    frame: false,
    alwaysOnTop: true,
  });
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

app.whenReady().then(() => {
  // Set app title in windows
  if (process.platform === 'win32') {
    app.setAppUserModelId(app.name);
  }

  // allow usual quit in mac
  if (process.platform === 'darwin') {
    globalShortcut.register('Command+Q', () => {
      win.send('user-request-shutdown');
    });
  }
  createWindow();

  // register global shortcuts
  // (available regardless of whether app is in focus)
  // bring focus to window
  globalShortcut.register('Alt+1', () => {
    win.show();
    win.focus();
  });

  // recreate window if no others open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // give the nodejs server some time
  setTimeout(() => {
    // Load page served by node
    const reactApp =
      env === 'development' ? 'http://localhost:3000/editor' : 'http://localhost:4001/editor';

    win.loadURL(reactApp).then(() => {
      win.webContents.setBackgroundThrottling(false);

      // window stuff
      win.show();
      win.focus();

      splash.destroy();

      // tray stuff
      tray.setToolTip(loaded);
    });
  }, 2000);

  // Hide on close
  win.on('close', function (event) {
    event.preventDefault();
    if (!isQuitting) {
      showNotification('Window Closed', 'App running in background');
      win.hide();
      return false;
    }
    return true;
  });

  // create tray
  // TODO: Design better icon
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
      click: () => {
        win.destroy();
        app.quit();
      },
    },
  ];

  const trayContextMenu = Menu.buildFromTemplate(trayMenuTemplate);
  tray.setContextMenu(trayContextMenu);

  // on tray click event, show main window
  tray.on('click', function () {
    if (!win.isVisible()) {
      win.show();
    }
    win.focus();
  });
});

// unregister shortcuts before quitting
app.once('will-quit', () => {
  globalShortcut.unregisterAll();
});

// destroy tray icon before quit
app.once('before-quit', () => {
  tray.destroy();
});

// Get messages from react
// Test message
ipcMain.on('test-message', (event, arg) => {
  showNotification('Test Message', 'test from react', arg);
});

// Ask for main window reload
// Test message
ipcMain.on('reload', (event, arg) => {
  if (win) {
    win.reload();
  }
});

// Terminate
ipcMain.on('shutdown', () => {
  console.log('Got IPC shutdown');

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
    shell.openExternal('https://cpvalente.gitbook.io/ontime/');
  } else {
    shell.openExternal(arg);
  }
});
