/**
 * FLIPLY — Type Definitions
 */

export type ClockFormat = '12h' | '24h';

export type ThemeId =
  | 'pure-dark'
  | 'dark'
  | 'light'
  | 'green'
  | 'blue'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'purple'
  | 'pink';

export type ClockSize = 'sm' | 'md' | 'lg' | 'xl';

export type FlipSpeed = 'slow' | 'normal' | 'fast';

export type ClockSeparator = ':' | '·' | 'blank';

export type DatePresetId =
  | 'A' // Day, Month Date, Year
  | 'B' // Day, Date Month, Year
  | 'C' // Date Month Year
  | 'D' // Month Date Year
  | 'E' // Day • Date Month • Year (Default)
  | 'F' // Day • Month Date • Year
  | 'G' // Date • Month • Year
  | 'H' // Year • Month • Date
  | 'I' // Year • Date • Month
  | 'J' // Day • Date • Month • Year
  | 'custom'; // Custom Order

export type DateElement = 'day' | 'date' | 'month' | 'year';

export type DateSeparator = ',' | '•' | '·' | '|' | '-' | '/' | 'space' | 'none';

export type DayFormat = 'Monday' | 'MONDAY' | 'Mon' | 'MON' | 'Mon.' | 'M';

export type MonthFormat = 'September' | 'SEPTEMBER' | 'Sep' | 'SEP' | 'Sep.';

export type DateFormatOption = '10' | '10th' | '10.';

export type YearFormat = '2026' | "'26";

export interface ClockSettings {
  format: ClockFormat;
  showSeconds: boolean;
  showDate: boolean; // Master toggle for date display
  // Date & Day Master Toggles
  showDay: boolean; // Show Day (e.g. Thursday)
  showDateNumber: boolean; // Show Date (e.g. 10)
  showMonth: boolean; // Show Month (e.g. September)
  showYear: boolean; // Show Year (e.g. 2026)
  // Date & Day Order & Formatting
  datePreset: DatePresetId;
  customDateOrder: DateElement[];
  dateSeparator: DateSeparator;
  dayFormat: DayFormat;
  monthFormat: MonthFormat;
  dateFormat: DateFormatOption;
  yearFormat: YearFormat;
  // Appearance & Clock
  theme: ThemeId;
  clockSize: ClockSize;
  flipSpeed: FlipSpeed;
  digitSpacing: number; // in pixels (4 - 40)
  separator: ClockSeparator;
  customBgColor: string | null;
  customDigitColor: string | null;
  showBattery: boolean; // Show Battery / Power Status
  showChargingIndicator: boolean; // Charging Indicator ON / OFF
  showPowerSavingIndicator: boolean; // Power Saving Indicator ON / OFF
  keepScreenAwake: boolean;
  startWithWindows: boolean;
}

export type PlatformType = 'windows' | 'macos' | 'linux' | 'other';

export type BatteryStatusType = 'charging' | 'fully-charged' | 'not-charging';

export type BatteryDisplayState = 'normal' | 'charging' | 'powersaving';

export interface BatteryState {
  available: boolean;
  hasBattery: boolean;
  platform?: PlatformType | string;
  level: number | null; // 0 to 100, or null if desktop without battery
  charging: boolean;
  powerSaving?: boolean | null;
  powerSavingLabel?: string; // "Battery Saver" | "Energy Saver" | "Low Power Mode" | "Eco Mode"
  chargingTime?: number;
  dischargingTime?: number;
  status?: BatteryStatusType;
  statusText?: string;
  displayState: BatteryDisplayState;
  previewOverride: BatteryDisplayState | null;
  setPreviewOverride?: (state: BatteryDisplayState | null) => void;
}

export interface FliplyNativeBatteryData {
  level: number; // e.g. 0.78
  charging: boolean;
  powerSaving: boolean;
  powerSavingLabel: string;
  hasBattery: boolean;
  platform?: PlatformType | string;
}

export interface FliplyNativeBatteryBridge {
  getStatus: () => Promise<FliplyNativeBatteryData> | FliplyNativeBatteryData;
  addEventListener?: (type: string, listener: (event?: unknown) => void) => void;
  removeEventListener?: (type: string, listener: (event?: unknown) => void) => void;
  onchange?: ((event?: unknown) => void) | null;
}

export interface ClockTime {
  hours: string;
  minutes: string;
  seconds: string;
  isPM: boolean;
  rawDate: Date;
  dateFormatted: string;
  compactDateFormatted: string;
}

export interface ElectronAPI {
  isElectron: boolean;
  isScreenSaver: boolean;
  isPreview?: boolean;
  previewHwnd?: string;
  getBatteryStatus: () => Promise<BatteryState>;
  getSettings: () => Promise<ClockSettings | null>;
  saveSettings: (settings: ClockSettings) => Promise<boolean>;
  toggleFullscreen: () => Promise<boolean>;
  isFullscreen: () => Promise<boolean>;
  setWakeLock: (enable: boolean) => Promise<boolean>;
  getStartup: () => Promise<boolean>;
  setStartup: (enable: boolean) => Promise<boolean>;
  exitScreenSaver: () => void;
  openSettingsWindow: () => void;
  closeApp: () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    fliplyNativeBattery?: FliplyNativeBatteryBridge;
    fliplyTestBatteryState?: (mode: string, label?: string, level?: number) => void;
    fliplyResetBatteryPreview?: () => void;
  }
}
