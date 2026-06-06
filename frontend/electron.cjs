const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV !== 'production';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'StockFlow',
    webPreferences: {
      nodeIntegration: false,          // Security: never expose Node.js to renderer
      contextIsolation: true,          // Security: sandbox renderer from Node.js
      webSecurity: true,               // Security: enforce same-origin policy
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
    }
  });

  // Hide standard menu for a cleaner look natively
  mainWindow.setMenuBarVisibility(false);

  if (isDev) {
    // In dev mode, load from the Vite dev server
    mainWindow.loadURL('http://localhost:5173');
  } else {
    // In production, load the compiled app
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html')).catch(err => {
      console.error('Failed to load local file:', err);
    });
  }

  // Security: prevent navigation to external URLs (common attack vector in Electron apps)
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    const allowedHosts = ['localhost'];
    if (!allowedHosts.includes(parsedUrl.hostname)) {
      event.preventDefault();
      // Open external links in the system browser instead
      shell.openExternal(navigationUrl);
    }
  });

  // Security: prevent opening new windows from within the renderer
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle errors loading pages
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`Page failed to load: ${errorCode} - ${errorDescription}`);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
