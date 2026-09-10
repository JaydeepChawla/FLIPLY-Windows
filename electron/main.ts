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

    if (
      arg === '/s' ||
      arg === '-s' ||
      arg === '--screensaver'
    ) {
      isScreenSaver = true;
    } else if (
      arg.startsWith('/c') ||
      arg.startsWith('-c') ||
      arg === '--screensaver-config'
    ) {
      isConfig = true;
    } else if (
      arg === '/p' ||
      arg === '-p'
    ) {
      isPreview = true;

      if (i + 1 < args.length) {
        previewHwnd = args[i + 1];
        i++;
      }
    } else if (arg.startsWith('/p:')) {
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
      JSON.stringify(
        settings,
        null,
        2
      ),
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

  const windowOptions:
    Electron.BrowserWindowConstructorOptions = {

    title: 'FLIPLY — Flip Clock',

    icon: fs.existsSync(iconPath)
      ? iconPath
      : undefined,

    webPreferences: {

      // IMPORTANT:
      // Electron build creates preload.cjs
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

    const bounds =
      display
        ? display.bounds
        : screen
            .getPrimaryDisplay()
            .bounds;

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

  const win =
    new BrowserWindow(
      finalWindowOptions
    );

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

  if (ssArgs?.previewHwnd) {
    queryParams.set(
      'hwnd',
      ssArgs.previewHwnd
    );
  }

  const queryString =
    queryParams.toString()
      ? `?${queryParams.toString()}`
      : '';

  const devServerUrl =
    process.env.VITE_DEV_SERVER_URL ||
    'http://localhost:3000';

  const prodPath =
    path.join(
      __dirname,
      '../dist/index.html'
    );

  /**
   * Development
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

    /**
     * Production
     */
    await win.loadFile(
      prodPath,
      {
        search: queryString,
      }
    );
  }

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

const ssArgs =
  parseCommandLineArgs(
    process.argv
  );

/**
 * Single instance
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

  } else {

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
}

/**
 * Electron ready
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
     * Save settings
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
     * Toggle fullscreen
     */
    ipcMain.handle(
      'toggle-fullscreen',
      async (event) => {

        const win =
          BrowserWindow
            .fromWebContents(
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
     * Fullscreen state
     */
    ipcMain.handle(
      'is-fullscreen',
      async (event) => {

        const win =
          BrowserWindow
            .fromWebContents(
              event.sender
            );

        return win
          ? win.isFullScreen()
          : false;
      }
    );

    /**
     * Wake lock
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
     * Startup state
     */
    ipcMain.handle(
      'get-startup',
      async () => {
        return getStartupState();
      }
    );

    /**
     * Set startup
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
     * Exit screen saver
     */
    ipcMain.on(
      'exit-screensaver',
      () => {
        app.quit();
      }
    );

    /**
     * Close app
     */
    ipcMain.on(
      'close-app',
      () => {
        app.quit();
      }
    );

    /**
     * Create windows
     */
    if (ssArgs.isScreenSaver) {

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

      const win =
        await createWindow(
          undefined,
          ssArgs
        );

      mainWindows.push(win);

      /**
       * System tray
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
          BrowserWindow
            .getAllWindows()
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
