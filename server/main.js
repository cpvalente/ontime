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

const env = process.env.NODE_ENV || 'prod';

let loaded = 'Nothing loaded';
let isQuitting = false;

const nodePath =
  env != 'prod'
    ? path.join('file://', __dirname, 'src/app.js')
    : path.join('file://', __dirname, '../', 'extraResources', 'src/app.js');

(async () => {
  try {
    const { startServer, startOSCServer, startOSCClient } = await import(
      nodePath
    );
    // Start express server
    loaded = startServer();
    // Start OSC Server (API)
    startOSCServer();
    // Start OSC Client (Feedback)
    startOSCClient();
  } catch (error) {
    console.log(error);
    loaded = error;
  }
})();

// Load Icons
// TODO: Icons appear pixelated
const trayIcon = path.join(__dirname, './assets/images/logos/LOGO-512.png');
const appIcon = path.join(__dirname, './assets/images/logos/LOGO-512.png');

function showNotification(text) {
  new Notification({
    title: 'ontime',
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
  dialog.showErrorBox(
    'Multiple instances',
    'An instance if the App is already running.'
  );
  app.quit();
  return;
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (win) {
      if (win.isMinimized()) win.restore();
      win.show();
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
    minWidth: 500,
    minHeight: 530,
    maxWidth: 1920,
    maxHeight: 1440,
    backgroundColor: '#202020',
    icon: appIcon,
    show: false,
    textAreasAreResizable: false,
    enableWebSQL: false,
    webPreferences: {
      preload: path.join(__dirname, './electron/preload.js'),
      // TODO: what are recommended alternatives to node integration?
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  win.setMenu(null);

  // Load page served by node
  const reactApp =
    env == 'prod'
      ? 'http://localhost:4001/editor'
      : 'http://localhost:3000/editor';

  win.loadURL(reactApp).then(() => {
    win.webContents.setBackgroundThrottling(false);
  });
}

app.whenReady().then(() => {
  createWindow();
  /* ======================================
   * CONTEXT MENU CREATION ON REACT SIDE
  // Create context menu
  // const contextMenu = new Menu();
  // contextMenu.append(
  //   new MenuItem({
  //     label: 'Build context menu here',
  //   })
  // );

  // open context menu when clicked
  // win.webContents.on('context-menu', (e, params) => {
  //   contextMenu.popup(win, params.x, params.y);
  // });
  * ======================================
  */

  // register global shortcuts
  // (available regardless of wheter app is in focus)
  // bring focus to window
  globalShortcut.register('Alt+1', () => {
    win.show();
  });

  globalShortcut.register('Alt+t', () => {
    // Show dev tools
    win.webContents.openDevTools({ mode: 'detach' });
  });

  // recreate window if no others open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  win.once('ready-to-show', () => {
    setTimeout(() => {
      // window stuff
      win.show();
      splash.destroy();
      showNotification(loaded.toString());

      // tray stuff
      // TODO: get IP Address
      tray.setToolTip(loaded);
    }, 2000);
  });

  // Hide on close
  win.on('close', function (event) {
    event.preventDefault();
    if (!isQuitting) {
      showNotification('App running in background');
      win.hide();
      return false;
    }
    return true;
  });

  // create tray
  // TODO: Design better icon
  tray = new Tray(trayIcon);

  // TODO: Move to separate file
  // Define context menu
  const trayMenuTemplate = [
    {
      label: 'Show App',
      click: () => win.show(),
    },
    {
      label: 'Close',
      click: () => {
        win.destroy();
        app.quit();
      },
    },
  ];

  const trayContextMenu = Menu.buildFromTemplate(trayMenuTemplate);
  tray.setContextMenu(trayContextMenu);
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
  showNotification('testing 1-2', arg);
});

// Terminate
ipcMain.on('shutdown', (event, arg) => {
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
    win.setContentSize(1920, 1000);
    win.setPosition(0, 0);
  } else if (arg === 'to-tray') {
    // window to tray
    win.hide();
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
