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
  return (
    <div className="group bg-zinc-900/95 rounded-3xl border border-white/10 hover:border-pink-500/40 shadow-xl hover:shadow-[0_0_30px_rgba(244,63,94,0.18)] transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Top Image & Visual Header with strict 4:5 aspect ratio */}
      <Link
        to={`/profile/${profile.slug}`}
        className="block relative aspect-[4/5] w-full overflow-hidden bg-zinc-950 cursor-pointer"
      >
        <img
          src={profile.image || DEFAULT_AVATAR_PLACEHOLDER}
          alt={profile.fullName}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Dark Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10 pointer-events-none" />

        {/* Badges Top Row: Responsive single-row layout preventing collision on 360px-430px */}
        <div className="absolute top-2.5 sm:top-3 inset-x-2.5 sm:inset-x-3 flex items-center justify-between gap-1.5 z-10 pointer-events-none">
          {/* Left Badges */}
          <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto shrink min-w-0">
            {profile.verified !== false && (
              <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-zinc-950/90 text-emerald-400 border border-emerald-500/40 flex items-center gap-1 shadow-md whitespace-nowrap shrink-0">
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Verified</span>
              </span>
            )}
            {profile.featured && (
              <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md flex items-center gap-1 whitespace-nowrap shrink-0">
                <Sparkles className="w-2.5 h-2.5 fill-white shrink-0" />
                <span>Featured</span>
              </span>
            )}
          </div>

          {/* Right Badge: Age & Marital Status */}
          <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-zinc-950/90 text-slate-200 border border-white/15 pointer-events-auto shadow-md whitespace-nowrap">
            {profile.age} yrs • {profile.maritalStatus}
          </span>
        </div>

        {/* Candidate Bottom Overlay: Name & Location + Story & Video Call Ready Badges */}
        <div className="absolute bottom-2.5 sm:bottom-3 inset-x-2.5 sm:inset-x-3 z-10 text-white flex flex-col gap-1.5 pointer-events-none">
          {/* Name & City */}
          <div className="pointer-events-auto">
            <h3 className="text-lg sm:text-xl font-bold font-serif-luxury leading-tight drop-shadow-md truncate group-hover:text-pink-300 transition-colors">
              {profile.fullName}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-300 flex items-center gap-1 mt-0.5 drop-shadow-sm truncate">
              <MapPin className="w-3 h-3 text-pink-400 shrink-0" />
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
                className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-medium bg-black/65 hover:bg-black/85 text-rose-200 hover:text-white border border-rose-400/35 backdrop-blur-md flex items-center gap-1 sm:gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95 shrink-0"
                title="Tap to view her story"
                aria-label={`Tap to view ${profile.fullName}'s story`}
              >
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-300 fill-rose-300/30 shrink-0" />
                <span className="truncate">Tap to view her story</span>
              </button>
            ) : (
              <span />
            )}

            {/* Bottom-right: Video Call Ready badge */}
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
            <Briefcase className="w-3.5 h-3.5 text-pink-400 shrink-0" />
            <span className="font-semibold truncate">{profile.profession}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <GraduationCap className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{profile.education}</span>
          </div>

          {/* Proposal Message Snippet */}
          <div className="mt-2.5 sm:mt-3 p-3 rounded-2xl bg-zinc-950/70 border border-white/5 text-xs text-slate-300 leading-relaxed italic line-clamp-2">
            "{profile.proposalMessage || profile.bio}"
          </div>
        </div>

        {/* Tags */}
        {profile.tags && profile.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {profile.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-800 border border-white/5 text-slate-300"
              >
                #{tag}
              </span>
            ))}
            {profile.tags.length > 3 && (
              <span className="px-1.5 py-0.5 text-[10px] text-slate-500">
                +{profile.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Footer actions: Matching [ Message ] [ Call Me ] Button Pair */}
        <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-2 sm:gap-2.5">
          {onOpenMessage && (
            <button
              type="button"
              onClick={() => onOpenMessage(profile)}
              className="w-full py-2.5 px-2 sm:px-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white border border-zinc-700/80 hover:border-pink-500/50 hover:shadow-[0_0_16px_rgba(244,63,94,0.22)] text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-95 cursor-pointer truncate"
              title={`Message ${profile.fullName}`}
              aria-label={`Message ${profile.fullName}`}
            >
              <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-500 fill-pink-500/20 shrink-0" />
              <span className="truncate">Message</span>
            </button>
          )}

          {onOpenVideoCall || onOpenContact ? (
            <button
              type="button"
              onClick={() => onOpenVideoCall ? onOpenVideoCall(profile) : onOpenContact?.(profile)}
              className="w-full py-2.5 px-2 sm:px-3 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:via-pink-600 hover:to-rose-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all shadow-md shadow-rose-950/30 active:scale-95 cursor-pointer truncate"
              title={`Call ${profile.fullName}`}
              aria-label={`Call ${profile.fullName}`}
            >
              <Phone className="w-3.5 h-3.5 fill-white text-white shrink-0" />
              <span className="truncate">Call Me</span>
            </button>
          ) : (
            <Link
              to={`/profile/${profile.slug}`}
              className="w-full py-2.5 px-2 sm:px-3 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:via-pink-600 hover:to-rose-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all shadow-md shadow-rose-950/30 active:scale-95 truncate"
            >
              <Phone className="w-3.5 h-3.5 fill-white text-white shrink-0" />
              <span className="truncate">Call Me</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
