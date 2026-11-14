import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Briefcase,
  Sparkles,
  MessageCircle,
  Phone,
  Video,
  ArrowRight,
  User,
} from 'lucide-react';
import { Profile, DEFAULT_AVATAR_PLACEHOLDER, isProfileActive } from '../types';

interface ProfileCardProps {
  profile: Profile;
  isActive?: boolean;
  isOnline?: boolean;
  onOpenContact?: (profile: Profile) => void;
  onOpenMessage?: (profile: Profile) => void;
  onOpenVideoCall?: (profile: Profile) => void;
  onOpenStory?: (profile: Profile) => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  isActive: isActiveProp,
  onOpenContact,
  onOpenMessage,
  onOpenVideoCall,
  onOpenStory,
}) => {
  const displayName =
    profile.fullName && profile.fullName.trim().length > 0
      ? profile.fullName.trim()
      : 'Candidate Portfolio';

  const isActive = typeof isActiveProp === 'boolean' ? isActiveProp : isProfileActive(profile);
  const hasStory = Boolean(profile.story?.slides && profile.story.slides.length > 0);

  return (
    <article
      data-profile-id={profile.id}
      className="group bg-[#111114] hover:bg-[#141418] rounded-2xl border border-[#232329] hover:border-[#FF2878]/50 transition-all duration-200 flex flex-col overflow-hidden relative"
    >
      {/* 1. Candidate Portrait (Consistent 4:5 Aspect Ratio with object-top face framing) */}
      <Link
        to={`/profile/${profile.slug}`}
        className="block relative aspect-[4/5] w-full overflow-hidden bg-[#08080A] cursor-pointer"
        aria-label={`View ${displayName}'s full profile`}
      >
        <img
          src={profile.image || DEFAULT_AVATAR_PLACEHOLDER}
          alt={displayName}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-500 ease-out"
        />

        <span className="sr-only">
          <User className="w-6 h-6" />
        </span>

        {/* Measured Subtle Contrast Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111114]/90 via-transparent to-black/25 pointer-events-none" />

        {/* Top Overlays: Featured / Active Published Profile Status */}
        <div className="absolute top-2 sm:top-3 inset-x-2 sm:inset-x-3 flex items-center justify-between gap-1.5 z-10 pointer-events-none">
          <div className="flex items-center gap-1 min-w-0">
            {profile.featured && (
              <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-semibold bg-[#09090B]/85 text-white border border-[#FF2878]/45 backdrop-blur-md flex items-center gap-1 whitespace-nowrap shrink-0">
                <Sparkles className="w-2.5 h-2.5 text-[#FF2878] shrink-0" />
                <span>Featured</span>
              </span>
            )}
            {isActive && (
              <span
                className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-semibold bg-[#09090B]/85 text-[#00D084] border border-[#00D084]/40 backdrop-blur-md flex items-center gap-1 whitespace-nowrap shrink-0"
                title="Active published profile"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D084] shadow-[0_0_6px_rgba(0,208,132,0.75)]" />
                <span>Active</span>
              </span>
            )}
          </div>
        </div>

        {/* Bottom Portrait Controls: Story Trigger (left) & Video Call Ready Pill (right) */}
        <div className="absolute bottom-2 sm:bottom-3 inset-x-2 sm:inset-x-3 z-10 flex items-center justify-between gap-1.5 pointer-events-auto">
          {hasStory ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenStory?.(profile);
              }}
              className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-medium bg-[#09090B]/90 hover:bg-black text-white border border-[#2A2A32] hover:border-[#8B5CF6] backdrop-blur-md flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="Tap to view her story"
              aria-label={`View ${displayName}'s story`}
            >
              <Sparkles className="w-2.5 h-2.5 text-[#8B5CF6] shrink-0" />
              <span className="sm:hidden">Story</span>
              <span className="hidden sm:inline">Tap to view story</span>
            </button>
          ) : (
            <span />
          )}

          <span
            className="ml-auto px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-semibold bg-gradient-to-r from-[#FF2878] to-[#8B5CF6] text-white shadow-sm flex items-center gap-1 whitespace-nowrap shrink-0 pointer-events-none"
            title="Video Call Ready"
          >
            <Video className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white shrink-0" />
            <span>Video Call Ready</span>
          </span>
        </div>
      </Link>

      {/* Card Body: Compact 2-Column Mobile Hierarchy + Prominent Side-by-Side Action Buttons */}
      <div className="p-2.5 min-[390px]:p-3 sm:p-4 flex-1 flex flex-col justify-between gap-2.5 sm:gap-3.5">
        <div className="space-y-1 sm:space-y-1.5 min-w-0">
          {/* 2. Candidate Name & Age */}
          <h3 className="text-sm min-[390px]:text-[15px] sm:text-[17px] font-bold text-white leading-snug truncate">
            <Link
              to={`/profile/${profile.slug}`}
              className="hover:text-[#FF4D8D] transition-colors inline-flex items-baseline gap-1 sm:gap-1.5 max-w-full"
            >
              <span className="truncate">{displayName}</span>
              <span className="text-xs sm:text-sm font-semibold text-[#A5A5B5] tabular-nums shrink-0">
                {profile.age}
              </span>
            </Link>
          </h3>

          {/* 3. Location */}
          <p className="text-[11px] sm:text-xs text-[#B8B8C6] flex items-center gap-1 sm:gap-1.5 truncate">
            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#FF2878] shrink-0" />
            <span className="truncate">
              {profile.city}, {profile.country}
            </span>
          </p>

          {/* 4. Profession */}
          <p className="text-[11px] sm:text-xs text-white font-medium flex items-center gap-1 sm:gap-1.5 truncate">
            <Briefcase className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#8B5CF6] shrink-0" />
            <span className="truncate">{profile.profession}</span>
          </p>

          {/* 5. Other Relevant Profile Information */}
          <p className="text-[11px] sm:text-xs text-[#9A9AA8] truncate pt-0.5">
            {profile.maritalStatus}
            {profile.education ? ` · ${profile.education}` : ''}
          </p>
        </div>

        {/* 6. Always-Visible Equal-Width Side-by-Side Call & Message Actions */}
        <div className="pt-2.5 sm:pt-3 border-t border-[#232329] space-y-1.5 sm:space-y-2">
          <div className="grid grid-cols-2 gap-1.5 min-[390px]:gap-2 sm:gap-2.5 w-full">
            <button
              type="button"
              onClick={() => {
                if (onOpenVideoCall) {
                  onOpenVideoCall(profile);
                } else if (onOpenContact) {
                  onOpenContact(profile);
                }
              }}
              className="w-full min-h-[44px] h-[44px] sm:h-[46px] px-1.5 sm:px-3 rounded-xl bg-gradient-to-r from-[#FF2878] to-[#E11D62] hover:brightness-110 active:scale-[0.97] text-white text-[11px] min-[390px]:text-xs sm:text-[13px] font-semibold flex items-center justify-center gap-1 sm:gap-1.5 shadow-sm transition-all duration-150 cursor-pointer min-w-0 whitespace-nowrap"
              aria-label={`Call ${displayName}`}
              title={`Call ${displayName}`}
            >
              <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0" />
              <span>Call</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onOpenMessage) {
                  onOpenMessage(profile);
                } else if (onOpenContact) {
                  onOpenContact(profile);
                }
              }}
              className="w-full min-h-[44px] h-[44px] sm:h-[46px] px-1.5 sm:px-3 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] hover:brightness-110 active:scale-[0.97] text-white text-[11px] min-[390px]:text-xs sm:text-[13px] font-semibold flex items-center justify-center gap-1 sm:gap-1.5 shadow-sm transition-all duration-150 cursor-pointer min-w-0 whitespace-nowrap"
              aria-label={`Message ${displayName}`}
              title={`Message ${displayName}`}
            >
              <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0" />
              <span>Message</span>
            </button>
          </div>

          <Link
            to={`/profile/${profile.slug}`}
            className="w-full py-1 text-[11px] sm:text-xs font-medium text-[#9A9AA8] hover:text-white flex items-center justify-center gap-1 transition-colors"
          >
            <span>View Profile</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
          </Link>
        </div>
      </div>
    </article>
  );
};
