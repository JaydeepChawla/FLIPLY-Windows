/**
 * FLIPLY — useSettings Hook
 * Persistent configuration across Web localStorage and Electron safe store
 */

import { useCallback, useEffect, useState } from 'react';
import { ClockSettings } from '../types';
import { DEFAULT_SETTINGS } from '../utils/clockUtils';

const STORAGE_KEY = 'fliply_clock_settings_v1';

export function useSettings() {
  const [settings, setSettings] = useState<ClockSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return { ...DEFAULT_SETTINGS, ...parsed };
        }
      } catch {
        // localStorage not available or JSON parse failed
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Load from Electron IPC if running in desktop mode
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI?.getSettings) {
      window.electronAPI.getSettings().then((electronSettings) => {
        if (electronSettings) {
          setSettings((prev) => ({ ...prev, ...electronSettings }));
        }
      }).catch(() => {});
    }
  }, []);

  const updateSettings = useCallback((updater: Partial<ClockSettings> | ((prev: ClockSettings) => ClockSettings)) => {
    setSettings((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      
      // Persist to web localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore localStorage errors
      }

      // Persist to Electron if available
      if (typeof window !== 'undefined' && window.electronAPI?.saveSettings) {
        window.electronAPI.saveSettings(next).catch(() => {});
      }

      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch {}

    if (typeof window !== 'undefined' && window.electronAPI?.saveSettings) {
      window.electronAPI.saveSettings(DEFAULT_SETTINGS).catch(() => {});
    }
  }, []);

  return { settings, updateSettings, resetSettings };
}
