import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  Home,
  Compass,
  Sparkles,
  PlayCircle,
  MapPin,
  Briefcase,
  Heart,
  Star,
  Activity,
  Search,
  UserCheck,
  Shield,
  FileText,
  Mail,
  X,
} from 'lucide-react';

export type DiscoveryCategoryKey =
  | 'all'
  | 'featured'
  | 'location'
  | 'profession'
  | 'marital'
  | 'recent';

interface SidebarProps {
  activeNav: 'home' | 'discover' | 'spotlight' | 'stories';
  activeCategory: DiscoveryCategoryKey;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onNavigateHome: () => void;
  onNavigateDiscover: () => void;
  onNavigateSpotlight: () => void;
  onNavigateStories: () => void;
  onSelectCategory: (cat: DiscoveryCategoryKey) => void;
  onOpenSearch: () => void;
  onOpenLegalModal: (tab: 'privacy' | 'terms' | 'contact') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav,
  activeCategory,
  mobileOpen,
  onCloseMobile,
  onNavigateHome,
  onNavigateDiscover,
  onNavigateSpotlight,
  onNavigateStories,
  onSelectCategory,
  onOpenSearch,
  onOpenLegalModal,
}) => {
  // Close mobile drawer on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMobile();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mobileOpen, onCloseMobile]);

  // Ensure only one route or active category filter is highlighted at once
  const hasSpecificCategory = activeNav === 'discover' && activeCategory !== 'all';

  const navItemClass = (isActive: boolean) =>
    `w-full min-h-[40px] flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors duration-150 cursor-pointer text-left ${
      isActive
        ? 'bg-[#16161B] text-white border border-[#FF2878]/40'
        : 'text-[#9A9AA8] hover:text-white hover:bg-[#111114] border border-transparent'
    }`;

  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full min-h-0 bg-[#08080A] text-white select-none">
      {/* Top: Official Call Me Logo Header */}
      <div className="h-16 px-5 border-b border-[#232329] flex items-center justify-between gap-3 shrink-0">
        <Link
          to="/"
          onClick={() => {
            onNavigateHome();
            if (isMobile) onCloseMobile();
          }}
          className="flex items-center min-w-0 group focus-visible:outline-none"
          aria-label="Call Me Home"
        >
          <img
            src="https://iili.io/nFUR3HN.png"
            alt="Call Me"
            className="h-9 w-auto max-w-[152px] object-contain shrink-0 transition-transform duration-200 group-hover:scale-[1.02]"
          />
        </Link>

        {isMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-[#9A9AA8] hover:text-white hover:bg-[#141418] border border-[#232329] transition-colors cursor-pointer shrink-0"
            aria-label="Close navigation menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Scrollable Navigation Column (flex-1 + min-h-0 guarantees independent scroll without footer overlap) */}
      <nav
        aria-label="Primary Discovery Sidebar"
        className="flex-1 min-h-0 overflow-y-auto px-3.5 py-5 space-y-6 scrollbar-none"
      >
        {/* MAIN NAVIGATION */}
        <div className="space-y-1">
          <p className="px-3 pb-1 text-[11px] font-medium tracking-[0.06em] text-[#7A7A88]">
            Explore
          </p>
          <button
            type="button"
            onClick={() => {
              onNavigateHome();
              if (isMobile) onCloseMobile();
            }}
            aria-current={activeNav === 'home' ? 'page' : undefined}
            className={navItemClass(activeNav === 'home')}
          >
            <Home
              className={`w-4 h-4 shrink-0 ${activeNav === 'home' ? 'text-[#FF2878]' : 'text-[#7A7A88]'}`}
            />
            <span className="truncate">Home</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onNavigateDiscover();
              if (isMobile) onCloseMobile();
            }}
            aria-current={activeNav === 'discover' && !hasSpecificCategory ? 'page' : undefined}
            className={navItemClass(activeNav === 'discover' && !hasSpecificCategory)}
          >
            <Compass
              className={`w-4 h-4 shrink-0 ${
                activeNav === 'discover' && !hasSpecificCategory ? 'text-[#FF2878]' : 'text-[#7A7A88]'
              }`}
            />
            <span className="truncate">Discover</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onNavigateSpotlight();
              if (isMobile) onCloseMobile();
            }}
            aria-current={activeNav === 'spotlight' ? 'page' : undefined}
            className={navItemClass(activeNav === 'spotlight')}
          >
            <Sparkles
              className={`w-4 h-4 shrink-0 ${activeNav === 'spotlight' ? 'text-[#FF2878]' : 'text-[#7A7A88]'}`}
            />
            <span className="truncate">Spotlight</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onNavigateStories();
              if (isMobile) onCloseMobile();
            }}
            aria-current={activeNav === 'stories' ? 'page' : undefined}
            className={navItemClass(activeNav === 'stories')}
          >
            <PlayCircle
              className={`w-4 h-4 shrink-0 ${activeNav === 'stories' ? 'text-[#FF2878]' : 'text-[#7A7A88]'}`}
            />
            <span className="truncate">Stories</span>
          </button>
        </div>

        {/* CATEGORIES */}
        <div className="space-y-1 pt-4 border-t border-[#232329]/80">
          <p className="px-3 pb-1 text-[11px] font-medium tracking-[0.06em] text-[#7A7A88]">
            Categories
          </p>

          <button
            type="button"
            onClick={() => {
              onSelectCategory('location');
              if (isMobile) onCloseMobile();
            }}
            className={navItemClass(hasSpecificCategory && activeCategory === 'location')}
          >
            <MapPin
              className={`w-4 h-4 shrink-0 ${
                hasSpecificCategory && activeCategory === 'location' ? 'text-[#FF2878]' : 'text-[#7A7A88]'
              }`}
            />
            <span className="truncate">Location</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectCategory('profession');
              if (isMobile) onCloseMobile();
            }}
            className={navItemClass(hasSpecificCategory && activeCategory === 'profession')}
          >
            <Briefcase
              className={`w-4 h-4 shrink-0 ${
                hasSpecificCategory && activeCategory === 'profession' ? 'text-[#FF2878]' : 'text-[#7A7A88]'
              }`}
            />
            <span className="truncate">Profession</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectCategory('marital');
              if (isMobile) onCloseMobile();
            }}
            className={navItemClass(hasSpecificCategory && activeCategory === 'marital')}
          >
            <Heart
              className={`w-4 h-4 shrink-0 ${
                hasSpecificCategory && activeCategory === 'marital' ? 'text-[#FF2878]' : 'text-[#7A7A88]'
              }`}
            />
            <span className="truncate">Marital Status</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectCategory('featured');
              if (isMobile) onCloseMobile();
            }}
            className={navItemClass(hasSpecificCategory && activeCategory === 'featured')}
          >
            <Star
              className={`w-4 h-4 shrink-0 ${
                hasSpecificCategory && activeCategory === 'featured' ? 'text-[#FF2878]' : 'text-[#7A7A88]'
              }`}
            />
            <span className="truncate">Featured Profiles</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectCategory('recent');
              if (isMobile) onCloseMobile();
            }}
            className={navItemClass(hasSpecificCategory && activeCategory === 'recent')}
          >
            <Activity
              className={`w-4 h-4 shrink-0 ${
                hasSpecificCategory && activeCategory === 'recent' ? 'text-[#FF2878]' : 'text-[#7A7A88]'
              }`}
            />
            <span className="truncate">Recently Active</span>
          </button>
        </div>

        {/* TOOLS */}
        <div className="space-y-1 pt-4 border-t border-[#232329]/80">
          <p className="px-3 pb-1 text-[11px] font-medium tracking-[0.06em] text-[#7A7A88]">
            Tools
          </p>

          <button
            type="button"
            onClick={() => {
              onOpenSearch();
              if (isMobile) onCloseMobile();
            }}
            className={navItemClass(false)}
          >
            <Search className="w-4 h-4 shrink-0 text-[#FF2878]" />
            <span className="truncate">Search Candidates</span>
          </button>

          <Link
            to="/admin"
            onClick={() => {
              if (isMobile) onCloseMobile();
            }}
            className={navItemClass(false)}
          >
            <UserCheck className="w-4 h-4 shrink-0 text-[#8B5CF6]" />
            <span className="truncate">Private Portal</span>
          </Link>
        </div>
      </nav>

      {/* BOTTOM: Clean Fixed Legal Footer inside Sidebar Column */}
      <div className="px-4 py-3.5 border-t border-[#232329] bg-[#08080A] space-y-2 shrink-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-[#9A9AA8]">
          <button
            type="button"
            onClick={() => {
              onOpenLegalModal('privacy');
              if (isMobile) onCloseMobile();
            }}
            className="inline-flex items-center gap-1 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            <Shield className="w-3 h-3 shrink-0" />
            <span>Privacy</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onOpenLegalModal('terms');
              if (isMobile) onCloseMobile();
            }}
            className="inline-flex items-center gap-1 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            <FileText className="w-3 h-3 shrink-0" />
            <span>Terms</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onOpenLegalModal('contact');
              if (isMobile) onCloseMobile();
            }}
            className="inline-flex items-center gap-1 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            <Mail className="w-3 h-3 shrink-0" />
            <span>Contact</span>
          </button>
        </div>
        <p className="text-[11px] text-[#6E6E7C]">
          © {new Date().getFullYear()} Call Me
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar (240px wide) */}
      <aside
        aria-label="Desktop Navigation Sidebar"
        className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-[240px] lg:z-40 border-r border-[#232329] bg-[#08080A]"
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Slide-Out Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/75 backdrop-blur-xs"
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
              className="relative z-10 w-[275px] max-w-[85vw] h-full border-r border-[#232329] bg-[#08080A] shadow-2xl"
              aria-label="Mobile Navigation Drawer"
            >
              {renderSidebarContent(true)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
