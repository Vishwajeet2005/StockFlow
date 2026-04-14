const { app, BrowserWindow } = require('electron');
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
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false // Bypasses CORS directly in desktop instance
    }
  });

  // Hide standard menu for a cleaner look natively
  mainWindow.setMenuBarVisibility(false);

  if (isDev) {
    // Port 5173 is the default for Vite frontend
    mainWindow.loadURL('http://localhost:5173');
  } else {
    // In production, point directly to the Vite compiled index.html
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

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
