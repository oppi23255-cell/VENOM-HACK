import React, { useEffect, useState } from 'react';
import { Headphones, KeyRound, PlayCircle, User } from 'lucide-react';
import { TranslationStrings } from '../i18n/translations';

interface LoginViewProps {
  t: TranslationStrings;
  prefillUserId?: string;
  prefillCode?: string;
  onLoginSuccess: (userId: string, expiry: number) => void;
  onGoAffiliate: () => void;
  onOpenVideo: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  t,
  prefillUserId = '',
  prefillCode = '',
  onLoginSuccess,
  onGoAffiliate,
  onOpenVideo,
}) => {
  const [userId, setUserId] = useState(prefillUserId);
  const [actCode, setActCode] = useState(prefillCode);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (prefillUserId) setUserId(prefillUserId);
    if (prefillCode) setActCode(prefillCode);
    if (prefillUserId || prefillCode) setErrorMsg(null);
  }, [prefillUserId, prefillCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = userId.trim();
    const trimmedCode = actCode.trim();

    if (!trimmedId || !trimmedCode) {
      setErrorMsg(t.err_empty);
      return;
    }

    try {
      const storedRaw = localStorage.getItem('generatedCode');
      const stored = storedRaw ? JSON.parse(storedRaw) : null;
      if (
        stored &&
        stored.userId === trimmedId &&
        stored.code === trimmedCode &&
        Date.now() < stored.expiry
      ) {
        setErrorMsg(null);
        localStorage.setItem(
          'loggedIn',
          JSON.stringify({
            userId: trimmedId,
            expiry: stored.expiry,
            platform: 'Ultrapari',
          })
        );
        onLoginSuccess(trimmedId, stored.expiry);
      } else {
        setErrorMsg(t.dash_error_login);
      }
    } catch {
      setErrorMsg(t.dash_error_login);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-[16px] animate-fade-up">
      {errorMsg && (
        <div className="w-full bg-[#ff0055]/15 border border-[#ff4d4d] text-[#ff4d4d] p-[12px] rounded-[10px] text-center font-bold text-[14px]">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full flex flex-col">
        <div className="relative w-full mb-[15px]">
          <input
            type="text"
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value);
              setErrorMsg(null);
            }}
            placeholder={t.id_placeholder}
            autoComplete="off"
            className="w-full py-[12px] pr-[45px] pl-[15px] bg-black/30 border border-white/10 rounded-[12px] text-white text-[15px] outline-none transition-all duration-300 focus:border-[#ff0800] focus:shadow-[0_0_15px_rgba(255,8,0,0.25)] placeholder:text-[#8b949e]"
          />
          <User className="w-[18px] h-[18px] text-[#ff0800] absolute top-1/2 -translate-y-1/2 right-[15px] pointer-events-none" />
        </div>

        <div className="relative w-full mb-[15px]">
          <input
            type="text"
            value={actCode}
            onChange={(e) => {
              setActCode(e.target.value);
              setErrorMsg(null);
            }}
            placeholder={t.code_placeholder}
            autoComplete="off"
            className="w-full py-[12px] pr-[45px] pl-[15px] bg-black/30 border border-white/10 rounded-[12px] text-white text-[15px] outline-none transition-all duration-300 focus:border-[#ff0800] focus:shadow-[0_0_15px_rgba(255,8,0,0.25)] placeholder:text-[#8b949e]"
          />
          <KeyRound className="w-[18px] h-[18px] text-[#ff0800] absolute top-1/2 -translate-y-1/2 right-[15px] pointer-events-none" />
        </div>

        <button
          type="submit"
          className="lightning-btn w-full p-[12px] border-none rounded-[12px] text-[15px] font-black cursor-pointer flex items-center justify-center gap-[10px] transition-all duration-300 mb-[12px] bg-gradient-to-br from-[#ff0800] to-[#B30600] text-white shadow-[0_10px_30px_rgba(255,8,0,0.4)] hover:brightness-110 active:scale-[0.99]"
        >
          {t.login_btn}
        </button>
      </form>

      <button
        type="button"
        onClick={onGoAffiliate}
        className="lightning-btn w-full p-[12px] rounded-[12px] text-[15px] font-black cursor-pointer flex items-center justify-center gap-[10px] transition-all duration-300 bg-transparent border border-[#ff0800] text-[#ff0800] hover:bg-[#ff0800]/10 whitespace-nowrap"
      >
        {t.get_code_btn}
      </button>

      <button
        type="button"
        onClick={onOpenVideo}
        className="lightning-btn w-full p-[12px] rounded-[12px] text-[15px] font-black cursor-pointer flex items-center justify-center gap-[10px] transition-all duration-300 bg-transparent border border-[#ff0800] text-[#ff0800] hover:bg-[#ff0800]/10 whitespace-nowrap"
      >
        <span>{t.video_btn}</span>
        <PlayCircle className="w-[18px] h-[18px]" />
      </button>

      <a
        href="https://t.me/+DUYca9dWCGU1MjI0"
        target="_blank"
        rel="noopener noreferrer"
        className="lightning-btn w-full p-[12px] border-none rounded-[12px] text-[15px] font-black cursor-pointer flex items-center justify-center gap-[10px] no-underline transition-all duration-300 bg-gradient-to-r from-[#B30600] to-[#ff0800] text-white hover:brightness-110 whitespace-nowrap"
      >
        <svg viewBox="0 0 24 24" className="w-[19px] h-[19px] fill-current">
          <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
        </svg>
        <span>{t.tg_channel}</span>
      </a>

      <div className="w-full text-center mt-[4px] pt-[12px] border-t border-[#ff0800]/15">
        <a
          href="https://t.me/+DUYca9dWCGU1MjI0"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#ff0800] no-underline font-bold text-[13px] inline-flex items-center gap-[6px] hover:drop-shadow-[0_0_10px_rgba(255,8,0,0.6)]"
        >
          <Headphones className="w-[15px] h-[15px]" />
          <span>{t.dev_support} تيليجرام</span>
        </a>
      </div>
    </div>
  );
};
