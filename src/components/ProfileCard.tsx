import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Briefcase, GraduationCap, Play, Eye, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import { Profile, DEFAULT_AVATAR_PLACEHOLDER } from '../types';

interface ProfileCardProps {
  profile: Profile;
  onOpenStory: (profile: Profile) => void;
  onOpenContact?: (profile: Profile) => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onOpenStory, onOpenContact }) => {
  const hasStory = profile.story && profile.story.slides && profile.story.slides.length > 0;

  return (
    <div className="group bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Top Image & Visual Header */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-100">
        <img
          src={profile.image || DEFAULT_AVATAR_PLACEHOLDER}
          alt={profile.fullName}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Gradient scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Badges Top Row */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5">
            {profile.verified !== false && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-slate-900 shadow-sm backdrop-blur-md flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified
              </span>
            )}

            {profile.featured && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-sm flex items-center gap-1">
                <Sparkles className="w-3 h-3 fill-white" />
                Featured
              </span>
            )}
          </div>

          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/60 text-white backdrop-blur-md">
            {profile.age} yrs • {profile.maritalStatus}
          </span>
        </div>

        {/* Story Button Overlay (Bottom Right of Image) */}
        {hasStory && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenStory(profile);
            }}
            className="absolute bottom-3 right-3 z-10 px-3 py-1.5 rounded-full bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-rose-900/30 flex items-center gap-1.5 backdrop-blur-md transform hover:scale-105 active:scale-95 transition-all"
            title="Watch Story Mode"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            <Play className="w-3 h-3 fill-white text-white" />
            <span>Story Mode</span>
          </button>
        )}

        {/* Candidate Name & City Overlay */}
        <div className="absolute bottom-3 left-3 right-24 z-10 text-white">
          <h3 className="text-xl font-bold font-serif-luxury leading-tight drop-shadow-sm truncate">
            {profile.fullName}
          </h3>
          <p className="text-xs text-slate-200 flex items-center gap-1 mt-0.5 drop-shadow-sm">
            <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
            <span className="truncate">{profile.city}, {profile.country}</span>
          </p>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        {/* Core Attributes */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <Briefcase className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="font-semibold truncate">{profile.profession}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{profile.education}</span>
          </div>

          {/* Proposal Message Snippet */}
          <div className="mt-3 p-3 rounded-2xl bg-rose-50/70 border border-rose-100 text-xs text-slate-700 leading-relaxed italic line-clamp-2">
            "{profile.proposalMessage || profile.bio}"
          </div>
        </div>

        {/* Tags */}
        {profile.tags && profile.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {profile.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600"
              >
                #{tag}
              </span>
            ))}
            {profile.tags.length > 3 && (
              <span className="px-1.5 py-0.5 text-[10px] text-slate-400">
                +{profile.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Footer actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Eye className="w-3.5 h-3.5" />
            <span>{profile.views || 0} views</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenContact && (
              <button
                type="button"
                onClick={() => onOpenContact(profile)}
                className="p-2 rounded-xl text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors"
                title="Connect directly"
              >
                <Heart className="w-4 h-4 fill-rose-100" />
              </button>
            )}

            <Link
              to={`/profile/${profile.slug}`}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              View Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
