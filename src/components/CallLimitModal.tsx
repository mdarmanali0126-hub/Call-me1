import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Video, Play, ShieldAlert, Award } from 'lucide-react';

interface CallLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWatchAd: () => void;
  callsUsed?: number;
}

export const CallLimitModal: React.FC<CallLimitModalProps> = ({
  isOpen,
  onClose,
  onWatchAd,
  callsUsed = 3,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Call Limit Reached"
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
        >
          {/* Ambient Glow */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20 blur-3xl"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(244, 63, 94, 0.3) 0%, rgba(0, 0, 0, 0.95) 75%)',
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-md bg-zinc-950 rounded-3xl border border-pink-500/30 shadow-[0_0_50px_rgba(244,63,94,0.25)] p-6 sm:p-8 text-center text-white overflow-hidden space-y-6"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Glowing Icon */}
            <div className="relative inline-flex items-center justify-center mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 p-0.5 shadow-xl shadow-rose-950/40">
                <div className="w-full h-full rounded-[22px] bg-zinc-950 flex items-center justify-center text-pink-400">
                  <Video className="w-8 h-8" />
                </div>
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-pink-500" />
              </span>
            </div>

            {/* Typography */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/25 text-pink-300 text-[10px] font-semibold tracking-wider uppercase">
                <Sparkles className="w-3 h-3 text-pink-400" />
                <span>Call Limit Reached</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-serif-luxury text-white">
                Your free video previews are used up.
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
                Watch a short sponsor message to continue exploring. You will instantly receive <span className="text-pink-400 font-semibold">5 additional video previews</span>!
              </p>
            </div>

            {/* Feature Perks Box */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-white/10 text-left space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between font-semibold text-slate-200">
                <span>Completed Previews</span>
                <span className="text-pink-400 font-mono">{callsUsed} Used</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-rose-500 to-pink-500 h-full w-full rounded-full" />
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                <Award className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                <span>Unlocks 5 more 10-second video call previews</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={onWatchAd}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:via-pink-600 hover:to-rose-700 text-white font-bold text-sm shadow-[0_0_25px_rgba(244,63,94,0.35)] flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Watch Sponsor Message</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Maybe Later
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
