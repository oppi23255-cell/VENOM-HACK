import React, { useEffect, useState } from 'react';
import { TranslationStrings } from '../i18n/translations';

interface TopHeaderProps {
  t: TranslationStrings;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ t }) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const datePart = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
  const dayPart = t.days[now.getDay()] || '';
  const timePart = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  return (
    <header
      className="fixed top-0 left-0 w-full px-[15px] py-[10px] bg-black/40 border-b border-[#ff0800]/25 flex justify-between items-center z-[100] backdrop-blur-[10px]"
      dir="rtl"
    >
      <div className="flex items-center gap-[5px] font-black text-[clamp(11px,3vw,15px)] whitespace-nowrap">
        <span className="text-[#B30600] font-mono tabular-nums text-[clamp(14px,3.5vw,18px)]">
          {timePart}
        </span>
        <span className="text-white/40">|</span>
        <span className="text-[#ff5a55]">{dayPart}</span>
        <span className="text-white/40">-</span>
        <span className="text-[#ff0800] tabular-nums">{datePart}</span>
      </div>

      <div className="flex items-center" dir="ltr">
        <a
          href="https://t.me/+DUYca9dWCGU1MjI0"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#ff0800] hover:text-white transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_10px_rgba(255,8,0,0.7)] shrink-0"
          aria-label="تيليجرام"
        >
          <svg viewBox="0 0 24 24" className="w-[24px] h-[24px] fill-current">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
          </svg>
        </a>
      </div>
    </header>
  );
};
