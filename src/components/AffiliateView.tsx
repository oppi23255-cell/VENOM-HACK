import React, { useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  IdCard,
  Upload,
} from 'lucide-react';
import { TranslationStrings } from '../i18n/translations';
import { UltrapariLogo } from './UltrapariLogo';

interface AffiliateViewProps {
  t: TranslationStrings;
  verifyError: string | null;
  onClearError: () => void;
  onBack: () => void;
  onGenerateCode: (
    userId: string,
    depositImage: string,
    promoImage: string
  ) => void;
}

const ULTRAPARI_DOWNLOAD_URL =
  'https://refpa42156.com/L?tag=d_6346663m_118431c_&site=6346663&ad=118431';

export const AffiliateView: React.FC<AffiliateViewProps> = ({
  t,
  verifyError,
  onClearError,
  onBack,
  onGenerateCode,
}) => {
  const [copied, setCopied] = useState(false);
  const [verifyId, setVerifyId] = useState('');
  const [depositPreview, setDepositPreview] = useState<string | null>(null);
  const [promoPreview, setPromoPreview] = useState<string | null>(null);

  const depositInputRef = useRef<HTMLInputElement>(null);
  const promoInputRef = useRef<HTMLInputElement>(null);

  const trimmedId = verifyId.trim();
  const isIdEmpty = trimmedId === '';
  const isIdValid = trimmedId.length > 0;
  const canVerify = isIdValid && Boolean(depositPreview) && Boolean(promoPreview);

  const handleCopyPromo = () => {
    navigator.clipboard.writeText('S333');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type && !file.type.startsWith('image/')) return;
    onClearError();

    const reader = new FileReader();
    reader.onload = (ev) => {
      const rawDataUrl = typeof ev.target?.result === 'string' ? ev.target.result : null;
      if (!rawDataUrl) return;

      const img = new Image();
      img.onload = () => {
        const maxDim = 1100;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setter(rawDataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        setter(canvas.toDataURL('image/jpeg', 0.76));
      };
      img.onerror = () => setter(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full flex flex-col items-center gap-[16px] animate-fade-up">
      <h3 className="text-[#ff0800] text-center w-full font-bold text-[18px]">
        {t.aff_title}
      </h3>

      {/* Platform Selector */}
      <div className="flex gap-[10px] my-[4px] justify-center w-full">
        <button
          type="button"
          className="flex-1 py-[10px] border-2 border-[#ff0800] bg-[#ff0800]/15 shadow-[0_0_20px_rgba(255,8,0,0.35)] rounded-[14px] text-white font-bold text-[14px] cursor-pointer flex flex-col items-center gap-[6px]"
        >
          <UltrapariLogo className="w-[60px] h-[60px]" />
          <span>{t.platform_label}</span>
        </button>
      </div>

      {/* Steps */}
      <div className="w-full flex flex-col gap-[10px]">
        <div className="flex items-center gap-[12px] px-[12px] py-[10px] bg-[#ff0800]/[0.06] rounded-[12px] border border-[#ff0800]/20 hover:bg-[#ff0800]/[0.12] hover:border-[#ff0800] transition-all duration-300">
          <div className="w-[32px] h-[32px] rounded-full bg-[#ff0800] text-white flex items-center justify-center font-black text-[14px] shrink-0">
            1
          </div>
          <div className="flex-1 text-[14px] text-[#e6edf3] leading-snug">
            {t.step1_prefix} <b>{t.step1_platform}</b>
          </div>
        </div>

        <div className="flex items-center gap-[12px] px-[12px] py-[10px] bg-[#ff0800]/[0.06] rounded-[12px] border border-[#ff0800]/20 hover:bg-[#ff0800]/[0.12] hover:border-[#ff0800] transition-all duration-300">
          <div className="w-[32px] h-[32px] rounded-full bg-[#ff0800] text-white flex items-center justify-center font-black text-[14px] shrink-0">
            2
          </div>
          <div className="flex-1 text-[14px] text-[#e6edf3] leading-snug">
            {t.step2_prefix} (
            <span className="text-[#ff0800] font-black">S333</span>)
          </div>
        </div>

        <div className="flex items-center gap-[12px] px-[12px] py-[10px] bg-[#ff0800]/[0.06] rounded-[12px] border border-[#ff0800]/20 hover:bg-[#ff0800]/[0.12] hover:border-[#ff0800] transition-all duration-300">
          <div className="w-[32px] h-[32px] rounded-full bg-[#ff0800] text-white flex items-center justify-center font-black text-[14px] shrink-0">
            3
          </div>
          <div className="flex-1 text-[14px] text-[#e6edf3] leading-snug">
            {t.step3_prefix} <b>{t.step3_amount}</b> {t.step3_suffix}
          </div>
        </div>

        <div className="flex items-center gap-[12px] px-[12px] py-[10px] bg-[#ff0800]/[0.06] rounded-[12px] border border-[#ff0800]/20 hover:bg-[#ff0800]/[0.12] hover:border-[#ff0800] transition-all duration-300">
          <div className="w-[32px] h-[32px] rounded-full bg-[#ff0800] text-white flex items-center justify-center font-black text-[14px] shrink-0">
            4
          </div>
          <div className="flex-1 text-[14px] text-[#e6edf3] leading-snug">
            {t.step4}
          </div>
        </div>

        <div className="flex items-center gap-[12px] px-[12px] py-[10px] bg-[#ff0800]/[0.06] rounded-[12px] border border-[#ff0800]/20 hover:bg-[#ff0800]/[0.12] hover:border-[#ff0800] transition-all duration-300">
          <div className="w-[32px] h-[32px] rounded-full bg-[#ff0800] text-white flex items-center justify-center font-black text-[14px] shrink-0">
            5
          </div>
          <div className="flex-1 text-[14px] text-[#e6edf3] leading-snug">
            {t.step5}
          </div>
        </div>
      </div>

      {/* Promo Code Box */}
      <div className="flex items-center justify-between bg-black/60 p-[10px] rounded-[8px] border border-dashed border-[#ff0800] w-full">
        <span className="text-[18px] font-black text-[#ff0800] tracking-[2px] px-2 font-cyber">
          S333
        </span>
        <button
          type="button"
          onClick={handleCopyPromo}
          className={`lightning-btn border-none px-[12px] py-[6px] rounded-[6px] font-bold cursor-pointer transition-colors text-[13px] ${
            copied ? 'bg-white text-[#B30600]' : 'bg-[#ff0800] text-white'
          }`}
        >
          {copied ? t.copied : t.copy_btn}
        </button>
      </div>

      {/* Download Link */}
      <a
        href={ULTRAPARI_DOWNLOAD_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="lightning-btn w-full p-[12px] border-none rounded-[12px] text-[15px] font-black cursor-pointer flex items-center justify-center gap-[10px] no-underline bg-gradient-to-br from-[#ff0800] to-[#B30600] text-white shadow-[0_10px_30px_rgba(255,8,0,0.4)] hover:brightness-110"
      >
        <Download className="w-[18px] h-[18px]" />
        <span>{t.download_platform}</span>
      </a>

      {/* Verification Form */}
      <div className="bg-black/40 border border-[#ff0800]/35 rounded-[15px] p-[15px] text-center w-full">
        <h4 className="text-[#ff0800] font-bold mb-[12px] text-[15px]">
          {t.verify_title}
        </h4>

        <div className="relative w-full mb-[15px]">
          <input
            type="text"
            value={verifyId}
            onChange={(e) => {
              setVerifyId(e.target.value);
              onClearError();
            }}
            placeholder={t.verify_id_place}
            autoComplete="off"
            className={`w-full py-[12px] pr-[45px] pl-[15px] bg-black/30 border rounded-[12px] text-white text-[15px] outline-none transition-all duration-300 placeholder:text-[#8b949e] ${
              isIdEmpty
                ? 'border-white/10 focus:border-[#ff0800]'
                : 'border-[#ff0800]'
            }`}
          />
          {isIdEmpty ? (
            <IdCard className="w-[18px] h-[18px] text-[#ff0800] absolute top-1/2 -translate-y-1/2 right-[15px] pointer-events-none" />
          ) : (
            <CheckCircle2 className="w-[18px] h-[18px] text-[#35d07f] absolute top-1/2 -translate-y-1/2 right-[15px] pointer-events-none" />
          )}
        </div>

        {/* Screenshot Upload Boxes */}
        <div className="grid grid-cols-2 gap-[10px] my-[15px] w-full">
          <div className="rounded-[16px] bg-black/15 border border-[#ff0800]/20 p-[10px]">
            <label className="font-black text-[12px] text-[#8b949e] block mb-[8px]">
              {t.deposit_label}
            </label>
            <button
              type="button"
              onClick={() => depositInputRef.current?.click()}
              style={
                depositPreview
                  ? {
                      backgroundImage: `url(${depositPreview})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined
              }
              className={`w-full h-[130px] rounded-[14px] bg-black/10 flex items-center justify-center cursor-pointer relative overflow-hidden ${
                depositPreview
                  ? 'border-2 border-solid border-[#ff0800]'
                  : 'border-2 border-dashed border-[#ff0800]/50'
              }`}
            >
              {!depositPreview && (
                <Upload className="w-[34px] h-[34px] text-[#ff0800]/50" />
              )}
              <small className="absolute bottom-[8px] left-[8px] bg-black/55 border border-[#ff0800]/35 px-[8px] py-[3px] rounded-full text-[11px] text-[#e6edf3] backdrop-blur-[4px]">
                {t.upload_deposit}
              </small>
            </button>
            <input
              ref={depositInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, setDepositPreview)}
            />
          </div>

          <div className="rounded-[16px] bg-black/15 border border-[#ff0800]/20 p-[10px]">
            <label className="font-black text-[12px] text-[#8b949e] block mb-[8px]">
              {t.promocode_label}
            </label>
            <button
              type="button"
              onClick={() => promoInputRef.current?.click()}
              style={
                promoPreview
                  ? {
                      backgroundImage: `url(${promoPreview})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined
              }
              className={`w-full h-[130px] rounded-[14px] bg-black/10 flex items-center justify-center cursor-pointer relative overflow-hidden ${
                promoPreview
                  ? 'border-2 border-solid border-[#ff0800]'
                  : 'border-2 border-dashed border-[#ff0800]/50'
              }`}
            >
              {!promoPreview && (
                <Upload className="w-[34px] h-[34px] text-[#ff0800]/50" />
              )}
              <small className="absolute bottom-[8px] left-[8px] bg-black/55 border border-[#ff0800]/35 px-[8px] py-[3px] rounded-full text-[11px] text-[#e6edf3] backdrop-blur-[4px]">
                {t.upload_promocode}
              </small>
            </button>
            <input
              ref={promoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, setPromoPreview)}
            />
          </div>
        </div>

        {verifyError && (
          <div className="w-full bg-[#ff0055]/15 border border-[#ff4d4d] text-[#ff4d4d] p-[10px] rounded-[10px] text-center font-bold text-[13px] mb-[12px]">
            {verifyError}
          </div>
        )}

        <button
          type="button"
          disabled={!canVerify}
          onClick={() =>
            canVerify &&
            depositPreview &&
            promoPreview &&
            onGenerateCode(trimmedId, depositPreview, promoPreview)
          }
          className={`lightning-btn bg-gradient-to-r from-[#ff0800] to-[#B30600] text-white w-full p-[12px] border-none rounded-[12px] font-black text-[15px] transition-all duration-300 ${
            canVerify
              ? 'opacity-100 cursor-pointer hover:brightness-110'
              : 'opacity-50 pointer-events-none'
          }`}
        >
          {t.verify_btn}
        </button>
      </div>

      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="lightning-btn w-full p-[12px] border-none rounded-[12px] text-[15px] font-black cursor-pointer flex items-center justify-center gap-[10px] bg-gradient-to-r from-[#ff0800] to-[#B30600] text-white hover:brightness-110"
      >
        <ArrowRight className="w-[18px] h-[18px]" />
        <span>{t.back_btn}</span>
      </button>
    </div>
  );
};
