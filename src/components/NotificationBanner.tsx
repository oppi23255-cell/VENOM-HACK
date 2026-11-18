import React from 'react';
import { X } from 'lucide-react';
import { TranslationStrings } from '../i18n/translations';

interface NotificationBannerProps {
  visible: boolean;
  t: TranslationStrings;
  onClose: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  visible,
  t,
  onClose,
}) => {
  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 w-[92%] max-w-[400px] bg-[rgba(15,15,20,0.88)] backdrop-blur-[20px] border border-[#ff0800]/35 rounded-[25px] px-[15px] py-[12px] flex items-center gap-[15px] shadow-[0_15px_35px_rgba(0,0,0,0.6)] z-[9999] transition-[top] duration-500 ${
        visible ? 'top-[20px]' : '-top-[140px]'
      }`}
    >
      <a
        href="https://t.me/+DUYca9dWCGU1MjI0"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-[15px] flex-1 min-w-0 no-underline"
      >
        <div className="bg-gradient-to-br from-[#B30600] to-[#ff0800] text-white w-[45px] h-[45px] rounded-full flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(255,8,0,0.55)]">
          <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] fill-current">
            <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-white leading-snug">{t.notif_title}</p>
          <p className="text-[12px] text-white/75 leading-snug mt-0.5">{t.notif_desc}</p>
        </div>
      </a>
      <button
        type="button"
        onClick={onClose}
        className="text-white/80 hover:text-white p-1 shrink-0 cursor-pointer"
        aria-label="Close notification"
      >
        <X className="w-[18px] h-[18px]" />
      </button>
    </div>
  );
};
