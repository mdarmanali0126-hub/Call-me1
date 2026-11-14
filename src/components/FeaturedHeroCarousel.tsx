import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Sparkles,
  MessageCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Profile, DEFAULT_AVATAR_PLACEHOLDER, isProfileActive } from '../types';

interface FeaturedHeroCarouselProps {
  profiles: Profile[];
  loading: boolean;
  checkIsOnline?: (profile: Profile) => boolean;
  onOpenMessage: (profile: Profile) => void;
}

const ROTATION_INTERVAL_MS = 5000;

export const FeaturedHeroCarousel: React.FC<FeaturedHeroCarouselProps> = ({
  profiles,
  loading,
  checkIsOnline,
  onOpenMessage,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(
    typeof document !== 'undefined' ? document.hidden : false
  );
  const preloadedUrlsRef = useRef<Set<string>>(new Set());

  // Build deduplicated eligible published & approved candidate rotation list (featured first, then other active published profiles)
  const eligibleProfiles = useMemo<Profile[]>(() => {
    const published = profiles.filter((p) => isProfileActive(p) && Boolean(p.fullName?.trim()));
    if (published.length === 0) return [];

    const withImages = published.filter((p) => Boolean(p.image?.trim()));
    const pool = withImages.length > 0 ? withImages : published;

    const featured = pool.filter((p) => p.featured);
    const nonFeatured = pool.filter((p) => !p.featured);

    const seen = new Set<string>();
    const ordered: Profile[] = [];
    for (const candidate of [...featured, ...nonFeatured]) {
      if (!seen.has(candidate.id)) {
        seen.add(candidate.id);
        ordered.push(candidate);
      }
    }
    return ordered;
  }, [profiles]);

  const totalCount = eligibleProfiles.length;
  const safeIndex = totalCount > 0 ? currentIndex % totalCount : 0;
  const currentProfile = totalCount > 0 ? eligibleProfiles[safeIndex] : undefined;

  // Keep index bounded if profile list updates
  useEffect(() => {
    if (totalCount > 0 && currentIndex >= totalCount) {
      setCurrentIndex(0);
    }
  }, [totalCount, currentIndex]);

  // Pause rotation when browser tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabHidden(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Preload next candidate image silently in browser memory
  useEffect(() => {
    if (totalCount <= 1) return;
    const nextIdx = (safeIndex + 1) % totalCount;
    const nextImg = eligibleProfiles[nextIdx]?.image;
    if (nextImg && !preloadedUrlsRef.current.has(nextImg)) {
      preloadedUrlsRef.current.add(nextImg);
      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.src = nextImg;
    }
  }, [safeIndex, totalCount, eligibleProfiles]);

  // Single auto-rotation timer (5s); resets cleanly whenever safeIndex changes (including manual navigation)
  useEffect(() => {
    if (totalCount <= 1 || isHovered || isTabHidden || shouldReduceMotion) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % totalCount);
    }, ROTATION_INTERVAL_MS);

    return () => window.clearTimeout(timer);
  }, [safeIndex, totalCount, isHovered, isTabHidden, shouldReduceMotion]);

  const handlePrev = () => {
    if (totalCount <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + totalCount) % totalCount);
  };

  const handleNext = () => {
    if (totalCount <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % totalCount);
  };

  if (loading && !currentProfile) {
    return (
      <div className="aspect-[16/15] sm:aspect-[4/5] w-full max-w-[400px] sm:max-w-[380px] mx-auto rounded-2xl bg-[#111114] border border-[#232329] animate-pulse" />
    );
  }

  if (!currentProfile) {
    return null;
  }

  const isActive = isProfileActive(currentProfile);
  // Keep pagination dot strip compact on mobile if directory grows large
  const maxVisibleDots = 7;
  const dotIndices =
    totalCount <= maxVisibleDots
      ? Array.from({ length: totalCount }, (_, i) => i)
      : Array.from({ length: maxVisibleDots }, (_, i) => {
          const half = Math.floor(maxVisibleDots / 2);
          return (safeIndex - half + i + totalCount) % totalCount;
        });

  return (
    <div
      className="relative max-w-[400px] sm:max-w-[380px] mx-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Controlled Subtle Burgundy Ambient Aura */}
      <div
        className="hidden sm:block absolute -inset-4 rounded-3xl pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(155, 23, 68, 0.22) 0%, rgba(139, 92, 246, 0.08) 45%, transparent 75%)',
        }}
        aria-hidden="true"
      />

      <div className="relative rounded-2xl overflow-hidden bg-[#111114] border border-[#26262E] shadow-xl group">
        {/* Synchronized Portrait Frame (Fixed Aspect Ratio prevents layout jumps) */}
        <Link
          to={`/profile/${currentProfile.slug}`}
          className="block relative aspect-[16/15] sm:aspect-[4/5] w-full overflow-hidden bg-[#08080A]"
          aria-label={`View candidate profile for ${currentProfile.fullName}`}
        >
          <AnimatePresence mode="sync" initial={false}>
            <motion.img
              key={currentProfile.id}
              src={currentProfile.image || DEFAULT_AVATAR_PLACEHOLDER}
              alt={currentProfile.fullName}
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.99 }}
              transition={{ duration: shouldReduceMotion ? 0.15 : 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-500 ease-out"
            />
          </AnimatePresence>

          {/* Measured Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#08080A] via-[#08080A]/30 to-black/20 pointer-events-none z-10" />

          {/* Top Status Row (Synchronized with currentProfile) */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 z-20 pointer-events-none">
            <span className="px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-medium bg-[#09090B]/85 backdrop-blur-md border border-[#2A2A32] text-white inline-flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#FF2878]" />
              <span>{currentProfile.featured ? 'Featured' : 'Profile Spotlight'}</span>
            </span>

            {isActive && (
              <span
                className="px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold bg-[#09090B]/85 backdrop-blur-md border border-[#00D084]/40 text-[#00D084] inline-flex items-center gap-1.5"
                title="Active published profile"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D084] shadow-[0_0_6px_rgba(0,208,132,0.75)]" />
                <span>Active</span>
              </span>
            )}
          </div>
        </Link>

        {/* Synchronized Candidate Info + View Profile Row */}
        <div className="p-3.5 sm:p-4 z-20 bg-[#111114] border-t border-[#232329] flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentProfile.id}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                transition={{ duration: shouldReduceMotion ? 0.1 : 0.35, ease: 'easeOut' }}
                className="min-w-0"
              >
                <p className="text-[15px] sm:text-[17px] font-bold text-white leading-snug truncate">
                  {currentProfile.fullName}
                  <span className="text-[#A5A5B5] font-medium tabular-nums">, {currentProfile.age}</span>
                </p>
                <p className="text-xs text-[#B8B8C6] leading-snug mt-0.5 truncate">
                  {currentProfile.city}, {currentProfile.country} · {currentProfile.profession}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onOpenMessage(currentProfile)}
              className="w-10 h-10 sm:w-9 sm:h-9 rounded-xl bg-[#08080A] hover:bg-[#1C1C22] border border-[#2A2A32] hover:border-[#FF2878]/60 text-white flex items-center justify-center transition-colors cursor-pointer"
              title={`Message ${currentProfile.fullName}`}
              aria-label={`Message ${currentProfile.fullName}`}
            >
              <MessageCircle className="w-4 h-4 text-[#FF2878]" />
            </button>
            <Link
              to={`/profile/${currentProfile.slug}`}
              className="h-10 sm:h-9 px-3.5 rounded-xl gradient-pink-purple hover:opacity-95 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-opacity whitespace-nowrap"
            >
              <span>View Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Elegant Manual Controls & Clickable Pagination Dots */}
        {totalCount > 1 && (
          <div className="px-3.5 py-2 bg-[#0B0B0E] border-t border-[#232329] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrev}
                className="w-7 h-7 rounded-lg bg-[#141418] hover:bg-[#1E1E24] border border-[#232329] text-[#A5A5B5] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Previous featured candidate"
                title="Previous candidate"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="w-7 h-7 rounded-lg bg-[#141418] hover:bg-[#1E1E24] border border-[#232329] text-[#A5A5B5] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Next featured candidate"
                title="Next candidate"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-1" role="tablist" aria-label="Featured candidates">
              {dotIndices.map((idx) => {
                const active = idx === safeIndex;
                const dotCandidate = eligibleProfiles[idx];
                return (
                  <button
                    key={dotCandidate?.id || idx}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-label={`Show ${dotCandidate?.fullName || `candidate ${idx + 1}`}`}
                    onClick={() => setCurrentIndex(idx)}
                    className="py-1.5 px-0.5 flex items-center justify-center cursor-pointer"
                  >
                    <span
                      className={`block h-1.5 rounded-full transition-all duration-300 ${
                        active
                          ? 'w-5 gradient-pink-purple'
                          : 'w-1.5 bg-[#363642] hover:bg-[#6A6A7A]'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <span className="text-[11px] font-medium text-[#9A9AA8] tabular-nums shrink-0">
              {safeIndex + 1} / {totalCount}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
