import React from 'react';

interface UltrapariLogoProps {
  className?: string;
}

export const UltrapariLogo: React.FC<UltrapariLogoProps> = ({ className = 'w-[60px] h-[60px]' }) => {
  return (
    <div
      className={`${className} rounded-[12px] bg-gradient-to-br from-[#5a114c] via-[#3d0a33] to-[#1e0419] border border-[#ff0800]/30 flex items-center justify-center shadow-inner overflow-hidden`}
      aria-label="Ultrapari Logo"
    >
      <svg viewBox="0 0 64 64" className="w-[72%] h-[72%]" fill="none">
        <path
          d="M17 16V36C17 44.2843 23.7157 51 32 51C40.2843 51 47 44.2843 47 36V16"
          stroke="#ffffff"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <circle cx="32" cy="18" r="5" fill="#ff0800" />
      </svg>
    </div>
  );
};
