import React from 'react';
import { getDateDividerText } from '../../utils/dateUtils';

interface DateDividerProps {
  timestamp: Date | string;
}

export const DateDivider: React.FC<DateDividerProps> = ({ timestamp }) => {
  const dividerText = getDateDividerText(timestamp);

  return (
    <div className="flex items-center justify-center my-4">
      <div className="bg-gray-700 text-gray-300 text-xs px-3 py-1 rounded-full font-medium">
        {dividerText}
      </div>
    </div>
  );
};
