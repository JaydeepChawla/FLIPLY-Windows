/**
 * FLIPLY — DateDisplay Component
 * Displays formatted local date accurately
 */

import React, { memo } from 'react';

interface DateDisplayProps {
  showDate: boolean;
  dateText: string;
}

export const DateDisplay: React.FC<DateDisplayProps> = memo(({
  showDate,
  dateText,
}) => {
  if (!showDate) {
    return null;
  }

  return (
    <div
      className="clock-date-container"
      role="region"
      aria-label={`Current date: ${dateText}`}
    >
      {dateText}
    </div>
  );
});

DateDisplay.displayName = 'DateDisplay';
