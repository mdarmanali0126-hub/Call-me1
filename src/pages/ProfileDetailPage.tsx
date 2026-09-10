import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Briefcase,
  GraduationCap,
  Heart,
  Share2,
  ShieldCheck,
  Play,
  ArrowLeft,
  Calendar,
  Sparkles,
  Eye,
  MessageCircle,
  Quote,
  ChevronRight,
  User
} from 'lucide-react';
import { Profile, DEFAULT_AVATAR_PLACEHOLDER } from '../types';
import { fetchPublicProfileBySlug, fetchPublicProfiles, recordProfileView, trackTelemetry } from '../lib/api';
import { updateSEO, injectProfileJsonLd } from '../lib/seo';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { StoryViewerModal } from '../components/StoryViewerModal';
import { ContactModal } from '../components/ContactModal';
import { ShareModal } from '../components/ShareModal';
import { AdBanner } from '../components/AdBanner';
import { AdsterraBanner } from '../components/AdsterraBanner';

export const ProfileDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [relatedProfiles, setRelatedProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isStoryOpen, setIsStoryOpen] = useState(searchParams.get('story') === '1');
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

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

        // Record view telemetry
        recordProfileView(data.slug);
        trackTelemetry({
          type: 'page_view',
          profileSlug: data.slug,
          timestamp: new Date().toISOString()
        });

        // Load other related profiles
        fetchPublicProfiles().then((all) => {
          if (isMounted) {
            setRelatedProfiles(all.filter((p) => p.slug !== slug).slice(0, 3));
          }
        });
      })
      .catch((err) => {
        if (isMounted) {
          setError('Failed to load profile. Please try again.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
          <div className="w-12 h-12 border-3 border-rose-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Retrieving portfolio via Express API...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-4">
          <User className="w-16 h-16 text-slate-300 mx-auto" />
          <h2 className="text-2xl font-bold font-serif-luxury text-slate-900">Portfolio Not Found</h2>
          <p className="text-sm text-slate-600">{error || 'This profile is either unpublished or does not exist.'}</p>
          <Link
            to="/"
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Directory</span>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const hasStory = profile.story && profile.story.slides && profile.story.slides.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
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
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/95 text-slate-900 shadow-md backdrop-blur-md flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Verified Profile
                    </span>
                    {profile.featured && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-md flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 fill-white" />
                        Featured
                      </span>
                    )}
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black/60 text-white backdrop-blur-md">
                    {profile.views || 0} views
                  </span>
                </div>

                {/* Story Mode Floating Trigger */}
                {hasStory && (
                  <div className="relative z-20 mb-3">
                    <button
                      type="button"
                      onClick={() => setIsStoryOpen(true)}
                      className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-sm shadow-xl shadow-rose-950/50 flex items-center justify-center gap-2 transform active:scale-95 transition-all"
                    >
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                      </span>
                      <Play className="w-4 h-4 fill-white text-white" />
                      <span>Watch Full Story Mode ({profile.story.slides.length} Chapters)</span>
                    </button>
                  </div>
                )}
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
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[11px] font-medium text-slate-500 block">Age &amp; Status</span>
                      <span className="text-sm font-bold text-slate-900">{profile.age} yrs • {profile.maritalStatus}</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[11px] font-medium text-slate-500 block">Education</span>
                      <span className="text-xs font-bold text-slate-900 truncate block" title={profile.education}>
                        {profile.education}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[11px] font-medium text-slate-500 block">Preferred Contact</span>
                      <span className="text-sm font-bold text-slate-900 capitalize">
                        {profile.publicContact?.preferredMethod || 'WhatsApp'}
                      </span>
                    </div>
                  </div>

                  {/* Personal Proposal Message Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50/90 via-amber-50/40 to-white border border-rose-200/80 shadow-xs space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-800 uppercase tracking-wider">
                      <Quote className="w-4 h-4 text-rose-600" />
                      <span>Personal Matrimonial Proposal</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed italic">
                      "{profile.proposalMessage || profile.bio}"
                    </p>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsContactOpen(true)}
                    className="flex-1 py-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-95"
                  >
                    <Heart className="w-4 h-4 fill-white" />
                    <span>Connect &amp; View Contact Info</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsShareOpen(true)}
                    className="py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm border border-slate-200 flex items-center gap-2 transition-colors"
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

        {/* Detailed Sections */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Info Column */}
          <div className="lg:col-span-8 space-y-8">
            {/* Biography & Outlook */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4">
              <h3 className="text-xl font-bold font-serif-luxury text-slate-900">
                About {profile.fullName}
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {profile.bio}
              </p>

              {/* Tags */}
              {profile.tags && profile.tags.length > 0 && (
                <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                  {profile.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Story Mode Chapters Preview */}
            {hasStory && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block">
                      Interactive Story
                    </span>
                    <h3 className="text-xl font-bold font-serif-luxury text-slate-900">
                      {profile.story.title || 'Life in Perspective'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsStoryOpen(true)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Launch</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {profile.story.slides.map((slide, index) => (
                    <div
                      key={slide.id || index}
                      onClick={() => setIsStoryOpen(true)}
                      className="p-4 rounded-2xl bg-slate-50 hover:bg-rose-50/50 border border-slate-200/80 cursor-pointer transition-colors space-y-1.5 group"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold text-rose-600">Chapter {index + 1}</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{slide.title}</h4>
                      <p className="text-xs text-slate-600 line-clamp-2">{slide.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* In-page Ad Banner */}
            <AdBanner slotName="profile_inline" profileSlug={profile.slug} />

            {/* Network Banner (320x50) */}
            <AdsterraBanner />

            {/* Gallery if present */}
            {profile.gallery && profile.gallery.filter(Boolean).length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4">
                <h3 className="text-xl font-bold font-serif-luxury text-slate-900">
                  Portfolio Gallery
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {profile.gallery.filter(img => Boolean(img && img.trim())).map((imgUrl, i) => (
                    <img
                      key={i}
                      src={imgUrl}
                      alt={`${profile.fullName} gallery ${i + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full aspect-square object-cover rounded-2xl border border-slate-200 hover:scale-102 transition-transform cursor-pointer"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Column: Specifications & Connect Box */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Specs */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
              <h4 className="font-bold font-serif-luxury text-slate-900 text-lg">
                Key Background Attributes
              </h4>

              <dl className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-slate-500">Profession</dt>
                  <dd className="font-semibold text-slate-900 text-right">{profile.profession}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-slate-500">Education</dt>
                  <dd className="font-semibold text-slate-900 text-right max-w-[160px] truncate" title={profile.education}>
                    {profile.education}
                  </dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-slate-500">Current Residence</dt>
                  <dd className="font-semibold text-slate-900 text-right">{profile.city}, {profile.country}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-slate-500">Marital Status</dt>
                  <dd className="font-semibold text-slate-900 text-right">{profile.maritalStatus}</dd>
                </div>
                {profile.religion && (
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <dt className="text-slate-500">Beliefs / Tradition</dt>
                    <dd className="font-semibold text-slate-900 text-right">{profile.religion}</dd>
                  </div>
                )}
                {profile.height && (
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <dt className="text-slate-500">Height</dt>
                    <dd className="font-semibold text-slate-900 text-right">{profile.height}</dd>
                  </div>
                )}
                {profile.motherTongue && (
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <dt className="text-slate-500">Languages</dt>
                    <dd className="font-semibold text-slate-900 text-right">{profile.motherTongue}</dd>
                  </div>
                )}
              </dl>

              {profile.hobbies && profile.hobbies.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-2">Interests &amp; Passions</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.hobbies.map((h, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px]">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Direct Connect Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-900 to-slate-900 text-white space-y-4 shadow-lg">
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-300 uppercase tracking-wider">
                <MessageCircle className="w-4 h-4" />
                <span>Ready to Discuss?</span>
              </div>
              <h4 className="text-xl font-bold font-serif-luxury">
                Initiate a Matrimonial Introduction
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connect directly with {profile.fullName} via verified WhatsApp, telephone, or formal email proposal.
              </p>
              <button
                type="button"
                onClick={() => setIsContactOpen(true)}
                className="w-full py-3 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-rose-50 transition-colors shadow-xs"
              >
                Reveal Contact Channels
              </button>
            </div>
          </div>
        </section>

        {/* Related Candidates */}
        {relatedProfiles.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-12 border-t border-slate-200">
            <h3 className="text-2xl font-bold font-serif-luxury text-slate-900 mb-6">
              Other Verified Portfolios You May Wish to Explore
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProfiles.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
                >
                  <img
                    src={p.image || DEFAULT_AVATAR_PLACEHOLDER}
                    alt={p.fullName}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm truncate">{p.fullName}</h4>
                    <p className="text-xs text-slate-500 truncate">{p.profession}</p>
                    <p className="text-xs text-slate-400">{p.city}, {p.country}</p>
                    <Link
                      to={`/profile/${p.slug}`}
                      className="text-xs text-rose-600 font-semibold hover:underline mt-1 inline-block"
                    >
                      View Profile →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />

      {/* Story Mode Modal */}
      {hasStory && (
        <StoryViewerModal
          profile={profile}
          isOpen={isStoryOpen}
          onClose={() => setIsStoryOpen(false)}
          onOpenContact={() => setIsContactOpen(true)}
        />
      )}

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
    </div>
  );
};
