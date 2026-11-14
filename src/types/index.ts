export interface StorySlide {
  id: string;
  title: string;
  text: string;
  mediaUrl?: string;
  quote?: string;
  caption?: string;
  bgGradient?: string;
  ctaText?: string;
  ctaAction?: 'contact' | 'proposal' | 'next';
}

export interface ProfileStory {
  title: string;
  subtitle?: string;
  slides: StorySlide[];
}

export interface PublicContact {
  phone?: string;
  email?: string;
  whatsapp?: string;
  instagram?: string;
  linkedin?: string;
  website?: string;
  preferredMethod?: 'whatsapp' | 'email' | 'phone';
}

export interface Profile {
  id: string;
  slug: string;
  fullName: string;
  age: number;
  maritalStatus: 'Never Married' | 'Married' | 'Divorced' | 'Widowed' | 'Separated' | 'Single';
  city: string;
  state: string;
  country: string;
  profession: string;
  education: string;
  bio: string;
  proposalMessage: string;
  image: string;
  gallery?: string[];
  publicContact: PublicContact;
  published: boolean;
  featured?: boolean;
  verified?: boolean;
  views: number;
  story: ProfileStory;
  callVideoUrl?: string;
  tags: string[];
  religion?: string;
  height?: string;
  motherTongue?: string;
  hobbies?: string[];
  isOnline?: boolean;
  lastActiveAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdSlot {
  id: string;
  slotName: 'header_banner' | 'profile_inline' | 'story_sponsor' | 'footer_banner';
  enabled: boolean;
  title: string;
  description: string;
  sponsorName: string;
  linkUrl: string;
  imageUrl?: string;
  ctaText: string;
  badgeText?: string;
}

export interface NetworkAdSettings {
  popunder: boolean;
  socialBar: boolean;
  banner: boolean;
}

export interface AdvertisingSettings {
  slots: AdSlot[];
  ads?: NetworkAdSettings;
  updatedAt: string;
}

export interface TelemetryEvent {
  id?: string;
  type: 'page_view' | 'story_open' | 'story_complete' | 'contact_click' | 'ad_click';
  profileSlug?: string;
  metadata?: Record<string, any>;
  timestamp: string;
  userAgent?: string;
}

export interface AnalyticsSummary {
  totalViews: number;
  totalStoryViews: number;
  totalContactClicks: number;
  totalAdClicks: number;
  popularProfiles: Array<{
    id: string;
    slug: string;
    fullName: string;
    views: number;
  }>;
  recentEvents: TelemetryEvent[];
}

export const DEFAULT_AVATAR_PLACEHOLDER = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80';

/**
 * Determines whether a candidate profile is published and approved (Active),
 * strictly excluding draft, unpublished, suspended, or disabled profiles.
 * Note: This reflects published profile availability, not real-time user presence.
 */
export function isProfileActive(profile?: Profile | null): boolean {
  if (!profile || profile.published !== true) return false;
  const extended = profile as Profile & {
    approved?: boolean;
    disabled?: boolean;
    suspended?: boolean;
    status?: string;
    moderationStatus?: string;
  };
  if (extended.approved === false || extended.disabled === true || extended.suspended === true) {
    return false;
  }
  const normalizedStatus = (extended.moderationStatus || extended.status || '').toLowerCase().trim();
  if (
    normalizedStatus &&
    ['draft', 'unpublished', 'suspended', 'disabled', 'archived', 'rejected', 'inactive'].includes(
      normalizedStatus
    )
  ) {
    return false;
  }
  return true;
}

