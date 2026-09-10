/**
 * FLIPLY — useBattery Hook
 * Central Battery State Management supporting:
 * - Central BatteryDisplayState: 'normal' | 'charging' | 'powersaving'
 * - Development Battery Test Preview override for browser preview
 * - Native Windows Bridge (window.fliplyNativeBattery) with real Win32/PowerShell APIs
 * - Web Battery Status API (navigator.getBattery)
 *
 * Strict Priority: Charging > Power Saving > Normal
 * No persistent storage for dev preview: temporary in-memory override only.
 */

import { useEffect, useState } from 'react';
import {
  BatteryDisplayState,
  BatteryState,
  FliplyNativeBatteryData,
  PlatformType,
} from '../types';
import { computeBatteryStatus, detectPlatform } from '../utils/clockUtils';

export type { BatteryDisplayState };

interface NavigatorBatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  onchargingchange: ((event: Event) => void) | null;
  onlevelchange: ((event: Event) => void) | null;
  onchargingtimechange: ((event: Event) => void) | null;
  ondischargingtimechange: ((event: Event) => void) | null;
  addEventListener(type: string, listener: (event: Event) => void): void;
  removeEventListener(type: string, listener: (event: Event) => void): void;
}

// Global in-memory development preview override
// Strictly in-memory: refreshes revert to real battery detection
let devPreviewOverride: BatteryDisplayState | null = null;
let lastKnownRealLevel: number = 70;
let lastKnownRealCharging: boolean = false;
let lastKnownRealHasBattery: boolean = true;
const hookSubscribers = new Set<() => void>();

function notifyHookSubscribers() {
  hookSubscribers.forEach((fn) => {
    try {
      fn();
    } catch {
      // ignore
    }
  });
}

/**
 * Set development battery preview override
 * Immediately updates FLIPLY without page reload.
 */
export function setBatteryPreviewOverride(state: BatteryDisplayState | null): void {
  devPreviewOverride = state;
  notifyHookSubscribers();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('fliplyBatteryChange', {
        detail: { previewState: state },
      })
    );
  }
}

/**
 * Get current development preview override
 */
export function getBatteryPreviewOverride(): BatteryDisplayState | null {
  return devPreviewOverride;
}

/**
 * Reset development battery preview to real device status
 */
export function resetBatteryPreview(): void {
  setBatteryPreviewOverride(null);
}

function getEffectiveStatusSnapshot(): FliplyNativeBatteryData {
  const preview = devPreviewOverride;
  if (preview) {
    return {
      level: Math.max(0, Math.min(1, (lastKnownRealLevel || 70) / 100)),
      charging: preview === 'charging',
      powerSaving: preview === 'powersaving',
      powerSavingLabel: preview === 'powersaving' ? 'Battery Saver' : '',
      hasBattery: true,
      platform: 'windows',
    };
  }

  const levelDecimal = Math.max(0, Math.min(1, Math.round(lastKnownRealLevel) / 100));
  return {
    level: levelDecimal,
    charging: lastKnownRealCharging,
    powerSaving: false,
    powerSavingLabel: 'Battery Saver',
    hasBattery: lastKnownRealHasBattery,
    platform: detectPlatform(),
  };
}

// Attach developer helpers to window for easy browser testing
if (typeof window !== 'undefined') {
  window.fliplyTestBatteryState = (
    mode: string,
    label?: string,
    level?: number
  ) => {
    const rawMode = (mode || '').toLowerCase().replace(/[\s-_]/g, '');

    if (rawMode === 'reset' || rawMode === 'clear' || rawMode === 'real') {
      setBatteryPreviewOverride(null);
      return;
    }

    if (typeof level === 'number' && !isNaN(level)) {
      lastKnownRealLevel =
        level <= 1 && level > 0 ? Math.round(level * 100) : Math.round(level);
    }

    if (
      rawMode === 'powersaving' ||
      rawMode === 'batterysaver' ||
      rawMode === 'energysaver' ||
      rawMode === 'lowpower'
    ) {
      setBatteryPreviewOverride('powersaving');
    } else if (rawMode === 'charging') {
      setBatteryPreviewOverride('charging');
    } else {
      setBatteryPreviewOverride('normal');
    }
  };

  window.fliplyResetBatteryPreview = () => {
    setBatteryPreviewOverride(null);
  };

  // Provide fallback bridge if not already injected by Electron
  if (!window.fliplyNativeBattery) {
    window.fliplyNativeBattery = {
      getStatus: async (): Promise<FliplyNativeBatteryData> => {
        return getEffectiveStatusSnapshot();
      },
    };
  }
}

function extractNativeBatteryData(raw: unknown): {
  platform?: PlatformType | string;
  level: number | null;
  charging: boolean;
  powerSaving: boolean;
  powerSavingLabel?: string;
  hasBattery: boolean;
} | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const hasBattery =
    typeof obj.hasBattery === 'boolean'
      ? obj.hasBattery
      : obj.level !== null && obj.level !== undefined;

  let level: number | null = null;
  if (hasBattery && typeof obj.level === 'number') {
    const rawLevel = obj.level;
    level =
      rawLevel <= 1 && rawLevel > 0
        ? Math.max(0, Math.min(100, Math.round(rawLevel * 100)))
        : Math.max(0, Math.min(100, Math.round(rawLevel)));
  }

  const charging = Boolean(obj.charging);
  const powerSaving = Boolean(obj.powerSaving);
  const platform = typeof obj.platform === 'string' ? obj.platform : undefined;
  const powerSavingLabel =
    typeof obj.powerSavingLabel === 'string' && obj.powerSavingLabel
      ? obj.powerSavingLabel
      : undefined;

  return {
    platform,
    level,
    charging,
    powerSaving,
    powerSavingLabel,
    hasBattery,
  };
}

async function getNativeFliplyBattery(): Promise<{
  platform?: PlatformType | string;
  level: number | null;
  charging: boolean;
  powerSaving: boolean;
  powerSavingLabel?: string;
  hasBattery: boolean;
} | null> {
  if (typeof window === 'undefined' || !window.fliplyNativeBattery) {
    return null;
  }
  const bridge = window.fliplyNativeBattery;
  if (typeof bridge.getStatus === 'function') {
    try {
      const res = await bridge.getStatus();
      return extractNativeBatteryData(res);
    } catch {
      return null;
    }
  }
  return extractNativeBatteryData(bridge);
}

function resolveBatteryState(
  rawLevel: number | null,
  rawCharging: boolean,
  rawPowerSaving: boolean | null,
  rawPowerSavingLabel?: string,
  rawHasBattery: boolean = true,
  platform: PlatformType | string = detectPlatform()
): BatteryState {
  let effectiveLevel = rawLevel;
  let effectiveCharging = rawCharging;
  let effectivePowerSaving = rawPowerSaving;
  let effectiveLabel = rawPowerSavingLabel;
  let effectiveHasBattery = rawHasBattery;
  let displayState: BatteryDisplayState = 'normal';

  // Apply development preview override if active
  if (devPreviewOverride) {
    effectiveHasBattery = true;
    effectiveLevel = typeof rawLevel === 'number' && !isNaN(rawLevel) ? rawLevel : (lastKnownRealLevel || 70);

    if (devPreviewOverride === 'charging') {
      displayState = 'charging';
      effectiveCharging = true;
      effectivePowerSaving = false;
      effectiveLabel = undefined;
    } else if (devPreviewOverride === 'powersaving') {
      displayState = 'powersaving';
      effectiveCharging = false;
      effectivePowerSaving = true;
      effectiveLabel = 'Battery Saver';
    } else {
      displayState = 'normal';
      effectiveCharging = false;
      effectivePowerSaving = false;
      effectiveLabel = undefined;
    }
  } else {
    // Normal resolution based on real hardware state
    if (effectiveCharging) {
      displayState = 'charging';
    } else if (effectivePowerSaving === true) {
      displayState = 'powersaving';
    } else {
      displayState = 'normal';
    }
  }

  // Update tracking caches with real level
  if (typeof effectiveLevel === 'number' && !isNaN(effectiveLevel)) {
    lastKnownRealLevel = effectiveLevel;
  }
  lastKnownRealCharging = effectiveCharging;
  lastKnownRealHasBattery = effectiveHasBattery;

  const { status, statusText } = computeBatteryStatus(
    effectiveLevel ?? 70,
    effectiveCharging
  );

  return {
    available: true,
    hasBattery: effectiveHasBattery,
    platform,
    level: effectiveLevel ?? 70,
    charging: effectiveCharging,
    powerSaving: effectivePowerSaving,
    powerSavingLabel: effectiveLabel,
    status,
    statusText: effectivePowerSaving ? (effectiveLabel || 'Battery Saver') : statusText,
    displayState,
    previewOverride: devPreviewOverride,
    setPreviewOverride: setBatteryPreviewOverride,
  };
}

export function useBattery(): BatteryState {
  const [batteryState, setBatteryState] = useState<BatteryState>(() =>
    resolveBatteryState(lastKnownRealLevel, lastKnownRealCharging, null, undefined, true)
  );

  useEffect(() => {
    let isMounted = true;
    let batteryManager: NavigatorBatteryManager | null = null;
    let nativePollId: ReturnType<typeof setInterval> | null = null;
    let syncIntervalId: ReturnType<typeof setInterval> | null = null;

    // Direct synchronous subscriber for preview buttons & window.fliplyTestBatteryState
    const handleSimulationOrEvent = () => {
      if (!isMounted) return;
      setBatteryState((prev) =>
        resolveBatteryState(
          prev.level,
          prev.charging,
          prev.powerSaving,
          prev.powerSavingLabel,
          prev.hasBattery,
          prev.platform
        )
      );
    };

    hookSubscribers.add(handleSimulationOrEvent);
    if (typeof window !== 'undefined') {
      window.addEventListener('fliplyBatteryChange', handleSimulationOrEvent);
    }

    // 1. Check Native Fliply Battery Bridge
    const syncNativeBattery = async (): Promise<boolean> => {
      // If a preview override is active, immediately resolve with preview state
      if (devPreviewOverride) {
        handleSimulationOrEvent();
        return true;
      }

      const nativeData = await getNativeFliplyBattery();
      if (nativeData && isMounted) {
        setBatteryState(
          resolveBatteryState(
            nativeData.level,
            nativeData.charging,
            nativeData.powerSaving,
            nativeData.powerSavingLabel,
            nativeData.hasBattery,
            nativeData.platform || detectPlatform()
          )
        );
        return true;
      }
      return false;
    };

    if (typeof window !== 'undefined') {
      const bridge = window.fliplyNativeBattery;
      if (bridge && typeof bridge.addEventListener === 'function') {
        try {
          bridge.addEventListener('change', () => {
            syncNativeBattery();
          });
        } catch {
          // ignore
        }
      }
    }

    syncNativeBattery().then((hasNative) => {
      if (!isMounted) return;

      if (hasNative && !devPreviewOverride && typeof window !== 'undefined' && window.electronAPI) {
        // Poll native bridge periodically for changes in Electron
        nativePollId = setInterval(syncNativeBattery, 4000);
        return;
      }

      // 2. Electron API fallback
      if (
        !hasNative &&
        !devPreviewOverride &&
        typeof window !== 'undefined' &&
        window.electronAPI?.getBatteryStatus
      ) {
        const fetchElectronBattery = async () => {
          try {
            const raw = await window.electronAPI!.getBatteryStatus();
            if (raw && isMounted && !devPreviewOverride) {
              setBatteryState(
                resolveBatteryState(
                  raw.level,
                  raw.charging,
                  raw.powerSaving ?? null,
                  raw.powerSavingLabel,
                  raw.hasBattery !== false,
                  raw.platform || 'windows'
                )
              );
            }
          } catch {
            if (isMounted && !devPreviewOverride) {
              setBatteryState((prev) => ({
                ...prev,
                hasBattery: false,
                powerSaving: null,
              }));
            }
          }
        };

        fetchElectronBattery();
        syncIntervalId = setInterval(fetchElectronBattery, 5000);
        return;
      }

      // 3. Browser Battery Status API (Web Fallback)
      if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
        const updateBatteryInfo = (bm: NavigatorBatteryManager) => {
          if (!isMounted) return;

          const levelPct = Math.round(bm.level * 100);
          lastKnownRealLevel = levelPct;
          lastKnownRealCharging = bm.charging;

          // Do NOT treat navigator.getBattery() as a Windows Battery Saver detector.
          // Power saving is only true if native bridge or preview override specifies it.
          setBatteryState(
            resolveBatteryState(
              levelPct,
              bm.charging,
              null, // Browser cannot detect OS power-saving mode
              undefined,
              true,
              detectPlatform()
            )
          );
        };

        const handleBatteryEvent = () => {
          if (batteryManager) {
            updateBatteryInfo(batteryManager);
          }
        };

        (navigator as unknown as { getBattery: () => Promise<NavigatorBatteryManager> })
          .getBattery()
          .then((bm) => {
            if (!isMounted) return;
            batteryManager = bm;
            updateBatteryInfo(bm);

            bm.addEventListener('chargingchange', handleBatteryEvent);
            bm.addEventListener('levelchange', handleBatteryEvent);
            bm.addEventListener('chargingtimechange', handleBatteryEvent);
            bm.addEventListener('dischargingtimechange', handleBatteryEvent);

            bm.onchargingchange = handleBatteryEvent;
            bm.onlevelchange = handleBatteryEvent;

            syncIntervalId = setInterval(() => {
              if (batteryManager && isMounted) {
                updateBatteryInfo(batteryManager);
              }
            }, 6000);
          })
          .catch(() => {
            if (isMounted) {
              setBatteryState(
                resolveBatteryState(lastKnownRealLevel, false, null, undefined, true)
              );
            }
          });
        return;
      }

      // Battery API not supported by this browser
      setBatteryState(
        resolveBatteryState(lastKnownRealLevel, false, null, undefined, true)
      );
    });

    return () => {
      isMounted = false;
      hookSubscribers.delete(handleSimulationOrEvent);
      if (nativePollId) {
        clearInterval(nativePollId);
      }
      if (syncIntervalId) {
        clearInterval(syncIntervalId);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('fliplyBatteryChange', handleSimulationOrEvent);
      }
      if (batteryManager) {
        batteryManager.removeEventListener('chargingchange', () => {});
        batteryManager.removeEventListener('levelchange', () => {});
        batteryManager.removeEventListener('chargingtimechange', () => {});
        batteryManager.removeEventListener('dischargingtimechange', () => {});
        batteryManager.onchargingchange = null;
        batteryManager.onlevelchange = null;
      }
    };
  }, []);

  return batteryState;
}
