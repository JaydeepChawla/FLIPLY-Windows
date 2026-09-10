/**
 * FLIPLY — ThemeSelector Component
 * Quick visual theme picker
 */

import React, { useEffect, useRef } from 'react';
import { ThemeId } from '../types';
import { THEMES } from '../utils/clockUtils';
import { X } from 'lucide-react';

interface ThemeSelectorProps {
  isOpen: boolean;
  currentTheme: ThemeId;
  onSelectTheme: (theme: ThemeId) => void;
  onClose: () => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  isOpen,
  currentTheme,
  onSelectTheme,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

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

  if (!isOpen) return null;

  return (
    <div
      className="settings-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Choose Theme"
    >
      <div
        ref={modalRef}
        className="settings-modal"
        style={{ maxWidth: '420px' }}
      >
        <div className="settings-header">
          <span className="settings-title">Themes</span>
          <button
            type="button"
            className="settings-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="settings-content">
          <div className="theme-grid">
            {(Object.keys(THEMES) as ThemeId[]).map((id) => {
              const t = THEMES[id];
              const isActive = currentTheme === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={`theme-swatch ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    onSelectTheme(id);
                    onClose();
                  }}
                  aria-pressed={isActive}
                  aria-label={`Select ${t.name} theme`}
                >
                  <div
                    className="theme-swatch-circle"
                    style={{
                      backgroundColor: t.bg,
                      borderColor: t.accent,
                    }}
                  />
                  <span className="theme-swatch-name">{t.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
