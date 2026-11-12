import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Briefcase, GraduationCap, ShieldCheck, Sparkles, MessageCircle, Phone, Video } from 'lucide-react';
import { Profile, DEFAULT_AVATAR_PLACEHOLDER } from '../types';

interface ProfileCardProps {
  profile: Profile;
  onOpenContact?: (profile: Profile) => void;
  onOpenMessage?: (profile: Profile) => void;
  onOpenVideoCall?: (profile: Profile) => void;
  onOpenStory?: (profile: Profile) => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  onOpenContact,
  onOpenMessage,
  onOpenVideoCall,
  onOpenStory,
}) => {
  // Clean full name display: ensure names like "Dr." or incomplete strings fallback properly
  const displayName = profile.fullName && profile.fullName.trim().length > 3
    ? profile.fullName.trim()
    : (profile.fullName?.trim() || 'Candidate Portfolio');

  return (
    <div className="group bg-[#090e1a]/95 rounded-3xl border border-amber-200/15 hover:border-amber-300/40 shadow-xl hover:shadow-[0_12px_36px_rgba(0,0,0,0.55)] transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Top Image & Visual Header with strict 4:5 aspect ratio */}
      <Link
        to={`/profile/${profile.slug}`}
        className="block relative aspect-[4/5] w-full overflow-hidden bg-[#050811] cursor-pointer"
      >
        <img
          src={profile.image || DEFAULT_AVATAR_PLACEHOLDER}
          alt={displayName}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
        />

        {/* Midnight Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090e1a] via-[#090e1a]/30 to-black/20 pointer-events-none" />

        {/* Badges Top Row */}
        <div className="absolute top-2.5 sm:top-3 inset-x-2.5 sm:inset-x-3 flex items-center justify-between gap-1.5 z-10 pointer-events-none">
          {/* Left Badges */}
          <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto shrink min-w-0">
            {profile.featured && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-amber-500/20 text-amber-200 border border-amber-400/40 backdrop-blur-md shadow-md flex items-center gap-1 whitespace-nowrap shrink-0">
                <Sparkles className="w-2.5 h-2.5 text-amber-300 fill-amber-300/30 shrink-0" />
                <span>Featured</span>
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-[#050811]/85 text-slate-300 border border-white/10 backdrop-blur-md flex items-center gap-1 whitespace-nowrap shrink-0">
              <ShieldCheck className="w-3 h-3 text-amber-300/80 shrink-0" />
              <span>Private</span>
            </span>
            {profile.isOnline && (
              <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-[#050811]/90 text-emerald-300 border border-emerald-400/30 backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
                <span>Active</span>
              </span>
            )}
          </div>

          {/* Right Badge: Age & Marital Status */}
          <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-[#050811]/90 text-amber-100/90 border border-amber-200/20 pointer-events-auto shadow-md whitespace-nowrap backdrop-blur-md">
            {profile.age} yrs • {profile.maritalStatus}
          </span>
        </div>

        {/* Candidate Bottom Overlay: Name & Location + Story & Video Call Ready Badges */}
        <div className="absolute bottom-2.5 sm:bottom-3 inset-x-2.5 sm:inset-x-3 z-10 text-white flex flex-col gap-1.5 pointer-events-none">
          {/* Name & City */}
          <div className="pointer-events-auto">
            <h3 className="text-lg sm:text-xl font-bold font-serif-luxury leading-tight text-white drop-shadow-md truncate group-hover:text-amber-200 transition-colors">
              {displayName}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-300 flex items-center gap-1 mt-0.5 drop-shadow-sm truncate">
              <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate">{profile.city}, {profile.country}</span>
            </p>
          </div>

          {/* Bottom Badges Row: Story on Left & Video Call Ready on Right */}
          <div className="flex items-center justify-between gap-1.5 pt-0.5 pointer-events-auto">
            {/* Bottom-left: Tap to view her story (where available) */}
            {profile.story?.slides && profile.story.slides.length > 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenStory?.(profile);
                }}
                className="px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-medium bg-[#050811]/85 hover:bg-black text-amber-200 hover:text-white border border-amber-300/30 backdrop-blur-md flex items-center gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95 shrink-0"
                title="View candidate story"
                aria-label={`View ${displayName}'s story`}
              >
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-300 fill-amber-300/30 shrink-0" />
                <span className="truncate">Story Portfolio</span>
              </button>
            ) : (
              <span />
            )}

            {/* Bottom-right: Video Call Ready badge (rose-pink pill with small camera icon) */}
            <span
              className="ml-auto px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white border border-white/20 shadow-md shadow-pink-950/40 flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0"
              title="Video Call Ready"
            >
              <Video className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white fill-white/20 shrink-0" />
              <span className="leading-none">Video Call Ready</span>
            </span>
          </div>
        </div>
      </Link>

      {/* Body Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        {/* Core Attributes */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-200">
            <Briefcase className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="font-semibold text-slate-100 truncate">{profile.profession}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <GraduationCap className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{profile.education}</span>
          </div>

          {/* Proposal / Introduction Statement */}
          <div className="mt-2.5 p-3 rounded-2xl bg-[#050811]/80 border border-white/5 text-xs text-slate-300 leading-relaxed italic line-clamp-2">
            "{profile.proposalMessage || profile.bio}"
          </div>
        </div>

        {/* Tags */}
        {profile.tags && profile.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {profile.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#11192d] border border-amber-200/10 text-slate-300"
              >
                #{tag}
              </span>
            ))}
            {profile.tags.length > 3 && (
              <span className="px-1.5 py-0.5 text-[10px] text-slate-500">
                +{profile.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer Actions: [ View Profile ] primary + [ Message ] & [ Call ] options */}
        <div className="pt-3 border-t border-white/10 space-y-2">
          <Link
            to={`/profile/${profile.slug}`}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#17223b] to-[#1e2d4d] hover:from-[#213054] hover:to-[#2b3e6b] text-amber-200 hover:text-white border border-amber-300/30 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98"
          >
            <span>View Full Profile</span>
            <span className="text-amber-300 font-serif-luxury text-sm">→</span>
          </Link>

          <div className="grid grid-cols-2 gap-2">
            {onOpenMessage && (
              <button
                type="button"
                onClick={() => onOpenMessage(profile)}
                className="w-full py-2 px-2 rounded-xl bg-[#050811] hover:bg-[#0f172a] text-slate-200 border border-white/10 text-[11px] sm:text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer truncate"
                title={`Send inquiry to ${displayName}`}
              >
                <MessageCircle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="truncate">Inquire</span>
              </button>
            )}

            {onOpenVideoCall ? (
              <button
                type="button"
                onClick={() => onOpenVideoCall(profile)}
                className="w-full py-2 px-2 rounded-xl bg-[#050811] hover:bg-[#0f172a] text-slate-200 border border-white/10 text-[11px] sm:text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer truncate"
                title={`Call ${displayName}`}
              >
                <Phone className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="truncate">Call Me</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
