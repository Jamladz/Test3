import React from 'react';

interface GramIconProps {
  className?: string;
  size?: number;
}

export function GramIcon({ className = '', size = 20 }: GramIconProps) {
  return (
    <span 
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src="https://i.suar.me/EpN7r/l"
        alt="GRAM"
        className="w-full h-full object-contain rounded-full drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]"
        onError={(e) => {
          // Fallback if image network fails
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    </span>
  );
}
