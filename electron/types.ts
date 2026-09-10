/**
 * FLIPLY — Electron Main Process Types
 */

import { ClockSettings } from '../src/types';

export interface WindowsBatteryInfo {
  available: boolean;
  hasBattery: boolean;
  platform?: 'windows' | 'macos' | 'linux' | 'other';
  level: number | null;
  charging: boolean;
  powerSaving?: boolean;
  powerSavingLabel?: string;
  status?: 'charging' | 'fully-charged' | 'not-charging';
  statusText?: string;
}

export interface ScreenSaverArgs {
  isScreenSaver: boolean;
  isPreview: boolean;
  isConfig: boolean;
  previewHwnd?: string;
}

export type SettingsStore = ClockSettings;
