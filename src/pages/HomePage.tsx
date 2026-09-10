import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Sparkles,
  Heart,
  SlidersHorizontal,
  X,
  Play,
  ArrowRight,
  ShieldCheck,
  Flame,
  Users
} from 'lucide-react';
import { Profile, DEFAULT_AVATAR_PLACEHOLDER } from '../types';
import { fetchPublicProfiles, trackTelemetry } from '../lib/api';
import { updateSEO } from '../lib/seo';
import { logEvent } from '../lib/analytics';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProfileCard } from '../components/ProfileCard';
import { StoryViewerModal } from '../components/StoryViewerModal';
import { ContactModal } from '../components/ContactModal';
import { ShareModal } from '../components/ShareModal';
import { AdsterraBanner } from '../components/AdsterraBanner';

export const HomePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get('country') || 'all');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'all');
  const [selectedProfession, setSelectedProfession] = useState(searchParams.get('profession') || 'all');
  const [onlyFeatured, setOnlyFeatured] = useState(searchParams.get('filter') === 'featured');

  // Modal active profile states
  const [storyProfile, setStoryProfile] = useState<Profile | null>(null);
  const [contactProfile, setContactProfile] = useState<Profile | null>(null);
  const [shareProfile, setShareProfile] = useState<Profile | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  useEffect(() => {
    updateSEO({
      title: 'Call Me - Bespoke Matrimonial Portfolios & Story Mode Platform',
      description: 'Discover verified matrimonial candidate portfolios, interactive Story Mode presentations, and direct personal proposals.',
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Header Ad Slot */}
      <AdsterraBanner slotName="header" />

      {/* Navigation */}
      <Navbar onSearchClick={() => setSearchModalOpen(true)} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white via-rose-50/25 to-slate-50 border-b border-slate-200/80 pt-12 pb-16 lg:pt-16 lg:pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
                <span>Premium Matrimonial Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 font-serif-luxury leading-[1.15]">
                Find Your <span className="text-rose-600 italic">Perfect Match</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Discover verified, highly compatible female profiles tailored to your values and lifestyle. Browse our exclusive collection of premium matrimonial candidates.
              </p>

              {/* Quick search input */}
              <div className="pt-4 max-w-xl mx-auto">
                <div className="relative flex items-center bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-200 p-1.5 focus-within:ring-2 focus-within:ring-rose-500 transition-all">
                  <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by candidate name, profession, city..."
                    className="w-full px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-1 text-slate-400 hover:text-slate-600 mr-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (searchQuery.trim()) {
                        logEvent('search', 'Home', searchQuery);
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white text-xs font-bold shrink-0 shadow-xs transition-all"
                  >
                    Find Profiles
                  </button>
                </div>
              </div>
            </div>

            {/* Spotlight Card if available */}
            {spotlightProfile && !searchQuery && (
              <div id="featured" className="mt-14 max-w-5xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-12 items-center">
                  <div className="md:col-span-5 relative aspect-square sm:aspect-auto sm:h-full min-h-[300px]">
                    <img
                      src={spotlightProfile.image || DEFAULT_AVATAR_PLACEHOLDER}
                      alt={spotlightProfile.fullName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 md:from-transparent via-transparent to-black/30" />
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold shadow-md">
                      <Sparkles className="w-3.5 h-3.5 fill-white" />
                      Candidate Spotlight
                    </div>
                  </div>

                  <div className="md:col-span-7 p-6 sm:p-8 lg:p-10 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100">
                        {spotlightProfile.profession}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {spotlightProfile.age} yrs • {spotlightProfile.city}, {spotlightProfile.country}
                      </span>
                    </div>

                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold font-serif-luxury text-slate-900">
                        {spotlightProfile.fullName}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">{spotlightProfile.education}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 text-xs text-slate-700 leading-relaxed italic">
                      "{spotlightProfile.proposalMessage || spotlightProfile.bio}"
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      {spotlightProfile.story?.slides?.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setStoryProfile(spotlightProfile)}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white text-xs font-bold shadow-md shadow-rose-900/20 flex items-center gap-2 transform active:scale-95 transition-all"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Watch Story Mode</span>
                        </button>
                      )}

                      <Link
                        to={`/profile/${spotlightProfile.slug}`}
                        className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <span>View Full Portfolio</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => setContactProfile(spotlightProfile)}
                        className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
                      >
                        Connect Directly
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Trust Badges Section */}
        <section className="bg-white border-b border-slate-200/80 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x md:divide-slate-100">
              <div className="px-6 py-4 md:py-0">
                <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold font-serif-luxury text-slate-900 mb-2">100% Verified Profiles</h3>
                <p className="text-sm text-slate-500">Every candidate is carefully vetted to ensure genuine matrimonial intent and authentic backgrounds.</p>
              </div>
              <div className="px-6 py-4 md:py-0">
                <div className="w-14 h-14 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center mx-auto mb-4 border border-slate-200 shadow-sm">
                  <Heart className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold font-serif-luxury text-slate-900 mb-2">Immersive Story Mode</h3>
                <p className="text-sm text-slate-500">Go beyond flat bios. Discover personalities through interactive chapters covering values, career, and family.</p>
              </div>
              <div className="px-6 py-4 md:py-0">
                <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-100 shadow-sm">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold font-serif-luxury text-slate-900 mb-2">Privacy Protected</h3>
                <p className="text-sm text-slate-500">Contact information is secured and only accessible through formal inquiry channels to maintain exclusivity.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Directory Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Controls & Filter Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-8 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold font-serif-luxury text-slate-900">
                  Browse Premium Candidates
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                  {filteredProfiles.length} Available
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Authentic profiles with verified backgrounds and direct contact channels.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setOnlyFeatured(!onlyFeatured)}
                className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-colors border ${
                  onlyFeatured
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Featured Spotlights</span>
              </button>

              {/* Country Select */}
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium outline-none"
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
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium outline-none"
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
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium outline-none"
              >
                <option value="all">All Marital Statuses</option>
                <option value="Never Married">Never Married</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
                <option value="Separated">Separated</option>
              </select>

              {(searchQuery || selectedCountry !== 'all' || selectedStatus !== 'all' || onlyFeatured) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCountry('all');
                    setSelectedStatus('all');
                    setSelectedProfession('all');
                    setOnlyFeatured(false);
                  }}
                  className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-800 font-semibold"
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
              <div className="w-10 h-10 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Retrieving verified profiles...</p>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800">No candidates match your filters</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try loosening your search keywords or resetting filters to browse all verified portfolios.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCountry('all');
                  setSelectedStatus('all');
                  setOnlyFeatured(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors"
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
                  onOpenStory={(p) => setStoryProfile(p)}
                  onOpenContact={(p) => setContactProfile(p)}
                />
              ))}
            </div>
          )}

        </section>
      </main>

      {/* Footer Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6 w-full">
        <AdsterraBanner slotName="footer" />
      </div>

      <Footer />

      {/* Modals */}
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
    </div>
  );
};
