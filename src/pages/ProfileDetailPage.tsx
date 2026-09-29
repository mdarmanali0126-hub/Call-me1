import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Briefcase,
  GraduationCap,
  Heart,
  Share2,
  ShieldCheck,
  ArrowLeft,
  Calendar,
  Sparkles,
  Eye,
  MessageCircle,
  Quote,
  User,
  Phone
} from 'lucide-react';
import { Profile, DEFAULT_AVATAR_PLACEHOLDER } from '../types';
import { fetchPublicProfileBySlug, fetchPublicProfiles, recordProfileView, trackTelemetry } from '../lib/api';
import { updateSEO, injectProfileJsonLd } from '../lib/seo';
import { logEvent } from '../lib/analytics';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ContactModal } from '../components/ContactModal';
import { ShareModal } from '../components/ShareModal';
import { MessageChatModal } from '../components/MessageChatModal';
import { VideoCallModal } from '../components/VideoCallModal';
import { CallLimitModal } from '../components/CallLimitModal';
import { AdInterstitialModal } from '../components/AdInterstitialModal';
import { AdsterraBanner } from '../components/AdsterraBanner';
import { useCallLimit } from '../hooks/useCallLimit';

export const ProfileDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [relatedProfiles, setRelatedProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Call Limit Management
  const { callsUsed, callsRemaining, canCall, consumeCall } = useCallLimit();
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [isAdInterstitialOpen, setIsAdInterstitialOpen] = useState(false);

  // Modals
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);

  // Initiate call with limit check
  const handleInitiateCall = () => {
    if (!profile) return;
    if (!canCall) {
      setIsLimitModalOpen(true);
    } else {
      logEvent('open_video_call', 'Engagement', profile.slug);
      setIsVideoCallOpen(true);
    }
  };

  const handleAdInterstitialComplete = () => {
    setIsAdInterstitialOpen(false);
    setIsVideoCallOpen(true);
  };

  useEffect(() => {
    if (!slug) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    // Fetch from Express API
    fetchPublicProfileBySlug(slug)
      .then((data) => {
        if (!isMounted) return;
        if (!data) {
          setError('The requested matrimonial portfolio could not be found.');
          setLoading(false);
          return;
        }

        setProfile(data);
        setLoading(false);

        // SEO & Analytics
        updateSEO({
          title: `${data.fullName} - Matrimonial Portfolio & Proposal | Call Me`,
          description: `${data.fullName}, ${data.age} yrs, ${data.profession} based in ${data.city}, ${data.country}. ${data.proposalMessage || data.bio}`,
          image: data.image,
          url: window.location.href
        });

        injectProfileJsonLd(data);
        recordProfileView(data.slug);
        trackTelemetry({
          type: 'page_view',
          profileSlug: data.slug,
          timestamp: new Date().toISOString()
        });
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Error loading profile.');
        setLoading(false);
      });

    // Fetch related recommendations
    fetchPublicProfiles().then((all) => {
      if (isMounted) {
        setRelatedProfiles(all.filter((p) => p.slug !== slug).slice(0, 3));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
          <div className="w-12 h-12 border-3 border-rose-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Retrieving candidate portfolio...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <div className="max-w-md mx-auto my-auto p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Heart className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-serif-luxury text-slate-900">Portfolio Unavailable</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {error || 'This candidate portfolio is currently unpublished or has been archived.'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Directory</span>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <AdsterraBanner slotName="header" />
      <Navbar />

      <main className="flex-1 pb-16">
        {/* Back breadcrumb */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Candidate Directory</span>
          </Link>
        </div>

        {/* Hero Portfolio Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Left Column: Image & Media Gallery */}
              <div className="lg:col-span-5 relative bg-slate-950 min-h-[420px] lg:min-h-[540px] flex flex-col justify-end p-6 overflow-hidden">
                <img
                  src={profile.image || DEFAULT_AVATAR_PLACEHOLDER}
                  alt={profile.fullName}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />

                {/* Top Overlay Badges */}
                <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
                  <div className="flex items-center gap-2">
                    {profile.verified !== false && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/95 text-slate-900 shadow-md backdrop-blur-md flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Verified Profile
                      </span>
                    )}
                    {profile.featured && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-md flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 fill-white" />
                        Featured
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Key Details & Proposal */}
              <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-3 py-1 rounded-lg border border-rose-200">
                      {profile.profession}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      ID: {profile.id}
                    </span>
                  </div>

                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold font-serif-luxury text-slate-900 leading-tight">
                      {profile.fullName}
                    </h1>
                    <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{profile.city}, {profile.state ? `${profile.state}, ` : ''}{profile.country}</span>
                    </p>
                  </div>

                  {/* Highlight Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[11px] font-medium text-slate-600 block">Age &amp; Status</span>
                      <span className="text-sm font-bold text-slate-900">{profile.age} yrs • {profile.maritalStatus}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[11px] font-medium text-slate-600 block">Education</span>
                      <span className="text-sm font-bold text-slate-900 truncate block" title={profile.education}>
                        {profile.education}
                      </span>
                    </div>
                    {profile.religion && (
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[11px] font-medium text-slate-600 block">Faith / Outlook</span>
                        <span className="text-sm font-bold text-slate-900 truncate block">{profile.religion}</span>
                      </div>
                    )}
                  </div>

                  {/* Personal Bio */}
                  {profile.bio && (
                    <div className="space-y-1.5 pt-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Personal Background</h3>
                      <p className="text-sm text-slate-700 leading-relaxed">{profile.bio}</p>
                    </div>
                  )}

                  {/* Formal Matrimonial Proposal Message */}
                  {profile.proposalMessage && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-50 via-amber-50/40 to-white border border-rose-100 relative space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 uppercase tracking-wider">
                        <Quote className="w-3.5 h-3.5" />
                        <span>Direct Matrimonial Proposal Statement</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed italic">
                        "{profile.proposalMessage}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Primary Action Buttons: [ Message ] [ Call Me ] [ Share ] */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsMessageOpen(true)}
                    className="flex-1 min-w-[140px] py-3.5 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700/80 hover:border-pink-500/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.22)] font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                    title={`Message ${profile.fullName}`}
                  >
                    <MessageCircle className="w-4 h-4 text-pink-500 fill-pink-500/20" />
                    <span>Message</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleInitiateCall}
                    className="flex-1 min-w-[140px] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:via-pink-600 hover:to-rose-700 text-white font-bold text-sm shadow-md shadow-rose-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer"
                    title={`Call ${profile.fullName}`}
                  >
                    <Phone className="w-4 h-4 fill-white text-white" />
                    <span>Call Me</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsShareOpen(true)}
                    className="py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm border border-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
                    title="Share Profile"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Share</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Attribute Matrix */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <h2 className="text-xl font-bold font-serif-luxury text-slate-900 border-b border-slate-100 pb-3">
              Candidate Attributes &amp; Preferences
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              {profile.height && (
                <div className="space-y-1">
                  <span className="text-slate-600 font-medium">Height</span>
                  <p className="font-semibold text-slate-900 text-sm">{profile.height}</p>
                </div>
              )}
              {profile.motherTongue && (
                <div className="space-y-1">
                  <span className="text-slate-600 font-medium">Mother Tongue / Languages</span>
                  <p className="font-semibold text-slate-900 text-sm">{profile.motherTongue}</p>
                </div>
              )}
              {profile.religion && (
                <div className="space-y-1">
                  <span className="text-slate-600 font-medium">Religion &amp; Philosophy</span>
                  <p className="font-semibold text-slate-900 text-sm">{profile.religion}</p>
                </div>
              )}
              {profile.maritalStatus && (
                <div className="space-y-1">
                  <span className="text-slate-600 font-medium">Marital Status</span>
                  <p className="font-semibold text-slate-900 text-sm">{profile.maritalStatus}</p>
                </div>
              )}
            </div>

            {/* Hobbies & Interests */}
            {profile.hobbies && profile.hobbies.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Interests &amp; Passions
                </span>
                <div className="flex flex-wrap gap-2">
                  {profile.hobbies.map((hobby, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-800 border border-rose-100"
                    >
                      {hobby}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Profile Tags */}
            {profile.tags && profile.tags.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Focus Tags
                </span>
                <div className="flex flex-wrap gap-2">
                  {profile.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Network Banner (320x50) */}
          <AdsterraBanner slotName="profile_inline" />

          {/* Gallery if present */}
          {profile.gallery && profile.gallery.filter(Boolean).length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4">
              <h3 className="text-xl font-bold font-serif-luxury text-slate-900">
                Portfolio Gallery
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {profile.gallery.filter(img => Boolean(img && img.trim())).map((imgUrl, i) => (
                  <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-slate-100">
                    <img
                      src={imgUrl}
                      alt={`Gallery item ${i + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Similar Candidates Section */}
        {relatedProfiles.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold font-serif-luxury text-slate-900">
                  Recommended Matches
                </h3>
                <p className="text-xs text-slate-500">Other verified candidates with compatible preferences</p>
              </div>
              <Link to="/" className="text-xs font-bold text-rose-600 hover:text-rose-700">
                View All Directory →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedProfiles.map((rel) => (
                <div
                  key={rel.id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all group"
                >
                  <Link to={`/profile/${rel.slug}`} className="block relative aspect-[4/3] bg-slate-100">
                    <img
                      src={rel.image || DEFAULT_AVATAR_PLACEHOLDER}
                      alt={rel.fullName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-md">
                      {rel.age} yrs
                    </div>
                  </Link>
                  <div className="p-4 space-y-2">
                    <h4 className="font-bold font-serif-luxury text-slate-900 group-hover:text-rose-600 transition-colors">
                      {rel.fullName}
                    </h4>
                    <p className="text-xs text-slate-500 truncate">{rel.profession}</p>
                    <p className="text-[11px] text-slate-400">{rel.city}, {rel.country}</p>
                    <div className="pt-2">
                      <Link
                        to={`/profile/${rel.slug}`}
                        className="block text-center py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6 w-full">
        <AdsterraBanner slotName="footer" />
      </div>

      <Footer />

      {/* Contact Channels Modal */}
      <ContactModal
        profile={profile}
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      {/* Share Modal */}
      <ShareModal
        profile={profile}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />

      {/* Message Chat Modal */}
      <MessageChatModal
        profile={profile}
        isOpen={isMessageOpen}
        onClose={() => setIsMessageOpen(false)}
      />

      {/* Simulated Video Call Modal */}
      {isVideoCallOpen && (
        <VideoCallModal
          profile={profile}
          isOpen={isVideoCallOpen}
          onClose={() => setIsVideoCallOpen(false)}
          onCallCompleted={() => consumeCall()}
          onOpenContact={() => {
            setIsVideoCallOpen(false);
            setIsContactOpen(true);
          }}
        />
      )}

      {/* Call Limit Reached Modal */}
      {isLimitModalOpen && (
        <CallLimitModal
          isOpen={isLimitModalOpen}
          callsUsed={callsUsed}
          onClose={() => setIsLimitModalOpen(false)}
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
    </div>
  );
};
