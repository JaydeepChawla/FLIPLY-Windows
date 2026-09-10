/**
 * FLIPLY — BatteryIndicator Component
 * Clean, modern Windows 11-style battery indicator supporting:
 * - Windows Laptops: [white battery] 83% / [yellow battery] 83% Battery Saver (or Energy Saver) / [green battery + lightning] 83% Charging
 * - MacBook / Mac: [yellow battery] 83% Low Power Mode / [green battery + lightning] 83% Charging
 * - Desktop PCs (no battery): [energy icon] Energy Saver (or Eco Mode) when active; hidden when normal
 *
 * Strict Priority: Charging > Power Saving > Normal
 * Controlled by user visibility settings (showBattery, showChargingIndicator, showPowerSavingIndicator)
 * Strictly no emojis (🔋 / ⚡).
 */

import React, { memo, useId } from 'react';
import { BatteryState } from '../types';
import { formatBatteryPercentage, getBatteryVisualState } from '../utils/clockUtils';

interface BatteryIndicatorProps {
  battery: BatteryState;
  showBattery: boolean;
  showChargingIndicator?: boolean;
  showPowerSavingIndicator?: boolean;
}

export const BatteryIndicator: React.FC<BatteryIndicatorProps> = memo(({
  battery,
  showBattery,
  showChargingIndicator = true,
  showPowerSavingIndicator = true,
}) => {
  const clipId = useId();

  if (!showBattery || !battery.available) {
    return null;
  }

  const visual = getBatteryVisualState({
    charging: Boolean(battery.charging),
    powerSaving: battery.powerSaving,
    hasBattery: battery.hasBattery !== false,
    platform: battery.platform,
    powerSavingLabel: battery.powerSavingLabel,
    showBattery,
    showChargingIndicator,
    showPowerSavingIndicator,
    displayState: battery.displayState,
    previewOverride: battery.previewOverride,
  });

  if (!visual.visible) {
    return null;
  }

  // DESKTOP PC (No battery detected) in Energy Saver / Eco Mode
  if (visual.isEcoIcon) {
    const label = visual.labelText || 'Energy Saver';
    return (
      <div
        className="clock-battery-container select-none"
        role="status"
        aria-label={label}
        style={{ color: visual.color }}
      >
        {/* Modern Windows 11 Energy Saver / Eco SVG Icon */}
        <svg
          className="battery-icon-svg shrink-0"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>

        <span className="battery-charging-text font-medium">{label}</span>
      </div>
    );
  }

  // DEVICES WITH BATTERY (Laptop, MacBook, portable device)
  const roundedLevel =
    battery.level !== null && battery.level !== undefined
      ? Math.max(0, Math.min(100, Math.round(battery.level)))
      : 70;
  const percentageText = formatBatteryPercentage(roundedLevel);
  const innerFillWidth = (17.2 * roundedLevel) / 100;

  const ariaLabel = visual.labelText
    ? `Battery ${roundedLevel} percent, ${visual.labelText}`
    : `Battery ${roundedLevel} percent`;

  return (
    <div
      className="clock-battery-container select-none"
      role="status"
      aria-label={ariaLabel}
      style={{ color: visual.color }}
    >
      <svg
        className="battery-icon-svg shrink-0 select-none"
        width="25"
        height="13"
        viewBox="0 0 25 13"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <clipPath id={clipId}>
            <rect x="2.4" y="2.4" width="17.2" height="8.2" rx="1.4" ry="1.4" />
          </clipPath>
        </defs>

        {/* Battery Outline */}
        <rect
          x="1"
          y="1"
          width="20"
          height="11"
          rx="2.4"
          ry="2.4"
          stroke="currentColor"
          strokeWidth="1.2"
          fill="none"
        />

        {/* Right Terminal Cap */}
        <rect
          x="22"
          y="4"
          width="1.8"
          height="5"
          rx="0.9"
          ry="0.9"
          fill="currentColor"
        />

        {/* Dynamic Battery Fill representing battery percentage */}
        {roundedLevel > 0 && (
          <rect
            x="2.4"
            y="2.4"
            width={innerFillWidth}
            height="8.2"
            fill="currentColor"
            clipPath={`url(#${clipId})`}
          />
        )}

        {/* Windows 11 SVG Lightning Bolt (inside battery, shown only when charging) */}
        {visual.hasLightning && (
          <path
            d="M 11.6 2.0 L 8.6 6.5 H 11.4 L 10.4 11.0 L 13.6 6.0 H 10.6 Z"
            fill="#4ade80"
            stroke="#000000"
            strokeWidth="0.6"
            strokeLinejoin="round"
          />
        )}
      </svg>

      {/* Percentage displayed immediately beside the icon */}
      <span className="battery-percent-text">{percentageText}</span>

      {/* Status label (e.g. "Charging", "Battery Saver", "Energy Saver", "Low Power Mode") */}
      {visual.labelText && (
        <span className="battery-charging-text font-medium">{visual.labelText}</span>
      )}
    </div>
  );
});

BatteryIndicator.displayName = 'BatteryIndicator';


