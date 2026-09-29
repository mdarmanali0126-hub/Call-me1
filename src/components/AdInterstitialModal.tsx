import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { resetAllowanceAfterAd } from '../lib/callLimit';
import { logEvent } from '../lib/analytics';

interface AdInterstitialModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onClose?: () => void;
}

const AD_DURATION_SECONDS = 10;

export const AdInterstitialModal: React.FC<AdInterstitialModalProps> = ({
  isOpen,
  onComplete,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(AD_DURATION_SECONDS);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSecondsRemaining(AD_DURATION_SECONDS);
      setIsCompleted(false);
      logEvent('ad_interstitial_start', 'Monetization', 'call_limit_interstitial');

      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            // Grant 5 calls allowance
            resetAllowanceAfterAd();
            setIsCompleted(true);
            logEvent('ad_interstitial_complete', 'Monetization', 'granted_5_calls');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isOpen]);

  const progressPercent = Math.min(
    100,
    ((AD_DURATION_SECONDS - secondsRemaining) / AD_DURATION_SECONDS) * 100
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Sponsor Advertisement"
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/95 backdrop-blur-md"
        >
          {/* Ambient Glow */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20 blur-3xl"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(244, 63, 94, 0.25) 0%, rgba(0, 0, 0, 0.98) 75%)',
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative w-full max-w-lg bg-zinc-950 rounded-3xl border border-white/10 shadow-[0_0_60px_rgba(244,63,94,0.22)] p-5 sm:p-7 text-white overflow-hidden space-y-5"
          >
            {/* Header: Label + Countdown Timer */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500" />
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
                  Advertisement
                </span>
              </div>

              {/* Countdown or Completed Badge */}
              {!isCompleted ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-pink-500/30 text-pink-400 text-xs font-mono font-bold shadow-xs select-none">
                  <span>Reward in</span>
                  <span className="text-white text-sm">{secondsRemaining}s</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-semibold select-none">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>5 Calls Unlocked!</span>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400"
                style={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3, ease: 'linear' }}
              />
            </div>

            {/* Sponsor Ad Area */}
            <div className="w-full min-h-[180px] sm:min-h-[220px] rounded-2xl bg-zinc-900/90 border border-white/10 p-4 flex flex-col items-center justify-center text-center relative overflow-hidden">
              {/* Actual Project Adsterra Ad Unit */}
              <div className="w-full flex flex-col items-center justify-center">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2 select-none">
                  Sponsored Partner
                </div>
                <div className="w-[320px] max-w-full min-h-[50px] flex items-center justify-center bg-black/40 rounded-xl border border-white/5 p-1">
                  <iframe
                    title="Sponsor Network Ad"
                    width={320}
                    height={50}
                    style={{
                      width: '320px',
                      height: '50px',
                      maxWidth: '100%',
                      border: 'none',
                    }}
                    scrolling="no"
                    src="/adsterra.html"
                  />
                </div>
              </div>

              {/* Sponsor Message Information */}
              <div className="mt-4 pt-3 border-t border-white/5 text-center max-w-xs space-y-1">
                <p className="text-xs text-slate-300 font-medium">
                  Supporting verified matrimonial discovery
                </p>
                <p className="text-[11px] text-slate-500">
                  Thank you for supporting Call Me platform sponsors.
                </p>
              </div>
            </div>

            {/* Footer / Completion CTA */}
            <div className="pt-2 text-center">
              {!isCompleted ? (
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 select-none py-2">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-spin" />
                  <span>Your 5 new call previews will unlock when the sponsor message ends ({secondsRemaining}s)</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onComplete}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:via-pink-600 hover:to-rose-700 text-white font-bold text-sm shadow-[0_0_25px_rgba(244,63,94,0.35)] flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 fill-white" />
                  <span>Continue with 5 New Video Previews</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
