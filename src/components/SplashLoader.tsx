import React from 'react';

interface SplashLoaderProps {
  onFinish: () => void;
}

export const SplashLoader: React.FC<SplashLoaderProps> = ({ onFinish }) => {
  return (
    <div
      onClick={onFinish}
      className="splash-screen fixed inset-0 z-[10000] flex flex-col items-center justify-center cursor-pointer select-none"
      role="status"
      aria-label="Loading VENOM HACK"
    >
      <img
        src="/assets/aistudio/photo_2026-11-18_04-40-37_92c1121a.jpg"
        alt="VENOM HACK"
        className="splash-logo w-[110px] h-[110px] max-[480px]:w-[85px] max-[480px]:h-[85px] rounded-full object-cover border-2 border-[#ff0800]/60 bg-[#0b1014]"
      />
      <div className="splash-title text-[28px] max-[480px]:text-[22px] font-black mt-[14px]">
        VENOM HACK
      </div>
      <div className="splash-spinner mt-[25px]" />
    </div>
  );
};
