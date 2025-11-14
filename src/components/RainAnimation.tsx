import React from "react";

export const RainAnimation: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="w-full h-full opacity-30" aria-hidden>
        {/* Simple CSS-based subtle rain lines for background */}
        <div className="relative w-full h-full">
          <div className="absolute -left-8 top-0 w-[2px] h-full bg-gradient-to-b from-transparent to-white/10 animate-[rain_6s_linear_infinite]" />
        </div>
      </div>
    </div>
  );
};

export default RainAnimation;
