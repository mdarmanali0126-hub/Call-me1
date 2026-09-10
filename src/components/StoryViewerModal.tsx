import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Share2,
  MessageCircle,
  Sparkles,
  MapPin,
  Heart,
  Quote
} from 'lucide-react';
import { Profile, DEFAULT_AVATAR_PLACEHOLDER } from '../types';
import { AdBanner } from './AdBanner';
import { trackTelemetry } from '../lib/api';
import { logEvent } from '../lib/analytics';

interface StoryViewerModalProps {
  profile: Profile;
  isOpen: boolean;
  onClose: () => void;
  onOpenContact?: () => void;
  initialSlideIndex?: number;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  profile,
  isOpen,
  onClose,
  onOpenContact,
  initialSlideIndex = 0
}) => {
  const slides = profile.story?.slides || [];
  const [currentIndex, setCurrentIndex] = useState(initialSlideIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100 for active slide
  const [copiedShare, setCopiedShare] = useState(false);

  const SLIDE_DURATION_MS = 6000;
  const progressIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Audio tone helper
  const playTone = useCallback((freq = 520) => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // Audio autoplay restrictions
    }
  }, [soundEnabled]);

  // Log open
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialSlideIndex);
      setProgress(0);
      trackTelemetry({
        type: 'story_open',
        profileSlug: profile.slug,
        timestamp: new Date().toISOString()
      });
      logEvent('story_open', 'Story', profile.slug);
    }
  }, [isOpen, initialSlideIndex, profile.slug]);

  // Navigation handlers
  const goToNext = useCallback(() => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex((prev) => {
        const nextIdx = prev + 1;
        logEvent('story_progress', 'Story', `${profile.slug} - Chapter ${nextIdx + 1}`);
        return nextIdx;
      });
      setProgress(0);
      playTone(580);
    } else {
      // Completed all slides
      trackTelemetry({
        type: 'story_complete',
        profileSlug: profile.slug,
        timestamp: new Date().toISOString()
      });
      logEvent('story_complete', 'Story', profile.slug);
      onClose();
    }
  }, [currentIndex, slides.length, profile.slug, onClose, playTone]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
      playTone(440);
    }
  }, [currentIndex, playTone]);

  // Timer loop
  useEffect(() => {
    if (!isOpen || isPaused || slides.length === 0) return;

    const stepMs = 50;
    const increment = (stepMs / SLIDE_DURATION_MS) * 100;

    progressIntervalRef.current = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goToNext();
          return 0;
        }
        return prev + increment;
      });
    }, stepMs);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isOpen, isPaused, currentIndex, goToNext, slides.length]);

  // Keyboard navigation & ESC handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === ' ') goToNext();
      if (e.key === 'ArrowLeft') goToPrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, goToNext, goToPrev]);

  if (!isOpen || slides.length === 0) return null;

  const currentSlide = slides[currentIndex] || slides[0];

  const handleShareStory = () => {
    const url = `${window.location.origin}/profile/${profile.slug}?story=1`;
    navigator.clipboard.writeText(url);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl select-none">
      {/* Background ambient gradient */}
      <div
        className="absolute inset-0 opacity-40 blur-3xl transition-all duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, rgba(225, 29, 72, 0.4) 0%, rgba(15, 23, 42, 0.9) 100%)`
        }}
      />

      {/* Main Story Container (phone frame on desktop, full screen on mobile) */}
      <div className="relative w-full h-full sm:h-[92vh] sm:max-w-md sm:rounded-3xl overflow-hidden shadow-2xl bg-slate-950 flex flex-col border border-white/10">
        {/* Top Progress Bars */}
        <div className="absolute top-0 inset-x-0 z-30 p-3 pt-4 sm:p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="flex gap-1.5 w-full">
            {slides.map((slide, idx) => {
              let fillPercent = 0;
              if (idx < currentIndex) fillPercent = 100;
              else if (idx === currentIndex) fillPercent = progress;

              return (
                <div key={slide.id || idx} className="h-1 flex-1 bg-white/25 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all ease-linear"
                    style={{
                      width: `${fillPercent}%`,
                      transitionDuration: idx === currentIndex ? '50ms' : '0ms'
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Header Info */}
          <div className="flex items-center justify-between mt-3 text-white">
            <div className="flex items-center gap-2.5">
              <img
                src={profile.image || DEFAULT_AVATAR_PLACEHOLDER}
                alt={profile.fullName}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover border-2 border-rose-500 shadow-xs"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm leading-tight text-white">{profile.fullName}</span>
                  <span className="text-[11px] text-rose-300 font-medium">Story</span>
                </div>
                <p className="text-[11px] text-slate-300 flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 text-rose-400" />
                  <span>{profile.city}, {profile.country}</span>
                </p>
              </div>
            </div>

            {/* Header controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                title={soundEnabled ? 'Mute' : 'Enable audio tone'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-rose-400" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleShareStory}
                className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                title="Share this story"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-white/90 hover:text-white rounded-full hover:bg-white/10 transition-colors ml-1"
                title="Close Story (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {copiedShare && (
            <div className="mt-2 text-center text-xs text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 py-1 px-2 rounded-md">
              Story link copied to clipboard!
            </div>
          )}
        </div>

        {/* Slide Visual Content with Motion */}
        <div
          className="relative flex-1 w-full h-full flex flex-col justify-end p-6 pb-24 sm:pb-20 overflow-hidden"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 w-full h-full"
            >
              {/* Background media */}
              {currentSlide.mediaUrl && currentSlide.mediaUrl.trim() !== '' ? (
                <img
                  src={currentSlide.mediaUrl}
                  alt={currentSlide.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${currentSlide.bgGradient || 'from-rose-950 via-slate-900 to-black'}`} />
              )}

              {/* Dark gradient overlay for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20" />
            </motion.div>
          </AnimatePresence>

          {/* Interactive Tap Zones: Left = Prev, Right = Next */}
          <div
            className="absolute inset-y-16 left-0 w-1/3 z-20 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              goToPrev();
            }}
            aria-label="Previous slide"
          />
          <div
            className="absolute inset-y-16 right-0 w-2/3 z-20 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            aria-label="Next slide"
          />

          {/* Slide Text Content */}
          <div className="relative z-20 space-y-3 pointer-events-none">
            {currentSlide.caption && (
              <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 backdrop-blur-md">
                {currentSlide.caption}
              </span>
            )}

            <h3 className="text-2xl font-bold text-white tracking-tight leading-tight font-serif-luxury">
              {currentSlide.title}
            </h3>

            {currentSlide.quote && (
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/15 text-rose-100 text-xs italic flex items-start gap-2">
                <Quote className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{currentSlide.quote}</p>
              </div>
            )}

            <p className="text-sm text-slate-200 leading-relaxed max-w-sm">
              {currentSlide.text}
            </p>

            {/* Slide Sponsor Tag if applicable */}
            <div className="pointer-events-auto pt-1">
              <AdBanner slotName="story_sponsor" profileSlug={profile.slug} />
            </div>

            {/* CTA button inside slide */}
            {currentSlide.ctaText && (
              <div className="pt-2 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenContact) {
                      onClose();
                      onOpenContact();
                    }
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 text-white font-semibold text-sm shadow-lg shadow-rose-900/40 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{currentSlide.ctaText}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Bar inside modal */}
        <div className="absolute bottom-0 inset-x-0 z-30 p-4 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>{currentIndex + 1} of {slides.length}</span>
            <span>•</span>
            <span className="text-slate-300">Tap sides to flip</span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onOpenContact) {
                onClose();
                onOpenContact();
              }
            }}
            className="px-4 py-2 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Heart className="w-3.5 h-3.5 fill-white" />
            <span>Connect</span>
          </button>
        </div>

        {/* Desktop Side Chevron Arrows */}
        <button
          type="button"
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white items-center justify-center disabled:opacity-20 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={goToNext}
          className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white items-center justify-center transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
