import React, { useState } from 'react';
import { CheckCircle2, PlayCircle, X } from 'lucide-react';
import { TranslationStrings } from '../i18n/translations';

interface LoadingModalProps {
  open: boolean;
  t: TranslationStrings;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({ open, t }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/90 z-[999] flex flex-col items-center justify-center gap-[15px]">
      <div className="w-[50px] h-[50px] border-4 border-[#ff0800]/25 border-t-[#ff0800] rounded-full animate-spin" />
      <h3 className="text-white font-bold text-[18px]">{t.loading_title}</h3>
    </div>
  );
};

interface SuccessModalProps {
  open: boolean;
  code: string;
  t: TranslationStrings;
  onClose: () => void;
  onQuickLogin: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  open,
  code,
  t,
  onClose,
  onQuickLogin,
}) => {
  const [copied, setCopied] = useState(false);
  if (!open) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[999] flex items-center justify-center p-4">
      <div className="bg-[rgba(10,10,20,0.95)] border-2 border-[#35d07f] p-[30px] rounded-[20px] w-full max-w-[350px] text-center relative animate-fade-up">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-[12px] right-[15px] bg-transparent border-none text-white cursor-pointer hover:text-[#ff4d4d]"
          aria-label="Close"
        >
          <X className="w-[20px] h-[20px]" />
        </button>

        <CheckCircle2 className="w-[50px] h-[50px] text-[#35d07f] mx-auto" />
        <h2 className="text-[#35d07f] font-black text-[20px] mt-[10px]">
          {t.dash_success_title}
        </h2>

        <div className="flex items-center justify-between bg-black/60 p-[10px] rounded-[8px] border border-dashed border-[#35d07f] mt-[15px] mb-[16px]">
          <span className="text-[18px] font-black text-[#35d07f] tracking-[2px] font-cyber px-2">
            {code}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className={`px-[12px] py-[6px] rounded-[6px] font-bold cursor-pointer border-none text-[13px] transition-colors ${
              copied ? 'bg-white text-[#15803d]' : 'bg-[#35d07f] text-white'
            }`}
          >
            {copied ? t.copied : t.dash_copy_fast}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full p-[12px] border-none rounded-[12px] text-[15px] font-black cursor-pointer mb-[10px] bg-gradient-to-br from-[#ff0800] to-[#B30600] text-white"
        >
          {t.dash_close}
        </button>

        <button
          type="button"
          onClick={onQuickLogin}
          className="w-full p-[12px] border-none rounded-[12px] text-[15px] font-black cursor-pointer bg-gradient-to-r from-[#ff0800] to-[#B30600] text-white"
        >
          {t.dash_quick_login}
        </button>
      </div>
    </div>
  );
};

interface VideoModalProps {
  open: boolean;
  t: TranslationStrings;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ open, t, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-[1000] flex items-center justify-center p-4">
      <div className="w-[90%] max-w-[380px] relative bg-[#0a0d12] p-[16px] rounded-[18px] border border-[#ff0800] animate-fade-up">
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-[40px] right-0 bg-transparent border-none text-[#ff4d4d] cursor-pointer"
          aria-label="Close Video"
        >
          <X className="w-[30px] h-[30px]" />
        </button>

        <div className="aspect-[9/16] w-full rounded-[12px] bg-gradient-to-b from-[#140404] to-[#010409] border border-[#ff0800]/25 flex flex-col items-center justify-center p-6 text-center gap-4">
          <div className="w-[64px] h-[64px] rounded-full bg-[#ff0800]/15 border border-[#ff0800] flex items-center justify-center text-[#ff0800]">
            <PlayCircle className="w-[34px] h-[34px]" />
          </div>
          <h3 className="text-white font-black text-[18px]">{t.video_title}</h3>
          <ol className="text-right text-[13px] text-[#e6edf3]/85 space-y-2 w-full bg-black/40 p-4 rounded-[12px] border border-white/10">
            <li>1. {t.step1_prefix} {t.step1_platform}</li>
            <li>2. {t.step2_prefix} (S333)</li>
            <li>3. {t.step3_prefix} {t.step3_amount} {t.step3_suffix}</li>
            <li>4. {t.step4}</li>
            <li>5. {t.step5}</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
