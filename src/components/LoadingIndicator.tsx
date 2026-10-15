import React from 'react';

interface LoadingIndicatorProps {
  message?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message = 'Loading real-time data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3 min-h-[200px]">
      <div className="w-10 h-10 border-4 border-[#079889] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm font-medium text-slate-500">{message}</p>
    </div>
  );
};
