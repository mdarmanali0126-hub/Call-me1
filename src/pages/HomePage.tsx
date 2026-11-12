import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Sparkles,
  Heart,
  X,
  ArrowRight,
  ShieldCheck,
  Users,
  MessageCircle,
  Phone,
  Lock,
  Compass,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Profile, DEFAULT_AVATAR_PLACEHOLDER } from '../types';
import { fetchPublicProfiles, trackTelemetry } from '../lib/api';
import { updateSEO } from '../lib/seo';
import { logEvent } from '../lib/analytics';
import { useOnlinePresence } from '../lib/presence';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProfileCard } from '../components/ProfileCard';
import { ContactModal } from '../components/ContactModal';
import { ShareModal } from '../components/ShareModal';
import { MessageChatModal } from '../components/MessageChatModal';
import { VideoCallModal } from '../components/VideoCallModal';
import { CallLimitModal } from '../components/CallLimitModal';
import { AdInterstitialModal } from '../components/AdInterstitialModal';
import { StoryViewerModal } from '../components/StoryViewerModal';
import { AdsterraBanner } from '../components/AdsterraBanner';
import { useCallLimit } from '../hooks/useCallLimit';

export const HomePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Call Limit Management
  const { callsUsed, callsRemaining, canCall, consumeCall } = useCallLimit();
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [isAdInterstitialOpen, setIsAdInterstitialOpen] = useState(false);
  const [pendingVideoCallProfile, setPendingVideoCallProfile] = useState<Profile | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get('country') || 'all');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'all');
  const [selectedProfession, setSelectedProfession] = useState(searchParams.get('profession') || 'all');
  const [onlyFeatured, setOnlyFeatured] = useState(searchParams.get('filter') === 'featured');

  // Modal active profile states
  const [contactProfile, setContactProfile] = useState<Profile | null>(null);
  const [shareProfile, setShareProfile] = useState<Profile | null>(null);
  const [messageProfile, setMessageProfile] = useState<Profile | null>(null);
  const [videoCallProfile, setVideoCallProfile] = useState<Profile | null>(null);
  const [storyProfile, setStoryProfile] = useState<Profile | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Real-Time Online Presence Tracking
  const { checkIsOnline } = useOnlinePresence();

  // Horizontal Reel Drag & Scroll Controls
  const reelRef = React.useRef<HTMLDivElement | null>(null);
  const isMouseDownRef = React.useRef(false);
  const startXRef = React.useRef(0);
  const scrollLeftRef = React.useRef(0);
  const hasDraggedRef = React.useRef(false);

  const handleReelScroll = (direction: 'left' | 'right') => {
    if (reelRef.current) {
      const scrollAmount = 280;
      reelRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!reelRef.current) return;
    isMouseDownRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - reelRef.current.offsetLeft;
    scrollLeftRef.current = reelRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current || !reelRef.current) return;
    const x = e.pageX - reelRef.current.offsetLeft;
    const walk = (x - startXRef.current);
    if (Math.abs(walk) > 6) {
      hasDraggedRef.current = true;
      reelRef.current.scrollLeft = scrollLeftRef.current - walk;
    }
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
  };

  // Start call or trigger limit screen
  const handleInitiateCall = (targetProfile: Profile) => {
    if (!canCall) {
      setPendingVideoCallProfile(targetProfile);
      setIsLimitModalOpen(true);
    } else {
      setVideoCallProfile(targetProfile);
    }
  };

  // When 10-second sponsor ad finishes, grant 5 calls and optionally resume call
  const handleAdInterstitialComplete = () => {
    setIsAdInterstitialOpen(false);
    setToastMessage('5 new video call previews unlocked! You can continue calling.');
    setTimeout(() => setToastMessage(null), 5000);
    if (pendingVideoCallProfile) {
      const p = pendingVideoCallProfile;
      setPendingVideoCallProfile(null);
      setVideoCallProfile(p);
    }
  };

  useEffect(() => {
    updateSEO({
      title: 'Call Me - Discover Profiles, Message & Video Calling',
      description: 'Discover verified matrimonial candidate portfolios, direct messaging inquiries, and simulated video call previews on Call Me.',
      url: window.location.origin
    });

    trackTelemetry({
      type: 'page_view',
      timestamp: new Date().toISOString()
    });

    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const data = await fetchPublicProfiles();
      setProfiles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Derive unique filter options
  const countries = useMemo(() => {
    const list = Array.from(new Set(profiles.map((p) => p.country).filter(Boolean)));
    return ['all', ...list];
  }, [profiles]);

  const professions = useMemo(() => {
    const list = Array.from(new Set(profiles.map((p) => p.profession).filter(Boolean)));
    return ['all', ...list.slice(0, 10)];
  }, [profiles]);

  // Helper to match marital status accommodating standard matrimonial synonyms (Single <=> Never Married <=> Unmarried)
  const matchesMaritalStatus = (candidateStatus: string | undefined, filterStatus: string): boolean => {
    if (!filterStatus || filterStatus === 'all') return true;
    if (!candidateStatus) return false;
    const c = candidateStatus.trim().toLowerCase();
    const f = filterStatus.trim().toLowerCase();

    const isUnmarriedFilter = f === 'single' || f === 'never married' || f === 'unmarried';
    const isUnmarriedCandidate = c === 'single' || c === 'never married' || c === 'unmarried';
    if (isUnmarriedFilter && isUnmarriedCandidate) {
      return true;
    }

    return c === f;
  };

  // Filtered list
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      if (onlyFeatured && !p.featured) return false;
      if (selectedCountry !== 'all' && p.country && p.country.toLowerCase() !== selectedCountry.toLowerCase()) return false;
      if (selectedStatus !== 'all' && !matchesMaritalStatus(p.maritalStatus, selectedStatus)) return false;
      if (selectedProfession !== 'all' && p.profession && !p.profession.toLowerCase().includes(selectedProfession.toLowerCase())) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.fullName.toLowerCase().includes(q);
        const matchesCity = p.city.toLowerCase().includes(q);
        const matchesProf = p.profession.toLowerCase().includes(q);
        const matchesBio = p.bio.toLowerCase().includes(q);
        const matchesTag = p.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesCity && !matchesProf && !matchesBio && !matchesTag) return false;
      }

      return true;
    });
  }, [profiles, searchQuery, selectedCountry, selectedStatus, selectedProfession, onlyFeatured]);

  const featuredProfiles = useMemo(() => {
    return profiles.filter((p) => p.featured && p.published);
  }, [profiles]);

  const spotlightProfile = featuredProfiles[0] || profiles[0];

  // Published profiles for the Active Calling reel
  const activeProfiles = useMemo(() => {
    return profiles.filter((p) => p.published);
  }, [profiles]);

  const scrollToProfiles = () => {
    const target = document.getElementById('discover');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050811] text-white selection:bg-amber-500 selection:text-black">
      {/* Navigation */}
      <Navbar onSearchClick={() => setSearchModalOpen(true)} />

      <main className="flex-1 relative overflow-hidden">
        {/* Subtle Luxury Ambient Top Glow */}
        <div
          className="absolute top-0 inset-x-0 h-[560px] pointer-events-none opacity-40 blur-3xl transform-gpu contain-paint isolate"
          style={{
            background: 'radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.12) 0%, rgba(13, 20, 36, 0.4) 40%, rgba(5, 8, 17, 0) 75%)',
          }}
        />

        {/* ==================================================
            1. HERO SECTION (Exceptional Luxury Matchmaking Hero)
            ================================================== */}
        <section className="relative pt-12 pb-14 lg:pt-18 lg:pb-20 border-b border-amber-200/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto space-y-5 sm:space-y-6">
              {/* Brand Tag Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0d1424] border border-amber-300/25 text-amber-200 text-[10px] sm:text-xs font-semibold tracking-widest uppercase shadow-[0_4px_20px_rgba(0,0,0,0.5)] select-none">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>Call Me • Bespoke Luxury Matchmaking</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-serif-luxury leading-[1.16] sm:leading-[1.12]">
                Discover Someone{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-rose-200 italic">
                  Extraordinary.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg lg:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal px-2">
                Meaningful connections begin with the right introduction.
              </p>

              {/* Primary Call to Action Button */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={scrollToProfiles}
                  className="h-12 sm:h-13 px-8 sm:px-9 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs sm:text-sm tracking-wide shadow-[0_8px_25px_rgba(212,175,55,0.25)] flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <span>Explore Profiles</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </button>
              </div>

              {/* Beautifully Designed Search Experience */}
              <div className="pt-3 max-w-2xl mx-auto w-full px-1 sm:px-0">
                <div className="relative flex items-center w-full bg-[#090e1a]/95 rounded-2xl sm:rounded-full shadow-2xl shadow-black/80 border border-amber-200/20 focus-within:border-amber-300/60 focus-within:ring-1 focus-within:ring-amber-300/30 p-1.5 sm:p-2 transition-all">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 ml-3 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by candidate name, profession, city, or background..."
                    className="w-full min-w-0 px-3 py-2 text-xs sm:text-sm text-white placeholder:text-slate-400 bg-transparent outline-none font-normal"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-1.5 text-slate-400 hover:text-white mr-1 transition-colors cursor-pointer shrink-0"
                      title="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (searchQuery.trim()) {
                        logEvent('search', 'Home', searchQuery);
                        scrollToProfiles();
                      }
                    }}
                    className="px-5 sm:px-6 py-2.5 rounded-xl sm:rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-bold tracking-wide shrink-0 shadow-md active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================
            2. ACTIVE STORIES & CANDIDATE REEL
            - Genuine real-time presence (bright green if active, neutral gray if offline)
            - Smooth horizontal side-scrolling (overflow-x-auto, touch-action: pan-x, -webkit-overflow-scrolling: touch)
            ================================================== */}
        <section className="bg-[#070b16] border-b border-white/5 py-5 sm:py-7 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-3.5 px-0.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <h2 className="text-xs sm:text-sm font-bold tracking-widest text-amber-100 uppercase font-sans">
                  Active Stories &amp; Candidate Reel
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                  Tap candidate to open story or message
                </span>
                {/* Desktop navigation chevrons for easy scrolling with mouse */}
                <div className="hidden sm:flex items-center gap-1.5 ml-2">
                  <button
                    type="button"
                    onClick={() => handleReelScroll('left')}
                    className="p-1.5 rounded-full bg-white/5 hover:bg-amber-400/20 text-slate-400 hover:text-amber-200 border border-white/10 transition-colors cursor-pointer"
                    aria-label="Scroll left"
                    title="Scroll left"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReelScroll('right')}
                    className="p-1.5 rounded-full bg-white/5 hover:bg-amber-400/20 text-slate-400 hover:text-amber-200 border border-white/10 transition-colors cursor-pointer"
                    aria-label="Scroll right"
                    title="Scroll right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Horizontal Calling Reel: Single horizontal row, non-shrinking circles, responsive swipe */}
            <div
              ref={reelRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="-mx-4 px-4 sm:mx-0 sm:px-0 flex items-center gap-4 sm:gap-6 overflow-x-auto flex-nowrap pb-3 pt-1 scrollbar-none select-none scroll-smooth touch-pan-x overscroll-x-contain webkit-overflow-touch snap-x snap-mandatory cursor-grab active:cursor-grabbing"
              style={{
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-x',
                overscrollBehaviorX: 'contain',
              }}
            >
              {/* Item 0: Instant Call Action */}
              {spotlightProfile && (
                <div
                  onClick={() => {
                    if (hasDraggedRef.current) return;
                    handleInitiateCall(spotlightProfile);
                  }}
                  className="flex flex-col items-center gap-1.5 shrink-0 snap-start cursor-pointer group"
                >
                  <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-amber-400 via-amber-200 to-rose-400 group-hover:scale-105 transition-transform duration-200">
                    <div className="w-16 h-16 sm:w-[68px] sm:h-[68px] rounded-full bg-[#050811] flex flex-col items-center justify-center border-2 border-black text-amber-300 group-hover:text-white transition-colors">
                      <Phone className="w-5 h-5 fill-amber-300/20 text-amber-300" />
                      <span className="text-[9px] font-bold mt-0.5 text-amber-200 tracking-wider">CALL</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-200 truncate max-w-[70px] text-center mt-0.5">
                    Instant Call
                  </span>
                </div>
              )}

              {/* Candidate Profiles in Reel */}
              {activeProfiles.map((p) => {
                const isOnline = checkIsOnline(p);
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (hasDraggedRef.current) return;
                      setMessageProfile(p);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setMessageProfile(p);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Send message inquiry to ${p.fullName} (${isOnline ? 'Online' : 'Offline'})`}
                    className="flex flex-col items-center gap-1.5 shrink-0 snap-start cursor-pointer group outline-none"
                  >
                    {/* Circular image with refined champagne border */}
                    <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-amber-400/80 via-amber-200/60 to-rose-400/80 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all duration-200 shadow-md">
                      <img
                        src={p.image || DEFAULT_AVATAR_PLACEHOLDER}
                        alt={p.fullName}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 sm:w-[68px] sm:h-[68px] rounded-full object-cover border-2 border-[#050811]"
                      />

                      {/* Genuine Real-Time Presence Indicator: Bright Green if Online, Neutral Slate Gray if Offline */}
                      {isOnline ? (
                        <span
                          className="absolute bottom-0 right-0 z-10 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-[#050811] shadow-[0_0_10px_rgba(16,185,129,0.95)] flex items-center justify-center transition-transform"
                          title={`${p.fullName} is currently active`}
                          aria-label="Online now"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-100 animate-pulse" />
                        </span>
                      ) : (
                        <span
                          className="absolute bottom-0.5 right-0.5 z-10 w-3 h-3 rounded-full bg-slate-600/85 ring-2 ring-[#050811]"
                          title={`${p.fullName} is offline`}
                          aria-label="Offline"
                        />
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-slate-300 truncate max-w-[74px] text-center group-hover:text-amber-200 transition-colors mt-0.5">
                      {p.fullName.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================================================
            3. FEATURED CANDIDATE SPOTLIGHT (Luxury Editorial Card)
            ================================================== */}
        {spotlightProfile && !searchQuery && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div id="featured" className="max-w-5xl mx-auto bg-[#090e1a]/95 rounded-3xl border border-amber-200/20 shadow-[0_16px_50px_rgba(0,0,0,0.6)] overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-12 items-center">
                {/* Spotlight Visual Image */}
                <div className="md:col-span-5 relative aspect-square sm:aspect-auto sm:h-full min-h-[340px] bg-[#050811]">
                  <img
                    src={spotlightProfile.image || DEFAULT_AVATAR_PLACEHOLDER}
                    alt={spotlightProfile.fullName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#090e1a]/95 md:from-transparent via-transparent to-black/30" />

                  {/* Refined Badge */}
                  <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#050811]/90 text-amber-200 text-xs font-semibold border border-amber-300/30 backdrop-blur-md shadow-lg">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Candidate Spotlight</span>
                  </div>
                </div>

                {/* Spotlight Info */}
                <div className="md:col-span-7 p-6 sm:p-8 lg:p-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-300 bg-amber-500/10 px-3 py-1 rounded-md border border-amber-400/20">
                      {spotlightProfile.profession}
                    </span>
                    <span className="text-xs text-slate-300 font-medium">
                      {spotlightProfile.age} yrs • {spotlightProfile.city}, {spotlightProfile.country}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold font-serif-luxury text-white">
                      {spotlightProfile.fullName}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">{spotlightProfile.education}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#050811]/90 border border-white/5 text-xs text-slate-300 leading-relaxed italic">
                    "{spotlightProfile.proposalMessage || spotlightProfile.bio}"
                  </div>

                  {/* Actions: View Portfolio, Message, Call Me */}
                  <div className="pt-2 flex flex-wrap items-center gap-2.5">
                    <Link
                      to={`/profile/${spotlightProfile.slug}`}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                    >
                      <span>View Full Profile</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => setMessageProfile(spotlightProfile)}
                      className="px-4 py-2.5 rounded-xl bg-[#050811] hover:bg-[#10182b] text-slate-200 border border-amber-200/20 hover:border-amber-300/50 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                      title={`Message ${spotlightProfile.fullName}`}
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-amber-300" />
                      <span>Inquire</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInitiateCall(spotlightProfile)}
                      className="px-4 py-2.5 rounded-xl bg-[#050811] hover:bg-[#10182b] text-slate-200 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                      title={`Call ${spotlightProfile.fullName}`}
                    >
                      <Phone className="w-3.5 h-3.5 text-rose-400" />
                      <span>Call Me</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ==================================================
            4. DISCOVER PROFILES & CANDIDATE DIRECTORY
            ================================================== */}
        <section id="discover" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 border-t border-white/5 relative z-10 isolate bg-[#050811]">
          {/* Filter Header Panel with Refined Champagne Accents */}
          <div className="bg-[#090e1a] border border-amber-200/15 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl shadow-black/50">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 sm:pb-5 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-serif-luxury text-white">
                    Discover Profiles
                  </h2>
                  <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-400/25 text-amber-200">
                    {filteredProfiles.length} Available
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Browse authentic candidate portfolios, evaluate mutual compatibility, and connect directly.
                </p>
              </div>

              {/* Action Buttons: Featured Spotlight toggle & Reset filter */}
              <div className="flex items-center gap-2.5 self-start lg:self-auto">
                <button
                  type="button"
                  onClick={() => setOnlyFeatured(!onlyFeatured)}
                  className={`h-9 sm:h-10 px-3.5 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-all border cursor-pointer select-none active:scale-95 ${
                    onlyFeatured
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold border-transparent shadow-xs'
                      : 'bg-[#050811] text-slate-300 border-white/10 hover:border-amber-300/40 hover:text-white'
                  }`}
                >
                  <Sparkles className={`w-3.5 h-3.5 ${onlyFeatured ? 'text-slate-950' : 'text-amber-300'} shrink-0`} />
                  <span>Featured Spotlights</span>
                </button>

                {(searchQuery || selectedCountry !== 'all' || selectedStatus !== 'all' || selectedProfession !== 'all' || onlyFeatured) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCountry('all');
                      setSelectedStatus('all');
                      setSelectedProfession('all');
                      setOnlyFeatured(false);
                    }}
                    className="h-9 sm:h-10 px-3 rounded-xl bg-[#050811] hover:bg-[#10182b] border border-amber-300/30 text-xs text-amber-200 font-semibold cursor-pointer transition-colors active:scale-95"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Responsive Filter Dropdowns: Stacks vertically on mobile (360px, 390px, 430px), 3-col grid on desktop */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5 w-full">
              {/* Location Filter */}
              <div className="relative w-full">
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  aria-label="Filter by Location"
                  className="w-full h-11 sm:h-10 pl-3.5 pr-9 py-2 rounded-xl bg-[#050811] border border-white/10 text-slate-200 text-xs font-medium outline-none appearance-none hover:border-amber-300/30 focus:border-amber-300/50 focus:ring-1 focus:ring-amber-300/30 transition-colors cursor-pointer truncate"
                >
                  <option value="all">All Locations</option>
                  {countries.filter((c) => c !== 'all').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Profession Filter */}
              <div className="relative w-full">
                <select
                  value={selectedProfession}
                  onChange={(e) => setSelectedProfession(e.target.value)}
                  aria-label="Filter by Profession"
                  className="w-full h-11 sm:h-10 pl-3.5 pr-9 py-2 rounded-xl bg-[#050811] border border-white/10 text-slate-200 text-xs font-medium outline-none appearance-none hover:border-amber-300/30 focus:border-amber-300/50 focus:ring-1 focus:ring-amber-300/30 transition-colors cursor-pointer truncate"
                >
                  <option value="all">All Professions</option>
                  {professions.filter((p) => p !== 'all').map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Marital Status Filter */}
              <div className="relative w-full">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  aria-label="Filter by Marital Status"
                  className="w-full h-11 sm:h-10 pl-3.5 pr-9 py-2 rounded-xl bg-[#050811] border border-white/10 text-slate-200 text-xs font-medium outline-none appearance-none hover:border-amber-300/30 focus:border-amber-300/50 focus:ring-1 focus:ring-amber-300/30 transition-colors cursor-pointer truncate"
                >
                  <option value="all">All Marital Statuses</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                  <option value="Never Married">Never Married</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Network Banner (320x50) */}
          <AdsterraBanner slotName="profile_inline" />

          {/* Profiles Grid */}
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-amber-300 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-medium">Retrieving verified candidate portfolios...</p>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="py-20 text-center bg-[#090e1a] rounded-3xl border border-white/10 p-8 space-y-4">
              <Users className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-white font-serif-luxury">No candidates match your current search</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try broadening your criteria or clearing filters to view all available portfolios.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCountry('all');
                  setSelectedStatus('all');
                  setSelectedProfession('all');
                  setOnlyFeatured(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-xs font-bold hover:from-amber-300 hover:to-amber-400 transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pt-6">
              {filteredProfiles.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  onOpenContact={(p) => setContactProfile(p)}
                  onOpenMessage={(p) => setMessageProfile(p)}
                  onOpenVideoCall={(p) => handleInitiateCall(p)}
                  onOpenStory={(p) => setStoryProfile(p)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ==================================================
            5. HOW CALL ME WORKS (Luxury Matchmaking Steps)
            ================================================== */}
        <section className="border-t border-white/10 bg-[#070b16] py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
                Simple, Respectful &amp; Authentic
              </span>
              <h2 className="text-3xl font-bold font-serif-luxury text-white">
                How Call Me Works
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Thoughtful connections built on genuine profiles, direct inquiry, and mutual discretion.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 01 */}
              <div className="bg-[#090e1a] rounded-3xl border border-amber-200/10 p-6 sm:p-8 hover:border-amber-300/30 transition-all space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400 font-serif-luxury">
                    01
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300">
                    <Compass className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-lg font-bold font-serif-luxury text-white">
                  Discover Candidates
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Browse authentic portfolios, examine candid proposals, and evaluate compatibility based on lifestyle, values, and life aspirations.
                </p>
              </div>

              {/* Step 02 */}
              <div className="bg-[#090e1a] rounded-3xl border border-amber-200/10 p-6 sm:p-8 hover:border-amber-300/30 transition-all space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400 font-serif-luxury">
                    02
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-lg font-bold font-serif-luxury text-white">
                  Inquire Discreetly
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Initiate a respectful inquiry. Understand expectations and discuss personal milestones in a private, supportive atmosphere.
                </p>
              </div>

              {/* Step 03 */}
              <div className="bg-[#090e1a] rounded-3xl border border-amber-200/10 p-6 sm:p-8 hover:border-amber-300/30 transition-all space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400 font-serif-luxury">
                    03
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300">
                    <Phone className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-lg font-bold font-serif-luxury text-white">
                  Connect &amp; Meet
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Experience video previews and request direct communication channels to begin your next chapter together.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================
            6. TRUST & PRIVACY PILLARS
            ================================================== */}
        <section className="border-t border-white/10 bg-[#050811] py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x md:divide-white/10">
              <div className="px-6 py-4 md:py-0 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-500/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold font-serif-luxury text-white">Verified Profiles</h3>
                <p className="text-xs text-slate-400">Authentic candidate portfolios with verified profession, background, and sincere matrimonial intent.</p>
              </div>

              <div className="px-6 py-4 md:py-0 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-950/60 text-amber-300 flex items-center justify-center mx-auto mb-3 border border-amber-500/30">
                  <Heart className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold font-serif-luxury text-white">Direct Communication</h3>
                <p className="text-xs text-slate-400">Connect through private inquiries, video previews, and mutually approved contact details.</p>
              </div>

              <div className="px-6 py-4 md:py-0 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#0d1424] text-slate-300 flex items-center justify-center mx-auto mb-3 border border-white/10">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold font-serif-luxury text-white">Privacy Protected</h3>
                <p className="text-xs text-slate-400">Personal contact details are guarded and only unlocked through mutual introduction consent.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================
            7. FINAL CTA SECTION (Luxury Invitation)
            ================================================== */}
        <section className="border-t border-white/10 bg-gradient-to-b from-[#070b16] via-[#090e1a] to-[#050811] py-16 sm:py-20 relative overflow-hidden text-center">
          <div
            className="absolute inset-0 pointer-events-none opacity-20 blur-3xl"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.15) 0%, transparent 70%)',
            }}
          />
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-5">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
              Your Journey Awaits
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif-luxury text-white leading-tight">
              Maybe Your Next Chapter{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-rose-200 italic">
                Starts Here.
              </span>
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
              Explore candidate portfolios, submit confidential inquiries, and find a companion who shares your world.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={scrollToProfiles}
                className="px-8 sm:px-9 py-3.5 sm:py-4 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs sm:text-sm tracking-wide shadow-[0_8px_30px_rgba(212,175,55,0.25)] inline-flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <span>Explore Profiles</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6 w-full">
        <AdsterraBanner slotName="footer" />
      </div>

      <Footer />

      {/* Modals */}
      {contactProfile && (
        <ContactModal
          profile={contactProfile}
          isOpen={!!contactProfile}
          onClose={() => setContactProfile(null)}
        />
      )}

      {shareProfile && (
        <ShareModal
          profile={shareProfile}
          isOpen={!!shareProfile}
          onClose={() => setShareProfile(null)}
        />
      )}

      {messageProfile && (
        <MessageChatModal
          profile={messageProfile}
          isOpen={!!messageProfile}
          onClose={() => setMessageProfile(null)}
        />
      )}

      {videoCallProfile && (
        <VideoCallModal
          profile={videoCallProfile}
          isOpen={!!videoCallProfile}
          onClose={() => setVideoCallProfile(null)}
          onCallCompleted={() => consumeCall()}
          onOpenContact={(p) => {
            setVideoCallProfile(null);
            setContactProfile(p);
          }}
        />
      )}

      {/* Story Viewer Modal */}
      {storyProfile && (
        <StoryViewerModal
          profile={storyProfile}
          isOpen={!!storyProfile}
          onClose={() => setStoryProfile(null)}
          onOpenContact={() => {
            const p = storyProfile;
            setStoryProfile(null);
            setContactProfile(p);
          }}
        />
      )}

      {/* Call Limit Reached Modal */}
      {isLimitModalOpen && (
        <CallLimitModal
          isOpen={isLimitModalOpen}
          callsUsed={callsUsed}
          onClose={() => {
            setIsLimitModalOpen(false);
            setPendingVideoCallProfile(null);
          }}
          onWatchAd={() => {
            setIsLimitModalOpen(false);
            setIsAdInterstitialOpen(true);
          }}
        />
      )}

      {/* 10-Second Sponsor Ad Interstitial */}
      {isAdInterstitialOpen && (
        <AdInterstitialModal
          isOpen={isAdInterstitialOpen}
          onComplete={handleAdInterstitialComplete}
        />
      )}

      {/* Toast Notification for Unlocked Calls */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-zinc-900 border border-pink-500/40 text-pink-300 text-xs font-semibold shadow-2xl flex items-center gap-2 select-none animate-fade-in">
          <Sparkles className="w-4 h-4 text-pink-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
