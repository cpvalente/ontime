const {
  app,
  BrowserWindow,
  Menu,
  globalShortcut,
  Tray,
  dialog,
} = require('electron');
const path = require('path');
const { electron } = require('process');
const nodeapp = require('./app.js');
require('@electron/remote/main').initialize();

// Load Icons
// TODO: Icons appear pixelated
const trayIcon = path.join(__dirname, './assets/images/logos/LOGO-512.png');
const appIcon = path.join(__dirname, './assets/images/logos/LOGO-512.png');

// Ensure there isn't another instance of the app running already
var lock = app.requestSingleInstanceLock();
if (!lock) {
  dialog.showErrorBox(
    'Multiple instances',
    'Another instance is already running. Please close the other instance first.'
  );
  app.quit();
  return;
}

var win, tray;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    backgroundColor: '#202020',
    icon: appIcon,
    // TODO: Make framerless
    // frame: false,
    webPreferences: {
      preload: path.join(__dirname, './electron/preload.js'),
      // TODO: what are recommended alternatives to node integration?
      nodeIntegration: true,
      enableRemoteModule: true,
    },
  });

  // Load page served by node
  win.loadURL('http://localhost:4001/editor');
  // TODO: Make development environment and run live react instead
  // win.loadURL('http://localhost:3000/editor');

  // Show dev tools
  win.webContents.openDevTools({ mode: 'detach' });
}

app.whenReady().then(() => {
  createWindow();

  // TODO: Move to separate file
  // TODO: Should move to react?
  // Define App Menu
  const appMenuTemplate = [
    {
      label: 'Help',
      submenu: [
        {
          label: 'Getting Started',
          click: () => {
            console.log('Gonna do something here: Help > Getting Started');
          },
        },
        {
          label: 'OSC Controls',
          click: () => {
            console.log('Gonna do something here: Help > OSC Controls');
          },
        },
        {
          label: 'URL Definitions',
          click: () => {
            console.log('Gonna do something here: Help > URL Definitions');
          },
        },
      ],
    },
  ];

  const appMenu = Menu.buildFromTemplate(appMenuTemplate);
  Menu.setApplicationMenu(appMenu);

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

  // recreate window if no others open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // Hide on minimise
  win.on('minimize', function (event) {
    event.preventDefault();
    win.hide();
  });

  //Hide on close
  win.on('close', function (event) {
    event.preventDefault();
    win.hide();

    return false;
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
  tray.setToolTip('ontime running on http://localhost:4001/');
});

// unregister shortcuts before quitting
app.once('will-quit', () => {
  globalShortcut.unregisterAll();
});
