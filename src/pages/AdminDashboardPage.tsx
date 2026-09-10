import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Eye,
  Settings,
  BarChart3,
  LogOut,
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  ExternalLink,
  Play,
  Heart,
  ShieldCheck,
  AlertCircle,
  Save,
  Layers,
  ArrowRight,
  Clock,
  Activity,
  Database,
  RefreshCw,
  Radio,
  Megaphone,
  Zap,
  Globe,
  Layout
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Profile, AdvertisingSettings, AnalyticsSummary, DEFAULT_AVATAR_PLACEHOLDER } from '../types';
import {
  fetchProfilesFromFirestore,
  deleteProfileFromFirestore,
  toggleProfilePublish,
  fetchAdSettingsFromFirestore,
  saveAdSettingsToFirestore,
  fetchTelemetrySummary,
  refreshFirestoreSync
} from '../lib/firestoreService';
import {
  syncProfileToServer,
  syncDeleteProfileToServer,
  syncAdvertisingToServer,
  invalidateAdvertisingCache,
  refreshServerProfilesCache
} from '../lib/api';
import { StoryViewerModal } from '../components/StoryViewerModal';

export const AdminDashboardPage: React.FC = () => {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'profiles' | 'advertising' | 'analytics'>('profiles');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [adSettings, setAdSettings] = useState<AdvertisingSettings | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [previewStoryProfile, setPreviewStoryProfile] = useState<Profile | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Load dashboard data
  useEffect(() => {
    if (!isAuthenticated) return;
    loadAllData();
  }, [isAuthenticated]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [profs, ads, ana] = await Promise.all([
        fetchProfilesFromFirestore(false),
        fetchAdSettingsFromFirestore(),
        fetchTelemetrySummary()
      ]);
      setProfiles(profs);
      setAdSettings(ads);
      setAnalytics(ana);
    } catch (err: any) {
      console.error(err);
      setActionError('Error loading dashboard data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      await refreshFirestoreSync();
      await refreshServerProfilesCache();
      await loadAllData();
      showToast('Refreshed real candidate profiles from Firestore & synchronized caches.');
    } catch (err: any) {
      setActionError('Firestore refresh notice: ' + (err.message || String(err)));
    } finally {
      setIsRefreshing(false);
    }
  };

  const showToast = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // Toggle publish status
  const handleTogglePublish = async (profile: Profile) => {
    const newStatus = !profile.published;
    try {
      await toggleProfilePublish(profile.id, newStatus);
      const updated = { ...profile, published: newStatus };
      setProfiles((prev) => prev.map((p) => (p.id === profile.id ? updated : p)));
      await syncProfileToServer(updated);
      showToast(`Profile "${profile.fullName}" is now ${newStatus ? 'Published' : 'Draft'}`);
    } catch (err: any) {
      setActionError('Failed to toggle publish status: ' + err.message);
    }
  };

  // Delete profile
  const handleDeleteProfile = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete profile "${name}"?`)) {
      return;
    }
    try {
      await deleteProfileFromFirestore(id);
      await syncDeleteProfileToServer(id);
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      showToast(`Profile "${name}" deleted successfully.`);
    } catch (err: any) {
      setActionError('Delete failed: ' + err.message);
    }
  };

  // Save Advertising Settings
  const handleSaveAds = async () => {
    if (!adSettings) return;
    try {
      await saveAdSettingsToFirestore(adSettings);
      await syncAdvertisingToServer(adSettings);
      invalidateAdvertisingCache(adSettings);
      showToast('Advertising configuration updated and synced successfully.');
    } catch (err: any) {
      setActionError('Failed to save advertising: ' + err.message);
    }
  };

  // Filtered profiles for search
  const filteredProfiles = profiles.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      p.profession.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q)
    );
  });

  const totalViews = profiles.reduce((acc, p) => acc + (p.views || 0), 0);
  const publishedCount = profiles.filter((p) => p.published).length;

  if (authLoading || (!isAuthenticated && loading)) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Admin Header */}
      <header className="border-b border-slate-800 bg-slate-950/70 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 flex items-center justify-center text-white shadow-md">
              <Heart className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white font-serif-luxury tracking-tight text-lg">CALL ME</span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                  Admin Console
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {user?.photoURL && user.photoURL.trim() !== '' && (
                  <img
                    src={user.photoURL}
                    alt="Admin"
                    className="w-4 h-4 rounded-full border border-emerald-500"
                    referrerPolicy="no-referrer"
                  />
                )}
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Authorized Admin:</span>
                  <span className="text-emerald-300 font-semibold">{user?.email || 'mdarmanali0126@gmail.com'}</span>
                  {user?.providerData?.[0]?.providerId === 'google.com' && (
                    <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800 font-medium">
                      Google
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors"
            >
              <span>View Live Website</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate('/admin/login');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Toast notifications */}
        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{actionSuccess}</span>
          </div>
        )}

        {actionError && (
          <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-700 text-rose-200 text-xs flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button type="button" onClick={() => setActionError(null)} className="text-slate-400 hover:text-white">
              Dismiss
            </button>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Candidate Portfolios</span>
              <Users className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-serif-luxury text-white">
              {profiles.length}
            </div>
            <p className="text-[11px] text-emerald-400 font-medium">
              {publishedCount} Published • {profiles.length - publishedCount} Drafts
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 gap-6 text-sm">
          <button
            type="button"
            onClick={() => setActiveTab('profiles')}
            className={`pb-3 font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'profiles'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Profiles Management ({profiles.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('advertising')}
            className={`pb-3 font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'advertising'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Advertising Architecture</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`pb-3 font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'analytics'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics &amp; Telemetry</span>
          </button>
        </div>

        {/* TAB 1: PROFILES MANAGEMENT */}
        {activeTab === 'profiles' && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, slug, role..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleRefreshData}
                  disabled={isRefreshing}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  title="Reload candidate profiles directly from Firestore without modifying existing profiles"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-rose-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing ? 'Refreshing...' : 'Refresh / Sync Data'}</span>
                </button>

                <Link
                  to="/admin/profiles/new"
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-950/40 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Candidate Profile</span>
                </Link>
              </div>
            </div>

            {/* Profiles Table */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold">Candidate</th>
                      <th className="py-3.5 px-4 font-semibold">Slug Route</th>
                      <th className="py-3.5 px-4 font-semibold">Location &amp; Role</th>
                      <th className="py-3.5 px-4 font-semibold">Status</th>
                      <th className="py-3.5 px-4 font-semibold">Story Mode</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredProfiles.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image || DEFAULT_AVATAR_PLACEHOLDER}
                              alt={p.fullName}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white text-sm">{p.fullName}</span>
                                {p.featured && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                                    Featured
                                  </span>
                                )}
                              </div>
                              <span className="text-slate-500 text-[11px]">{p.age} yrs • {p.maritalStatus}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                          <Link
                            to={`/profile/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-rose-400 hover:text-rose-300 flex items-center gap-1 group"
                          >
                            <span>/{p.slug}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-white font-medium truncate max-w-[160px]">{p.profession}</div>
                          <div className="text-slate-500 text-[11px]">{p.city}, {p.country}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(p)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-colors ${
                              p.published
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {p.published ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            <span>{p.published ? 'Published' : 'Draft'}</span>
                          </button>
                        </td>

                        <td className="py-3.5 px-4">
                          {p.story?.slides?.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => setPreviewStoryProfile(p)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Play className="w-3 h-3 fill-amber-300" />
                              <span>{p.story.slides.length} Slides</span>
                            </button>
                          ) : (
                            <span className="text-slate-500 text-[11px]">No slides</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/admin/profiles/${p.id}/edit`}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="Edit Profile"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDeleteProfile(p.id, p.fullName)}
                              className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-rose-100 transition-colors"
                              title="Delete Profile"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ADVERTISING ARCHITECTURE */}
        {activeTab === 'advertising' && adSettings && (
          <div className="space-y-8 max-w-4xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold font-serif-luxury text-white">Advertising Management</h3>
                <p className="text-xs text-slate-400">
                  Control independent network ad formats and native sponsor placements across the platform.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveAds}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Ad Settings</span>
              </button>
            </div>

            {/* SECTION 1: NETWORK ADVERTISING FORMATS (ADSTERRA) */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Adsterra &amp; Network Advertising Formats</h4>
                    <p className="text-[11px] text-slate-400">
                      Each ad format is independently controlled. When disabled, scripts and containers will not execute or load.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    3 Independent Channels
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Popunder Ads */}
                <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  adSettings.ads?.popunder
                    ? 'bg-gradient-to-b from-amber-950/20 to-slate-900 border-amber-500/40 shadow-xs'
                    : 'bg-slate-900/60 border-slate-800/80 opacity-80'
                }`}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-amber-400" />
                        <span className="font-bold text-white text-xs">Popunder Ads</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        adSettings.ads?.popunder
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {adSettings.ads?.popunder ? 'ON' : 'OFF'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Loads Popunder script on interaction. Prevents duplicate injection across navigations.
                    </p>

                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[10px] text-slate-400 font-mono truncate">
                      pl31254996.profitableratecpm...
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">Status</span>
                    <button
                      type="button"
                      onClick={() => {
                        const currentVal = !!adSettings.ads?.popunder;
                        setAdSettings({
                          ...adSettings,
                          ads: {
                            popunder: !currentVal,
                            socialBar: adSettings.ads?.socialBar ?? false,
                            banner: adSettings.ads?.banner ?? false
                          }
                        });
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        adSettings.ads?.popunder
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      <span>{adSettings.ads?.popunder ? 'Enabled [ON]' : 'Disabled [OFF]'}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Social Bar Ads */}
                <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  adSettings.ads?.socialBar
                    ? 'bg-gradient-to-b from-rose-950/20 to-slate-900 border-rose-500/40 shadow-xs'
                    : 'bg-slate-900/60 border-slate-800/80 opacity-80'
                }`}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Megaphone className="w-4 h-4 text-rose-400" />
                        <span className="font-bold text-white text-xs">Social Bar Ads</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        adSettings.ads?.socialBar
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {adSettings.ads?.socialBar ? 'ON' : 'OFF'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Engaging floating social bar with rich push-style format without duplicate execution.
                    </p>

                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[10px] text-slate-400 font-mono truncate">
                      pl31254997.profitableratecpm...
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">Status</span>
                    <button
                      type="button"
                      onClick={() => {
                        const currentVal = !!adSettings.ads?.socialBar;
                        setAdSettings({
                          ...adSettings,
                          ads: {
                            popunder: adSettings.ads?.popunder ?? false,
                            socialBar: !currentVal,
                            banner: adSettings.ads?.banner ?? false
                          }
                        });
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        adSettings.ads?.socialBar
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      <span>{adSettings.ads?.socialBar ? 'Enabled [ON]' : 'Disabled [OFF]'}</span>
                    </button>
                  </div>
                </div>

                {/* 3. Banner (320x50) */}
                <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  adSettings.ads?.banner
                    ? 'bg-gradient-to-b from-indigo-950/20 to-slate-900 border-indigo-500/40 shadow-xs'
                    : 'bg-slate-900/60 border-slate-800/80 opacity-80'
                }`}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layout className="w-4 h-4 text-indigo-400" />
                        <span className="font-bold text-white text-xs">Banner (320x50)</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        adSettings.ads?.banner
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {adSettings.ads?.banner ? 'ON' : 'OFF'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Rendered in centered, responsive container. Mobile-safe with no layout overflow.
                    </p>

                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[10px] text-slate-400 font-mono truncate">
                      320x50 iframe | key: b5007...
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">Status</span>
                    <button
                      type="button"
                      onClick={() => {
                        const currentVal = !!adSettings.ads?.banner;
                        setAdSettings({
                          ...adSettings,
                          ads: {
                            popunder: adSettings.ads?.popunder ?? false,
                            socialBar: adSettings.ads?.socialBar ?? false,
                            banner: !currentVal
                          }
                        });
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        adSettings.ads?.banner
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      <span>{adSettings.ads?.banner ? 'Enabled [ON]' : 'Disabled [OFF]'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ANALYTICS & TELEMETRY */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold font-serif-luxury text-white">Google Analytics</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-xl">
                Traffic and engagement metrics (page views, story clicks, interactions) are tracked natively using Google Analytics 4 (Measurement ID: G-ZT7QE0CRY5). 
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4">
              <BarChart3 className="w-12 h-12 text-rose-400 mb-2" />
              <h4 className="text-lg font-bold text-white">View Complete Analytics</h4>
              <p className="text-sm text-slate-400 max-w-md">
                Please log in to your Google Analytics dashboard to view real-time traffic, candidate profile popularity, and visitor engagement statistics.
              </p>
              <a 
                href="https://analytics.google.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-4 px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-colors"
              >
                <span>Open Google Analytics</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
      </main>

      {/* Story Preview Modal */}
      {previewStoryProfile && (
        <StoryViewerModal
          profile={previewStoryProfile}
          isOpen={!!previewStoryProfile}
          onClose={() => setPreviewStoryProfile(null)}
        />
      )}
    </div>
  );
};
