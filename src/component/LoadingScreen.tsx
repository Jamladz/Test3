import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingScreen = ({ onComplete }: { onComplete?: () => void }) => {
  useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(onComplete, 1500);
      return () => clearTimeout(timer);
    }
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900 flex flex-col items-center justify-center text-white">
      <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
      <p className="font-bold animate-pulse">Loading Application...</p>
    </div>
  );
};
