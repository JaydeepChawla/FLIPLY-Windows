/**
 * FLIPLY — Automated Test Suite
 * Tests time formatting, 12H/24H conversion, midnight, noon, and edge cases.
 * Run with: node scripts/test-clock.js
 */

import assert from 'assert';

// 1. Hours Formatting Logic Test
function formatHours(date, format) {
  const rawHours = date.getHours();
  const isPM = rawHours >= 12;

  if (format === '24h') {
    return {
      hours: rawHours.toString().padStart(2, '0'),
      isPM,
    };
  }

  let h = rawHours % 12;
  if (h === 0) h = 12;
  return {
    hours: h.toString().padStart(2, '0'),
    isPM,
  };
}

function splitDigits(val) {
  const p = val.padStart(2, '0');
  return [p[0], p[1]];
}

function computeBatteryStatus(level, charging, chargingTime) {
  const roundedLevel = Math.max(0, Math.min(100, Math.round(level)));
  if (roundedLevel >= 100 || (charging && chargingTime === 0)) {
    return { status: 'fully-charged', statusText: 'Fully Charged' };
  }
  if (charging) {
    return { status: 'charging', statusText: 'Charging' };
  }
  return { status: 'not-charging', statusText: 'Not Charging' };
}

function formatBatteryText(available, level, charging, chargingTime) {
  if (!available) return 'Battery unavailable';
  const pct = Math.max(0, Math.min(100, Math.round(level)));
  const { statusText } = computeBatteryStatus(pct, charging, chargingTime);
  return `${pct}% ${statusText}`;
}

function getBatteryVisualState(optionsOrCharging, powerSavingParam, hasBatteryParam = true, platformParam, powerSavingLabelParam, showChargingIndicatorParam = true, showPowerSavingIndicatorParam = true) {
  const options = typeof optionsOrCharging === 'object' && optionsOrCharging !== null
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
        color: '#22c55e',
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
        color: '#f59e0b',
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
        color: '#e2e8f0',
        hasLightning: false,
        isEcoIcon: false,
        labelText: undefined,
        showChargingText: false,
      };
    }
  }

  // DESKTOP PC (No battery detected)
  if (!hasBattery) {
    if (powerSaving === true && showPowerSavingIndicator) {
      return {
        visible: true,
        state: 'power-saving',
        color: '#f59e0b',
        hasLightning: false,
        isEcoIcon: true,
        labelText: powerSavingLabel || 'Energy Saver',
        showChargingText: false,
      };
    }
    return {
      visible: false,
      state: 'normal',
      color: '#e2e8f0',
      hasLightning: false,
      isEcoIcon: false,
      showChargingText: false,
    };
  }

  // DEVICES WITH BATTERY
  if (charging && showChargingIndicator) {
    return {
      visible: true,
      state: 'charging',
      color: '#22c55e',
      hasLightning: true,
      isEcoIcon: false,
      labelText: 'Charging',
      showChargingText: true,
    };
  }

  if (powerSaving === true && showPowerSavingIndicator) {
    const label = powerSavingLabel || (platform === 'macos' ? 'Low Power Mode' : 'Battery Saver');
    return {
      visible: true,
      state: 'power-saving',
      color: '#f59e0b',
      hasLightning: false,
      isEcoIcon: false,
      labelText: label,
      showChargingText: false,
    };
  }

  return {
    visible: true,
    state: 'normal',
    color: '#e2e8f0',
    hasLightning: false,
    isEcoIcon: false,
    labelText: undefined,
    showChargingText: false,
  };
}

console.log('Running FLIPLY Test Suite...\n');

let passed = 0;
let total = 0;

function it(desc, fn) {
  total++;
  try {
    fn();
    console.log(`  ✓ ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${desc}`);
    console.error(`    ${err.message}`);
  }
}

// Tests
it('handles Midnight (00:00) in 24H format -> "00"', () => {
  const date = new Date(2026, 8, 10, 0, 0, 0);
  const res = formatHours(date, '24h');
  assert.strictEqual(res.hours, '00');
  assert.strictEqual(res.isPM, false);
});

it('handles Midnight (00:00) in 12H format -> "12" AM', () => {
  const date = new Date(2026, 8, 10, 0, 0, 0);
  const res = formatHours(date, '12h');
  assert.strictEqual(res.hours, '12');
  assert.strictEqual(res.isPM, false);
});

it('handles Noon (12:00) in 24H format -> "12"', () => {
  const date = new Date(2026, 8, 10, 12, 0, 0);
  const res = formatHours(date, '24h');
  assert.strictEqual(res.hours, '12');
  assert.strictEqual(res.isPM, true);
});

it('handles Noon (12:00) in 12H format -> "12" PM', () => {
  const date = new Date(2026, 8, 10, 12, 0, 0);
  const res = formatHours(date, '12h');
  assert.strictEqual(res.hours, '12');
  assert.strictEqual(res.isPM, true);
});

it('handles 11:59:59 PM transitioning to Midnight 00:00:00', () => {
  const before = new Date(2026, 8, 10, 23, 59, 59);
  const after = new Date(2026, 8, 11, 0, 0, 0);

  const res1 = formatHours(before, '12h');
  const res2 = formatHours(after, '12h');

  assert.strictEqual(res1.hours, '11');
  assert.strictEqual(res1.isPM, true);

  assert.strictEqual(res2.hours, '12');
  assert.strictEqual(res2.isPM, false);
});

it('handles 11:59:59 AM transitioning to Noon 12:00:00 PM', () => {
  const before = new Date(2026, 8, 10, 11, 59, 59);
  const after = new Date(2026, 8, 10, 12, 0, 0);

  const res1 = formatHours(before, '12h');
  const res2 = formatHours(after, '12h');

  assert.strictEqual(res1.hours, '11');
  assert.strictEqual(res1.isPM, false);

  assert.strictEqual(res2.hours, '12');
  assert.strictEqual(res2.isPM, true);
});

it('correctly splits digits into pairs with leading zero padding', () => {
  assert.deepStrictEqual(splitDigits('7'), ['0', '7']);
  assert.deepStrictEqual(splitDigits('42'), ['4', '2']);
  assert.deepStrictEqual(splitDigits('00'), ['0', '0']);
});

it('formats real battery and handles battery unavailable honestly', () => {
  assert.strictEqual(formatBatteryText(false, 0, false), 'Battery unavailable');
  // Example 1: Laptop plugged in and charging: 92% Charging
  assert.strictEqual(formatBatteryText(true, 92, true), '92% Charging');
  // Example 2: Laptop plugged in but battery full / not actively charging: 100% Fully Charged
  assert.strictEqual(formatBatteryText(true, 100, true), '100% Fully Charged');
  assert.strictEqual(formatBatteryText(true, 100, false), '100% Fully Charged');
  assert.strictEqual(formatBatteryText(true, 99.8, true, 0), '100% Fully Charged');
  // Example 3: Laptop running on battery: 92% Not Charging
  assert.strictEqual(formatBatteryText(true, 92, false), '92% Not Charging');
  assert.strictEqual(formatBatteryText(true, 42, false), '42% Not Charging');
});

it('strictly enforces Windows 11 battery priority: charging > powerSaving > normal', () => {
  // 1. Normal: charging = false, powerSaving = false
  const normal = getBatteryVisualState(false, false);
  assert.strictEqual(normal.state, 'normal');
  assert.strictEqual(normal.color, '#e2e8f0');
  assert.strictEqual(normal.hasLightning, false);
  assert.strictEqual(normal.showChargingText, false);

  // 2. Battery Saver: charging = false, powerSaving = true
  const powerSaving = getBatteryVisualState(false, true);
  assert.strictEqual(powerSaving.state, 'power-saving');
  assert.strictEqual(powerSaving.color, '#f59e0b');
  assert.strictEqual(powerSaving.hasLightning, false);
  assert.strictEqual(powerSaving.showChargingText, false);

  // 3. Charging: charging = true, powerSaving = false
  const charging = getBatteryVisualState(true, false);
  assert.strictEqual(charging.state, 'charging');
  assert.strictEqual(charging.color, '#22c55e');
  assert.strictEqual(charging.hasLightning, true);
  assert.strictEqual(charging.showChargingText, true);

  // 4. Charging wins when BOTH charging and powerSaving are true
  const chargingWithSaver = getBatteryVisualState(true, true);
  assert.strictEqual(chargingWithSaver.state, 'charging');
  assert.strictEqual(chargingWithSaver.color, '#22c55e');
  assert.strictEqual(chargingWithSaver.hasLightning, true);
  assert.strictEqual(chargingWithSaver.showChargingText, true);

  // 5. Web fallback (powerSaving = null): normal when not charging, charging when plugged in
  const webNormal = getBatteryVisualState(false, null);
  assert.strictEqual(webNormal.state, 'normal');
  assert.strictEqual(webNormal.hasLightning, false);
  assert.strictEqual(webNormal.showChargingText, false);

  const webCharging = getBatteryVisualState(true, null);
  assert.strictEqual(webCharging.state, 'charging');
  assert.strictEqual(webCharging.hasLightning, true);
  assert.strictEqual(webCharging.showChargingText, true);
});

it('supports Windows Laptop with Battery Saver and Energy Saver labels', () => {
  const winSaver = getBatteryVisualState({
    platform: 'windows',
    charging: false,
    powerSaving: true,
    powerSavingLabel: 'Battery Saver',
    hasBattery: true,
  });
  assert.strictEqual(winSaver.visible, true);
  assert.strictEqual(winSaver.state, 'power-saving');
  assert.strictEqual(winSaver.color, '#f59e0b');
  assert.strictEqual(winSaver.labelText, 'Battery Saver');
  assert.strictEqual(winSaver.isEcoIcon, false);

  const winEnergySaver = getBatteryVisualState({
    platform: 'windows',
    charging: false,
    powerSaving: true,
    powerSavingLabel: 'Energy Saver',
    hasBattery: true,
  });
  assert.strictEqual(winEnergySaver.labelText, 'Energy Saver');
  assert.strictEqual(winEnergySaver.color, '#f59e0b');
});

it('supports MacBook with Low Power Mode and Charging priority', () => {
  const macLowPower = getBatteryVisualState({
    platform: 'macos',
    charging: false,
    powerSaving: true,
    hasBattery: true,
  });
  assert.strictEqual(macLowPower.visible, true);
  assert.strictEqual(macLowPower.state, 'power-saving');
  assert.strictEqual(macLowPower.labelText, 'Low Power Mode');
  assert.strictEqual(macLowPower.color, '#f59e0b');

  // When Mac is plugged in and charging, Charging has priority
  const macCharging = getBatteryVisualState({
    platform: 'macos',
    charging: true,
    powerSaving: true,
    hasBattery: true,
  });
  assert.strictEqual(macCharging.state, 'charging');
  assert.strictEqual(macCharging.color, '#22c55e');
  assert.strictEqual(macCharging.hasLightning, true);
  assert.strictEqual(macCharging.labelText, 'Charging');
});

it('handles Desktop PCs without battery: shows Energy/Eco icon when active, hides when normal', () => {
  // 1. Desktop in normal mode: completely hidden (no fake percentage)
  const desktopNormal = getBatteryVisualState({
    hasBattery: false,
    charging: false,
    powerSaving: false,
  });
  assert.strictEqual(desktopNormal.visible, false);

  // 2. Desktop with Energy Saver active: shows Energy Saver icon and label
  const desktopEnergySaver = getBatteryVisualState({
    hasBattery: false,
    charging: false,
    powerSaving: true,
    powerSavingLabel: 'Energy Saver',
  });
  assert.strictEqual(desktopEnergySaver.visible, true);
  assert.strictEqual(desktopEnergySaver.isEcoIcon, true);
  assert.strictEqual(desktopEnergySaver.labelText, 'Energy Saver');
  assert.strictEqual(desktopEnergySaver.color, '#f59e0b');

  // 3. Desktop with Eco Mode active
  const desktopEco = getBatteryVisualState({
    hasBattery: false,
    charging: false,
    powerSaving: true,
    powerSavingLabel: 'Eco Mode',
  });
  assert.strictEqual(desktopEco.visible, true);
  assert.strictEqual(desktopEco.isEcoIcon, true);
  assert.strictEqual(desktopEco.labelText, 'Eco Mode');
});

it('respects Settings toggles: Show Battery/Power Status, Charging Indicator, Power Saving Indicator', () => {
  // Show Battery / Power Status = false -> Hidden in all states
  const turnedOff = getBatteryVisualState({
    hasBattery: true,
    charging: true,
    showBattery: false,
  });
  assert.strictEqual(turnedOff.visible, false);

  // Charging Indicator = false -> Falls back to normal battery presentation
  const chargingHidden = getBatteryVisualState({
    hasBattery: true,
    charging: true,
    showChargingIndicator: false,
  });
  assert.strictEqual(chargingHidden.visible, true);
  assert.strictEqual(chargingHidden.state, 'normal');
  assert.strictEqual(chargingHidden.hasLightning, false);
  assert.strictEqual(chargingHidden.labelText, undefined);

  // Power Saving Indicator = false -> Falls back to normal battery presentation
  const saverHidden = getBatteryVisualState({
    hasBattery: true,
    charging: false,
    powerSaving: true,
    showPowerSavingIndicator: false,
  });
  assert.strictEqual(saverHidden.visible, true);
  assert.strictEqual(saverHidden.state, 'normal');
  assert.strictEqual(saverHidden.labelText, undefined);

  // Desktop with Power Saving Indicator = false -> Hidden
  const desktopSaverHidden = getBatteryVisualState({
    hasBattery: false,
    powerSaving: true,
    showPowerSavingIndicator: false,
  });
  assert.strictEqual(desktopSaverHidden.visible, false);
});

// ==========================================
// DATE & DAY FORMATTING LOGIC
// ==========================================
function getOrdinalSuffix(day) {
  if (day >= 11 && day <= 13) return `${day}th`;
  switch (day % 10) {
    case 1: return `${day}st`;
    case 2: return `${day}nd`;
    case 3: return `${day}rd`;
    default: return `${day}th`;
  }
}

function formatDayName(date, format) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const name = days[date.getDay()];
  switch (format) {
    case 'Monday': return name;
    case 'MONDAY': return name.toUpperCase();
    case 'Mon': return name.slice(0, 3);
    case 'MON': return name.slice(0, 3).toUpperCase();
    case 'Mon.': return `${name.slice(0, 3)}.`;
    case 'M': return name[0].toUpperCase();
    default: return name;
  }
}

function formatMonthName(date, format) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const name = months[date.getMonth()];
  switch (format) {
    case 'September': return name;
    case 'SEPTEMBER': return name.toUpperCase();
    case 'Sep': return name.slice(0, 3);
    case 'SEP': return name.slice(0, 3).toUpperCase();
    case 'Sep.': return `${name.slice(0, 3)}.`;
    default: return name;
  }
}

function formatDateNumber(date, format) {
  const d = date.getDate();
  switch (format) {
    case '10': return d.toString();
    case '10th': return getOrdinalSuffix(d);
    case '10.': return `${d}.`;
    default: return d.toString();
  }
}

function formatYearNumber(date, format) {
  const y = date.getFullYear();
  switch (format) {
    case '2026': return y.toString();
    case "'26": return `'${y.toString().slice(-2)}`;
    default: return y.toString();
  }
}

function getDateSeparatorChar(separator) {
  switch (separator) {
    case ',': return ', ';
    case '•': return ' • ';
    case '·': return ' · ';
    case '|': return ' | ';
    case '-': return ' - ';
    case '/': return ' / ';
    case 'space': return ' ';
    case 'none': return '';
    default: return ' • ';
  }
}

function formatCustomDate(date, settings) {
  const {
    showDate = true,
    showDay = true,
    showDateNumber = true,
    showMonth = true,
    showYear = true,
    datePreset = 'E',
    customDateOrder = ['day', 'date', 'month', 'year'],
    dateSeparator = '•',
    dayFormat = 'Monday',
    monthFormat = 'September',
    dateFormat = '10',
    yearFormat = '2026',
  } = settings;

  if (!showDate) return '';
  if (!showDay && !showDateNumber && !showMonth && !showYear) return '';

  const dayStr = showDay ? formatDayName(date, dayFormat) : '';
  const dateStr = showDateNumber ? formatDateNumber(date, dateFormat) : '';
  const monthStr = showMonth ? formatMonthName(date, monthFormat) : '';
  const yearStr = showYear ? formatYearNumber(date, yearFormat) : '';

  const sep = getDateSeparatorChar(dateSeparator);

  if (datePreset === 'custom') {
    const parts = [];
    for (const elem of customDateOrder) {
      if (elem === 'day' && dayStr) parts.push(dayStr);
      if (elem === 'date' && dateStr) parts.push(dateStr);
      if (elem === 'month' && monthStr) parts.push(monthStr);
      if (elem === 'year' && yearStr) parts.push(yearStr);
    }
    return parts.join(sep);
  }

  switch (datePreset) {
    case 'A': {
      const monthDate = [monthStr, dateStr].filter(Boolean).join(' ');
      const groups = [dayStr, monthDate, yearStr].filter(Boolean);
      const joiner = dateSeparator === ',' ? ', ' : sep;
      return groups.join(joiner);
    }
    case 'B': {
      const dateMonth = [dateStr, monthStr].filter(Boolean).join(' ');
      if (dateSeparator === ',') {
        const parts = [];
        if (dayStr) parts.push(`${dayStr},`);
        if (dateMonth) parts.push(dateMonth);
        if (yearStr) parts.push(yearStr);
        return parts.join(' ');
      }
      const groups = [dayStr, dateMonth, yearStr].filter(Boolean);
      return groups.join(sep);
    }
    case 'C': {
      const parts = [dateStr, monthStr, yearStr].filter(Boolean);
      return parts.join(dateSeparator === 'space' ? ' ' : sep);
    }
    case 'D': {
      const monthDate = [monthStr, dateStr].filter(Boolean).join(' ');
      if (dateSeparator === ',') {
        return [monthDate, yearStr].filter(Boolean).join(', ');
      }
      return [monthDate, yearStr].filter(Boolean).join(sep);
    }
    case 'E': {
      const dateMonth = [dateStr, monthStr].filter(Boolean).join(' ');
      const groups = [dayStr, dateMonth, yearStr].filter(Boolean);
      return groups.join(sep);
    }
    case 'F': {
      const monthDate = [monthStr, dateStr].filter(Boolean).join(' ');
      const groups = [dayStr, monthDate, yearStr].filter(Boolean);
      return groups.join(sep);
    }
    case 'G': {
      const parts = [dateStr, monthStr, yearStr].filter(Boolean);
      return parts.join(sep);
    }
    case 'H': {
      const parts = [yearStr, monthStr, dateStr].filter(Boolean);
      return parts.join(sep);
    }
    case 'I': {
      const parts = [yearStr, dateStr, monthStr].filter(Boolean);
      return parts.join(sep);
    }
    case 'J': {
      const parts = [dayStr, dateStr, monthStr, yearStr].filter(Boolean);
      return parts.join(sep);
    }
    default: {
      const parts = [dayStr, dateStr, monthStr, yearStr].filter(Boolean);
      return parts.join(sep);
    }
  }
}

// ----------------------------------------------------
// TESTS: DATE PRESETS A - J (Thursday, Sept 10, 2026)
// ----------------------------------------------------
const testDate = new Date(2026, 8, 10); // September 10, 2026 (Thursday)

it('formats Preset A: Day, Month Date, Year', () => {
  const res = formatCustomDate(testDate, {
    datePreset: 'A',
    dateSeparator: ',',
    dayFormat: 'Monday',
    monthFormat: 'September',
    dateFormat: '10',
    yearFormat: '2026',
  });
  assert.strictEqual(res, 'Thursday, September 10, 2026');
});

it('formats Preset B: Day, Date Month, Year', () => {
  const res = formatCustomDate(testDate, {
    datePreset: 'B',
    dateSeparator: ',',
    dayFormat: 'Monday',
    monthFormat: 'September',
    dateFormat: '10',
    yearFormat: '2026',
  });
  assert.strictEqual(res, 'Thursday, 10 September 2026');
});

it('formats Preset C: Date Month Year', () => {
  const res = formatCustomDate(testDate, {
    datePreset: 'C',
    dateSeparator: 'space',
    monthFormat: 'September',
    dateFormat: '10',
    yearFormat: '2026',
  });
  assert.strictEqual(res, '10 September 2026');
});

it('formats Preset D: Month Date Year', () => {
  const res = formatCustomDate(testDate, {
    datePreset: 'D',
    dateSeparator: ',',
    monthFormat: 'September',
    dateFormat: '10',
    yearFormat: '2026',
  });
  assert.strictEqual(res, 'September 10, 2026');
});

it('formats Preset E: Day • Date Month • Year', () => {
  const res = formatCustomDate(testDate, {
    datePreset: 'E',
    dateSeparator: '•',
    dayFormat: 'Monday',
    monthFormat: 'September',
    dateFormat: '10',
    yearFormat: '2026',
  });
  assert.strictEqual(res, 'Thursday • 10 September • 2026');
});

it('formats Preset F: Day • Month Date • Year', () => {
  const res = formatCustomDate(testDate, {
    datePreset: 'F',
    dateSeparator: '•',
    dayFormat: 'Monday',
    monthFormat: 'September',
    dateFormat: '10',
    yearFormat: '2026',
  });
  assert.strictEqual(res, 'Thursday • September 10 • 2026');
});

it('formats Preset G: Date • Month • Year', () => {
  const res = formatCustomDate(testDate, {
    datePreset: 'G',
    dateSeparator: '•',
    monthFormat: 'September',
    dateFormat: '10',
    yearFormat: '2026',
  });
  assert.strictEqual(res, '10 • September • 2026');
});

it('formats Preset H: Year • Month • Date', () => {
  const res = formatCustomDate(testDate, {
    datePreset: 'H',
    dateSeparator: '•',
    monthFormat: 'September',
    dateFormat: '10',
    yearFormat: '2026',
  });
  assert.strictEqual(res, '2026 • September • 10');
});

it('formats Preset I: Year • Date • Month', () => {
  const res = formatCustomDate(testDate, {
    datePreset: 'I',
    dateSeparator: '•',
    monthFormat: 'September',
    dateFormat: '10',
    yearFormat: '2026',
  });
  assert.strictEqual(res, '2026 • 10 • September');
});

it('formats Preset J: Day • Date • Month • Year', () => {
  const res = formatCustomDate(testDate, {
    datePreset: 'J',
    dateSeparator: '•',
    dayFormat: 'Monday',
    monthFormat: 'September',
    dateFormat: '10',
    yearFormat: '2026',
  });
  assert.strictEqual(res, 'Thursday • 10 • September • 2026');
});

it('formats with various Separators correctly', () => {
  const base = {
    datePreset: 'E',
    dayFormat: 'Monday',
    monthFormat: 'September',
    dateFormat: '10',
    yearFormat: '2026',
  };

  assert.strictEqual(formatCustomDate(testDate, { ...base, dateSeparator: '•' }), 'Thursday • 10 September • 2026');
  assert.strictEqual(formatCustomDate(testDate, { ...base, dateSeparator: '|' }), 'Thursday | 10 September | 2026');
  assert.strictEqual(formatCustomDate(testDate, { ...base, dateSeparator: '-' }), 'Thursday - 10 September - 2026');
  assert.strictEqual(formatCustomDate(testDate, { ...base, dateSeparator: '/' }), 'Thursday / 10 September / 2026');
  assert.strictEqual(formatCustomDate(testDate, { ...base, dateSeparator: '·' }), 'Thursday · 10 September · 2026');
  assert.strictEqual(formatCustomDate(testDate, { ...base, dateSeparator: 'space' }), 'Thursday 10 September 2026');
});

it('supports all Day Formats', () => {
  const base = { datePreset: 'custom', customDateOrder: ['day'] };
  assert.strictEqual(formatCustomDate(testDate, { ...base, dayFormat: 'Monday' }), 'Thursday');
  assert.strictEqual(formatCustomDate(testDate, { ...base, dayFormat: 'MONDAY' }), 'THURSDAY');
  assert.strictEqual(formatCustomDate(testDate, { ...base, dayFormat: 'Mon' }), 'Thu');
  assert.strictEqual(formatCustomDate(testDate, { ...base, dayFormat: 'MON' }), 'THU');
  assert.strictEqual(formatCustomDate(testDate, { ...base, dayFormat: 'Mon.' }), 'Thu.');
  assert.strictEqual(formatCustomDate(testDate, { ...base, dayFormat: 'M' }), 'T');
});

it('supports all Month Formats', () => {
  const base = { datePreset: 'custom', customDateOrder: ['month'] };
  assert.strictEqual(formatCustomDate(testDate, { ...base, monthFormat: 'September' }), 'September');
  assert.strictEqual(formatCustomDate(testDate, { ...base, monthFormat: 'SEPTEMBER' }), 'SEPTEMBER');
  assert.strictEqual(formatCustomDate(testDate, { ...base, monthFormat: 'Sep' }), 'Sep');
  assert.strictEqual(formatCustomDate(testDate, { ...base, monthFormat: 'SEP' }), 'SEP');
  assert.strictEqual(formatCustomDate(testDate, { ...base, monthFormat: 'Sep.' }), 'Sep.');
});

it('supports all Date Formats (10, 10th, 10.)', () => {
  const base = { datePreset: 'custom', customDateOrder: ['date'] };
  assert.strictEqual(formatCustomDate(testDate, { ...base, dateFormat: '10' }), '10');
  assert.strictEqual(formatCustomDate(testDate, { ...base, dateFormat: '10th' }), '10th');
  assert.strictEqual(formatCustomDate(testDate, { ...base, dateFormat: '10.' }), '10.');

  // Ordinal checks for other dates: 1st, 2nd, 3rd, 21st, 22nd, 23rd, 31st
  assert.strictEqual(formatDateNumber(new Date(2026, 8, 1), '10th'), '1st');
  assert.strictEqual(formatDateNumber(new Date(2026, 8, 2), '10th'), '2nd');
  assert.strictEqual(formatDateNumber(new Date(2026, 8, 3), '10th'), '3rd');
  assert.strictEqual(formatDateNumber(new Date(2026, 8, 21), '10th'), '21st');
  assert.strictEqual(formatDateNumber(new Date(2026, 8, 22), '10th'), '22nd');
  assert.strictEqual(formatDateNumber(new Date(2026, 8, 23), '10th'), '23rd');
  assert.strictEqual(formatDateNumber(new Date(2026, 7, 31), '10th'), '31st'); // August 31
});

it('supports all Year Formats (2026, 26)', () => {
  const base = { datePreset: 'custom', customDateOrder: ['year'] };
  assert.strictEqual(formatCustomDate(testDate, { ...base, yearFormat: '2026' }), '2026');
  assert.strictEqual(formatCustomDate(testDate, { ...base, yearFormat: "'26" }), "'26");
});

it('supports Master Toggles: independently disable Day, Date, Month, Year', () => {
  const base = {
    datePreset: 'E',
    dateSeparator: '•',
    dayFormat: 'Monday',
    monthFormat: 'September',
    dateFormat: '10',
    yearFormat: '2026',
  };

  // Hide Day
  assert.strictEqual(formatCustomDate(testDate, { ...base, showDay: false }), '10 September • 2026');
  // Hide Year
  assert.strictEqual(formatCustomDate(testDate, { ...base, showYear: false }), 'Thursday • 10 September');
  // Hide Month
  assert.strictEqual(formatCustomDate(testDate, { ...base, showMonth: false }), 'Thursday • 10 • 2026');
  // Hide Date
  assert.strictEqual(formatCustomDate(testDate, { ...base, showDateNumber: false }), 'Thursday • September • 2026');
  // All off
  assert.strictEqual(formatCustomDate(testDate, { ...base, showDay: false, showDateNumber: false, showMonth: false, showYear: false }), '');
  // Master showDate = false
  assert.strictEqual(formatCustomDate(testDate, { ...base, showDate: false }), '');
});

it('supports Custom Layout with arbitrary order', () => {
  const base = {
    datePreset: 'custom',
    dateSeparator: ' • ',
    dayFormat: 'Monday',
    monthFormat: 'September',
    dateFormat: '10',
    yearFormat: '2026',
  };

  // Year → Month → Date
  assert.strictEqual(
    formatCustomDate(testDate, { ...base, customDateOrder: ['year', 'month', 'date'], dateSeparator: '•' }),
    '2026 • September • 10'
  );

  // Month → Day → Date → Year
  assert.strictEqual(
    formatCustomDate(testDate, { ...base, customDateOrder: ['month', 'day', 'date', 'year'], dateSeparator: '•' }),
    'September • Thursday • 10 • 2026'
  );
});

it('matches Default Settings: THURSDAY • 10 SEPTEMBER • 2026 (Rule 13)', () => {
  const defaultSettings = {
    showDate: true,
    showDay: true,
    showDateNumber: true,
    showMonth: true,
    showYear: true,
    datePreset: 'E',
    dateSeparator: '•',
    dayFormat: 'MONDAY',
    monthFormat: 'SEPTEMBER',
    dateFormat: '10',
    yearFormat: '2026',
  };

  const res = formatCustomDate(testDate, defaultSettings);
  assert.strictEqual(res, 'THURSDAY • 10 SEPTEMBER • 2026');
});

it('verifies Three-State Battery System specification (State 1 Normal, State 2 Charging, State 3 Power Saving)', () => {
  // State 1 — Normal: charging = false, powerSaving = false
  const state1 = getBatteryVisualState({
    charging: false,
    powerSaving: false,
    hasBattery: true,
    showBattery: true,
    showChargingIndicator: true,
    showPowerSavingIndicator: true,
  });
  assert.strictEqual(state1.state, 'normal');
  assert.strictEqual(state1.color, '#e2e8f0');
  assert.strictEqual(state1.hasLightning, false);
  assert.strictEqual(state1.labelText, undefined);

  // State 2 — Charging: charging = true, powerSaving = false
  const state2 = getBatteryVisualState({
    charging: true,
    powerSaving: false,
    hasBattery: true,
    showBattery: true,
    showChargingIndicator: true,
    showPowerSavingIndicator: true,
  });
  assert.strictEqual(state2.state, 'charging');
  assert.strictEqual(state2.color, '#22c55e');
  assert.strictEqual(state2.hasLightning, true);
  assert.strictEqual(state2.labelText, 'Charging');

  // State 3 — Battery Saver / Power Saving: charging = false, powerSaving = true
  const state3 = getBatteryVisualState({
    charging: false,
    powerSaving: true,
    powerSavingLabel: 'Battery Saver',
    hasBattery: true,
    showBattery: true,
    showChargingIndicator: true,
    showPowerSavingIndicator: true,
  });
  assert.strictEqual(state3.state, 'power-saving');
  assert.strictEqual(state3.color, '#f59e0b');
  assert.strictEqual(state3.hasLightning, false);
  assert.strictEqual(state3.labelText, 'Battery Saver');

  // State 3 alternative labels: Power Saving Mode and Energy Saver
  const state3b = getBatteryVisualState({
    charging: false,
    powerSaving: true,
    powerSavingLabel: 'Power Saving Mode',
    hasBattery: true,
    showBattery: true,
    showChargingIndicator: true,
    showPowerSavingIndicator: true,
  });
  assert.strictEqual(state3b.labelText, 'Power Saving Mode');

  const state3c = getBatteryVisualState({
    charging: false,
    powerSaving: true,
    powerSavingLabel: 'Energy Saver',
    hasBattery: true,
    showBattery: true,
    showChargingIndicator: true,
    showPowerSavingIndicator: true,
  });
  assert.strictEqual(state3c.labelText, 'Energy Saver');

  // Strict priority: Charging > Power Saving
  const stateChargingOverride = getBatteryVisualState({
    charging: true,
    powerSaving: true,
    powerSavingLabel: 'Battery Saver',
    hasBattery: true,
    showBattery: true,
    showChargingIndicator: true,
    showPowerSavingIndicator: true,
  });
  assert.strictEqual(stateChargingOverride.state, 'charging');
  assert.strictEqual(stateChargingOverride.color, '#22c55e');
  assert.strictEqual(stateChargingOverride.hasLightning, true);
  assert.strictEqual(stateChargingOverride.labelText, 'Charging');
});

it('verifies Development Battery State Preview override buttons (Normal, Charging, Battery Saver, Reset)', () => {
  // Test Normal Button Override:
  const normalPreview = getBatteryVisualState({
    previewOverride: 'normal',
    charging: true, // Should be overridden by preview
    powerSaving: true,
  });
  assert.strictEqual(normalPreview.visible, true);
  assert.strictEqual(normalPreview.state, 'normal');
  assert.strictEqual(normalPreview.color, '#e2e8f0');
  assert.strictEqual(normalPreview.hasLightning, false);
  assert.strictEqual(normalPreview.labelText, undefined);

  // Test Charging Button Override:
  const chargingPreview = getBatteryVisualState({
    previewOverride: 'charging',
    charging: false,
    powerSaving: false,
  });
  assert.strictEqual(chargingPreview.visible, true);
  assert.strictEqual(chargingPreview.state, 'charging');
  assert.strictEqual(chargingPreview.color, '#22c55e');
  assert.strictEqual(chargingPreview.hasLightning, true);
  assert.strictEqual(chargingPreview.labelText, 'Charging');

  // Test Battery Saver Button Override:
  const saverPreview = getBatteryVisualState({
    previewOverride: 'powersaving',
    charging: false,
    powerSaving: false,
  });
  assert.strictEqual(saverPreview.visible, true);
  assert.strictEqual(saverPreview.state, 'power-saving');
  assert.strictEqual(saverPreview.color, '#f59e0b');
  assert.strictEqual(saverPreview.hasLightning, false);
  assert.strictEqual(saverPreview.labelText, 'Battery Saver');

  // Test Reset (previewOverride: null) reverts back to normal detection
  const resetNormal = getBatteryVisualState({
    previewOverride: null,
    charging: false,
    powerSaving: false,
    hasBattery: true,
  });
  assert.strictEqual(resetNormal.state, 'normal');
  assert.strictEqual(resetNormal.color, '#e2e8f0');
});

console.log(`\nResults: ${passed}/${total} tests passed.\n`);

if (passed !== total) {
  process.exit(1);
}
