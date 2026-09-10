/**
 * FLIPLY — FlipClock Component
 * Coordinates the full flip clock display (Hours, Minutes, Seconds, AM/PM)
 */

import React, { memo } from 'react';
import { ClockSettings, ClockTime } from '../types';
import { splitDigits } from '../utils/clockUtils';
import { FlipDigit } from './FlipDigit';

interface FlipClockProps {
  time: ClockTime;
  settings: ClockSettings;
}

export const FlipClock: React.FC<FlipClockProps> = memo(({ time, settings }) => {
  const [h1, h2] = splitDigits(time.hours);
  const [m1, m2] = splitDigits(time.minutes);
  const [s1, s2] = splitDigits(time.seconds);

  const {
    clockSize,
    flipSpeed,
    digitSpacing,
    separator,
    showSeconds,
    format,
    customBgColor,
    customDigitColor,
  } = settings;

  const renderSeparator = () => {
    if (separator === 'blank') {
      return <div className="flip-separator-blank" style={{ margin: `0 ${digitSpacing / 2}px` }} />;
    }
    if (separator === '·') {
      return (
        <div className="flip-separator" style={{ margin: `0 ${digitSpacing / 2}px` }}>
          <div className="flip-separator-dot" />
        </div>
      );
    }
    // Default ':'
    return (
      <div className="flip-separator" style={{ margin: `0 ${digitSpacing / 2}px` }}>
        <div className="flip-separator-dot" />
        <div className="flip-separator-dot" />
      </div>
    );
  };

  const pairGapStyle = { gap: `${digitSpacing}px` };

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`flip-clock-container clock-size-${clockSize}`}
        role="timer"
        aria-live="polite"
        aria-label={`Time: ${time.hours}:${time.minutes}${showSeconds ? `:${time.seconds}` : ''} ${format === '12h' ? (time.isPM ? 'PM' : 'AM') : ''}`}
      >
        {/* Hours Pair */}
        <div className="flex items-center" style={pairGapStyle}>
          <FlipDigit
            digit={h1}
            flipSpeed={flipSpeed}
            customBgColor={customBgColor}
            customDigitColor={customDigitColor}
          />
          <FlipDigit
            digit={h2}
            flipSpeed={flipSpeed}
            customBgColor={customBgColor}
            customDigitColor={customDigitColor}
          />
        </div>

        {/* Separator between Hours and Minutes */}
        {renderSeparator()}

        {/* Minutes Pair */}
        <div className="flex items-center" style={pairGapStyle}>
          <FlipDigit
            digit={m1}
            flipSpeed={flipSpeed}
            customBgColor={customBgColor}
            customDigitColor={customDigitColor}
          />
          <FlipDigit
            digit={m2}
            flipSpeed={flipSpeed}
            customBgColor={customBgColor}
            customDigitColor={customDigitColor}
          />
        </div>

        {/* Optional Seconds Pair */}
        {showSeconds && (
          <>
            {renderSeparator()}
            <div className="flex items-center" style={pairGapStyle}>
              <FlipDigit
                digit={s1}
                flipSpeed={flipSpeed}
                customBgColor={customBgColor}
                customDigitColor={customDigitColor}
              />
              <FlipDigit
                digit={s2}
                flipSpeed={flipSpeed}
                customBgColor={customBgColor}
                customDigitColor={customDigitColor}
              />
            </div>
          </>
        )}
      </div>

      {/* 12-Hour AM / PM indicator */}
      {format === '12h' && (
        <div className="flip-meridiem">
          {time.isPM ? 'PM' : 'AM'}
        </div>
      )}
    </div>
  );
});

FlipClock.displayName = 'FlipClock';
