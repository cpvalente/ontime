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
  nativeTheme,
  screen,
} = require('electron');
const path = require('path');

const { getApplicationMenu } = require('./menu/applicationMenu.js');
const { getTrayMenu } = require('./menu/trayMenu.js');
const { getAvailableUpdate } = require('./updateCheck.js');
const { loadWindowState, saveWindowState } = require('./windowState.js');

const electronConfig = require('./electron.config.js');
const {
  env,
  isProduction,
  isWindows,
  releaseTag,
  nodePath,
  getClientUrl,
  trayIcon,
  appIcon,
  getServerUrl,
} = require('./externals.js');

if (!isProduction) {
  console.log(`Electron running in ${env} environment`);
  console.log(`Ontime server at ${nodePath}`);
  process.traceProcessWarnings = true;
}

/** Flag holds server loading state */
let loaded = 'Ontime starting';

/**
 * Flag whether user has requested a quit
 * Used to coordinate window closes without exit
 */
let isQuitting = false;

/** Flag whether the check for updates on startup has been done */
let hasCheckedForUpdates = false;

// initialise
let win;
let splash;
let tray = null;

function persistWindowState() {
  if (!win || win.isDestroyed()) return;
  saveWindowState(path.join(app.getPath('userData'), 'window-state.json'), {
    bounds: win.getNormalBounds(),
    isMaximized: win.isMaximized(),
  });
}

/**
 * Coordinates the node process startup
 * @returns {number} server port - the port at which the backend has been started at
 */
async function startBackend() {
  // in dev mode, we expect both UI and server to be running
  if (!isProduction) {
    return;
  }

  const ontimeServer = require(nodePath);
  const { initAssets, startServer, startIntegrations } = ontimeServer;

  await initAssets(escalateError);

  const result = await startServer();
  loaded = result.message;

  await startIntegrations();

  return result.serverPort;
}

/**
 * @description utility function to create a notification
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 */
function showNotification(title, body) {
  new Notification({
    title,
    body,
    silent: true,
  }).show();
}

/**
 * Creates the application menu, offering the download if an update is available
 * @param {string} clientUrl
 * @param {string} serverUrl
 * @param {{ version: string, url: string } | null} availableUpdate
 */
function setupMenu(clientUrl, serverUrl, availableUpdate = null) {
  /**
   * @param {boolean} isManual - whether the user asked for the check, and so should be told the result
   */
  const checkForUpdates = async (isManual) => {
    try {
      const update = await getAvailableUpdate();
      if (update) {
        setupMenu(clientUrl, serverUrl, update);
        showNotification('Update available', `Ontime ${update.version} can be downloaded from the Help menu`);
      } else if (isManual) {
        showNotification('Ontime is up to date', `You are using the latest version ${releaseTag}`);
      }
    } catch (_error) {
      if (isManual) {
        showNotification('Could not check for updates', 'Please check your internet connection');
      }
    }
  };

  const menu = getApplicationMenu(
    askToQuit,
    clientUrl,
    serverUrl,
    redirectWindow,
    showDialog,
    (url) => win.webContents.downloadURL(url),
    availableUpdate,
    () => checkForUpdates(true),
  );
  Menu.setApplicationMenu(menu);

  // the startup check only runs once, when we have not yet found an update
  if (!availableUpdate && isProduction && !hasCheckedForUpdates) {
    hasCheckedForUpdates = true;
    checkForUpdates(false);
  }
}

/**
 * Terminate node service and close electron app
 */
function appShutdown() {
  persistWindowState();
  // terminate node service
  (async () => {
    const ontimeServer = require(nodePath);
    const { shutdown } = ontimeServer;
    await shutdown(electronConfig.appIni.shutdownCode);
  })();

  isQuitting = true;
  tray.destroy();
  win.destroy();
  app.quit();
}

/**
 * Sets Ontime window in focus
 */
function bringToFront() {
  win.show();
  win.focus();
}

/**
 * Coordinates the shutdown process
 */
function askToQuit() {
  bringToFront();
  win.send('user-request-shutdown');
}

/**
 * Allows processes to escalate errors to be shown in electron
 * @param {string} error
 */
function escalateError(error, unrecoverable = false) {
  if (unrecoverable) {
    dialog.showErrorBox('An unrecoverable error occurred', error);
    appShutdown();
  } else {
    dialog.showErrorBox('An error occurred', error);
  }
}

/**
 * Allows electron to ask the react app to redirect
 * @param {string} location
 */
function redirectWindow(location) {
  win.webContents.send('request-editor-location', location);
}

/**
 * Asks the react app to show a user dialog
 * @param {string} name
 */
function showDialog(name) {
  win.webContents.send('dialog', name);
}

// Ensure there isn't another instance of the app running already
const lock = app.requestSingleInstanceLock();
if (!lock) {
  dialog.showErrorBox('Multiple instances', 'An instance of the App is already running.');
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, we should focus our window.
    if (win) {
      if (win.isMinimized()) {
        win.restore();
      }
      bringToFront();
    }
  });
}

/**
 * Coordinates creation of electron windows (splash and main)
 */
function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const windowState = loadWindowState(
    path.join(app.getPath('userData'), 'window-state.json'),
    screen.getAllDisplays(),
    primaryDisplay,
  );
  splash = new BrowserWindow({
    width: 333,
    height: 333,
    backgroundColor: '#171719',
    show: false,
    icon: appIcon,
    resizable: false,
    frame: false,
    alwaysOnTop: true,
    focusable: false,
    skipTaskbar: true,
  });
  splash.setIgnoreMouseEvents(true);
  splash.once('ready-to-show', () => {
    if (!splash.isDestroyed()) splash.showInactive();
  });
  const splashPath = path.join('file://', __dirname, '/splash/splash.html');
  splash.loadURL(splashPath);

  win = new BrowserWindow({
    ...windowState.bounds,
    minWidth: Math.min(525, windowState.bounds.width),
    minHeight: Math.min(405, windowState.bounds.height),
    backgroundColor: '#101010', // $gray-1350
    icon: appIcon,
    show: false,
    textAreasAreResizable: false,
    enableWebSQL: false,
    darkTheme: true,
    webPreferences: {
      preload: path.join(__dirname, './preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
    },
  });

  win.setMenu(null);
  return windowState;
}

app.disableHardwareAcceleration();
app.whenReady().then(() => {
  nativeTheme.themeSource = 'dark';
  // Set app title in windows
  if (isWindows) {
    app.setAppUserModelId(app.name);
  }

  const windowState = createWindow();
  startBackend()
    .then((port) => {
      const clientUrl = getClientUrl(port);
      const serverUrl = getServerUrl(port);
      setupMenu(clientUrl, serverUrl);

      // Wait for both successful loading and the first paint before replacing the splash.
      const firstPaint = new Promise((resolve) => win.once('ready-to-show', resolve));
      Promise.all([firstPaint, win.loadURL(`${clientUrl}/editor`)])
        .then(() => {
          if (windowState.isMaximized) win.maximize();
          win.show();
          win.focus();

          splash.destroy();

          if (typeof loaded === 'string') {
            tray.setToolTip(loaded);
          } else {
            tray.setToolTip('Initialising error: please restart Ontime');
          }
        })
        .catch((error) => {
          console.log('ERROR: Ontime failed to reach server', error);
        });
    })
    .catch((error) => {
      console.log('ERROR: Ontime failed to start', error);
    });

  /**
   * recreate window if no others open
   */
  app.on('activate', () => {
    win.show();
  });

  /**
   * Hide on close
   */
  win.on('close', function (event) {
    persistWindowState();
    event.preventDefault();
    if (!isQuitting) {
      showNotification('Window Closed', 'App running in background');
      win.hide();
    }
  });

  // create tray and set its context menu
  tray = new Tray(trayIcon);
  const trayContextMenu = getTrayMenu(bringToFront, askToQuit);
  tray.setContextMenu(trayContextMenu);
});

app.on('before-quit', persistWindowState);

/**
 * Unregister shortcuts before quitting
 */
app.once('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Ask for main window reload
// Test message
ipcMain.on('reload', () => {
  win?.reload();
});

// Terminate
ipcMain.on('shutdown', () => {
  console.log('Electron got IPC shutdown');
  appShutdown();
});

/**
 * Handles requests to set window properties
 */
ipcMain.on('set-window', (_event, arg) => {
  switch (arg) {
    case 'show-dev':
      win.webContents.openDevTools({ mode: 'detach' });
      break;
    default:
      console.log('Electron unhandled window request', arg);
  }
});

/**
 * Handles requests to open external links
 */
ipcMain.on('send-to-link', (_event, arg) => {
  try {
    shell.openExternal(arg);
  } catch (_error) {
    /** unhandled error */
  }
});
