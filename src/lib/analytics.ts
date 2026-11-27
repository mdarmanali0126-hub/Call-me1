const VISITOR_STORAGE_KEY = 'call_me_visitor_v1';

let hasCheckedReturningVisitorInSession = false;

export type SearchSource = 'hero' | 'modal' | 'header' | 'other';
export type CarouselName = 'featured_hero' | 'people_worth_discovering' | 'featured_spotlight';
export type CarouselAction = 'next' | 'previous' | 'dot_select' | 'candidate_select';
export type MessageSource = 'candidate_card' | 'hero' | 'spotlight' | 'profile_detail';
export type CallSource = 'candidate_card' | 'carousel' | 'spotlight' | 'profile_detail' | 'chat_modal';
export type ScrollPageType = 'home' | 'profile';

function sendGtagEvent(eventName: string, params?: Record<string, unknown>): void {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', eventName, params || {});
    }
  } catch {
    // Analytics must never interrupt user experience
  }
}

export const logPageView = (path: string): void => {
  sendGtagEvent('page_view', {
    page_path: path,
  });
};

export const logEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
): void => {
  sendGtagEvent(action, {
    event_category: category,
    event_label: label,
    value,
  });
};

export const logProfileView = (params: {
  profileSlug: string;
  profession?: string;
  country?: string;
  isFeatured?: boolean;
}): void => {
  if (!params.profileSlug) return;
  sendGtagEvent('profile_view', {
    profile_slug: params.profileSlug,
    profession: params.profession || 'unknown',
    country: params.country || 'unknown',
    is_featured: Boolean(params.isFeatured),
  });
};

export const logProfileDuration = (params: {
  profileSlug: string;
  durationSeconds: number;
}): void => {
  if (
    !params.profileSlug ||
    !Number.isFinite(params.durationSeconds) ||
    params.durationSeconds < 2
  ) {
    return;
  }
  sendGtagEvent('profile_view_duration', {
    profile_slug: params.profileSlug,
    duration_seconds: Math.round(params.durationSeconds),
  });
};

export const logSearch = (params: {
  searchTerm: string;
  searchSource: SearchSource;
  resultsCount: number;
}): void => {
  const term = params.searchTerm.trim();
  if (!term) return;
  sendGtagEvent('search', {
    search_term: term,
    search_source: params.searchSource,
    results_count: Math.max(0, params.resultsCount),
  });
};

export const logFilterUsed = (params: {
  filterType: 'category' | 'location' | 'profession' | 'marital_status' | 'reset';
  filterValue: string;
  resultsCount: number;
}): void => {
  sendGtagEvent('filter_used', {
    filter_type: params.filterType,
    filter_value: params.filterValue,
    results_count: Math.max(0, params.resultsCount),
  });
};

export const logCarouselInteraction = (params: {
  carouselName: CarouselName;
  action: CarouselAction;
  targetSlug?: string;
}): void => {
  sendGtagEvent('carousel_interaction', {
    carousel_name: params.carouselName,
    action: params.action,
    target_slug: params.targetSlug || '',
  });
};

export const logMessageOpened = (params: {
  profileSlug: string;
  source: MessageSource;
}): void => {
  if (!params.profileSlug) return;
  sendGtagEvent('message_opened', {
    profile_slug: params.profileSlug,
    source: params.source,
  });
};

export const logCallStarted = (params: {
  profileSlug: string;
  source: CallSource;
  limitBlocked: boolean;
}): void => {
  if (!params.profileSlug) return;
  sendGtagEvent('call_started', {
    profile_slug: params.profileSlug,
    source: params.source,
    limit_blocked: Boolean(params.limitBlocked),
  });
};

export const logScrollDepth = (params: {
  pageType: ScrollPageType;
  percentScrolled: 25 | 50 | 75 | 90;
}): void => {
  sendGtagEvent('scroll_depth', {
    page_type: params.pageType,
    percent_scrolled: params.percentScrolled,
  });
};

let lastRecentlyViewedSlug = '';
let lastRecentlyViewedTime = 0;

export const logRecentlyViewed = (params: {
  profileSlug: string;
  historyCount: number;
  isRevisit?: boolean;
}): void => {
  const slug = params.profileSlug.trim();
  if (!slug) return;

  const now = Date.now();
  // Prevent duplicate firing from React Strict Mode double-mount or rapid rerenders
  if (slug === lastRecentlyViewedSlug && now - lastRecentlyViewedTime < 2000) {
    return;
  }
  lastRecentlyViewedSlug = slug;
  lastRecentlyViewedTime = now;

  sendGtagEvent('recently_viewed', {
    profile_slug: slug,
    history_count: Math.max(1, params.historyCount),
    is_revisit: Boolean(params.isRevisit),
  });
};

interface VisitorRecord {
  first_seen: string;
  visit_count: number;
  last_seen: string;
}

export const logReturningVisitor = (): void => {
  if (typeof window === 'undefined' || hasCheckedReturningVisitorInSession) return;
  hasCheckedReturningVisitorInSession = true;

  try {
    const nowIso = new Date().toISOString();
    const raw = window.localStorage.getItem(VISITOR_STORAGE_KEY);

    if (!raw) {
      const initial: VisitorRecord = {
        first_seen: nowIso,
        visit_count: 1,
        last_seen: nowIso,
      };
      window.localStorage.setItem(VISITOR_STORAGE_KEY, JSON.stringify(initial));
      return;
    }

    const parsed = JSON.parse(raw) as Partial<VisitorRecord>;
    const firstSeen =
      typeof parsed?.first_seen === 'string' && parsed.first_seen
        ? parsed.first_seen
        : nowIso;
    const prevCount =
      typeof parsed?.visit_count === 'number' && Number.isFinite(parsed.visit_count)
        ? Math.max(1, Math.floor(parsed.visit_count))
        : 1;
    const nextCount = prevCount + 1;

    const updated: VisitorRecord = {
      first_seen: firstSeen,
      visit_count: nextCount,
      last_seen: nowIso,
    };
    window.localStorage.setItem(VISITOR_STORAGE_KEY, JSON.stringify(updated));

    const firstMs = new Date(firstSeen).getTime();
    const daysSinceFirst = Number.isFinite(firstMs)
      ? Math.max(0, Math.floor((Date.now() - firstMs) / (1000 * 60 * 60 * 24)))
      : 0;

    sendGtagEvent('returning_visitor', {
      visit_count: nextCount,
      days_since_first_seen: daysSinceFirst,
    });
  } catch {
    // Gracefully ignore unavailable localStorage (e.g., private browsing restrictions)
  }
};
