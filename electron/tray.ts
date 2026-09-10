/**
 * FLIPLY — Windows System Tray Integration
 */

import { app, BrowserWindow, Menu, Tray } from 'electron';
import path from 'path';
import { getStartupState, toggleStartupState } from './startup';

let tray: Tray | null = null;

export function createTray(mainWindow: BrowserWindow, onOpenSettings: () => void): Tray {
  if (tray) return tray;

  // Use application icon
  const iconPath = path.join(__dirname, '../public/icons/icon-32.png');
  tray = new Tray(iconPath);

  tray.setToolTip('FLIPLY — Flip Clock');

  const updateContextMenu = async () => {
    const isStartupEnabled = await getStartupState();
    const isFullscreen = mainWindow.isFullScreen();

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'FLIPLY',
        enabled: false,
      },
      { type: 'separator' },
      {
        label: 'Show FLIPLY',
        click: () => {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.show();
          mainWindow.focus();
        },
      },
      {
        label: isFullscreen ? 'Exit Fullscreen' : 'Fullscreen',
        click: () => {
          mainWindow.setFullScreen(!isFullscreen);
        },
      },
      {
        label: 'Settings',
        click: () => {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.show();
          mainWindow.focus();
          onOpenSettings();
        },
      },
      {
        label: 'Start with Windows',
        type: 'checkbox',
        checked: isStartupEnabled,
        click: async (menuItem) => {
          await toggleStartupState(menuItem.checked);
          updateContextMenu();
        },
      },
      { type: 'separator' },
      {
        label: 'Exit',
        click: () => {
          app.quit();
        },
      },
    ]);

    tray?.setContextMenu(contextMenu);
  };

  tray.on('double-click', () => {
    if (mainWindow.isVisible()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    } else {
      mainWindow.show();
    }
  });

  updateContextMenu();

  return tray;
}

export function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}
