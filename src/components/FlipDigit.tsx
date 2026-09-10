/**
 * FLIPLY — FlipDigit Component
 * Realistic split-flap mechanical flip digit.
 * Only triggers 3D flip animation when the digit value actually changes.
 */

import React, { memo, useEffect, useRef, useState } from 'react';

interface FlipDigitProps {
  digit: string;
  flipSpeed: 'slow' | 'normal' | 'fast';
  customBgColor?: string | null;
  customDigitColor?: string | null;
}

export const FlipDigit: React.FC<FlipDigitProps> = memo(({
  digit,
  flipSpeed,
  customBgColor,
  customDigitColor,
}) => {
  const [current, setCurrent] = useState(digit);
  const [previous, setPrevious] = useState(digit);
  const [isFlipping, setIsFlipping] = useState(false);
  const prevDigitRef = useRef(digit);

  useEffect(() => {
    if (digit !== prevDigitRef.current) {
      setPrevious(prevDigitRef.current);
      setCurrent(digit);
      setIsFlipping(true);
      prevDigitRef.current = digit;
    }
  }, [digit]);

  const handleAnimationEnd = () => {
    setIsFlipping(false);
    setPrevious(current);
  };

  // Custom color overrides if provided by user
  const cardStyle: React.CSSProperties = {
    ...(customBgColor ? { backgroundColor: customBgColor } : {}),
    ...(customDigitColor ? { color: customDigitColor } : {}),
  };

  return (
    <div
      className={`flip-card-unit speed-${flipSpeed}`}
      aria-label={digit}
      role="text"
    >
      {/* 1. Static Top Half: reveals the NEW digit */}
      <div className="flip-half flip-half-top flip-static-top" style={cardStyle}>
        <div className="flip-digit-inner">{current}</div>
      </div>

      {/* 2. Static Bottom Half: shows the OLD digit during flip, or NEW digit when static */}
      <div className="flip-half flip-half-bottom flip-static-bottom" style={cardStyle}>
        <div className="flip-digit-inner">{isFlipping ? previous : current}</div>
      </div>

      {/* 3. Animating Flaps (only rendered during flip cycle) */}
      {isFlipping && (
        <>
          {/* Flipping Top: shows OLD digit top half, rotating downward */}
          <div
            className="flip-half flip-half-top flip-animating-top"
            style={cardStyle}
          >
            <div className="flip-digit-inner">{previous}</div>
          </div>

          {/* Flipping Bottom: shows NEW digit bottom half, rotating into place */}
          <div
            className="flip-half flip-half-bottom flip-animating-bottom"
            style={cardStyle}
            onAnimationEnd={handleAnimationEnd}
          >
            <div className="flip-digit-inner">{current}</div>
          </div>
        </>
      )}

      {/* Center divider hairline with mechanical groove shadow */}
      <div className="flip-divider-line" />
    </div>
  );
});

FlipDigit.displayName = 'FlipDigit';
