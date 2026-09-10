/**
 * FLIPLY — Minimalist Realistic Flip Clock
 * Web Application, Windows Desktop Application & Screen Saver
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useClock } from './hooks/useClock';
import { useBattery } from './hooks/useBattery';
import { useSettings } from './hooks/useSettings';
import { useWakeLock } from './hooks/useWakeLock';
import { useMouseActivity } from './hooks/useMouseActivity';
import { FlipClock } from './components/FlipClock';
import { DateDisplay } from './components/DateDisplay';
import { BatteryIndicator } from './components/BatteryIndicator';
import { Controls } from './components/Controls';
import { SettingsPanel } from './components/SettingsPanel';
import { ThemeSelector } from './components/ThemeSelector';
import { THEMES, formatCustomDate } from './utils/clockUtils';
import { ThemeId } from './types';

import './styles/themes.css';
import './styles/clock.css';
import './styles/settings.css';
import './styles/app.css';

export default function App() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const time = useClock(settings.format);
  const battery = useBattery();
  useWakeLock(settings.keepScreenAwake);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Detect if running in Electron and/or Screen Saver mode
  const isElectron = typeof window !== 'undefined' && Boolean(window.electronAPI?.isElectron);
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isScreenSaver = Boolean(
    (typeof window !== 'undefined' && window.electronAPI?.isScreenSaver) ||
    urlParams?.get('screensaver') === 'true' ||
    urlParams?.get('mode') === 'screensaver'
  );

  // Screen saver exit action on mouse/keyboard interaction
  const handleScreenSaverExit = useCallback(() => {
    if (isScreenSaver) {
      if (window.electronAPI?.exitScreenSaver) {
        window.electronAPI.exitScreenSaver();
      } else if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, [isScreenSaver]);

  const { isInactive } = useMouseActivity(3000, handleScreenSaverExit, isScreenSaver);

  // Fullscreen management
  const toggleFullscreen = useCallback(async () => {
    if (isElectron && window.electronAPI?.toggleFullscreen) {
      const state = await window.electronAPI.toggleFullscreen();
      setIsFullscreen(state);
      return;
    }

    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Fullscreen not allowed or cancelled
    }
  }, [isElectron]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Theme cycler for shortcut 'T'
  const cycleTheme = useCallback(() => {
    const themeKeys = Object.keys(THEMES) as ThemeId[];
    const currentIndex = themeKeys.indexOf(settings.theme);
    const nextIndex = (currentIndex + 1) % themeKeys.length;
    updateSettings({
      theme: themeKeys[nextIndex],
      customBgColor: null,
      customDigitColor: null,
    });
  }, [settings.theme, updateSettings]);

  // Keyboard Shortcuts: F11, S, D, T, Space, Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing inside form inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        return;
      }

      // F11: Fullscreen
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
        return;
      }

      // S: Toggle seconds
      if (e.key === 's' || e.key === 'S') {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          updateSettings((prev) => ({ ...prev, showSeconds: !prev.showSeconds }));
        }
        return;
      }

      // D: Toggle date
      if (e.key === 'd' || e.key === 'D') {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          updateSettings((prev) => ({ ...prev, showDate: !prev.showDate }));
        }
        return;
      }

      // T: Cycle theme
      if (e.key === 't' || e.key === 'T') {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          cycleTheme();
        }
        return;
      }

      // Space: Toggle settings
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsSettingsOpen((prev) => !prev);
        setIsThemeSelectorOpen(false);
        return;
      }

      // Esc: Close settings / theme selector or exit fullscreen
      if (e.key === 'Escape') {
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
          return;
        }
        if (isThemeSelectorOpen) {
          setIsThemeSelectorOpen(false);
          return;
        }
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen, updateSettings, cycleTheme, isSettingsOpen, isThemeSelectorOpen]);

  // Dynamic custom styling for background override
  const containerStyle: React.CSSProperties = {
    ...(settings.customBgColor ? { backgroundColor: settings.customBgColor } : {}),
  };

  return (
    <main
      className={`fliply-app ${isInactive ? 'cursor-hidden' : ''} ${isScreenSaver ? 'screensaver-active' : ''}`}
      data-theme={settings.theme}
      style={containerStyle}
    >
      {/* Top-Right Minimal Controls */}
      <Controls
        faded={isInactive && !isSettingsOpen && !isThemeSelectorOpen}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onOpenTheme={() => {
          setIsThemeSelectorOpen(true);
          setIsSettingsOpen(false);
        }}
        onOpenSettings={() => {
          setIsSettingsOpen(true);
          setIsThemeSelectorOpen(false);
        }}
        isScreenSaver={isScreenSaver}
      />

      {/* Main Clock Stage */}
      <div className="clock-stage">
        {/* The Realistic Flip Clock */}
        <FlipClock time={time} settings={settings} />

        {/* Date Display */}
        <DateDisplay
          showDate={settings.showDate && Boolean(formatCustomDate(time.rawDate, settings))}
          dateText={formatCustomDate(time.rawDate, settings)}
        />

        {/* Honest Battery Status */}
        <BatteryIndicator
          battery={battery}
          showBattery={settings.showBattery}
          showChargingIndicator={settings.showChargingIndicator}
          showPowerSavingIndicator={settings.showPowerSavingIndicator}
        />
      </div>

      {/* Settings Modal */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        settings={settings}
        onUpdate={updateSettings}
        onReset={resetSettings}
        onClose={() => setIsSettingsOpen(false)}
        isElectron={isElectron}
        battery={battery}
      />

      {/* Quick Theme Selector Modal */}
      <ThemeSelector
        isOpen={isThemeSelectorOpen}
        currentTheme={settings.theme}
        onSelectTheme={(th) => updateSettings({ theme: th })}
        onClose={() => setIsThemeSelectorOpen(false)}
      />
    </main>
  );
}
