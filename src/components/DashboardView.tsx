import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Fingerprint, LogOut } from 'lucide-react';
import { TranslationStrings } from '../i18n/translations';
import { UltrapariLogo } from './UltrapariLogo';

const RTDB_BASE = 'https://mrwan-dd795-default-rtdb.firebaseio.com';

type CrashPhase = 'waiting' | 'flight' | 'crashed';

interface CrashCurrentData {
  roundNumber?: number;
  phase?: CrashPhase;
  crashPoint?: number;
  roundStartedAt?: number;
  flightStartedAt?: number;
  updatedAt?: number;
  error?: string;
}

interface DashboardViewProps {
  t: TranslationStrings;
  userId: string;
  expiry: number;
  onLogout: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  t,
  userId,
  expiry,
  onLogout,
}) => {
  const [displayedPoint, setDisplayedPoint] = useState<number | null>(null);
  const [lockedRound, setLockedRound] = useState<number | null>(null);
  const [livePhase, setLivePhase] = useState<CrashPhase | null>(null);
  const [liveRound, setLiveRound] = useState<number | null>(null);
  const [dbClosed, setDbClosed] = useState(false);

  const [isPopped, setIsPopped] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(0, Math.ceil((expiry - Date.now()) / 1000))
  );

  const initialDurationRef = useRef<number>(
    Math.max(1, Math.ceil((expiry - Date.now()) / 1000))
  );

  // Strict single-round lock ref as required
  const lastShownRoundRef = useRef<number | null>(null);
  const currentSnapshotRef = useRef<CrashCurrentData | null>(null);
  const enabledRef = useRef<boolean>(true);
  const crashRootValidRef = useRef<boolean>(true);

  const markClosed = useCallback(() => {
    enabledRef.current = false;
    lastShownRoundRef.current = null;
    currentSnapshotRef.current = null;
    setDbClosed(true);
    setDisplayedPoint(null);
    setLockedRound(null);
    setIsPopped(false);
  }, []);

  const applyCurrentSnapshot = useCallback(
    (data: CrashCurrentData | false | null) => {
      if (!enabledRef.current || !crashRootValidRef.current || data === false) {
        markClosed();
        return;
      }

      setDbClosed(false);

      if (!data || typeof data !== 'object') {
        return;
      }

      if (data.error) {
        markClosed();
        return;
      }

      currentSnapshotRef.current = data;

      if (data.phase === 'waiting' || data.phase === 'flight' || data.phase === 'crashed') {
        setLivePhase(data.phase);
      }
      if (typeof data.roundNumber === 'number') {
        setLiveRound(data.roundNumber);
      }

      // Strict conditions:
      // 1. data.phase === "waiting"
      // 2. data.roundNumber !== lastShownRound (and strictly newer if already shown)
      // 3. data.crashPoint >= 1
      if (
        data.phase === 'waiting' &&
        typeof data.roundNumber === 'number' &&
        data.roundNumber !== lastShownRoundRef.current &&
        (lastShownRoundRef.current === null ||
          data.roundNumber > lastShownRoundRef.current) &&
        typeof data.crashPoint === 'number' &&
        data.crashPoint >= 1
      ) {
        lastShownRoundRef.current = data.roundNumber;
        setLockedRound(data.roundNumber);
        setDisplayedPoint(data.crashPoint);
        setIsPopped(false);
        requestAnimationFrame(() => {
          setIsPopped(true);
          setIsFlashing(true);
          setTimeout(() => setIsFlashing(false), 550);
        });
      }
    },
    [markClosed]
  );

  useEffect(() => {
    let cancelled = false;
    let pollInFlight = false;
    let shallowCounter = 0;

    // 1. Instant SSE stream on crash/current and crash/enabled
    let currentEs: EventSource | null = null;
    let enabledEs: EventSource | null = null;

    const handleSsePayload = (rawData: string, isEnabledStream: boolean) => {
      if (cancelled) return;
      try {
        const msg = JSON.parse(rawData) as { path?: string; data?: unknown };
        if (isEnabledStream) {
          if (msg.data === false) {
            markClosed();
          } else {
            enabledRef.current = true;
            if (crashRootValidRef.current) setDbClosed(false);
          }
          return;
        }

        if (msg.data === false) {
          markClosed();
          return;
        }

        if (msg.path === '/' && msg.data && typeof msg.data === 'object') {
          applyCurrentSnapshot(msg.data as CrashCurrentData);
        } else if (msg.path && msg.path !== '/' && currentSnapshotRef.current) {
          const key = msg.path.replace(/^\//, '') as keyof CrashCurrentData;
          const updated: CrashCurrentData = {
            ...currentSnapshotRef.current,
            [key]: msg.data,
          };
          applyCurrentSnapshot(updated);
        }
      } catch {
        // ignore malformed keepalive
      }
    };

    try {
      currentEs = new EventSource(`${RTDB_BASE}/crash/current.json`);
      currentEs.addEventListener('put', (e) =>
        handleSsePayload((e as MessageEvent).data, false)
      );
      currentEs.addEventListener('patch', (e) =>
        handleSsePayload((e as MessageEvent).data, false)
      );

      enabledEs = new EventSource(`${RTDB_BASE}/crash/enabled.json`);
      enabledEs.addEventListener('put', (e) =>
        handleSsePayload((e as MessageEvent).data, true)
      );
    } catch {
      // Fallback solely to 300ms polling if EventSource is unavailable
    }

    // 2. Fast 300ms REST polling with permission/enabled verification
    const pollDatabase = async () => {
      if (cancelled || pollInFlight) return;
      pollInFlight = true;
      try {
        shallowCounter = (shallowCounter + 1) % 5;
        const requests: Promise<Response>[] = [
          fetch(`${RTDB_BASE}/crash/current.json`, { cache: 'no-store' }),
          fetch(`${RTDB_BASE}/crash/enabled.json`, { cache: 'no-store' }),
        ];
        if (shallowCounter === 1) {
          requests.push(
            fetch(`${RTDB_BASE}/crash.json?shallow=true`, { cache: 'no-store' })
          );
        }

        const responses = await Promise.all(requests);
        if (cancelled) return;

        const [currentRes, enabledRes, shallowRes] = responses;

        if (
          currentRes.status === 401 ||
          currentRes.status === 403 ||
          enabledRes.status === 401 ||
          enabledRes.status === 403 ||
          (shallowRes && (shallowRes.status === 401 || shallowRes.status === 403))
        ) {
          markClosed();
          return;
        }

        const [currentJson, enabledJson] = await Promise.all([
          currentRes.json(),
          enabledRes.json(),
        ]);

        if (shallowRes) {
          const shallowJson = await shallowRes.json();
          if (
            shallowJson === false ||
            (shallowJson &&
              typeof shallowJson === 'object' &&
              'error' in shallowJson)
          ) {
            crashRootValidRef.current = false;
            markClosed();
            return;
          }
          crashRootValidRef.current = true;
        }

        if (
          enabledJson === false ||
          (enabledJson &&
            typeof enabledJson === 'object' &&
            'error' in enabledJson)
        ) {
          markClosed();
          return;
        }

        enabledRef.current = true;
        applyCurrentSnapshot(currentJson as CrashCurrentData | false | null);
      } catch {
        // transient network error; wait next tick
      } finally {
        pollInFlight = false;
      }
    };

    pollDatabase();
    const pollInterval = window.setInterval(pollDatabase, 300);

    return () => {
      cancelled = true;
      window.clearInterval(pollInterval);
      if (currentEs) currentEs.close();
      if (enabledEs) enabledEs.close();
    };
  }, [applyCurrentSnapshot, markClosed]);

  // Countdown timer
  useEffect(() => {
    const updateTimer = () => {
      const rem = Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
      setRemainingSeconds(rem);
      if (rem <= 0) {
        onLogout();
      }
    };
    updateTimer();
    const id = setInterval(updateTimer, 1000);
    return () => clearInterval(id);
  }, [expiry, onLogout]);

  const h = Math.floor(remainingSeconds / 3600);
  const m = Math.floor((remainingSeconds % 3600) / 60);
  const s = remainingSeconds % 60;
  const formattedTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  const progressPct = Math.min(
    100,
    Math.max(0, (remainingSeconds / initialDurationRef.current) * 100)
  );

  const phaseText =
    livePhase === 'waiting'
      ? t.dash_phase_waiting
      : livePhase === 'flight'
        ? t.dash_phase_flight
        : livePhase === 'crashed'
          ? t.dash_phase_crashed
          : t.dash_waiting_next;

  return (
    <div className="w-full flex flex-col items-center gap-[16px] animate-fade-up">
      {/* Big Multiplier Display */}
      <div className={`big-box px-4 text-center ${isFlashing ? 'flash' : ''}`} aria-live="polite">
        {dbClosed ? (
          <div className="relative z-[2] flex flex-col items-center gap-3 px-4">
            <AlertTriangle className="w-[44px] h-[44px] text-[#ff4d4d]" />
            <div className="text-[18px] font-black text-[#ff4d4d]">
              {t.dash_db_closed_title}
            </div>
            <p className="text-[13px] text-white/75 leading-relaxed">
              {t.dash_db_closed_desc}
            </p>
          </div>
        ) : displayedPoint !== null ? (
          <>
            <span className="relative z-[2] text-[12px] font-bold text-[#ff5a55] mb-1">
              {t.dash_round_label} #{lockedRound ?? liveRound ?? '---'}
            </span>
            <div
              className={`multiplier-value relative z-[2] ${isPopped ? 'pop' : ''}`}
              dir="ltr"
            >
              {displayedPoint.toFixed(2)}x
            </div>
            <span className="relative z-[2] text-[12px] font-bold text-white/70 mt-2">
              {phaseText}
            </span>
          </>
        ) : (
          <div className="relative z-[2] flex flex-col items-center gap-2">
            {liveRound !== null && (
              <span className="text-[12px] font-bold text-[#ff5a55]">
                {t.dash_round_label} #{liveRound}
              </span>
            )}
            <div className="multiplier-value relative z-[2]" dir="ltr">
              ---
            </div>
            <span className="text-[12px] font-bold text-white/70 mt-1">
              {t.dash_waiting_next}
            </span>
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="w-full flex flex-col gap-[12px]">
        {/* Account ID */}
        <div className="bg-[rgba(10,20,30,0.55)] border border-[#ff0800]/30 rounded-[24px] px-[16px] py-[12px] flex items-center gap-[14px] backdrop-blur-[20px]">
          <div className="w-[42px] h-[42px] rounded-full bg-black/30 border-2 border-[#ff0800]/40 flex items-center justify-center text-[#ff0800] shrink-0">
            <Fingerprint className="w-[20px] h-[20px]" />
          </div>
          <div className="min-w-0">
            <span
              className="block text-[14px] font-black text-white font-cyber tabular-nums"
              dir="ltr"
            >
              {userId}
            </span>
            <div className="text-[11px] text-white/65">
              {t.dash_account_id}
            </div>
          </div>
        </div>

        {/* Platform */}
        <div className="bg-[rgba(10,20,30,0.55)] border border-[#ff0800]/30 rounded-[24px] px-[16px] py-[12px] flex items-center gap-[14px] backdrop-blur-[20px]">
          <div className="w-[42px] h-[42px] rounded-full bg-black/30 border-2 border-[#ff0800]/40 flex items-center justify-center overflow-hidden shrink-0">
            <UltrapariLogo className="w-full h-full rounded-full" />
          </div>
          <div className="min-w-0">
            <span className="block text-[14px] font-black text-white font-cyber">
              {t.platform_label}
            </span>
            <div className="text-[11px] flex items-center gap-[6px] font-bold">
              <span
                className={`w-[6px] h-[6px] rounded-full ${
                  dbClosed ? 'bg-[#ff4d4d]' : 'bg-[#35d07f] status-dot'
                }`}
              />
              <span className={dbClosed ? 'text-[#ff4d4d]' : 'text-[#35d07f]'}>
                {dbClosed ? t.dash_db_closed_title : t.dash_active}
              </span>
            </div>
          </div>
        </div>

        {/* Timer Card */}
        <div className="bg-gradient-to-br from-[#ff0800]/10 to-[#B30600]/[0.06] border border-[#ff0800]/35 rounded-[24px] p-[16px] text-center backdrop-blur-[20px] w-full">
          <div className="text-[12px] text-white/65 mb-1">
            {t.dash_time_remaining}
          </div>
          <div
            className="font-cyber text-[24px] font-black text-[#ff0800] tabular-nums"
            dir="ltr"
          >
            {formattedTime}
          </div>
          <div className="w-full h-[4px] bg-white/[0.08] rounded-[2px] mt-[10px] overflow-hidden">
            <div
              className="h-full bg-[#ff0800] transition-[width] duration-1000 linear"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        type="button"
        onClick={onLogout}
        className="w-full p-[12px] rounded-[12px] text-[14px] font-black cursor-pointer flex items-center justify-center gap-[8px] bg-transparent border border-[#ff0800]/50 text-[#ff0800] hover:bg-[#ff0800]/10 transition-colors whitespace-nowrap"
      >
        <LogOut className="w-[16px] h-[16px]" />
        <span>{t.dash_logout}</span>
      </button>
    </div>
  );
};
