/**
 * FLIPLY — Clock & Utility Functions
 */

import {
  BatteryDisplayState,
  ClockFormat,
  ClockSettings,
  ClockTime,
  DateElement,
  DateFormatOption,
  DatePresetId,
  DateSeparator,
  DayFormat,
  MonthFormat,
  PlatformType,
  ThemeId,
  YearFormat,
} from '../types';

export const DEFAULT_SETTINGS: ClockSettings = {
  format: '24h',
  showSeconds: true,
  showDate: true, // Master toggle for date display
  // Date & Day Master Toggles (Defaults per Rule 13: All ON)
  showDay: true,
  showDateNumber: true,
  showMonth: true,
  showYear: true,
  // Default layout: Day • Date Month • Year (THURSDAY • 10 SEPTEMBER • 2026)
  datePreset: 'E',
  customDateOrder: ['day', 'date', 'month', 'year'],
  dateSeparator: '•',
  dayFormat: 'MONDAY',
  monthFormat: 'SEPTEMBER',
  dateFormat: '10',
  yearFormat: '2026',
  // Appearance
  theme: 'pure-dark',
  clockSize: 'xl',
  flipSpeed: 'normal',
  digitSpacing: 14,
  separator: ':',
  customBgColor: null,
  customDigitColor: null,
  showBattery: true,
  showChargingIndicator: true,
  showPowerSavingIndicator: true,
  keepScreenAwake: true,
  startWithWindows: false,
};

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  bg: string;
  cardBg: string;
  divider: string;
  textColor: string;
  textShadow: string;
  border: string;
  accent: string;
  subtle: string;
}

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  'pure-dark': {
    id: 'pure-dark',
    name: 'Pure Dark',
    bg: '#050505',
    cardBg: '#141414',
    divider: '#000000',
    textColor: '#ededed',
    textShadow: 'rgba(0, 0, 0, 0.7)',
    border: 'rgba(255, 255, 255, 0.05)',
    accent: '#ffffff',
    subtle: '#666666',
  },
  'dark': {
    id: 'dark',
    name: 'Dark',
    bg: '#0f1117',
    cardBg: '#1c202a',
    divider: '#0b0d13',
    textColor: '#f1f5f9',
    textShadow: 'rgba(0, 0, 0, 0.6)',
    border: 'rgba(255, 255, 255, 0.08)',
    accent: '#cbd5e1',
    subtle: '#788296',
  },
  'light': {
    id: 'light',
    name: 'Light',
    bg: '#f5f5f4',
    cardBg: '#e7e5e4',
    divider: '#d6d3d1',
    textColor: '#1c1917',
    textShadow: 'rgba(255, 255, 255, 0.6)',
    border: 'rgba(0, 0, 0, 0.08)',
    accent: '#292524',
    subtle: '#78716c',
  },
  'green': {
    id: 'green',
    name: 'Green',
    bg: '#07120c',
    cardBg: '#112217',
    divider: '#040b07',
    textColor: '#76e4a2',
    textShadow: 'rgba(0, 0, 0, 0.8)',
    border: 'rgba(118, 228, 162, 0.12)',
    accent: '#a7f3d0',
    subtle: '#3b7754',
  },
  'blue': {
    id: 'blue',
    name: 'Blue',
    bg: '#070f1a',
    cardBg: '#101d31',
    divider: '#040911',
    textColor: '#70bcf8',
    textShadow: 'rgba(0, 0, 0, 0.8)',
    border: 'rgba(112, 188, 248, 0.12)',
    accent: '#bae6fd',
    subtle: '#3d6c96',
  },
  'red': {
    id: 'red',
    name: 'Red',
    bg: '#140809',
    cardBg: '#261214',
    divider: '#0a0304',
    textColor: '#f87171',
    textShadow: 'rgba(0, 0, 0, 0.8)',
    border: 'rgba(248, 113, 113, 0.12)',
    accent: '#fecaca',
    subtle: '#883a3c',
  },
  'orange': {
    id: 'orange',
    name: 'Orange',
    bg: '#140c07',
    cardBg: '#271910',
    divider: '#0a0502',
    textColor: '#fb923c',
    textShadow: 'rgba(0, 0, 0, 0.8)',
    border: 'rgba(251, 146, 60, 0.12)',
    accent: '#fed7aa',
    subtle: '#8e4e24',
  },
  'yellow': {
    id: 'yellow',
    name: 'Yellow',
    bg: '#141206',
    cardBg: '#26220f',
    divider: '#0a0902',
    textColor: '#facc15',
    textShadow: 'rgba(0, 0, 0, 0.8)',
    border: 'rgba(250, 204, 21, 0.12)',
    accent: '#fef08a',
    subtle: '#847420',
  },
  'purple': {
    id: 'purple',
    name: 'Purple',
    bg: '#0f0817',
    cardBg: '#20122e',
    divider: '#07030c',
    textColor: '#c084fc',
    textShadow: 'rgba(0, 0, 0, 0.8)',
    border: 'rgba(192, 132, 252, 0.12)',
    accent: '#e9d5ff',
    subtle: '#693f92',
  },
  'pink': {
    id: 'pink',
    name: 'Pink',
    bg: '#140810',
    cardBg: '#281322',
    divider: '#0a0307',
    textColor: '#f472b6',
    textShadow: 'rgba(0, 0, 0, 0.8)',
    border: 'rgba(244, 114, 182, 0.12)',
    accent: '#fbcfe8',
    subtle: '#8d3b68',
  },
};

/**
 * Format hours for 12H or 24H mode
 * In 12H: midnight (00:00) -> 12, noon (12:00) -> 12, 13:00 -> 01
 */
export function formatHours(date: Date, format: ClockFormat): { hours: string; isPM: boolean } {
  const rawHours = date.getHours();
  const isPM = rawHours >= 12;

  if (format === '24h') {
    return {
      hours: rawHours.toString().padStart(2, '0'),
      isPM,
    };
  }

  // 12-hour clock:
  // 0 -> 12 AM
  // 1-11 -> 1-11 AM
  // 12 -> 12 PM
  // 13-23 -> 1-11 PM
  let h = rawHours % 12;
  if (h === 0) h = 12;
  return {
    hours: h.toString().padStart(2, '0'),
    isPM,
  };
}

/**
 * Split a two-digit string into individual digits ['1', '2']
 */
export function splitDigits(value: string): [string, string] {
  const padded = value.padStart(2, '0');
  return [padded[0], padded[1]];
}

export interface DatePresetDefinition {
  id: DatePresetId;
  name: string;
  example: string;
  defaultSeparator: DateSeparator;
}

export const DATE_PRESETS: DatePresetDefinition[] = [
  { id: 'A', name: 'Day, Month Date, Year', example: 'Thursday, September 10, 2026', defaultSeparator: ',' },
  { id: 'B', name: 'Day, Date Month, Year', example: 'Thursday, 10 September 2026', defaultSeparator: ',' },
  { id: 'C', name: 'Date Month Year', example: '10 September 2026', defaultSeparator: 'space' },
  { id: 'D', name: 'Month Date Year', example: 'September 10, 2026', defaultSeparator: ',' },
  { id: 'E', name: 'Day • Date Month • Year', example: 'Thursday • 10 September • 2026', defaultSeparator: '•' },
  { id: 'F', name: 'Day • Month Date • Year', example: 'Thursday • September 10 • 2026', defaultSeparator: '•' },
  { id: 'G', name: 'Date • Month • Year', example: '10 • September • 2026', defaultSeparator: '•' },
  { id: 'H', name: 'Year • Month • Date', example: '2026 • September • 10', defaultSeparator: '•' },
  { id: 'I', name: 'Year • Date • Month', example: '2026 • 10 • September', defaultSeparator: '•' },
  { id: 'J', name: 'Day • Date • Month • Year', example: 'Thursday • 10 • September • 2026', defaultSeparator: '•' },
  { id: 'custom', name: 'Custom Layout', example: 'Choose custom order & separator', defaultSeparator: '•' },
];

export const COMMON_CUSTOM_ORDERS: { label: string; order: DateElement[] }[] = [
  { label: 'Day → Date → Month → Year', order: ['day', 'date', 'month', 'year'] },
  { label: 'Day → Month → Date → Year', order: ['day', 'month', 'date', 'year'] },
  { label: 'Date → Month → Year', order: ['date', 'month', 'year', 'day'] },
  { label: 'Month → Date → Year', order: ['month', 'date', 'year', 'day'] },
  { label: 'Year → Month → Date', order: ['year', 'month', 'date', 'day'] },
  { label: 'Year → Date → Month', order: ['year', 'date', 'month', 'day'] },
  { label: 'Date → Day → Month → Year', order: ['date', 'day', 'month', 'year'] },
  { label: 'Month → Day → Date → Year', order: ['month', 'day', 'date', 'year'] },
];

/**
 * Returns ordinal suffix for day number (1st, 2nd, 3rd, 10th, 21st, etc.)
 */
export function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

/**
 * Format Day of the week name
 */
export function formatDayName(date: Date, format: DayFormat): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const name = days[date.getDay()];
  switch (format) {
    case 'Monday':
      return name;
    case 'MONDAY':
      return name.toUpperCase();
    case 'Mon':
      return name.slice(0, 3);
    case 'MON':
      return name.slice(0, 3).toUpperCase();
    case 'Mon.':
      return `${name.slice(0, 3)}.`;
    case 'M':
      return name[0].toUpperCase();
    default:
      return name;
  }
}

/**
 * Format Month name
 */
export function formatMonthName(date: Date, format: MonthFormat): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const name = months[date.getMonth()];
  switch (format) {
    case 'September':
      return name;
    case 'SEPTEMBER':
      return name.toUpperCase();
    case 'Sep':
      return name.slice(0, 3);
    case 'SEP':
      return name.slice(0, 3).toUpperCase();
    case 'Sep.':
      return `${name.slice(0, 3)}.`;
    default:
      return name;
  }
}

/**
 * Format Date (day of month) number
 */
export function formatDateNumber(date: Date, format: DateFormatOption): string {
  const d = date.getDate();
  switch (format) {
    case '10':
      return d.toString();
    case '10th':
      return getOrdinalSuffix(d);
    case '10.':
      return `${d}.`;
    default:
      return d.toString();
  }
}

/**
 * Format Year number
 */
export function formatYearNumber(date: Date, format: YearFormat): string {
  const y = date.getFullYear();
  switch (format) {
    case '2026':
      return y.toString();
    case "'26":
      return `'${y.toString().slice(-2)}`;
    default:
      return y.toString();
  }
}

/**
 * Return separator join string
 */
export function getDateSeparatorChar(separator: DateSeparator): string {
  switch (separator) {
    case ',':
      return ', ';
    case '•':
      return ' • ';
    case '·':
      return ' · ';
    case '|':
      return ' | ';
    case '-':
      return ' - ';
    case '/':
      return ' / ';
    case 'space':
      return ' ';
    case 'none':
      return '';
    default:
      return ' • ';
  }
}

/**
 * Format date according to user custom settings, preset, order, format, and separator.
 */
export function formatCustomDate(date: Date, settings: ClockSettings): string {
  const {
    showDate,
    showDay,
    showDateNumber,
    showMonth,
    showYear,
    datePreset,
    customDateOrder,
    dateSeparator,
    dayFormat,
    monthFormat,
    dateFormat,
    yearFormat,
  } = settings;

  // Master switch
  if (!showDate) return '';
  // Check if at least one element is enabled
  if (!showDay && !showDateNumber && !showMonth && !showYear) return '';

  const dayStr = showDay ? formatDayName(date, dayFormat) : '';
  const dateStr = showDateNumber ? formatDateNumber(date, dateFormat) : '';
  const monthStr = showMonth ? formatMonthName(date, monthFormat) : '';
  const yearStr = showYear ? formatYearNumber(date, yearFormat) : '';

  const sep = getDateSeparatorChar(dateSeparator);

  // Custom Order
  if (datePreset === 'custom') {
    const parts: string[] = [];
    for (const elem of customDateOrder) {
      if (elem === 'day' && dayStr) parts.push(dayStr);
      if (elem === 'date' && dateStr) parts.push(dateStr);
      if (elem === 'month' && monthStr) parts.push(monthStr);
      if (elem === 'year' && yearStr) parts.push(yearStr);
    }
    return parts.join(sep);
  }

  // Presets A - J
  switch (datePreset) {
    case 'A': {
      // Day, Month Date, Year (e.g. Thursday, September 10, 2026)
      const monthDate = [monthStr, dateStr].filter(Boolean).join(' ');
      const groups = [dayStr, monthDate, yearStr].filter(Boolean);
      const joiner = dateSeparator === ',' ? ', ' : sep;
      return groups.join(joiner);
    }
    case 'B': {
      // Day, Date Month, Year (e.g. Thursday, 10 September 2026)
      const dateMonth = [dateStr, monthStr].filter(Boolean).join(' ');
      if (dateSeparator === ',') {
        const parts: string[] = [];
        if (dayStr) parts.push(`${dayStr},`);
        if (dateMonth) parts.push(dateMonth);
        if (yearStr) parts.push(yearStr);
        return parts.join(' ');
      }
      const groups = [dayStr, dateMonth, yearStr].filter(Boolean);
      return groups.join(sep);
    }
    case 'C': {
      // Date Month Year (e.g. 10 September 2026)
      const parts = [dateStr, monthStr, yearStr].filter(Boolean);
      return parts.join(dateSeparator === 'space' ? ' ' : sep);
    }
    case 'D': {
      // Month Date Year (e.g. September 10, 2026)
      const monthDate = [monthStr, dateStr].filter(Boolean).join(' ');
      if (dateSeparator === ',') {
        return [monthDate, yearStr].filter(Boolean).join(', ');
      }
      return [monthDate, yearStr].filter(Boolean).join(sep);
    }
    case 'E': {
      // Day • Date Month • Year (e.g. Thursday • 10 September • 2026)
      const dateMonth = [dateStr, monthStr].filter(Boolean).join(' ');
      const groups = [dayStr, dateMonth, yearStr].filter(Boolean);
      return groups.join(sep);
    }
    case 'F': {
      // Day • Month Date • Year (e.g. Thursday • September 10 • 2026)
      const monthDate = [monthStr, dateStr].filter(Boolean).join(' ');
      const groups = [dayStr, monthDate, yearStr].filter(Boolean);
      return groups.join(sep);
    }
    case 'G': {
      // Date • Month • Year (e.g. 10 • September • 2026)
      const parts = [dateStr, monthStr, yearStr].filter(Boolean);
      return parts.join(sep);
    }
    case 'H': {
      // Year • Month • Date (e.g. 2026 • September • 10)
      const parts = [yearStr, monthStr, dateStr].filter(Boolean);
      return parts.join(sep);
    }
    case 'I': {
      // Year • Date • Month (e.g. 2026 • 10 • September)
      const parts = [yearStr, dateStr, monthStr].filter(Boolean);
      return parts.join(sep);
    }
    case 'J': {
      // Day • Date • Month • Year (e.g. Thursday • 10 • September • 2026)
      const parts = [dayStr, dateStr, monthStr, yearStr].filter(Boolean);
      return parts.join(sep);
    }
    default: {
      const parts = [dayStr, dateStr, monthStr, yearStr].filter(Boolean);
      return parts.join(sep);
    }
  }
}

/**
 * Extract complete clock time object from date
 */
export function getClockTime(date: Date, format: ClockFormat): ClockTime {
  const { hours, isPM } = formatHours(date, format);
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dayName = days[date.getDay()];
  const monthName = months[date.getMonth()];
  const shortMonth = shortMonths[date.getMonth()];
  const dayNum = date.getDate();
  const year = date.getFullYear();

  return {
    hours,
    minutes,
    seconds,
    isPM,
    rawDate: date,
    dateFormatted: `${dayName}, ${monthName} ${dayNum}, ${year}`,
    compactDateFormatted: `${dayName}, ${shortMonth} ${dayNum}`,
  };
}

/**
 * Detect runtime platform safely for terminology and UX defaults.
 * Does NOT guess power saving state, only platform identity.
 */
export function detectPlatform(): PlatformType {
  if (typeof navigator === 'undefined') return 'other';
  const ua = (navigator.userAgent || '').toLowerCase();
  const platform = (
    (navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData?.platform ||
    navigator.platform ||
    ''
  ).toLowerCase();

  if (platform.includes('mac') || ua.includes('macintosh') || ua.includes('mac os')) {
    return 'macos';
  }
  if (platform.includes('win') || ua.includes('windows')) {
    return 'windows';
  }
  if (platform.includes('linux') || ua.includes('linux')) {
    return 'linux';
  }
  return 'other';
}

/**
 * Return platform-appropriate power saving label when active.
 * Windows Laptop: "Battery Saver" (or "Energy Saver")
 * Mac: "Low Power Mode"
 * Desktop: "Energy Saver" / "Eco Mode"
 */
export function getDefaultPowerSavingLabel(
  platform?: PlatformType | string,
  hasBattery: boolean = true
): string {
  if (platform === 'macos') {
    return 'Low Power Mode';
  }
  if (!hasBattery) {
    return 'Energy Saver';
  }
  return 'Battery Saver';
}

/**
 * Round battery level to nearest whole integer percentage (0 - 100).
 * Handles both decimal (0.0 - 1.0) and percentage (0 - 100).
 * Returns empty string if level is null or undefined (e.g. desktop PC without battery).
 */
export function formatBatteryPercentage(level: number | null | undefined): string {
  if (level === null || level === undefined || isNaN(level)) {
    return '';
  }
  const normalized = level <= 1 && level > 0 ? level * 100 : level;
  const rounded = Math.max(0, Math.min(100, Math.round(normalized)));
  return `${rounded}%`;
}

export interface BatteryVisualOptions {
  charging: boolean;
  powerSaving?: boolean | null;
  hasBattery?: boolean;
  platform?: PlatformType | string;
  powerSavingLabel?: string;
  showBattery?: boolean;
  showChargingIndicator?: boolean;
  showPowerSavingIndicator?: boolean;
  displayState?: BatteryDisplayState;
  previewOverride?: BatteryDisplayState | null;
}

export interface BatteryVisualResult {
  visible: boolean;
  state: 'charging' | 'power-saving' | 'normal';
  color: string;
  hasLightning: boolean;
  isEcoIcon: boolean;
  labelText?: string;
  showChargingText: boolean;
}

/**
 * Determine battery & power visual state based on device type, platform, and strict priority:
 *
 * Priority: Charging > Power Saving > Normal
 *
 * Devices with Battery (hasBattery = true):
 * - IF charging: GREEN battery + lightning + "Charging"
 * - ELSE IF powerSaving: YELLOW/AMBER battery + platform label ("Battery Saver", "Low Power Mode", "Energy Saver")
 * - ELSE: WHITE/GRAY battery + percentage
 *
 * Devices without Battery (hasBattery = false, Desktop PC):
 * - IF powerSaving: ENERGY ICON + platform label ("Energy Saver", "Eco Mode")
 * - ELSE: Hide indicator completely (no fake battery percentage)
 */
export function getBatteryVisualState(
  optionsOrCharging: boolean | BatteryVisualOptions,
  powerSavingParam?: boolean | null,
  hasBatteryParam: boolean = true,
  platformParam?: PlatformType | string,
  powerSavingLabelParam?: string,
  showChargingIndicatorParam: boolean = true,
  showPowerSavingIndicatorParam: boolean = true
): BatteryVisualResult {
  const options: BatteryVisualOptions =
    typeof optionsOrCharging === 'object' && optionsOrCharging !== null
      ? optionsOrCharging
      : {
          charging: Boolean(optionsOrCharging),
          powerSaving: powerSavingParam,
          hasBattery: hasBatteryParam,
          platform: platformParam,
          powerSavingLabel: powerSavingLabelParam,
          showChargingIndicator: showChargingIndicatorParam,
          showPowerSavingIndicator: showPowerSavingIndicatorParam,
          showBattery: true,
        };

  const {
    charging,
    powerSaving,
    hasBattery = true,
    platform,
    powerSavingLabel,
    showBattery = true,
    showChargingIndicator = true,
    showPowerSavingIndicator = true,
    displayState,
    previewOverride,
  } = options;

  if (showBattery === false) {
    return {
      visible: false,
      state: 'normal',
      color: '#e2e8f0',
      hasLightning: false,
      isEcoIcon: false,
      showChargingText: false,
    };
  }

  // Development Preview Override
  const activeOverride = previewOverride || (displayState && ['normal', 'charging', 'powersaving'].includes(displayState) ? displayState : null);
  if (activeOverride) {
    if (activeOverride === 'charging') {
      return {
        visible: true,
        state: 'charging',
        color: '#22c55e', // Green
        hasLightning: true,
        isEcoIcon: false,
        labelText: 'Charging',
        showChargingText: true,
      };
    }
    if (activeOverride === 'powersaving') {
      return {
        visible: true,
        state: 'power-saving',
        color: '#f59e0b', // Yellow / Amber
        hasLightning: false,
        isEcoIcon: false,
        labelText: powerSavingLabel || 'Battery Saver',
        showChargingText: false,
      };
    }
    if (activeOverride === 'normal') {
      return {
        visible: true,
        state: 'normal',
        color: '#e2e8f0', // Crisp light-gray / white
        hasLightning: false,
        isEcoIcon: false,
        labelText: undefined,
        showChargingText: false,
      };
    }
  }

  // DESKTOP PC (No battery detected)
  if (!hasBattery) {
    // Only display if energy-saving mode is active and enabled in settings
    if (powerSaving === true && showPowerSavingIndicator) {
      const label = powerSavingLabel || 'Energy Saver';
      return {
        visible: true,
        state: 'power-saving',
        color: '#f59e0b', // Amber / Yellow energy indicator
        hasLightning: false,
        isEcoIcon: true,
        labelText: label,
        showChargingText: false,
      };
    }
    // Normal desktop mode without active power saving: hide completely (no fake battery info)
    return {
      visible: false,
      state: 'normal',
      color: '#e2e8f0',
      hasLightning: false,
      isEcoIcon: false,
      showChargingText: false,
    };
  }

  // DEVICES WITH BATTERY (Laptops, portable devices)
  // 1. Charging state has highest priority
  if (charging && showChargingIndicator) {
    return {
      visible: true,
      state: 'charging',
      color: '#22c55e', // Green
      hasLightning: true,
      isEcoIcon: false,
      labelText: 'Charging',
      showChargingText: true,
    };
  }

  // 2. Power Saving state (when not charging)
  if (powerSaving === true && showPowerSavingIndicator) {
    const label = powerSavingLabel || getDefaultPowerSavingLabel(platform, true);
    return {
      visible: true,
      state: 'power-saving',
      color: '#f59e0b', // Amber / Yellow
      hasLightning: false,
      isEcoIcon: false,
      labelText: label,
      showChargingText: false,
    };
  }

  // 3. Normal battery state
  return {
    visible: true,
    state: 'normal',
    color: '#e2e8f0', // Crisp light-gray / white
    hasLightning: false,
    isEcoIcon: false,
    labelText: undefined,
    showChargingText: false,
  };
}

/**
 * Compute real battery status and human-readable status text.
 * - When plugged in and charging: "Charging"
 * - When plugged in but full / not actively charging: "Fully Charged"
 * - When running on battery: "Not Charging"
 */
export function computeBatteryStatus(
  level: number,
  charging: boolean,
  chargingTime?: number
): { status: 'charging' | 'fully-charged' | 'not-charging'; statusText: string } {
  const roundedLevel = Math.max(0, Math.min(100, Math.round(level)));

  // Fully Charged:
  // 1. Rounded level is 100%
  // 2. Or battery is charging and chargingTime is reported as 0 by BatteryManager
  if (roundedLevel >= 100 || (charging && chargingTime === 0)) {
    return {
      status: 'fully-charged',
      statusText: 'Fully Charged',
    };
  }

  // Actively Charging:
  if (charging) {
    return {
      status: 'charging',
      statusText: 'Charging',
    };
  }

  // Running on battery / not actively charging:
  return {
    status: 'not-charging',
    statusText: 'Not Charging',
  };
}

/**
 * Format battery label honestly with percentage and real charging status
 */
export function formatBatteryText(
  available: boolean,
  level: number,
  charging: boolean,
  chargingTime?: number
): string {
  if (!available) {
    return 'Battery unavailable';
  }
  const pct = Math.max(0, Math.min(100, Math.round(level)));
  const { statusText } = computeBatteryStatus(pct, charging, chargingTime);
  return `${pct}% ${statusText}`;
}
