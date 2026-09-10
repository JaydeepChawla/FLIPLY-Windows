/**
 * FLIPLY — Top-Right Minimal Controls
 * Subtle buttons for Fullscreen, Themes, and Settings
 */

import React, { memo } from 'react';
import { Maximize2, Minimize2, Palette, Settings as SettingsIcon } from 'lucide-react';

interface ControlsProps {
  faded: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenTheme: () => void;
  onOpenSettings: () => void;
  isScreenSaver?: boolean;
}

export const Controls: React.FC<ControlsProps> = memo(({
  faded,
  isFullscreen,
  onToggleFullscreen,
  onOpenTheme,
  onOpenSettings,
  isScreenSaver,
}) => {
  if (isScreenSaver) {
    return null;
  }

  return (
    <nav
      className={`top-controls ${faded ? 'faded' : ''}`}
      aria-label="Clock Controls"
    >
      <button
        type="button"
        className="control-btn"
        onClick={onToggleFullscreen}
        aria-label={isFullscreen ? 'Exit Fullscreen (F11 / Esc)' : 'Enter Fullscreen (F11)'}
        title={isFullscreen ? 'Exit Fullscreen (F11)' : 'Fullscreen (F11)'}
      >
        {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
      </button>

      <button
        type="button"
        className="control-btn"
        onClick={onOpenTheme}
        aria-label="Select Theme (T)"
        title="Theme (T)"
      >
        <Palette size={17} />
      </button>

      <button
        type="button"
        className="control-btn"
        onClick={onOpenSettings}
        aria-label="Open Settings (Space)"
        title="Settings (Space)"
      >
        <SettingsIcon size={17} />
      </button>
    </nav>
  );
});

Controls.displayName = 'Controls';
