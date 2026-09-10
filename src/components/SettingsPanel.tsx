/**
 * FLIPLY — SettingsPanel Component
 * Comprehensive settings modal for FLIPLY
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  BatteryDisplayState,
  BatteryState,
  ClockFormat,
  ClockSeparator,
  ClockSettings,
  ClockSize,
  DateElement,
  DateFormatOption,
  DatePresetId,
  DateSeparator,
  DayFormat,
  FlipSpeed,
  MonthFormat,
  ThemeId,
  YearFormat,
} from '../types';
import {
  COMMON_CUSTOM_ORDERS,
  DATE_PRESETS,
  THEMES,
  formatCustomDate,
  formatDateNumber,
  formatDayName,
  formatMonthName,
  formatYearNumber,
} from '../utils/clockUtils';
import {
  getBatteryPreviewOverride,
  resetBatteryPreview,
  setBatteryPreviewOverride,
} from '../hooks/useBattery';
import { ChevronDown, ChevronUp, RotateCcw, X } from 'lucide-react';

const SEPARATOR_OPTIONS: { id: DateSeparator; label: string; symbol: string }[] = [
  { id: ',', label: "Comma (', ')", symbol: ', ' },
  { id: '•', label: "• (' • ')", symbol: '•' },
  { id: '·', label: "· (' · ')", symbol: '·' },
  { id: '|', label: "| (' | ')", symbol: '|' },
  { id: '-', label: "- (' - ')", symbol: '-' },
  { id: '/', label: "/ (' / ')", symbol: '/' },
  { id: 'space', label: "Space (' ')", symbol: 'Space' },
  { id: 'none', label: "None ('')", symbol: 'None' },
];

const DAY_FORMAT_OPTIONS: { id: DayFormat; label: string }[] = [
  { id: 'Monday', label: 'Monday' },
  { id: 'MONDAY', label: 'MONDAY' },
  { id: 'Mon', label: 'Mon' },
  { id: 'MON', label: 'MON' },
  { id: 'Mon.', label: 'Mon.' },
  { id: 'M', label: 'M' },
];

const MONTH_FORMAT_OPTIONS: { id: MonthFormat; label: string }[] = [
  { id: 'September', label: 'September' },
  { id: 'SEPTEMBER', label: 'SEPTEMBER' },
  { id: 'Sep', label: 'Sep' },
  { id: 'SEP', label: 'SEP' },
  { id: 'Sep.', label: 'Sep.' },
];

const DATE_FORMAT_OPTIONS: { id: DateFormatOption; label: string }[] = [
  { id: '10', label: '10' },
  { id: '10th', label: '10th' },
  { id: '10.', label: '10.' },
];

const YEAR_FORMAT_OPTIONS: { id: YearFormat; label: string }[] = [
  { id: '2026', label: '2026' },
  { id: "'26", label: "'26" },
];

interface SettingsPanelProps {
  isOpen: boolean;
  settings: ClockSettings;
  onUpdate: (updater: Partial<ClockSettings>) => void;
  onReset: () => void;
  onClose: () => void;
  isElectron?: boolean;
  battery?: BatteryState;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  settings,
  onUpdate,
  onReset,
  onClose,
  isElectron,
  battery,
}) => {
  const currentDate = useMemo(() => new Date(), []);
  const livePreview = useMemo(() => formatCustomDate(currentDate, settings), [currentDate, settings]);

  const [previewState, setPreviewState] = useState<BatteryDisplayState | null>(() =>
    battery?.previewOverride !== undefined ? battery.previewOverride : getBatteryPreviewOverride()
  );

  useEffect(() => {
    const handleBatteryEvent = () => {
      setPreviewState(getBatteryPreviewOverride());
    };
    window.addEventListener('fliplyBatteryChange', handleBatteryEvent);
    return () => window.removeEventListener('fliplyBatteryChange', handleBatteryEvent);
  }, []);

  const handlePreviewSelect = (mode: BatteryDisplayState) => {
    setBatteryPreviewOverride(mode);
    setPreviewState(mode);
    if (!settings.showBattery) {
      onUpdate({ showBattery: true });
    }
  };

  const handleResetPreview = () => {
    resetBatteryPreview();
    setPreviewState(null);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const moveCustomElement = (index: number, direction: 'up' | 'down') => {
    const current = settings.customDateOrder && settings.customDateOrder.length === 4
      ? [...settings.customDateOrder]
      : ['day', 'date', 'month', 'year'];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= current.length) return;
    const temp = current[index];
    current[index] = current[target];
    current[target] = temp;
    onUpdate({ customDateOrder: current });
  };

  const handlePresetSelect = (presetId: DatePresetId) => {
    if (presetId === 'custom') {
      onUpdate({ datePreset: 'custom' });
      return;
    }
    const found = DATE_PRESETS.find((p) => p.id === presetId);
    onUpdate({
      datePreset: presetId,
      ...(found ? { dateSeparator: found.defaultSeparator } : {}),
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="settings-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Clock Settings"
    >
      <div className="settings-modal">
        {/* Header */}
        <div className="settings-header">
          <span className="settings-title">Settings</span>
          <button
            type="button"
            className="settings-close-btn"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="settings-content">
          {/* DISPLAY SECTION */}
          <div className="settings-section">
            <span className="settings-section-title">Display</span>

            {/* 12H / 24H */}
            <div className="settings-row">
              <div>
                <div className="settings-label">Clock Format</div>
                <div className="settings-desc">Choose 12-hour (with AM/PM) or 24-hour time</div>
              </div>
              <div className="segmented-control">
                {(['12h', '24h'] as ClockFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    className={`segmented-btn ${settings.format === fmt ? 'active' : ''}`}
                    onClick={() => onUpdate({ format: fmt })}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Seconds */}
            <div className="settings-row">
              <div>
                <div className="settings-label">Seconds</div>
                <div className="settings-desc">Display animated seconds digit cards</div>
              </div>
              <button
                type="button"
                className={`toggle-switch ${settings.showSeconds ? 'active' : ''}`}
                onClick={() => onUpdate({ showSeconds: !settings.showSeconds })}
                aria-pressed={settings.showSeconds}
                aria-label="Toggle seconds"
              >
                <div className="toggle-thumb" />
              </button>
            </div>

            {/* Date */}
            <div className="settings-row">
              <div>
                <div className="settings-label">Date</div>
                <div className="settings-desc">Show current day and date below the clock</div>
              </div>
              <button
                type="button"
                className={`toggle-switch ${settings.showDate ? 'active' : ''}`}
                onClick={() => onUpdate({ showDate: !settings.showDate })}
                aria-pressed={settings.showDate}
                aria-label="Toggle date"
              >
                <div className="toggle-thumb" />
              </button>
            </div>
          </div>

          {/* DATE & DAY SECTION */}
          <div className="settings-section">
            <span className="settings-section-title">Date & Day</span>

            {/* Live Preview Card */}
            <div className="date-preview-card">
              <div className="date-preview-header">
                <span className="date-preview-badge">Live Preview</span>
                <span className="date-preview-sub">Current system date</span>
              </div>
              <div className="date-preview-display">
                {livePreview || <span className="date-preview-empty">(No date elements enabled)</span>}
              </div>
            </div>

            {/* 1. MASTER TOGGLES */}
            <div>
              <div className="date-subsection-title" style={{ marginBottom: '10px' }}>
                1. Master Toggles
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Show Day */}
                <div className="settings-row">
                  <div>
                    <div className="settings-label">Show Day</div>
                    <div className="settings-desc">
                      Display day of week ({formatDayName(currentDate, settings.dayFormat || 'Monday')})
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`toggle-switch ${settings.showDay !== false ? 'active' : ''}`}
                    onClick={() => onUpdate({ showDay: settings.showDay === false })}
                    aria-pressed={settings.showDay !== false}
                    aria-label="Toggle show day"
                  >
                    <div className="toggle-thumb" />
                  </button>
                </div>

                {/* Show Date */}
                <div className="settings-row">
                  <div>
                    <div className="settings-label">Show Date</div>
                    <div className="settings-desc">
                      Display calendar date ({formatDateNumber(currentDate, settings.dateFormat || '10')})
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`toggle-switch ${settings.showDateNumber !== false ? 'active' : ''}`}
                    onClick={() => onUpdate({ showDateNumber: settings.showDateNumber === false })}
                    aria-pressed={settings.showDateNumber !== false}
                    aria-label="Toggle show date"
                  >
                    <div className="toggle-thumb" />
                  </button>
                </div>

                {/* Show Month */}
                <div className="settings-row">
                  <div>
                    <div className="settings-label">Show Month</div>
                    <div className="settings-desc">
                      Display month name ({formatMonthName(currentDate, settings.monthFormat || 'September')})
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`toggle-switch ${settings.showMonth !== false ? 'active' : ''}`}
                    onClick={() => onUpdate({ showMonth: settings.showMonth === false })}
                    aria-pressed={settings.showMonth !== false}
                    aria-label="Toggle show month"
                  >
                    <div className="toggle-thumb" />
                  </button>
                </div>

                {/* Show Year */}
                <div className="settings-row">
                  <div>
                    <div className="settings-label">Show Year</div>
                    <div className="settings-desc">
                      Display calendar year ({formatYearNumber(currentDate, settings.yearFormat || '2026')})
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`toggle-switch ${settings.showYear !== false ? 'active' : ''}`}
                    onClick={() => onUpdate({ showYear: settings.showYear === false })}
                    aria-pressed={settings.showYear !== false}
                    aria-label="Toggle show year"
                  >
                    <div className="toggle-thumb" />
                  </button>
                </div>
              </div>
            </div>

            {/* 2. DATE ORDER */}
            <div>
              <div className="date-subsection-title" style={{ marginBottom: '8px' }}>
                2. Date Layout
              </div>
              <div className="date-preset-list">
                {DATE_PRESETS.map((preset) => {
                  const isActive = (settings.datePreset || 'E') === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      className={`date-preset-item ${isActive ? 'active' : ''}`}
                      onClick={() => handlePresetSelect(preset.id)}
                    >
                      <div className="date-preset-left">
                        <span className="date-preset-badge">
                          {preset.id === 'custom' ? '✦' : preset.id}
                        </span>
                        <div>
                          <div className="date-preset-name">{preset.name}</div>
                          <div className="date-preset-example">{preset.example}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. CUSTOM ORDER (Visible when Custom Layout is selected) */}
            {settings.datePreset === 'custom' && (
              <div className="custom-order-box">
                <div>
                  <div className="settings-label" style={{ marginBottom: '4px' }}>Custom Element Order</div>
                  <div className="settings-desc" style={{ marginBottom: '8px' }}>
                    Reorder elements using the arrow buttons or choose a quick combination below
                  </div>
                  <div className="custom-order-chips">
                    {(settings.customDateOrder && settings.customDateOrder.length === 4
                      ? settings.customDateOrder
                      : ['day', 'date', 'month', 'year']
                    ).map((elem, idx) => {
                      const labels: Record<DateElement, string> = {
                        day: 'Day',
                        date: 'Date',
                        month: 'Month',
                        year: 'Year',
                      };
                      return (
                        <div key={elem} className="custom-order-chip">
                          <span>{idx + 1}. {labels[elem]}</span>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            <button
                              type="button"
                              className="custom-order-chip-btn"
                              disabled={idx === 0}
                              onClick={() => moveCustomElement(idx, 'up')}
                              title="Move earlier"
                            >
                              <ChevronUp size={14} />
                            </button>
                            <button
                              type="button"
                              className="custom-order-chip-btn"
                              disabled={idx === 3}
                              onClick={() => moveCustomElement(idx, 'down')}
                              title="Move later"
                            >
                              <ChevronDown size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Combinations */}
                <div>
                  <div className="settings-label" style={{ fontSize: '11px', marginBottom: '6px' }}>
                    Quick Combinations
                  </div>
                  <div className="quick-combos-grid">
                    {COMMON_CUSTOM_ORDERS.map((combo) => {
                      const currentOrder = settings.customDateOrder || ['day', 'date', 'month', 'year'];
                      const isMatch = currentOrder.join(',') === combo.order.join(',');
                      return (
                        <button
                          key={combo.label}
                          type="button"
                          className={`quick-combo-btn ${isMatch ? 'active' : ''}`}
                          onClick={() => onUpdate({ customDateOrder: combo.order })}
                        >
                          {combo.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 4. SEPARATORS */}
            <div>
              <div className="settings-label" style={{ marginBottom: '4px' }}>Separator</div>
              <div className="settings-desc" style={{ marginBottom: '8px' }}>
                Symbol used to separate date elements
              </div>
              <div className="format-grid">
                {SEPARATOR_OPTIONS.map((sep) => {
                  const isActive = (settings.dateSeparator || '•') === sep.id;
                  return (
                    <button
                      key={sep.id}
                      type="button"
                      className={`format-btn ${isActive ? 'active' : ''}`}
                      onClick={() => onUpdate({ dateSeparator: sep.id })}
                    >
                      <span>{sep.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. DAY FORMAT */}
            <div>
              <div className="settings-label" style={{ marginBottom: '4px' }}>Day Format</div>
              <div className="settings-desc" style={{ marginBottom: '8px' }}>
                Text casing and abbreviation for the day of the week
              </div>
              <div className="format-grid">
                {DAY_FORMAT_OPTIONS.map((opt) => {
                  const isActive = (settings.dayFormat || 'MONDAY') === opt.id;
                  const sample = formatDayName(currentDate, opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={`format-btn ${isActive ? 'active' : ''}`}
                      onClick={() => onUpdate({ dayFormat: opt.id })}
                    >
                      <span>{opt.label}</span>
                      <span className="format-btn-preview">({sample})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. MONTH FORMAT */}
            <div>
              <div className="settings-label" style={{ marginBottom: '4px' }}>Month Format</div>
              <div className="settings-desc" style={{ marginBottom: '8px' }}>
                Text casing and abbreviation for the month
              </div>
              <div className="format-grid">
                {MONTH_FORMAT_OPTIONS.map((opt) => {
                  const isActive = (settings.monthFormat || 'SEPTEMBER') === opt.id;
                  const sample = formatMonthName(currentDate, opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={`format-btn ${isActive ? 'active' : ''}`}
                      onClick={() => onUpdate({ monthFormat: opt.id })}
                    >
                      <span>{opt.label}</span>
                      <span className="format-btn-preview">({sample})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 7. DATE FORMAT */}
            <div>
              <div className="settings-label" style={{ marginBottom: '4px' }}>Date Format</div>
              <div className="settings-desc" style={{ marginBottom: '8px' }}>
                Standard number, ordinal (e.g. 10th), or with dot (e.g. 10.)
              </div>
              <div className="format-grid">
                {DATE_FORMAT_OPTIONS.map((opt) => {
                  const isActive = (settings.dateFormat || '10') === opt.id;
                  const sample = formatDateNumber(currentDate, opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={`format-btn ${isActive ? 'active' : ''}`}
                      onClick={() => onUpdate({ dateFormat: opt.id })}
                    >
                      <span>{opt.label}</span>
                      <span className="format-btn-preview">({sample})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 8. YEAR FORMAT */}
            <div>
              <div className="settings-label" style={{ marginBottom: '4px' }}>Year Format</div>
              <div className="settings-desc" style={{ marginBottom: '8px' }}>
                Full 4-digit or 2-digit with apostrophe
              </div>
              <div className="format-grid">
                {YEAR_FORMAT_OPTIONS.map((opt) => {
                  const isActive = (settings.yearFormat || '2026') === opt.id;
                  const sample = formatYearNumber(currentDate, opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={`format-btn ${isActive ? 'active' : ''}`}
                      onClick={() => onUpdate({ yearFormat: opt.id })}
                    >
                      <span>{opt.label}</span>
                      <span className="format-btn-preview">({sample})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* APPEARANCE SECTION */}
          <div className="settings-section">
            <span className="settings-section-title">Appearance</span>

            {/* Theme selection */}
            <div>
              <div className="settings-label" style={{ marginBottom: '8px' }}>Theme</div>
              <div className="theme-grid">
                {(Object.keys(THEMES) as ThemeId[]).map((id) => {
                  const t = THEMES[id];
                  const isActive = settings.theme === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`theme-swatch ${isActive ? 'active' : ''}`}
                      onClick={() => onUpdate({ theme: id, customBgColor: null, customDigitColor: null })}
                      aria-pressed={isActive}
                      title={t.name}
                    >
                      <div
                        className="theme-swatch-circle"
                        style={{ backgroundColor: t.bg, borderColor: t.accent }}
                      />
                      <span className="theme-swatch-name">{t.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Clock Size */}
            <div className="settings-row">
              <div>
                <div className="settings-label">Clock Size</div>
                <div className="settings-desc">Scale the flip cards to fit your space</div>
              </div>
              <div className="segmented-control">
                {(['sm', 'md', 'lg', 'xl'] as ClockSize[]).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    className={`segmented-btn ${settings.clockSize === sz ? 'active' : ''}`}
                    onClick={() => onUpdate({ clockSize: sz })}
                  >
                    {sz === 'sm' ? 'S' : sz === 'md' ? 'M' : sz === 'lg' ? 'L' : 'XL'}
                  </button>
                ))}
              </div>
            </div>

            {/* Flip Speed */}
            <div className="settings-row">
              <div>
                <div className="settings-label">Flip Speed</div>
                <div className="settings-desc">Mechanical split-flap rotation duration</div>
              </div>
              <div className="segmented-control">
                {(['slow', 'normal', 'fast'] as FlipSpeed[]).map((sp) => (
                  <button
                    key={sp}
                    type="button"
                    className={`segmented-btn ${settings.flipSpeed === sp ? 'active' : ''}`}
                    onClick={() => onUpdate({ flipSpeed: sp })}
                  >
                    {sp.charAt(0).toUpperCase() + sp.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Digit Spacing */}
            <div className="settings-row">
              <div>
                <div className="settings-label">Digit Spacing</div>
                <div className="settings-desc">Gap between digits ({settings.digitSpacing}px)</div>
              </div>
              <input
                type="range"
                className="settings-range"
                min={6}
                max={32}
                step={2}
                value={settings.digitSpacing}
                onChange={(e) => onUpdate({ digitSpacing: Number(e.target.value) })}
                aria-label="Digit spacing in pixels"
              />
            </div>

            {/* Separator */}
            <div className="settings-row">
              <div>
                <div className="settings-label">Separator</div>
                <div className="settings-desc">Character between digit groups</div>
              </div>
              <div className="segmented-control">
                {([':', '·', 'blank'] as ClockSeparator[]).map((sep) => (
                  <button
                    key={sep}
                    type="button"
                    className={`segmented-btn ${settings.separator === sep ? 'active' : ''}`}
                    onClick={() => onUpdate({ separator: sep })}
                  >
                    {sep === 'blank' ? 'None' : sep}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Background Color override */}
            <div className="settings-row">
              <div>
                <div className="settings-label">Background Color</div>
                <div className="settings-desc">
                  {settings.customBgColor ? 'Custom color active' : 'Theme default'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {settings.customBgColor && (
                  <button
                    type="button"
                    className="text-xs opacity-75 hover:opacity-100 underline cursor-pointer"
                    onClick={() => onUpdate({ customBgColor: null })}
                  >
                    Reset
                  </button>
                )}
                <input
                  type="color"
                  value={settings.customBgColor || THEMES[settings.theme].bg}
                  onChange={(e) => onUpdate({ customBgColor: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer border border-neutral-700 bg-transparent"
                  aria-label="Custom background color"
                />
              </div>
            </div>

            {/* Custom Digit Color override */}
            <div className="settings-row">
              <div>
                <div className="settings-label">Digit Color</div>
                <div className="settings-desc">
                  {settings.customDigitColor ? 'Custom color active' : 'Theme default'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {settings.customDigitColor && (
                  <button
                    type="button"
                    className="text-xs opacity-75 hover:opacity-100 underline cursor-pointer"
                    onClick={() => onUpdate({ customDigitColor: null })}
                  >
                    Reset
                  </button>
                )}
                <input
                  type="color"
                  value={settings.customDigitColor || THEMES[settings.theme].textColor}
                  onChange={(e) => onUpdate({ customDigitColor: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer border border-neutral-700 bg-transparent"
                  aria-label="Custom digit color"
                />
              </div>
            </div>
          </div>

          {/* SYSTEM SECTION */}
          <div className="settings-section">
            <span className="settings-section-title">System</span>

            {/* Keep Screen Awake */}
            <div className="settings-row">
              <div>
                <div className="settings-label">Keep Screen Awake</div>
                <div className="settings-desc">Prevents monitor from sleeping or dimming</div>
              </div>
              <button
                type="button"
                className={`toggle-switch ${settings.keepScreenAwake ? 'active' : ''}`}
                onClick={() => onUpdate({ keepScreenAwake: !settings.keepScreenAwake })}
                aria-pressed={settings.keepScreenAwake}
                aria-label="Toggle keep screen awake"
              >
                <div className="toggle-thumb" />
              </button>
            </div>

            {/* Start with Windows */}
            <div className="settings-row">
              <div>
                <div className="settings-label">Start with Windows</div>
                <div className="settings-desc">
                  {isElectron
                    ? 'Automatically launch FLIPLY on system login'
                    : 'Configurable in FLIPLY Windows desktop app'}
                </div>
              </div>
              <button
                type="button"
                className={`toggle-switch ${settings.startWithWindows ? 'active' : ''}`}
                onClick={() => {
                  const nextVal = !settings.startWithWindows;
                  onUpdate({ startWithWindows: nextVal });
                  if (typeof window !== 'undefined' && window.electronAPI?.setStartup) {
                    window.electronAPI.setStartup(nextVal).catch(() => {});
                  }
                }}
                disabled={!isElectron}
                aria-pressed={settings.startWithWindows}
                aria-label="Toggle start with Windows"
                style={{ opacity: isElectron ? 1 : 0.6 }}
              >
                <div className="toggle-thumb" />
              </button>
            </div>
          </div>

          {/* BATTERY / POWER SECTION */}
          <div className="settings-section">
            <span className="settings-section-title">Battery / Power</span>

            <div className="settings-row">
              <div>
                <div className="settings-label">Show Battery / Power Status</div>
                <div className="settings-desc">Display real device power and battery indicator</div>
              </div>
              <button
                type="button"
                className={`toggle-switch ${settings.showBattery ? 'active' : ''}`}
                onClick={() => onUpdate({ showBattery: !settings.showBattery })}
                aria-pressed={settings.showBattery}
                aria-label="Toggle battery and power status display"
              >
                <div className="toggle-thumb" />
              </button>
            </div>

            <div className="settings-row">
              <div>
                <div className="settings-label">Charging Indicator</div>
                <div className="settings-desc">Show charging icon and status when plugged in</div>
              </div>
              <button
                type="button"
                className={`toggle-switch ${settings.showChargingIndicator !== false ? 'active' : ''}`}
                onClick={() =>
                  onUpdate({
                    showChargingIndicator: !(settings.showChargingIndicator !== false),
                  })
                }
                aria-pressed={settings.showChargingIndicator !== false}
                aria-label="Toggle charging indicator"
              >
                <div className="toggle-thumb" />
              </button>
            </div>

            <div className="settings-row">
              <div>
                <div className="settings-label">Battery Saver / Power Saving Indicator</div>
                <div className="settings-desc">Show Battery Saver, Energy Saver, or Low Power Mode indicator</div>
              </div>
              <button
                type="button"
                className={`toggle-switch ${settings.showPowerSavingIndicator !== false ? 'active' : ''}`}
                onClick={() =>
                  onUpdate({
                    showPowerSavingIndicator: !(settings.showPowerSavingIndicator !== false),
                  })
                }
                aria-pressed={settings.showPowerSavingIndicator !== false}
                aria-label="Toggle battery saver and power saving indicator"
              >
                <div className="toggle-thumb" />
              </button>
            </div>

            {/* DEVELOPMENT BATTERY TEST */}
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="settings-label text-xs uppercase tracking-wider font-semibold text-white/90">
                    Battery State Preview
                  </div>
                  <div className="settings-desc text-[11.5px] text-white/50">
                    Development test controls for browser preview
                  </div>
                </div>
                {previewState && (
                  <span className="text-[10.5px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-white/80">
                    {previewState === 'powersaving' ? 'Battery Saver' : previewState}
                  </span>
                )}
              </div>

              {/* 3 State Preview Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {/* NORMAL BUTTON */}
                <button
                  type="button"
                  className={`px-3 py-2.5 rounded-lg font-medium text-xs border transition-all flex flex-col items-center justify-center gap-1.5 ${
                    previewState === 'normal'
                      ? 'bg-white/20 border-white/70 text-white shadow ring-1 ring-white/40'
                      : 'bg-black/30 border-white/10 text-white/75 hover:bg-white/10 hover:text-white hover:border-white/30'
                  }`}
                  onClick={() => handlePreviewSelect('normal')}
                  aria-pressed={previewState === 'normal'}
                >
                  <svg
                    width="24"
                    height="12"
                    viewBox="0 0 25 13"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="shrink-0 text-slate-200"
                    aria-hidden="true"
                  >
                    <rect x="1" y="1" width="20" height="11" rx="2.4" ry="2.4" stroke="currentColor" strokeWidth="1.2" />
                    <rect x="22" y="4" width="1.8" height="5" rx="0.9" ry="0.9" fill="currentColor" />
                    <rect x="2.4" y="2.4" width="12" height="8.2" rx="1.2" fill="currentColor" />
                  </svg>
                  <span>Normal</span>
                </button>

                {/* CHARGING BUTTON */}
                <button
                  type="button"
                  className={`px-3 py-2.5 rounded-lg font-medium text-xs border transition-all flex flex-col items-center justify-center gap-1.5 ${
                    previewState === 'charging'
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow ring-1 ring-emerald-500/50'
                      : 'bg-black/30 border-white/10 text-white/75 hover:bg-emerald-950/30 hover:text-emerald-300 hover:border-emerald-500/40'
                  }`}
                  onClick={() => handlePreviewSelect('charging')}
                  aria-pressed={previewState === 'charging'}
                >
                  <svg
                    width="24"
                    height="12"
                    viewBox="0 0 25 13"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="shrink-0 text-emerald-400"
                    aria-hidden="true"
                  >
                    <rect x="1" y="1" width="20" height="11" rx="2.4" ry="2.4" stroke="currentColor" strokeWidth="1.2" />
                    <rect x="22" y="4" width="1.8" height="5" rx="0.9" ry="0.9" fill="currentColor" />
                    <rect x="2.4" y="2.4" width="12" height="8.2" rx="1.2" fill="currentColor" />
                    <path
                      d="M 11.6 2.0 L 8.6 6.5 H 11.4 L 10.4 11.0 L 13.6 6.0 H 10.6 Z"
                      fill="#4ade80"
                      stroke="#000000"
                      strokeWidth="0.6"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Charging</span>
                </button>

                {/* BATTERY SAVER BUTTON */}
                <button
                  type="button"
                  className={`px-3 py-2.5 rounded-lg font-medium text-xs border transition-all flex flex-col items-center justify-center gap-1.5 ${
                    previewState === 'powersaving'
                      ? 'bg-amber-950/60 border-amber-500 text-amber-300 shadow ring-1 ring-amber-500/50'
                      : 'bg-black/30 border-white/10 text-white/75 hover:bg-amber-950/30 hover:text-amber-300 hover:border-amber-500/40'
                  }`}
                  onClick={() => handlePreviewSelect('powersaving')}
                  aria-pressed={previewState === 'powersaving'}
                >
                  <svg
                    width="24"
                    height="12"
                    viewBox="0 0 25 13"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="shrink-0 text-amber-400"
                    aria-hidden="true"
                  >
                    <rect x="1" y="1" width="20" height="11" rx="2.4" ry="2.4" stroke="currentColor" strokeWidth="1.2" />
                    <rect x="22" y="4" width="1.8" height="5" rx="0.9" ry="0.9" fill="currentColor" />
                    <rect x="2.4" y="2.4" width="12" height="8.2" rx="1.2" fill="currentColor" />
                  </svg>
                  <span>Battery Saver</span>
                </button>
              </div>

              {/* RESET BATTERY PREVIEW BUTTON */}
              <button
                type="button"
                className="w-full py-2 px-3 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                onClick={handleResetPreview}
              >
                <RotateCcw size={12} className="text-white/60" />
                <span>Reset Battery Preview</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="settings-footer">
          <button
            type="button"
            className="settings-reset-btn flex items-center gap-1.5"
            onClick={onReset}
          >
            <RotateCcw size={13} />
            <span>Reset to Defaults</span>
          </button>

          <div className="settings-shortcuts">
            <span className="kbd">F11</span> Fullscreen
            <span className="kbd">S</span> Sec
            <span className="kbd">D</span> Date
            <span className="kbd">T</span> Theme
            <span className="kbd">Space</span> Settings
          </div>
        </div>
      </div>
    </div>
  );
};
