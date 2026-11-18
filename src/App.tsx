import { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { AR_TEXT } from './i18n/translations';
import { SplashLoader } from './components/SplashLoader';
import { TopHeader } from './components/TopHeader';
import { NotificationBanner } from './components/NotificationBanner';
import { LoginView } from './components/LoginView';
import { AffiliateView } from './components/AffiliateView';
import { DashboardView } from './components/DashboardView';
import { LoadingModal, SuccessModal, VideoModal } from './components/Modals';

type ViewMode = 'loginView' | 'affiliateView' | 'dashboardView';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [view, setView] = useState<ViewMode>('loginView');
  const [notifVisible, setNotifVisible] = useState(false);

  const [sessionUserId, setSessionUserId] = useState<string>('');
  const [sessionExpiry, setSessionExpiry] = useState<number>(0);

  const [prefillUserId, setPrefillUserId] = useState<string>('');
  const [prefillCode, setPrefillCode] = useState<string>('');

  const [isLoadingModal, setIsLoadingModal] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  const t = AR_TEXT;

  // Enforce Arabic RTL
  useEffect(() => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  }, []);

  // Splash loader timer
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Restore active session if valid
  useEffect(() => {
    try {
      const raw = localStorage.getItem('loggedIn');
      if (raw) {
        const session = JSON.parse(raw);
        if (session && session.userId && Date.now() < session.expiry) {
          setSessionUserId(session.userId);
          setSessionExpiry(session.expiry);
          setView('dashboardView');
        } else {
          localStorage.removeItem('loggedIn');
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Slide-down Telegram notification after 8s
  useEffect(() => {
    const timer = setTimeout(() => setNotifVisible(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleGenerateCode = async (
    userId: string,
    depositImage: string,
    promoImage: string
  ) => {
    setVerifyError(null);
    setIsLoadingModal(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch('/api/verify-screenshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          depositImage,
          promoImage,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = (await response.json()) as {
        valid: boolean;
        code?: string;
        expiry?: number;
        reasonCode?: string;
        detectedPromo?: string;
        detectedAmount?: number;
        message?: string;
      };

      setIsLoadingModal(false);

      if (!response.ok || !data.valid || !data.code || !data.expiry) {
        switch (data.reasonCode) {
          case 'PROMO_LOWERCASE':
            setVerifyError(t.err_promo_lowercase);
            break;
          case 'PROMO_INVALID':
            setVerifyError(
              data.detectedPromo
                ? `${t.err_promo_invalid} (المكتشف: ${data.detectedPromo})`
                : t.err_promo_invalid
            );
            break;
          case 'DEPOSIT_TOO_LOW':
            setVerifyError(
              data.detectedAmount
                ? `${t.err_deposit_low} (المكتشف: ${data.detectedAmount} ج.م)`
                : t.err_deposit_low
            );
            break;
          case 'DEPOSIT_INVALID':
            setVerifyError(t.err_deposit_invalid);
            break;
          default:
            setVerifyError(data.message || t.err_server);
        }
        return;
      }

      try {
        localStorage.setItem(
          'generatedCode',
          JSON.stringify({
            userId,
            code: data.code,
            expiry: data.expiry,
            platform: 'Ultrapari',
          })
        );
      } catch {
        // ignore storage errors
      }

      setGeneratedCode(data.code);
      setSuccessModalOpen(true);
    } catch {
      clearTimeout(timeoutId);
      setIsLoadingModal(false);
      setVerifyError(t.err_server);
    }
  };

  const handleQuickLogin = () => {
    try {
      const raw = localStorage.getItem('generatedCode');
      const stored = raw ? JSON.parse(raw) : null;
      if (stored) {
        setSuccessModalOpen(false);
        setPrefillUserId(stored.userId);
        setPrefillCode(stored.code);
        setView('loginView');
      }
    } catch {
      setSuccessModalOpen(false);
    }
  };

  const handleLoginSuccess = (userId: string, expiry: number) => {
    setSessionUserId(userId);
    setSessionExpiry(expiry);
    setView('dashboardView');
  };

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem('loggedIn');
    } catch {
      // ignore
    }
    setSessionUserId('');
    setSessionExpiry(0);
    setView('loginView');
  }, []);

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden bg-[#010409] text-[#e6edf3]">
      {showSplash && <SplashLoader onFinish={() => setShowSplash(false)} />}

      {/* Floating crimson background circles */}
      <div className="bg-circles" aria-hidden="true">
        <div />
        <div />
        <div />
      </div>

      {/* Telegram Notification Banner */}
      <NotificationBanner
        visible={notifVisible}
        t={t}
        onClose={() => setNotifVisible(false)}
      />

      {/* Top Header */}
      <TopHeader t={t} />

      {/* Main Content Shell */}
      <main className="relative z-10 w-full min-h-screen flex flex-col items-center pt-[60px] pb-[40px]">
        <div className="w-[94%] sm:w-[90%] max-w-[420px] mt-[55px]">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[rgba(13,17,23,0.9)] border border-[#ff0800]/25 rounded-[30px] pt-[34px] pb-[26px] px-[24px] max-[420px]:px-[18px] max-[420px]:pt-[30px] max-[420px]:pb-[22px] backdrop-blur-[25px] shadow-[0_25px_50px_rgba(0,0,0,0.5),0_0_40px_rgba(255,8,0,0.08)] relative w-full flex flex-col items-center gap-[18px]"
          >
            {/* Floating Morphing Profile Hex */}
            <div className="absolute -top-[55px] left-1/2 -translate-x-1/2 w-[100px] h-[100px] z-20">
              <div className="profile-hex">
                <img
                  src="/assets/aistudio/photo_2026-11-18_04-40-37_92c1121a.jpg"
                  alt="VENOM HACK"
                  className="w-full h-full object-cover bg-[#0b1014]"
                />
              </div>
            </div>

            {/* Brand Title */}
            <h1 className="brand-title mt-[12px]">
              VENOM{' '}
              <span className="text-[#ff0800] [-webkit-text-fill-color:#ff0800]">
                HACK
              </span>
            </h1>
            <p className="text-[12px] text-[#8b949e] text-center font-bold -mt-[12px]">
              المضاعف المباشر
            </p>

            {/* Active View */}
            {view === 'loginView' && (
              <LoginView
                t={t}
                prefillUserId={prefillUserId}
                prefillCode={prefillCode}
                onLoginSuccess={handleLoginSuccess}
                onGoAffiliate={() => {
                  setVerifyError(null);
                  setView('affiliateView');
                }}
                onOpenVideo={() => setVideoModalOpen(true)}
              />
            )}

            {view === 'affiliateView' && (
              <AffiliateView
                t={t}
                verifyError={verifyError}
                onClearError={() => setVerifyError(null)}
                onBack={() => {
                  setVerifyError(null);
                  setView('loginView');
                }}
                onGenerateCode={handleGenerateCode}
              />
            )}

            {view === 'dashboardView' && (
              <DashboardView
                t={t}
                userId={sessionUserId}
                expiry={sessionExpiry}
                onLogout={handleLogout}
              />
            )}
          </motion.div>
        </div>
      </main>

      {/* Modals */}
      <LoadingModal open={isLoadingModal} t={t} />
      <SuccessModal
        open={successModalOpen}
        code={generatedCode}
        t={t}
        onClose={() => setSuccessModalOpen(false)}
        onQuickLogin={handleQuickLogin}
      />
      <VideoModal
        open={videoModalOpen}
        t={t}
        onClose={() => setVideoModalOpen(false)}
      />
    </div>
  );
}
