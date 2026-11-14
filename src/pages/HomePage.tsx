import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
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
  ChevronRight,
  MapPin,
  Briefcase,
  Activity,
  Star,
  RotateCcw,
} from 'lucide-react';
import { Profile, DEFAULT_AVATAR_PLACEHOLDER } from '../types';
import { fetchPublicProfiles, trackTelemetry } from '../lib/api';
import { updateSEO } from '../lib/seo';
import { logEvent } from '../lib/analytics';
import { useOnlinePresence } from '../lib/presence';
import { Sidebar, DiscoveryCategoryKey } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProfileCard } from '../components/ProfileCard';
import { FeaturedHeroCarousel } from '../components/FeaturedHeroCarousel';
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Sidebar & Navigation state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [activeNav, setActiveNav] = useState<'home' | 'discover' | 'spotlight' | 'stories'>('home');
  const [activeCategory, setActiveCategory] = useState<DiscoveryCategoryKey>(
    searchParams.get('filter') === 'featured' ? 'featured' : 'all'
  );

  // Call Limit Management
  const { callsUsed, canCall, consumeCall } = useCallLimit();
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [isAdInterstitialOpen, setIsAdInterstitialOpen] = useState(false);
  const [pendingVideoCallProfile, setPendingVideoCallProfile] = useState<Profile | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Unified Filter & Search state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get('country') || 'all');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'all');
  const [selectedProfession, setSelectedProfession] = useState(searchParams.get('profession') || 'all');
  const [onlyFeatured, setOnlyFeatured] = useState(searchParams.get('filter') === 'featured');

  // Spotlight carousel index
  const [spotlightIndex, setSpotlightIndex] = useState(0);

  // Modals
  const [contactProfile, setContactProfile] = useState<Profile | null>(null);
  const [shareProfile, setShareProfile] = useState<Profile | null>(null);
  const [messageProfile, setMessageProfile] = useState<Profile | null>(null);
  const [videoCallProfile, setVideoCallProfile] = useState<Profile | null>(null);
  const [storyProfile, setStoryProfile] = useState<Profile | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'privacy' | 'terms' | 'contact' | null>(null);

  // Filter select refs for category jump focus
  const countrySelectRef = useRef<HTMLSelectElement | null>(null);
  const professionSelectRef = useRef<HTMLSelectElement | null>(null);
  const statusSelectRef = useRef<HTMLSelectElement | null>(null);
  const searchModalInputRef = useRef<HTMLInputElement | null>(null);

  // Real-Time Online Presence Tracking
  const { checkIsOnline } = useOnlinePresence();

  // Horizontal Reel Drag Controls (Desktop Mouse Drag + Native Touch Swipe)
  const reelRef = useRef<HTMLDivElement | null>(null);
  const isMouseDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const handleReelScroll = (direction: 'left' | 'right') => {
    if (reelRef.current) {
      const scrollAmount = 280;
      reelRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: shouldReduceMotion ? 'auto' : 'smooth',
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
    const walk = x - startXRef.current;
    if (Math.abs(walk) > 6) {
      hasDraggedRef.current = true;
      reelRef.current.scrollLeft = scrollLeftRef.current - walk;
    }
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 80);
  };

  // Sync URL filter query if navigated with ?filter=featured
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'featured') {
      setOnlyFeatured(true);
      setActiveCategory('featured');
    }
  }, [searchParams]);

  // Keyboard shortcut (Cmd/Ctrl + K) for Search Modal + Escape close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSearchModalOpen(false);
        setLegalModalTab(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchModalOpen) {
      setTimeout(() => searchModalInputRef.current?.focus(), 60);
    }
  }, [searchModalOpen]);

  // Scroll spy so Sidebar highlights accurately reflect current visible section
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const sectionIds: Array<'top' | 'stories' | 'discover' | 'spotlight'> = [
      'top',
      'stories',
      'discover',
      'spotlight',
    ];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length === 0) return;
        const id = visible[0].target.id;
        if (id === 'top') setActiveNav('home');
        else if (id === 'stories') setActiveNav('stories');
        else if (id === 'discover') setActiveNav('discover');
        else if (id === 'spotlight') setActiveNav('spotlight');
      },
      { rootMargin: '-18% 0px -55% 0px', threshold: [0.15, 0.35] }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [loading]);

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
      description:
        'Discover verified matrimonial candidate portfolios, direct messaging inquiries, and simulated video call previews on Call Me.',
      url: window.location.origin,
    });

    trackTelemetry({
      type: 'page_view',
      timestamp: new Date().toISOString(),
    });

    loadProfiles();
  }, []);

  // Scroll cleanly to section when arriving via URL hash (#discover, #spotlight, #stories)
  useEffect(() => {
    const hash = window.location.hash?.replace('#', '');
    if (hash && (hash === 'discover' || hash === 'spotlight' || hash === 'stories')) {
      const timer = setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth' });
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [loading, shouldReduceMotion]);

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

  // Derive unique filter options cleanly
  const countries = useMemo<string[]>(() => {
    const values = profiles
      .map((p) => p.country?.trim())
      .filter((v): v is string => Boolean(v));
    const list = Array.from(new Set<string>(values)).sort((a, b) => a.localeCompare(b));
    return ['all', ...list];
  }, [profiles]);

  const professions = useMemo<string[]>(() => {
    const values = profiles
      .map((p) => p.profession?.trim())
      .filter((v): v is string => Boolean(v));
    const list = Array.from(new Set<string>(values)).sort((a, b) => a.localeCompare(b));
    return ['all', ...list];
  }, [profiles]);

  // Helper to match marital status accommodating standard matrimonial synonyms
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

  // Filtered + Category-sorted list
  const filteredProfiles = useMemo(() => {
    const base = profiles.filter((p) => {
      if (onlyFeatured && !p.featured) return false;
      if (selectedCountry !== 'all' && p.country?.toLowerCase() !== selectedCountry.toLowerCase()) {
        return false;
      }
      if (selectedStatus !== 'all' && !matchesMaritalStatus(p.maritalStatus, selectedStatus)) {
        return false;
      }
      if (
        selectedProfession !== 'all' &&
        !p.profession?.toLowerCase().includes(selectedProfession.toLowerCase())
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.fullName.toLowerCase().includes(q);
        const matchesCity = p.city.toLowerCase().includes(q);
        const matchesCountry = p.country.toLowerCase().includes(q);
        const matchesProf = p.profession.toLowerCase().includes(q);
        const matchesBio = p.bio.toLowerCase().includes(q);
        const matchesTag = p.tags?.some((t) => t.toLowerCase().includes(q));
        if (
          !matchesName &&
          !matchesCity &&
          !matchesCountry &&
          !matchesProf &&
          !matchesBio &&
          !matchesTag
        ) {
          return false;
        }
      }

      return true;
    });

    if (activeCategory === 'recent') {
      return [...base].sort((a, b) => {
        const aOnline = checkIsOnline(a) ? 1 : 0;
        const bOnline = checkIsOnline(b) ? 1 : 0;
        if (aOnline !== bOnline) return bOnline - aOnline;
        const aTime = new Date(a.lastActiveAt || a.updatedAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.lastActiveAt || b.updatedAt || b.createdAt || 0).getTime();
        return bTime - aTime;
      });
    }

    return base;
  }, [
    profiles,
    searchQuery,
    selectedCountry,
    selectedStatus,
    selectedProfession,
    onlyFeatured,
    activeCategory,
    checkIsOnline,
  ]);

  // Search Modal quick preview matches
  const searchModalResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return profiles.slice(0, 6);
    return profiles
      .filter((p) => {
        return (
          p.fullName.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.country.toLowerCase().includes(q) ||
          p.profession.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
        );
      })
      .slice(0, 8);
  }, [profiles, searchQuery]);

  const featuredProfiles = useMemo(() => {
    return profiles.filter((p) => p.featured && p.published);
  }, [profiles]);

  const spotlightList = featuredProfiles.length > 0 ? featuredProfiles : profiles;
  const spotlightProfile =
    spotlightList.length > 0 ? spotlightList[spotlightIndex % spotlightList.length] : undefined;

  // Published profiles for circular candidate carousel
  const activeProfiles = useMemo(() => {
    return profiles.filter((p) => p.published);
  }, [profiles]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedCountry !== 'all' ||
    selectedStatus !== 'all' ||
    selectedProfession !== 'all' ||
    onlyFeatured ||
    activeCategory !== 'all';

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCountry('all');
    setSelectedStatus('all');
    setSelectedProfession('all');
    setOnlyFeatured(false);
    setActiveCategory('all');
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth' });
    }
  };

  const handleSelectCategory = (cat: DiscoveryCategoryKey) => {
    setActiveCategory(cat);
    setActiveNav('discover');
    if (cat === 'all') {
      resetAllFilters();
    } else if (cat === 'featured') {
      setOnlyFeatured(true);
    } else {
      setOnlyFeatured(false);
    }

    scrollToSection('discover');

    if (cat === 'location') {
      setTimeout(() => countrySelectRef.current?.focus(), 350);
    } else if (cat === 'profession') {
      setTimeout(() => professionSelectRef.current?.focus(), 350);
    } else if (cat === 'marital') {
      setTimeout(() => statusSelectRef.current?.focus(), 350);
    }
  };

  const handleCarouselCandidateClick = (p: Profile) => {
    if (hasDraggedRef.current) return;
    if (p.story?.slides && p.story.slides.length > 0) {
      logEvent('story_open', 'Carousel', p.slug);
      trackTelemetry({ type: 'story_open', profileSlug: p.slug, timestamp: new Date().toISOString() });
      setStoryProfile(p);
    } else {
      navigate(`/profile/${p.slug}`);
    }
  };

  const categoryButtons: Array<{ key: DiscoveryCategoryKey; label: string; icon: React.ReactNode }> = [
    { key: 'all', label: 'All', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { key: 'featured', label: 'Featured', icon: <Star className="w-3.5 h-3.5" /> },
    { key: 'location', label: 'Location', icon: <MapPin className="w-3.5 h-3.5" /> },
    { key: 'profession', label: 'Profession', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { key: 'marital', label: 'Marital Status', icon: <Heart className="w-3.5 h-3.5" /> },
    { key: 'recent', label: 'Recently Active', icon: <Activity className="w-3.5 h-3.5" /> },
  ];

  const spotlightIsOnline = spotlightProfile ? checkIsOnline(spotlightProfile) : false;

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-white selection:bg-[#FF2878] selection:text-white">
      {/* Persistent Left Sidebar (Desktop fixed 240px + Mobile Slide-Out Drawer) */}
      <Sidebar
        activeNav={activeNav}
        activeCategory={activeCategory}
        mobileOpen={mobileDrawerOpen}
        onCloseMobile={() => setMobileDrawerOpen(false)}
        onNavigateHome={() => {
          setActiveNav('home');
          window.scrollTo({ top: 0, behavior: shouldReduceMotion ? 'auto' : 'smooth' });
        }}
        onNavigateDiscover={() => {
          setActiveNav('discover');
          scrollToSection('discover');
        }}
        onNavigateSpotlight={() => {
          setActiveNav('spotlight');
          scrollToSection('spotlight');
        }}
        onNavigateStories={() => {
          setActiveNav('stories');
          scrollToSection('stories');
        }}
        onSelectCategory={handleSelectCategory}
        onOpenSearch={() => setSearchModalOpen(true)}
        onOpenLegalModal={(tab) => setLegalModalTab(tab)}
      />

      {/* Right Content Column Wrapper */}
      <div className="lg:pl-[240px] flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Navbar
          sidebarLayout
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery('')}
          onMenuClick={() => setMobileDrawerOpen(true)}
          onSearchClick={() => setSearchModalOpen(true)}
        />

        <main className="flex-1 relative">
          {/* Subtle Ambient Burgundy Depth Glow */}
          <div
            className="absolute top-0 inset-x-0 h-[520px] pointer-events-none bg-discovery-glow overflow-hidden"
            aria-hidden="true"
          />

          {/* ==================================================
              1. HERO SECTION (Compact Mobile-First Hierarchy + Desktop 2-Col)
              ================================================== */}
          <section
            id="top"
            className="relative pt-5 pb-7 sm:pt-10 sm:pb-12 lg:pt-14 lg:pb-16 border-b border-[#232329]"
          >
            <div className="max-w-7xl mx-auto px-3 min-[390px]:px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 lg:gap-12 items-center">
                {/* Left Column: Brand Eyebrow -> Heading -> Short Copy -> Side-by-Side CTAs -> Search */}
                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="lg:col-span-7 space-y-3.5 sm:space-y-5 lg:space-y-6 text-center lg:text-left"
                >
                  <p className="text-[11px] sm:text-xs font-medium tracking-[0.08em] uppercase text-[#9A9AA8]">
                    Call Me · Private Introductions
                  </p>

                  <h1 className="text-[clamp(1.75rem,6.6vw,3.25rem)] font-bold tracking-[-0.025em] text-white leading-[1.08] text-balance">
                    Discover Your
                    <span className="gradient-pink-purple-text block">
                      Perfect Introduction
                    </span>
                  </h1>

                  <p className="text-[13.5px] sm:text-base text-[#A5A5B5] max-w-xl mx-auto lg:mx-0 leading-[1.55] sm:leading-[1.65] line-clamp-3 sm:line-clamp-none">
                    Explore curated candidate portfolios, start private conversations, and meet someone extraordinary.
                  </p>

                  {/* Mobile Side-by-Side Equal-Height CTAs */}
                  <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-center sm:justify-center lg:justify-start sm:gap-3 pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveNav('discover');
                        scrollToSection('discover');
                      }}
                      className="min-h-[44px] h-[44px] px-3 sm:px-6 rounded-xl gradient-pink-purple hover:opacity-95 text-white font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 sm:gap-2 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                    >
                      <span>Explore Profiles</span>
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveNav('spotlight');
                        scrollToSection('spotlight');
                      }}
                      className="min-h-[44px] h-[44px] px-3 sm:px-6 rounded-xl bg-[#111114] hover:bg-[#19191F] text-white border border-[#232329] hover:border-[#34343E] font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 sm:gap-2 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF2878] shrink-0" />
                      <span className="sm:hidden">Spotlight</span>
                      <span className="hidden sm:inline">Discover Spotlight</span>
                    </button>
                  </div>

                  {/* Unified Compact Mobile-Friendly Search Bar */}
                  <div className="pt-0.5 max-w-xl mx-auto lg:mx-0 w-full">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (searchQuery.trim()) {
                          logEvent('search', 'Hero', searchQuery);
                        }
                        setActiveNav('discover');
                        scrollToSection('discover');
                      }}
                      className="relative flex items-center w-full min-w-0 min-h-[44px] h-11 sm:h-12 bg-[#111114] rounded-xl border border-[#232329] focus-within:border-[#FF2878]/60 focus-within:ring-2 focus-within:ring-[#FF2878]/15 pl-3 sm:pl-3.5 pr-1.5 transition-all"
                    >
                      <Search className="w-4 h-4 text-[#FF2878] shrink-0" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setSearchQuery('');
                        }}
                        placeholder="Search name, city, or profession..."
                        aria-label="Search candidate profiles"
                        className="flex-1 min-w-0 px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-white placeholder:text-[#7A7A88] bg-transparent outline-none truncate"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="p-1.5 text-[#9A9AA8] hover:text-white mr-0.5 transition-colors cursor-pointer shrink-0"
                          aria-label="Clear search query"
                          title="Clear search"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="submit"
                        className="h-8 sm:h-9 px-3 sm:px-5 rounded-lg gradient-pink-purple hover:opacity-95 text-white text-xs font-semibold shrink-0 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                      >
                        Search
                      </button>
                    </form>
                  </div>
                </motion.div>

                {/* Right Column: Automatic Featured Candidate Portrait Carousel */}
                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.05 }}
                  className="lg:col-span-5"
                >
                  <FeaturedHeroCarousel
                    profiles={profiles}
                    loading={loading}
                    checkIsOnline={checkIsOnline}
                    onOpenMessage={(p) => setMessageProfile(p)}
                  />
                </motion.div>
              </div>
            </div>
          </section>

          {/* ==================================================
              2. CANDIDATE CAROUSEL ("People Worth Discovering")
              ================================================== */}
          <section id="stories" className="bg-[#08080A] border-b border-[#232329] py-4 sm:py-6 lg:py-7 relative">
            <div className="max-w-7xl mx-auto px-3 min-[390px]:px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5 sm:gap-2">
                    <Sparkles className="w-4 h-4 text-[#FF2878] shrink-0" />
                    <span className="truncate">People Worth Discovering</span>
                  </h2>
                  <p className="text-[11px] sm:text-xs text-[#9A9AA8] mt-0.5 truncate">
                    Swipe or tap a candidate to view story or profile
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleReelScroll('left')}
                    className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-[#111114] hover:bg-[#19191F] text-[#9A9AA8] hover:text-white border border-[#232329] transition-colors cursor-pointer"
                    aria-label="Scroll candidates left"
                    title="Scroll left"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReelScroll('right')}
                    className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-[#111114] hover:bg-[#19191F] text-[#9A9AA8] hover:text-white border border-[#232329] transition-colors cursor-pointer"
                    aria-label="Scroll candidates right"
                    title="Scroll right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Smooth Horizontal Swipe Strip — Clean Edge Padding Prevents Clipped First/Last Cards */}
              <div
                ref={reelRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="-mx-3 min-[390px]:-mx-4 sm:mx-0 px-3 min-[390px]:px-4 sm:px-0 scroll-px-3 min-[390px]:scroll-px-4 sm:scroll-px-0 flex items-start gap-3.5 sm:gap-5 overflow-x-auto flex-nowrap pb-1.5 pt-1 scrollbar-none select-none touch-pan-xy overscroll-x-contain webkit-overflow-touch snap-x-proximity cursor-grab active:cursor-grabbing"
              >
                {/* Quick Video Call Preview Trigger */}
                {spotlightProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      if (hasDraggedRef.current) return;
                      handleInitiateCall(spotlightProfile);
                    }}
                    className="flex flex-col items-center gap-1.5 sm:gap-2 shrink-0 w-[68px] sm:w-[82px] cursor-pointer group snap-align-start outline-none"
                    aria-label="Start instant video call preview"
                  >
                    <div className="relative p-[2px] rounded-full gradient-pink-purple group-hover:scale-[1.04] transition-transform duration-200 shrink-0">
                      <div className="w-[62px] h-[62px] sm:w-[74px] sm:h-[74px] rounded-full bg-[#111114] flex flex-col items-center justify-center border-2 border-[#08080A]">
                        <Phone className="w-4 h-4 text-[#FF2878]" />
                        <span className="text-[8.5px] sm:text-[9px] font-semibold mt-0.5 sm:mt-1 text-white tracking-wider uppercase">
                          Call Me
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] sm:text-xs font-medium text-white truncate w-full text-center tracking-tight">
                      Instant Call
                    </span>
                  </button>
                )}

                {loading && activeProfiles.length === 0
                  ? Array.from({ length: 8 }).map((_, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-1.5 sm:gap-2 shrink-0 w-[68px] sm:w-[82px]">
                        <div className="w-[66px] h-[66px] sm:w-[78px] sm:h-[78px] rounded-full bg-[#111114] border border-[#232329] animate-pulse" />
                        <div className="w-11 h-3 rounded bg-[#111114] animate-pulse" />
                      </div>
                    ))
                  : activeProfiles.map((p) => {
                      const isOnline = checkIsOnline(p);
                      const hasStory = Boolean(p.story?.slides && p.story.slides.length > 0);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleCarouselCandidateClick(p)}
                          aria-label={`${p.fullName}${hasStory ? ' — View Story' : ' — View Profile'} (${isOnline ? 'Online' : 'Offline'})`}
                          className="flex flex-col items-center gap-1.5 sm:gap-2 shrink-0 w-[68px] sm:w-[82px] cursor-pointer group snap-align-start outline-none"
                        >
                          <div className="relative p-[2px] rounded-full bg-gradient-to-tr from-[#FF2878] via-[#B446C7] to-[#8B5CF6] group-hover:scale-[1.04] transition-transform duration-200 shrink-0">
                            <img
                              src={p.image || DEFAULT_AVATAR_PLACEHOLDER}
                              alt={p.fullName}
                              referrerPolicy="no-referrer"
                              draggable={false}
                              className="w-[62px] h-[62px] sm:w-[74px] sm:h-[74px] rounded-full object-cover object-top border-2 border-[#08080A] bg-[#111114] shrink-0"
                            />

                            {/* Genuine Presence Indicator */}
                            {isOnline ? (
                              <span
                                className="absolute bottom-0 right-0 z-20 w-3.5 h-3.5 rounded-full bg-[#00D084] ring-2 ring-[#08080A]"
                                title={`${p.fullName} is online`}
                              />
                            ) : (
                              <span
                                className="absolute bottom-0.5 right-0.5 z-20 w-2.5 h-2.5 rounded-full bg-[#64748B] ring-2 ring-[#08080A]"
                                title={`${p.fullName} is offline`}
                              />
                            )}
                          </div>
                          <span className="text-[11px] sm:text-xs font-medium text-[#D0D0DC] group-hover:text-white transition-colors truncate w-full text-center tracking-tight">
                            {p.fullName.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}

                {/* Trailing spacer ensures final card does not clip against viewport edge */}
                <div className="w-1 shrink-0 sm:hidden" aria-hidden="true" />
              </div>
            </div>
          </section>

          {/* ==================================================
              3. DISCOVER PROFILES + CATEGORY BAR + 2-COL MOBILE / 4-COL DESKTOP GRID
              ================================================== */}
          <section
            id="discover"
            className="max-w-7xl mx-auto px-3 min-[390px]:px-4 sm:px-6 lg:px-8 py-7 sm:py-11 lg:py-14 relative z-10"
          >
            {/* Centered Discovery Heading */}
            <div className="text-center max-w-2xl mx-auto space-y-1.5 sm:space-y-2.5 mb-5 sm:mb-8">
              <p className="text-[11px] sm:text-xs font-medium text-[#9A9AA8] tabular-nums">
                {filteredProfiles.length} {filteredProfiles.length === 1 ? 'Candidate' : 'Candidates'} Available
              </p>
              <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
                Discover Your{' '}
                <span className="gradient-pink-purple-text">Perfect Match</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#9A9AA8] leading-relaxed">
                Browse curated candidate portfolios, refine by background or location, and connect discreetly.
              </p>
            </div>

            {/* Horizontal Category Filter Bar */}
            <div className="flex items-center sm:justify-center gap-2 overflow-x-auto pb-2 mb-3.5 sm:mb-5 scrollbar-none -mx-3 min-[390px]:-mx-4 px-3 min-[390px]:px-4 sm:mx-0 sm:px-0">
              {categoryButtons.map((btn) => {
                const isActive = activeCategory === btn.key;
                return (
                  <button
                    key={btn.key}
                    type="button"
                    onClick={() => handleSelectCategory(btn.key)}
                    className={`min-h-[40px] px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all cursor-pointer active:scale-[0.98] ${
                      isActive
                        ? 'gradient-pink-purple text-white border border-transparent'
                        : 'bg-[#111114] hover:bg-[#18181D] text-[#9A9AA8] hover:text-white border border-[#232329]'
                    }`}
                  >
                    {btn.icon}
                    <span>{btn.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Responsive Filter Controls Card */}
            <div className="bg-[#111114] border border-[#232329] rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 w-full">
                {/* Location Filter */}
                <div className="relative w-full">
                  <select
                    ref={countrySelectRef}
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    aria-label="Filter by Location"
                    className={`w-full h-11 pl-3.5 pr-9 rounded-xl bg-[#08080A] border text-white text-xs font-medium outline-none appearance-none transition-colors cursor-pointer truncate ${
                      activeCategory === 'location' || selectedCountry !== 'all'
                        ? 'border-[#FF2878]/60'
                        : 'border-[#232329] hover:border-[#34343E] focus:border-[#FF2878]/60'
                    }`}
                  >
                    <option value="all">All Locations</option>
                    {countries
                      .filter((c) => c !== 'all')
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#9A9AA8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Profession Filter */}
                <div className="relative w-full">
                  <select
                    ref={professionSelectRef}
                    value={selectedProfession}
                    onChange={(e) => setSelectedProfession(e.target.value)}
                    aria-label="Filter by Profession"
                    className={`w-full h-11 pl-3.5 pr-9 rounded-xl bg-[#08080A] border text-white text-xs font-medium outline-none appearance-none transition-colors cursor-pointer truncate ${
                      activeCategory === 'profession' || selectedProfession !== 'all'
                        ? 'border-[#FF2878]/60'
                        : 'border-[#232329] hover:border-[#34343E] focus:border-[#FF2878]/60'
                    }`}
                  >
                    <option value="all">All Professions</option>
                    {professions
                      .filter((p) => p !== 'all')
                      .map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#9A9AA8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Marital Status Filter */}
                <div className="relative w-full">
                  <select
                    ref={statusSelectRef}
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    aria-label="Filter by Marital Status"
                    className={`w-full h-11 pl-3.5 pr-9 rounded-xl bg-[#08080A] border text-white text-xs font-medium outline-none appearance-none transition-colors cursor-pointer truncate ${
                      activeCategory === 'marital' || selectedStatus !== 'all'
                        ? 'border-[#FF2878]/60'
                        : 'border-[#232329] hover:border-[#34343E] focus:border-[#FF2878]/60'
                    }`}
                  >
                    <option value="all">All Marital Statuses</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Separated">Separated</option>
                    <option value="Never Married">Never Married</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#9A9AA8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Active Search / Reset Row */}
              {hasActiveFilters && (
                <div className="mt-3 pt-3 border-t border-[#232329] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-[#9A9AA8] tabular-nums">
                    Showing <strong className="text-white">{filteredProfiles.length}</strong>{' '}
                    {filteredProfiles.length === 1 ? 'profile' : 'profiles'}
                    {searchQuery.trim() ? ` matching “${searchQuery.trim()}”` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#08080A] hover:bg-[#19191F] border border-[#232329] text-white font-medium cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#FF2878]" />
                    <span>Reset Filters</span>
                  </button>
                </div>
              )}
            </div>

            {/* Preserved Network Banner (320x50) */}
            <AdsterraBanner slotName="profile_inline" />

            {/* Profile Discovery Grid: 2-col on mobile (>=360px), 1-col at 320px, 3-4 col desktop */}
            {loading ? (
              <div className="py-12 sm:py-16 text-center space-y-3">
                <div className="w-9 h-9 border-2 border-[#FF2878] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-[#9A9AA8] font-medium">
                  Retrieving verified candidate portfolios...
                </p>
              </div>
            ) : filteredProfiles.length === 0 ? (
              <div className="py-12 sm:py-16 text-center bg-[#111114] rounded-2xl border border-[#232329] p-6 sm:p-8 space-y-4">
                <Users className="w-11 h-11 text-[#7A7A88] mx-auto" />
                <h3 className="text-lg font-bold text-white">No candidates match your current filters</h3>
                <p className="text-xs sm:text-sm text-[#9A9AA8] max-w-md mx-auto">
                  Try broadening your search or clearing active filters to explore all available candidate portfolios.
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-6 py-2.5 rounded-xl gradient-pink-purple text-white text-xs font-semibold hover:opacity-95 transition-opacity cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 min-[390px]:gap-3 sm:gap-5 lg:gap-6 pt-3 sm:pt-4">
                {filteredProfiles.map((profile) => (
                  <ProfileCard
                    key={profile.id}
                    profile={profile}
                    isOnline={checkIsOnline(profile)}
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
              4. FEATURED SPOTLIGHT SECTION
              ================================================== */}
          {spotlightProfile && (
            <section
              id="spotlight"
              className="max-w-7xl mx-auto px-3 min-[390px]:px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12 lg:pb-16"
            >
              <div className="bg-[#111114] rounded-2xl border border-[#232329] overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
                  {/* Spotlight Portrait Image */}
                  <div className="md:col-span-5 relative aspect-[4/5] md:aspect-auto md:min-h-[380px] bg-[#08080A]">
                    <img
                      src={spotlightProfile.image || DEFAULT_AVATAR_PLACEHOLDER}
                      alt={spotlightProfile.fullName}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#111114] md:from-transparent via-transparent to-black/25 pointer-events-none" />

                    <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#09090B]/85 text-white text-xs font-medium border border-[#232329] backdrop-blur-md">
                      <Sparkles className="w-3.5 h-3.5 text-[#FF2878]" />
                      <span>Featured Spotlight</span>
                    </div>

                    {spotlightIsOnline && (
                      <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#09090B]/85 text-[#00D084] text-[11px] font-semibold border border-[#00D084]/40 backdrop-blur-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00D084]" />
                        <span>Online</span>
                      </div>
                    )}
                  </div>

                  {/* Spotlight Content */}
                  <div className="md:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-6">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-semibold uppercase tracking-wider text-[#FF4D8D]">
                          {spotlightProfile.profession}
                        </span>
                        <span className="text-[#9A9AA8] font-medium tabular-nums">
                          {spotlightProfile.age} yrs · {spotlightProfile.city}, {spotlightProfile.country}
                        </span>
                      </div>

                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                          {spotlightProfile.fullName}
                        </h2>
                        {spotlightProfile.education && (
                          <p className="text-xs sm:text-sm text-[#9A9AA8] mt-1">
                            {spotlightProfile.education} · {spotlightProfile.maritalStatus}
                          </p>
                        )}
                      </div>

                      <blockquote className="p-4 rounded-xl bg-[#08080A] border border-[#232329] text-xs sm:text-sm text-[#B8B8C6] leading-relaxed italic">
                        “{spotlightProfile.proposalMessage || spotlightProfile.bio}”
                      </blockquote>
                    </div>

                    {/* Actions + Spotlight Cycle */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#232329]">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <Link
                          to={`/profile/${spotlightProfile.slug}`}
                          className="min-h-[40px] px-5 py-2 rounded-xl gradient-pink-purple hover:opacity-95 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-opacity active:scale-[0.98]"
                        >
                          <span>View Full Profile</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => setMessageProfile(spotlightProfile)}
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-[#08080A] hover:bg-[#19191F] text-white border border-[#232329] hover:border-[#8B5CF6]/50 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-[#8B5CF6]" />
                          <span>Inquire</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleInitiateCall(spotlightProfile)}
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-[#08080A] hover:bg-[#19191F] text-white border border-[#232329] hover:border-[#FF2878]/50 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Phone className="w-3.5 h-3.5 text-[#FF2878]" />
                          <span>Call Me</span>
                        </button>
                      </div>

                      {spotlightList.length > 1 && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setSpotlightIndex((prev) => (prev - 1 + spotlightList.length) % spotlightList.length)
                            }
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#08080A] hover:bg-[#19191F] border border-[#232329] text-[#9A9AA8] hover:text-white transition-colors cursor-pointer"
                            aria-label="Previous spotlight candidate"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSpotlightIndex((prev) => (prev + 1) % spotlightList.length)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#08080A] hover:bg-[#19191F] border border-[#232329] text-[#9A9AA8] hover:text-white transition-colors cursor-pointer"
                            aria-label="Next spotlight candidate"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ==================================================
              5. HOW CALL ME WORKS
              ================================================== */}
          <section className="border-t border-[#232329] bg-[#08080A] py-9 sm:py-14 lg:py-16">
            <div className="max-w-7xl mx-auto px-3 min-[390px]:px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto space-y-1.5 sm:space-y-2 mb-7 sm:mb-12">
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-[#FF4D8D]">
                  Simple, Respectful &amp; Authentic
                </span>
                <h2 className="text-xl sm:text-3xl font-bold text-white tracking-tight">
                  How Call Me Works
                </h2>
                <p className="text-xs sm:text-sm text-[#9A9AA8]">
                  Thoughtful connections built on verified candidate portfolios, direct inquiry, and mutual discretion.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-[#111114] rounded-2xl border border-[#232329] p-5 sm:p-7 hover:border-[#34343E] transition-colors space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xl sm:text-2xl font-bold gradient-pink-purple-text tabular-nums">01</span>
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#08080A] border border-[#232329] flex items-center justify-center text-[#FF2878]">
                      <Compass className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Discover Candidates</h3>
                  <p className="text-xs sm:text-sm text-[#9A9AA8] leading-relaxed">
                    Browse authentic portfolios, examine candid proposals, and evaluate compatibility based on lifestyle, values, and aspirations.
                  </p>
                </div>

                <div className="bg-[#111114] rounded-2xl border border-[#232329] p-5 sm:p-7 hover:border-[#34343E] transition-colors space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xl sm:text-2xl font-bold gradient-pink-purple-text tabular-nums">02</span>
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#08080A] border border-[#232329] flex items-center justify-center text-[#8B5CF6]">
                      <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Inquire Discreetly</h3>
                  <p className="text-xs sm:text-sm text-[#9A9AA8] leading-relaxed">
                    Initiate a respectful inquiry. Understand expectations and discuss personal milestones in a private, supportive atmosphere.
                  </p>
                </div>

                <div className="bg-[#111114] rounded-2xl border border-[#232329] p-5 sm:p-7 hover:border-[#34343E] transition-colors space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xl sm:text-2xl font-bold gradient-pink-purple-text tabular-nums">03</span>
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#08080A] border border-[#232329] flex items-center justify-center text-[#FF2878]">
                      <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Connect &amp; Meet</h3>
                  <p className="text-xs sm:text-sm text-[#9A9AA8] leading-relaxed">
                    Experience video previews and request direct communication channels to begin your next chapter together.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ==================================================
              6. TRUST & PRIVACY PILLARS
              ================================================== */}
          <section className="border-t border-[#232329] bg-[#050505] py-8 sm:py-12 lg:py-14">
            <div className="max-w-7xl mx-auto px-3 min-[390px]:px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8 text-center divide-y md:divide-y-0 md:divide-x md:divide-[#232329]">
                <div className="px-4 py-3 md:py-0 space-y-2">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#111114] text-[#00D084] flex items-center justify-center mx-auto mb-2.5 border border-[#232329]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Verified Profiles</h3>
                  <p className="text-xs text-[#9A9AA8] leading-relaxed">
                    Authentic candidate portfolios with verified profession, background, and sincere matrimonial intent.
                  </p>
                </div>

                <div className="px-4 py-3 md:py-0 space-y-2">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#111114] text-[#FF2878] flex items-center justify-center mx-auto mb-2.5 border border-[#232329]">
                    <Heart className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Direct Communication</h3>
                  <p className="text-xs text-[#9A9AA8] leading-relaxed">
                    Connect through private inquiries, video call previews, and mutually approved contact details.
                  </p>
                </div>

                <div className="px-4 py-3 md:py-0 space-y-2">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#111114] text-[#8B5CF6] flex items-center justify-center mx-auto mb-2.5 border border-[#232329]">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Privacy Protected</h3>
                  <p className="text-xs text-[#9A9AA8] leading-relaxed">
                    Personal contact details are guarded and shared responsibly through trusted introduction channels.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ==================================================
              7. FINAL CTA SECTION
              ================================================== */}
          <section className="border-t border-[#232329] bg-[#08080A] py-10 sm:py-14 lg:py-16 relative overflow-hidden text-center">
            <div
              className="absolute inset-0 pointer-events-none opacity-65 bg-discovery-glow"
              aria-hidden="true"
            />
            <div className="max-w-3xl mx-auto px-3 min-[390px]:px-4 sm:px-6 lg:px-8 relative z-10 space-y-4 sm:space-y-5">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-[#FF4D8D]">
                Your Journey Awaits
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold text-white leading-tight text-balance">
                Maybe Your Next Chapter{' '}
                <span className="gradient-pink-purple-text">Starts Here.</span>
              </h2>
              <p className="text-xs sm:text-base text-[#9A9AA8] max-w-xl mx-auto">
                Explore candidate portfolios, submit confidential inquiries, and connect with someone who shares your world.
              </p>
              <div className="pt-1 sm:pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveNav('discover');
                    scrollToSection('discover');
                  }}
                  className="min-h-[44px] px-7 py-3 rounded-xl gradient-pink-purple hover:opacity-95 text-white font-semibold text-xs sm:text-sm inline-flex items-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span>Explore Profiles</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>
        </main>

        {/* Preserved Footer Banner */}
        <div className="max-w-7xl mx-auto px-3 min-[390px]:px-4 sm:px-6 lg:px-8 my-4 sm:my-6 w-full">
          <AdsterraBanner slotName="footer" />
        </div>

        <Footer sidebarLayout />
      </div>

      {/* ==================================================
          UNIFIED SEARCH CANDIDATES MODAL
          ================================================== */}
      <AnimatePresence>
        {searchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-24 px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSearchModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-xs"
            />
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="relative z-10 w-full max-w-xl max-h-[calc(100dvh-5rem)] flex flex-col bg-[#111114] border border-[#232329] rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-3.5 border-b border-[#232329] flex items-center gap-2.5 bg-[#09090B] shrink-0">
                <Search className="w-4 h-4 text-[#FF2878] shrink-0" />
                <input
                  ref={searchModalInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (searchQuery.trim()) logEvent('search', 'Modal', searchQuery);
                      setSearchModalOpen(false);
                      scrollToSection('discover');
                    }
                  }}
                  placeholder="Search candidates by name, city, country, profession..."
                  className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder:text-[#7A7A88] outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-[#9A9AA8] hover:text-white cursor-pointer shrink-0"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSearchModalOpen(false)}
                  className="px-2 py-1 text-[11px] font-medium text-[#9A9AA8] hover:text-white bg-[#111114] border border-[#232329] rounded-lg cursor-pointer shrink-0"
                >
                  Esc
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
                {searchModalResults.length === 0 ? (
                  <div className="py-10 text-center text-xs text-[#9A9AA8]">
                    No candidates match “{searchQuery}”. Try a city, country, or profession.
                  </div>
                ) : (
                  searchModalResults.map((candidate) => (
                    <Link
                      key={candidate.id}
                      to={`/profile/${candidate.slug}`}
                      onClick={() => setSearchModalOpen(false)}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-[#19191F] transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={candidate.image || DEFAULT_AVATAR_PLACEHOLDER}
                          alt={candidate.fullName}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover object-top border border-[#232329] shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white group-hover:text-[#FF4D8D] transition-colors truncate">
                            {candidate.fullName}, {candidate.age}
                          </p>
                          <p className="text-xs text-[#9A9AA8] truncate">
                            {candidate.profession} · {candidate.city}, {candidate.country}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#9A9AA8] group-hover:text-white shrink-0" />
                    </Link>
                  ))
                )}
              </div>

              <div className="p-3 border-t border-[#232329] bg-[#09090B] flex items-center justify-between gap-3 text-xs shrink-0">
                <span className="text-[#9A9AA8] tabular-nums">
                  {filteredProfiles.length} {filteredProfiles.length === 1 ? 'profile' : 'profiles'} matching
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchModalOpen(false);
                    scrollToSection('discover');
                  }}
                  className="px-3.5 py-2 rounded-lg gradient-pink-purple text-white font-semibold cursor-pointer whitespace-nowrap"
                >
                  Show in Discovery Grid
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================
          LEGAL & CONTACT INFO MODAL
          ================================================== */}
      <AnimatePresence>
        {legalModalTab && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLegalModalTab(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-xs"
            />
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              className="relative z-10 w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto bg-[#111114] border border-[#232329] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between gap-2 border-b border-[#232329] pb-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(['privacy', 'terms', 'contact'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setLegalModalTab(tab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        legalModalTab === tab
                          ? 'gradient-pink-purple text-white'
                          : 'bg-[#08080A] text-[#9A9AA8] hover:text-white border border-[#232329]'
                      }`}
                    >
                      {tab === 'privacy' ? 'Privacy Policy' : tab === 'terms' ? 'Terms of Service' : 'Contact'}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setLegalModalTab(null)}
                  className="p-1.5 rounded-lg text-[#9A9AA8] hover:text-white hover:bg-[#19191F] cursor-pointer shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {legalModalTab === 'privacy' && (
                <div className="space-y-2.5 text-xs sm:text-sm text-[#9A9AA8] leading-relaxed">
                  <h3 className="text-base font-bold text-white">Privacy &amp; Discretion Standards</h3>
                  <p>
                    Call Me publishes curated candidate portfolios solely with consent. Private contact details are protected behind direct inquiry channels and never sold or redistributed to third-party data brokers.
                  </p>
                  <p>
                    Visitor preferences and simulated call limits are stored locally in your browser. Administrators can manage profiles directly inside the Private Portal.
                  </p>
                </div>
              )}

              {legalModalTab === 'terms' && (
                <div className="space-y-2.5 text-xs sm:text-sm text-[#9A9AA8] leading-relaxed">
                  <h3 className="text-base font-bold text-white">Terms of Service</h3>
                  <p>
                    Call Me is an editorial introduction directory designed for respectful matrimonial and personal discovery. Visitors agree to communicate courteously and use candidate inquiry features strictly for genuine introductions.
                  </p>
                  <p>
                    Automated scraping, harassment, or unauthorized redistribution of candidate photographs and biographical details is strictly prohibited.
                  </p>
                </div>
              )}

              {legalModalTab === 'contact' && (
                <div className="space-y-3 text-xs sm:text-sm text-[#9A9AA8] leading-relaxed">
                  <h3 className="text-base font-bold text-white">Connect With Call Me</h3>
                  <p>
                    To inquire about a specific candidate, open their profile card and click <strong>Inquire</strong> or <strong>View Profile</strong> for direct introduction options.
                  </p>
                  <div className="pt-1 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLegalModalTab(null);
                        scrollToSection('discover');
                      }}
                      className="px-4 py-2 rounded-xl gradient-pink-purple text-white text-xs font-semibold cursor-pointer"
                    >
                      Browse Candidates
                    </button>
                    <Link
                      to="/admin"
                      onClick={() => setLegalModalTab(null)}
                      className="px-4 py-2 rounded-xl bg-[#08080A] border border-[#232329] text-white text-xs font-semibold hover:border-[#34343E]"
                    >
                      Private Portal
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preserved Platform Modals */}
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

      {isAdInterstitialOpen && (
        <AdInterstitialModal
          isOpen={isAdInterstitialOpen}
          onComplete={handleAdInterstitialComplete}
        />
      )}

      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-[#111114] border border-[#FF2878]/50 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 select-none animate-fade-in">
          <Sparkles className="w-4 h-4 text-[#FF2878]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
