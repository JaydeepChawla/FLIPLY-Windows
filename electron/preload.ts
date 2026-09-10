/**
 * FLIPLY — Secure Electron Preload Script
 * Exposes only strictly whitelisted IPC methods via contextBridge.
 * Does NOT expose Node.js primitives (fs, child_process, require, process).
 */

import { contextBridge, ipcRenderer } from 'electron';
import { BatteryState, ClockSettings, ElectronAPI } from '../src/types';

// Parse query params to detect screen saver mode
const urlParams = new URLSearchParams(window.location.search);
const isScreenSaver = urlParams.get('screensaver') === 'true' || urlParams.get('mode') === 'screensaver';
const isPreview = urlParams.get('preview') === 'true';
const previewHwnd = urlParams.get('hwnd') || undefined;

const api: ElectronAPI = {
  isElectron: true,
  isScreenSaver,
  isPreview,
  previewHwnd,

  getBatteryStatus: async (): Promise<BatteryState> => {
    return ipcRenderer.invoke('get-battery-status');
  },

  getSettings: async (): Promise<ClockSettings | null> => {
    return ipcRenderer.invoke('get-settings');
  },

  saveSettings: async (settings: ClockSettings): Promise<boolean> => {
    return ipcRenderer.invoke('save-settings', settings);
  },

  toggleFullscreen: async (): Promise<boolean> => {
    return ipcRenderer.invoke('toggle-fullscreen');
  },

  isFullscreen: async (): Promise<boolean> => {
    return ipcRenderer.invoke('is-fullscreen');
  },

  setWakeLock: async (enable: boolean): Promise<boolean> => {
    return ipcRenderer.invoke('set-wake-lock', enable);
  },

  getStartup: async (): Promise<boolean> => {
    return ipcRenderer.invoke('get-startup');
  },

  setStartup: async (enable: boolean): Promise<boolean> => {
    return ipcRenderer.invoke('set-startup', enable);
  },

  exitScreenSaver: () => {
    ipcRenderer.send('exit-screensaver');
  },

  openSettingsWindow: () => {
    ipcRenderer.send('open-settings-window');
  },

  closeApp: () => {
    ipcRenderer.send('close-app');
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);

// Expose standard Fliply Native Battery Bridge
contextBridge.exposeInMainWorld('fliplyNativeBattery', {
  getStatus: async () => {
    const status: BatteryState = await ipcRenderer.invoke('get-battery-status');
    const platform =
      status.platform ||
      (process.platform === 'darwin'
        ? 'macos'
        : process.platform === 'win32'
          ? 'windows'
          : 'linux');
    return {
      platform,
      level:
        status.level === null || status.level === undefined
          ? null
          : status.level <= 1
            ? status.level
            : status.level / 100,
      charging: Boolean(status.charging),
      powerSaving: Boolean(status.powerSaving),
      powerSavingLabel: status.powerSavingLabel,
      hasBattery: Boolean(status.hasBattery),
    };
  },
});
