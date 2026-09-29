import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Briefcase, GraduationCap, ShieldCheck, Sparkles, MessageCircle, Phone } from 'lucide-react';
import { Profile, DEFAULT_AVATAR_PLACEHOLDER } from '../types';

interface ProfileCardProps {
  profile: Profile;
  onOpenContact?: (profile: Profile) => void;
  onOpenMessage?: (profile: Profile) => void;
  onOpenVideoCall?: (profile: Profile) => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  onOpenContact,
  onOpenMessage,
  onOpenVideoCall,
}) => {
  return (
    <div className="group bg-zinc-900/95 rounded-3xl border border-white/10 hover:border-pink-500/40 shadow-xl hover:shadow-[0_0_30px_rgba(244,63,94,0.18)] transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Top Image & Visual Header */}
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />

        {/* Badges Top Row */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5">
            {profile.verified !== false && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/75 text-emerald-400 border border-emerald-500/30 backdrop-blur-md flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Verified
              </span>
            )}
            {profile.featured && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-sm flex items-center gap-1">
                <Sparkles className="w-3 h-3 fill-white" />
                Featured
              </span>
            )}
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/75 text-slate-200 border border-white/10 backdrop-blur-md">
            {profile.age} yrs • {profile.maritalStatus}
          </span>
        </div>

        {/* Candidate Name & City Overlay */}
        <div className="absolute bottom-3 left-3 right-4 z-10 text-white">
          <h3 className="text-xl font-bold font-serif-luxury leading-tight drop-shadow-sm truncate group-hover:text-pink-300 transition-colors">
            {profile.fullName}
          </h3>
          <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5 drop-shadow-sm">
            <MapPin className="w-3 h-3 text-pink-400 shrink-0" />
            <span className="truncate">{profile.city}, {profile.country}</span>
          </p>
        </div>
      </Link>

      {/* Body Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        {/* Core Attributes */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs text-slate-200">
            <Briefcase className="w-3.5 h-3.5 text-pink-400 shrink-0" />
            <span className="font-semibold truncate">{profile.profession}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <GraduationCap className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{profile.education}</span>
          </div>

          {/* Proposal Message Snippet */}
          <div className="mt-3 p-3 rounded-2xl bg-zinc-950/70 border border-white/5 text-xs text-slate-300 leading-relaxed italic line-clamp-2">
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
        <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-2.5">
          {onOpenMessage && (
            <button
              type="button"
              onClick={() => onOpenMessage(profile)}
              className="w-full py-2.5 px-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white border border-zinc-700/80 hover:border-pink-500/50 hover:shadow-[0_0_16px_rgba(244,63,94,0.22)] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              title={`Message ${profile.fullName}`}
              aria-label={`Message ${profile.fullName}`}
            >
              <MessageCircle className="w-4 h-4 text-pink-500 fill-pink-500/20 shrink-0" />
              <span>Message</span>
            </button>
          )}

          {onOpenVideoCall || onOpenContact ? (
            <button
              type="button"
              onClick={() => onOpenVideoCall ? onOpenVideoCall(profile) : onOpenContact?.(profile)}
              className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:via-pink-600 hover:to-rose-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-950/30 active:scale-95 cursor-pointer"
              title={`Call ${profile.fullName}`}
              aria-label={`Call ${profile.fullName}`}
            >
              <Phone className="w-3.5 h-3.5 fill-white text-white shrink-0" />
              <span>Call Me</span>
            </button>
          ) : (
            <Link
              to={`/profile/${profile.slug}`}
              className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:via-pink-600 hover:to-rose-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-950/30 active:scale-95"
            >
              <Phone className="w-3.5 h-3.5 fill-white text-white shrink-0" />
              <span>Call Me</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
