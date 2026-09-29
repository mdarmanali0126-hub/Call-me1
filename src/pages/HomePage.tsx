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
  Compass
} from 'lucide-react';
import { Profile, DEFAULT_AVATAR_PLACEHOLDER } from '../types';
import { fetchPublicProfiles, trackTelemetry } from '../lib/api';
import { updateSEO } from '../lib/seo';
import { logEvent } from '../lib/analytics';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProfileCard } from '../components/ProfileCard';
import { ContactModal } from '../components/ContactModal';
import { ShareModal } from '../components/ShareModal';
import { MessageChatModal } from '../components/MessageChatModal';
import { VideoCallModal } from '../components/VideoCallModal';
import { CallLimitModal } from '../components/CallLimitModal';
import { AdInterstitialModal } from '../components/AdInterstitialModal';
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
  const [searchModalOpen, setSearchModalOpen] = useState(false);

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

  // Filtered list
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      if (onlyFeatured && !p.featured) return false;
      if (selectedCountry !== 'all' && p.country.toLowerCase() !== selectedCountry.toLowerCase()) return false;
      if (selectedStatus !== 'all' && p.maritalStatus.toLowerCase() !== selectedStatus.toLowerCase()) return false;
      if (selectedProfession !== 'all' && !p.profession.toLowerCase().includes(selectedProfession.toLowerCase())) return false;

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
    <div className="min-h-screen flex flex-col bg-slate-950 text-white selection:bg-pink-500 selection:text-white">
      {/* Header Ad Slot */}
      <AdsterraBanner slotName="header" />

      {/* Navigation */}
      <Navbar onSearchClick={() => setSearchModalOpen(true)} />

      <main className="flex-1 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div
          className="absolute top-0 inset-x-0 h-[600px] pointer-events-none opacity-40 blur-3xl"
          style={{
            background: 'radial-gradient(circle at 50% 0%, rgba(244, 63, 94, 0.28) 0%, rgba(15, 23, 42, 0) 75%)',
          }}
        />

        {/* ==================================================
            1. HERO SECTION (Dark, Premium Romantic Discovery)
            ================================================== */}
        <section className="relative pt-10 pb-12 lg:pt-14 lg:pb-16 border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto space-y-4 sm:space-y-5">
              {/* Brand Tag Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/5 border border-pink-500/25 text-pink-300 text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase shadow-[0_0_12px_rgba(244,63,94,0.12)] select-none">
                <Sparkles className="w-3 h-3 text-pink-400 shrink-0" />
                <span>Call Me • Bespoke Discovery Platform</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-serif-luxury leading-[1.18] sm:leading-[1.14]">
                Discover Someone{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-rose-300 italic">
                  New
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal px-2">
                Meet interesting people, explore their profiles, send a message, and discover someone who feels right.
              </p>

              {/* Primary Call to Action Button */}
              <div className="pt-1 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={scrollToProfiles}
                  className="h-12 px-7 sm:px-8 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:via-pink-600 hover:to-rose-700 text-white font-bold text-xs sm:text-sm shadow-[0_0_25px_rgba(244,63,94,0.3)] flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <span>Explore Profiles</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Redesigned Dark Search Bar */}
              <div className="pt-3 max-w-xl mx-auto w-full px-1 sm:px-0">
                <div className="relative flex items-center w-full bg-zinc-900/95 rounded-2xl sm:rounded-full shadow-xl shadow-black/60 border border-white/10 focus-within:border-pink-500/50 focus-within:ring-1 focus-within:ring-pink-500/30 p-1.5 transition-all">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400 ml-2.5 sm:ml-3.5 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, profession, city..."
                    className="w-full min-w-0 px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 bg-transparent outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-1.5 text-slate-400 hover:text-white mr-1 transition-colors cursor-pointer shrink-0"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
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
                    className="px-4 sm:px-5 py-2.5 rounded-xl sm:rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:via-pink-600 hover:to-rose-700 text-white text-xs font-bold shrink-0 shadow-md shadow-rose-950/40 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                  >
                    Find Profiles
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================
            2. ACTIVE STORIES & CALLING (Profile Discovery & Direct Actions)
            ================================================== */}
        <section className="bg-black/90 border-b border-white/10 py-5 sm:py-7 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-3.5 px-0.5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500" />
                </span>
                <h2 className="text-xs sm:text-sm font-bold tracking-wider text-white uppercase font-sans">
                  Active Stories &amp; Calling
                </h2>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-900 border border-pink-500/20 text-pink-400 text-[10px] sm:text-[11px] font-medium shadow-xs select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                <span>{activeProfiles.length} Online Now</span>
              </div>
            </div>

            {/* Horizontal Calling Reel: Mobile edge-to-edge peek carousel */}
            <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex items-center gap-3.5 sm:gap-5 overflow-x-auto pb-3 pt-1 scrollbar-none select-none scroll-smooth">
              {/* Item 0: Instant Call Action */}
              {spotlightProfile && (
                <div
                  onClick={() => handleInitiateCall(spotlightProfile)}
                  className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
                >
                  <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 group-hover:scale-105 transition-transform duration-200">
                    <div className="w-16 h-16 sm:w-[68px] sm:h-[68px] rounded-full bg-zinc-950 flex flex-col items-center justify-center border-2 border-black text-pink-400 group-hover:text-white transition-colors">
                      <Phone className="w-5 h-5 fill-pink-500/20 text-pink-400" />
                      <span className="text-[9px] font-bold mt-0.5 text-pink-300">CALL</span>
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-black ring-1 ring-emerald-400/40" />
                  </div>
                  <span className="text-[11px] font-semibold text-pink-300 truncate max-w-[70px] text-center mt-0.5">
                    Instant Call
                  </span>
                </div>
              )}

              {/* Profiles in Calling Reel: Click opens Message Chat */}
              {activeProfiles.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setMessageProfile(p)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setMessageProfile(p);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Send message inquiry to ${p.fullName}`}
                  className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group outline-none"
                >
                  {/* Circular image with pink gradient ring */}
                  <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(244,63,94,0.35)] transition-all duration-200 shadow-md shadow-rose-950/30">
                    <img
                      src={p.image || DEFAULT_AVATAR_PLACEHOLDER}
                      alt={p.fullName}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 sm:w-[68px] sm:h-[68px] rounded-full object-cover border-2 border-black"
                    />
                    {/* Online Status Indicator */}
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-black ring-1 ring-emerald-400/40" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-300 truncate max-w-[70px] text-center group-hover:text-pink-300 transition-colors mt-0.5">
                    {p.fullName.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================================================
            3. FEATURED CANDIDATE SPOTLIGHT (Dark Luxury Card)
            ================================================== */}
        {spotlightProfile && !searchQuery && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
            <div id="featured" className="max-w-5xl mx-auto bg-zinc-900/90 rounded-3xl border border-white/10 shadow-[0_0_40px_rgba(244,63,94,0.16)] overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-12 items-center">
                {/* Spotlight Visual Image */}
                <div className="md:col-span-5 relative aspect-square sm:aspect-auto sm:h-full min-h-[320px] bg-zinc-950">
                  <img
                    src={spotlightProfile.image || DEFAULT_AVATAR_PLACEHOLDER}
                    alt={spotlightProfile.fullName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/90 md:from-transparent via-transparent to-black/40" />

                  {/* Pink Badge */}
                  <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-bold shadow-lg shadow-rose-950/40">
                    <Sparkles className="w-3.5 h-3.5 fill-white" />
                    <span>Candidate Spotlight</span>
                  </div>
                </div>

                {/* Spotlight Info */}
                <div className="md:col-span-7 p-6 sm:p-8 lg:p-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded-md border border-pink-500/20">
                      {spotlightProfile.profession}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {spotlightProfile.age} yrs • {spotlightProfile.city}, {spotlightProfile.country}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold font-serif-luxury text-white">
                      {spotlightProfile.fullName}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">{spotlightProfile.education}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-950/80 border border-white/5 text-xs text-slate-300 leading-relaxed italic">
                    "{spotlightProfile.proposalMessage || spotlightProfile.bio}"
                  </div>

                  {/* Actions: Message, Call Me, Full Portfolio */}
                  <div className="pt-2 flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setMessageProfile(spotlightProfile)}
                      className="px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white border border-zinc-700/80 hover:border-pink-500/50 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)] text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                      title={`Message ${spotlightProfile.fullName}`}
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-pink-500 fill-pink-500/20" />
                      <span>Message</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInitiateCall(spotlightProfile)}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:via-pink-600 hover:to-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-950/25 active:scale-95 transition-all cursor-pointer"
                      title={`Call ${spotlightProfile.fullName}`}
                    >
                      <Phone className="w-3.5 h-3.5 fill-white text-white" />
                      <span>Call Me</span>
                    </button>

                    <Link
                      to={`/profile/${spotlightProfile.slug}`}
                      className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-slate-200 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <span>View Portfolio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ==================================================
            4. DISCOVER PROFILES & CANDIDATE DIRECTORY
            ================================================== */}
        <section id="discover" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 border-t border-white/10">
          {/* Section Heading & Filter Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-bold font-serif-luxury text-white">
                  Discover Profiles
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-500/10 border border-pink-500/20 text-pink-400">
                  {filteredProfiles.length} Available
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Browse verified candidate portfolios, explore compatibility, and connect directly.
              </p>
            </div>

            {/* Filter Pills in Dark Call Me Theme */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setOnlyFeatured(!onlyFeatured)}
                className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-colors border cursor-pointer ${
                  onlyFeatured
                    ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white border-transparent shadow-xs shadow-rose-950/30'
                    : 'bg-zinc-900 text-slate-300 border-white/10 hover:border-pink-500/30 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                <span>Featured Spotlights</span>
              </button>

              {/* Country Select */}
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-slate-200 font-medium outline-none hover:border-pink-500/30 focus:border-pink-500/50"
              >
                <option value="all">All Locations</option>
                {countries.filter((c) => c !== 'all').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Profession Select */}
              <select
                value={selectedProfession}
                onChange={(e) => setSelectedProfession(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-slate-200 font-medium outline-none hover:border-pink-500/30 focus:border-pink-500/50"
              >
                <option value="all">All Professions</option>
                {professions.filter((p) => p !== 'all').map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              {/* Status Select */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-slate-200 font-medium outline-none hover:border-pink-500/30 focus:border-pink-500/50"
              >
                <option value="all">All Marital Statuses</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
                <option value="Separated">Separated</option>
                <option value="Never Married">Never Married</option>
              </select>

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
                  className="px-2.5 py-1.5 text-xs text-pink-400 hover:text-pink-300 font-semibold cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Network Banner (320x50) */}
          <AdsterraBanner slotName="profile_inline" />

          {/* Profiles Grid */}
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-medium">Retrieving verified profiles...</p>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="py-20 text-center bg-zinc-900/80 rounded-3xl border border-white/10 p-8 space-y-4">
              <Users className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-white font-serif-luxury">No candidates match your filters</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try loosening your search keywords or resetting filters to browse all verified portfolios.
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
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-semibold hover:from-rose-600 hover:to-pink-700 transition-colors cursor-pointer"
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
                />
              ))}
            </div>
          )}
        </section>

        {/* ==================================================
            5. HOW CALL ME WORKS (Dark & Romantic 3 Steps)
            ================================================== */}
        <section className="border-t border-white/10 bg-black/60 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-pink-400">
                Simple &amp; Authentic
              </span>
              <h2 className="text-3xl font-bold font-serif-luxury text-white">
                How Call Me Works
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Thoughtful connections built on genuine profiles, direct communication, and mutual respect.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 01 */}
              <div className="bg-zinc-900/90 rounded-3xl border border-white/10 p-6 sm:p-8 hover:border-pink-500/30 transition-all space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-500 font-serif-luxury">
                    01
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                    <Compass className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-lg font-bold font-serif-luxury text-white">
                  Discover Profiles
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Browse authentic matrimonial portfolios, view candid proposals, and explore compatibility based on values, lifestyle, and family background.
                </p>
              </div>

              {/* Step 02 */}
              <div className="bg-zinc-900/90 rounded-3xl border border-white/10 p-6 sm:p-8 hover:border-pink-500/30 transition-all space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-500 font-serif-luxury">
                    02
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-lg font-bold font-serif-luxury text-white">
                  Message &amp; Inquire
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Start with a discreet inquiry message. Learn about candidate preferences and explore mutual compatibility in private chat.
                </p>
              </div>

              {/* Step 03 */}
              <div className="bg-zinc-900/90 rounded-3xl border border-white/10 p-6 sm:p-8 hover:border-pink-500/30 transition-all space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-500 font-serif-luxury">
                    03
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                    <Phone className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-lg font-bold font-serif-luxury text-white">
                  Call &amp; Connect
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Experience simulated video call previews and access verified direct contact channels to begin your next chapter together.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================
            6. TRUST & PRIVACY PILLARS
            ================================================== */}
        <section className="border-t border-white/10 bg-slate-950 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x md:divide-white/10">
              <div className="px-6 py-4 md:py-0 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-500/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold font-serif-luxury text-white">100% Verified Profiles</h3>
                <p className="text-xs text-slate-400">Every candidate is carefully vetted to ensure genuine matrimonial intent and authentic background details.</p>
              </div>

              <div className="px-6 py-4 md:py-0 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-pink-950/60 text-pink-400 flex items-center justify-center mx-auto mb-3 border border-pink-500/30">
                  <Heart className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold font-serif-luxury text-white">Direct Communication</h3>
                <p className="text-xs text-slate-400">Connect through instant inquiries, video call previews, and direct family-approved contact channels.</p>
              </div>

              <div className="px-6 py-4 md:py-0 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-purple-950/60 text-purple-400 flex items-center justify-center mx-auto mb-3 border border-purple-500/30">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold font-serif-luxury text-white">Privacy Protected</h3>
                <p className="text-xs text-slate-400">Direct contact information is protected and only accessible through mutual inquiry channels.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================
            7. FINAL CTA SECTION (Dark Romantic Conclusion)
            ================================================== */}
        <section className="border-t border-white/10 bg-gradient-to-b from-black via-zinc-950 to-slate-950 py-16 sm:py-20 relative overflow-hidden text-center">
          <div
            className="absolute inset-0 pointer-events-none opacity-30 blur-3xl"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(244, 63, 94, 0.25) 0%, transparent 70%)',
            }}
          />
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-5">
            <span className="text-xs font-bold uppercase tracking-wider text-pink-400">
              Your Journey Awaits
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif-luxury text-white leading-tight">
              Maybe Your Next Chapter{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-rose-300 italic">
                Starts Here.
              </span>
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
              Explore profiles, send inquiries, and take the first step toward meaningful companionship.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={scrollToProfiles}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:via-pink-600 hover:to-rose-700 text-white font-bold text-sm shadow-[0_0_35px_rgba(244,63,94,0.35)] inline-flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <span>Discover Profiles</span>
                <ArrowRight className="w-4 h-4" />
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
