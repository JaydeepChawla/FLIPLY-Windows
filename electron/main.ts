/**
 * FLIPLY — Electron Main Process
 * Supports Windows Desktop App & Windows Screen Saver (.scr)
 */

import {
  app,
  BrowserWindow,
  ipcMain,
  powerSaveBlocker,
  screen,
} from 'electron';

import fs from 'fs';
import path from 'path';

import { getWindowsBatteryInfo } from './battery';
import { getStartupState, toggleStartupState } from './startup';
import { createTray } from './tray';
import { ScreenSaverArgs } from './types';

let mainWindows: BrowserWindow[] = [];
let wakeLockId: number | null = null;

const settingsFilePath = path.join(
  app.getPath('userData'),
  'settings.json'
);

/**
 * Parse Windows Command Line arguments
 *
 * Supports:
 * /s
 * /c
 * /c:<HWND>
 * /p <HWND>
 * --screensaver
 * --screensaver-config
 */
function parseCommandLineArgs(
  argv: string[]
): ScreenSaverArgs {
  const args = argv.slice(1);

  let isScreenSaver = false;
  let isPreview = false;
  let isConfig = false;

  let previewHwnd: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i].toLowerCase();

    // /s : Run Screen Saver
    if (
      arg === '/s' ||
      arg === '-s' ||
      arg === '--screensaver'
    ) {
      isScreenSaver = true;
    }

    // /c : Configure Screen Saver
    else if (
      arg.startsWith('/c') ||
      arg.startsWith('-c') ||
      arg === '--screensaver-config'
    ) {
      isConfig = true;
    }

    // /p <HWND> : Preview in Screen Saver dialog
    else if (arg === '/p' || arg === '-p') {
      isPreview = true;

      if (i + 1 < args.length) {
        previewHwnd = args[i + 1];
        i++;
      }
    }

    // /p:<HWND>
    else if (arg.startsWith('/p:')) {
      isPreview = true;
      previewHwnd = arg.substring(3);
    }
  }

  return {
    isScreenSaver,
    isPreview,
    isConfig,
    previewHwnd,
  };
}

/**
 * Read settings from local JSON file
 */
function loadLocalSettings(): any {
  try {
    if (fs.existsSync(settingsFilePath)) {
      const raw = fs.readFileSync(
        settingsFilePath,
        'utf-8'
      );

      return JSON.parse(raw);
    }
  } catch (err) {
    console.error(
      'Error reading settings file:',
      err
    );
  }

  return null;
}

/**
 * Save settings to local JSON file
 */
function saveLocalSettings(
  settings: any
): boolean {
  try {
    fs.mkdirSync(
      path.dirname(settingsFilePath),
      {
        recursive: true,
      }
    );

    fs.writeFileSync(
      settingsFilePath,
      JSON.stringify(settings, null, 2),
      'utf-8'
    );

    return true;
  } catch (err) {
    console.error(
      'Error saving settings file:',
      err
    );

    return false;
  }
}

/**
 * Create a window for normal or screen saver mode
 */
async function createWindow(
  display?: Electron.Display,
  ssArgs?: ScreenSaverArgs
): Promise<BrowserWindow> {
  const isScreenSaver =
    ssArgs?.isScreenSaver ?? false;

  const isConfig =
    ssArgs?.isConfig ?? false;

  const iconPath = path.join(
    __dirname,
    '../public/icons/icon-512.png'
  );

  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    title: 'FLIPLY — Flip Clock',

    icon: fs.existsSync(iconPath)
      ? iconPath
      : undefined,

    webPreferences: {
      /**
       * IMPORTANT:
       * Electron main process is bundled to:
       *
       * electron-dist/main.cjs
       *
       * and preload is bundled to:
       *
       * electron-dist/preload.cjs
       */
      preload: path.join(
        __dirname,
        'preload.cjs'
      ),

      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },

    backgroundColor: '#050505',
    show: false,
  };

  let finalWindowOptions =
    windowOptions;

  if (isScreenSaver) {
    // Screen Saver Mode
    const bounds = display
      ? display.bounds
      : screen.getPrimaryDisplay().bounds;

    finalWindowOptions = {
      ...windowOptions,

      x: bounds.x,
      y: bounds.y,

      width: bounds.width,
      height: bounds.height,

      frame: false,
      fullscreen: true,
      alwaysOnTop: true,
      kiosk: true,
      skipTaskbar: true,
    };
  } else if (isConfig) {
    // Screen Saver Configuration
    finalWindowOptions = {
      ...windowOptions,

      width: 580,
      height: 720,

      resizable: false,
      minimizable: false,
      maximizable: false,

      autoHideMenuBar: true,
    };
  } else {
    // Normal Desktop Mode
    finalWindowOptions = {
      ...windowOptions,

      width: 1060,
      height: 680,

      minWidth: 540,
      minHeight: 420,

      center: true,

      autoHideMenuBar: true,

      frame: true,
    };
  }

  const win = new BrowserWindow(
    finalWindowOptions
  );

  /**
   * Query parameters
   */
  const queryParams =
    new URLSearchParams();

  if (isScreenSaver) {
    queryParams.set(
      'screensaver',
      'true'
    );
  }

  if (isConfig) {
    queryParams.set(
      'mode',
      'config'
    );
  }

  if (ssArgs?.isPreview) {
    queryParams.set(
      'preview',
      'true'
    );
  }

  const queryString =
    queryParams.toString()
      ? `?${queryParams.toString()}`
      : '';

  /**
   * Development server
   */
  const devServerUrl =
    process.env.VITE_DEV_SERVER_URL ||
    'http://localhost:3000';

  /**
   * Production React application
   */
  const prodPath = path.join(
    __dirname,
    '../dist/index.html'
  );

  /**
   * Load application
   */
  if (
    process.env.NODE_ENV ===
      'development' ||
    !app.isPackaged
  ) {
    await win.loadURL(
      `${devServerUrl}${queryString}`
    );
  } else {
    await win.loadFile(
      prodPath,
      {
        search: queryString,
      }
    );
  }

  /**
   * Show window when ready
   */
  win.once(
    'ready-to-show',
    () => {
      win.show();

      if (isScreenSaver) {
        win.focus();
      }
    }
  );

  return win;
}

/**
 * Application Lifecycle
 */

const ssArgs =
  parseCommandLineArgs(
    process.argv
  );

/**
 * Single Instance Lock
 *
 * Screen saver can use multiple
 * windows for multiple monitors.
 */
if (
  !ssArgs.isScreenSaver &&
  !ssArgs.isPreview
) {
  const gotTheLock =
    app.requestSingleInstanceLock();

  if (!gotTheLock) {
    app.quit();
    process.exit(0);
  }

  app.on(
    'second-instance',
    () => {
      const primary =
        mainWindows[0];

      if (primary) {
        if (
          primary.isMinimized()
        ) {
          primary.restore();
        }

        primary.show();
        primary.focus();
      }
    }
  );
}

/**
 * Electron Ready
 */
app.whenReady().then(
  async () => {

    /**
     * Battery
     */
    ipcMain.handle(
      'get-battery-status',
      async () => {
        return getWindowsBatteryInfo();
      }
    );

    /**
     * Settings
     */
    ipcMain.handle(
      'get-settings',
      async () => {
        return loadLocalSettings();
      }
    );

    /**
     * Save Settings
     */
    ipcMain.handle(
      'save-settings',
      async (
        _event,
        settings
      ) => {
        return saveLocalSettings(
          settings
        );
      }
    );

    /**
     * Toggle Fullscreen
     */
    ipcMain.handle(
      'toggle-fullscreen',
      async (event) => {
        const win =
          BrowserWindow.fromWebContents(
            event.sender
          );

        if (!win) {
          return false;
        }

        const nextState =
          !win.isFullScreen();

        win.setFullScreen(
          nextState
        );

        return nextState;
      }
    );

    /**
     * Check Fullscreen
     */
    ipcMain.handle(
      'is-fullscreen',
      async (event) => {
        const win =
          BrowserWindow.fromWebContents(
            event.sender
          );

        return win
          ? win.isFullScreen()
          : false;
      }
    );

    /**
     * Wake Lock
     */
    ipcMain.handle(
      'set-wake-lock',
      async (
        _event,
        enable: boolean
      ) => {

        if (enable) {

          if (
            wakeLockId === null
          ) {
            wakeLockId =
              powerSaveBlocker.start(
                'prevent-display-sleep'
              );
          }

        } else {

          if (
            wakeLockId !== null
          ) {
            powerSaveBlocker.stop(
              wakeLockId
            );

            wakeLockId = null;
          }
        }

        return true;
      }
    );

    /**
     * Startup State
     */
    ipcMain.handle(
      'get-startup',
      async () => {
        return getStartupState();
      }
    );

    /**
     * Toggle Startup
     */
    ipcMain.handle(
      'set-startup',
      async (
        _event,
        enable: boolean
      ) => {
        return toggleStartupState(
          enable
        );
      }
    );

    /**
     * Exit Screen Saver
     */
    ipcMain.on(
      'exit-screensaver',
      () => {
        app.quit();
      }
    );

    /**
     * Close Application
     */
    ipcMain.on(
      'close-app',
      () => {
        app.quit();
      }
    );

    /**
     * Launch Screen Saver
     * on all monitors
     */
    if (
      ssArgs.isScreenSaver
    ) {

      const displays =
        screen.getAllDisplays();

      for (
        const display of displays
      ) {

        const win =
          await createWindow(
            display,
            ssArgs
          );

        mainWindows.push(win);
      }

    } else {

      /**
       * Normal FLIPLY Desktop App
       */
      const win =
        await createWindow(
          undefined,
          ssArgs
        );

      mainWindows.push(win);

      /**
       * System Tray
       */
      createTray(
        win,
        () => {
          win.webContents.send(
            'open-settings'
          );
        }
      );
    }

    /**
     * macOS activation
     */
    app.on(
      'activate',
      async () => {

        if (
          BrowserWindow.getAllWindows()
            .length === 0
        ) {

          const win =
            await createWindow(
              undefined,
              ssArgs
            );

          mainWindows.push(win);
        }
      }
    );
  }
);

/**
 * Close all windows
 */
app.on(
  'window-all-closed',
  () => {

    if (
      process.platform !==
      'darwin'
    ) {
      app.quit();
    }
  }
);
