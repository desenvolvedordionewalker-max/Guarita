import React from "react";

export const RainHeaderAnimation: React.FC = () => {
  return (
    <div className="absolute left-4 top-2 z-0 pointer-events-none" aria-hidden>
      <svg width="64" height="32" viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g" x1="0" x2="1">
            <stop offset="0%" stopColor="#00C2FF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#00FFB3" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="64" height="32" rx="6" fill="url(#g)" opacity="0.06" />
      </svg>
    </div>
  );
};

export default RainHeaderAnimation;
