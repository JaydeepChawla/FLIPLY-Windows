/**
 * FLIPLY — Windows Auto-Startup Manager
 * Controls Windows registry run key via Electron's app.setLoginItemSettings
 */

import { app } from 'electron';

export async function getStartupState(): Promise<boolean> {
  try {
    const settings = app.getLoginItemSettings();
    return Boolean(settings.openAtLogin);
  } catch {
    return false;
  }
}

export async function toggleStartupState(enable: boolean): Promise<boolean> {
  try {
    app.setLoginItemSettings({
      openAtLogin: enable,
      path: process.execPath,
      args: ['--hidden'],
    });
    return enable;
  } catch {
    return false;
  }
}
