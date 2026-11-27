import { Profile, isProfileActive } from '../types';

export const RECENTLY_VIEWED_STORAGE_KEY = 'call_me_recently_viewed_v1';
export const RECENTLY_VIEWED_UPDATED_EVENT = 'call_me_recently_viewed_updated';
export const MAX_RECENTLY_VIEWED = 10;

export interface RecentlyViewedEntry {
  slug: string;
  viewedAt: number;
}

export interface RecordRecentlyViewedResult {
  recorded: boolean;
  isRevisit: boolean;
  entries: RecentlyViewedEntry[];
}

function dispatchRecentlyViewedUpdate(entries: RecentlyViewedEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(
      new CustomEvent<RecentlyViewedEntry[]>(RECENTLY_VIEWED_UPDATED_EVENT, {
        detail: entries,
      })
    );
  } catch {
    // Ignore dispatch errors in constrained environments
  }
}

function sanitizeEntries(raw: unknown): {
  entries: RecentlyViewedEntry[];
  needsRepair: boolean;
} {
  if (!Array.isArray(raw)) {
    return { entries: [], needsRepair: true };
  }

  let needsRepair = false;
  const deduped = new Map<string, RecentlyViewedEntry>();

  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      needsRepair = true;
      continue;
    }

    const record = item as Partial<RecentlyViewedEntry>;
    const slug = typeof record.slug === 'string' ? record.slug.trim() : '';
    const viewedAt =
      typeof record.viewedAt === 'number' && Number.isFinite(record.viewedAt) && record.viewedAt > 0
        ? record.viewedAt
        : null;

    if (!slug || viewedAt === null) {
      needsRepair = true;
      continue;
    }

    const existing = deduped.get(slug);
    if (existing) {
      needsRepair = true;
      if (viewedAt > existing.viewedAt) {
        deduped.set(slug, { slug, viewedAt });
      }
    } else {
      deduped.set(slug, { slug, viewedAt });
    }
  }

  const sorted = Array.from(deduped.values()).sort((a, b) => b.viewedAt - a.viewedAt);
  if (sorted.length > MAX_RECENTLY_VIEWED) {
    needsRepair = true;
  }

  return {
    entries: sorted.slice(0, MAX_RECENTLY_VIEWED),
    needsRepair,
  };
}

function writeEntries(entries: RecentlyViewedEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      RECENTLY_VIEWED_STORAGE_KEY,
      JSON.stringify(entries.slice(0, MAX_RECENTLY_VIEWED))
    );
  } catch {
    // Gracefully ignore unavailable or quota-exceeded localStorage
  }
}

export function getRecentlyViewedEntries(): RecentlyViewedEntry[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    const { entries, needsRepair } = sanitizeEntries(parsed);
    if (needsRepair) {
      writeEntries(entries);
    }
    return entries;
  } catch {
    // Malformed JSON or unavailable localStorage: safely recover without crashing
    try {
      window.localStorage.removeItem(RECENTLY_VIEWED_STORAGE_KEY);
    } catch {
      // Ignore storage cleanup error
    }
    return [];
  }
}

export function recordRecentlyViewed(
  profile: Profile | null | undefined,
  viewedAt: number = Date.now()
): RecordRecentlyViewedResult {
  if (!profile || !isProfileActive(profile)) {
    return {
      recorded: false,
      isRevisit: false,
      entries: getRecentlyViewedEntries(),
    };
  }

  const normalizedSlug = typeof profile.slug === 'string' ? profile.slug.trim() : '';
  if (!normalizedSlug) {
    return {
      recorded: false,
      isRevisit: false,
      entries: getRecentlyViewedEntries(),
    };
  }

  const safeTimestamp =
    typeof viewedAt === 'number' && Number.isFinite(viewedAt) && viewedAt > 0
      ? viewedAt
      : Date.now();

  const existing = getRecentlyViewedEntries();
  const isRevisit = existing.some((entry) => entry.slug === normalizedSlug);

  const nextEntries: RecentlyViewedEntry[] = [
    { slug: normalizedSlug, viewedAt: safeTimestamp },
    ...existing.filter((entry) => entry.slug !== normalizedSlug),
  ].slice(0, MAX_RECENTLY_VIEWED);

  writeEntries(nextEntries);
  dispatchRecentlyViewedUpdate(nextEntries);

  return {
    recorded: true,
    isRevisit,
    entries: nextEntries,
  };
}

export function resolveRecentlyViewedProfiles(
  entries: RecentlyViewedEntry[],
  publishedProfiles: Profile[],
  limit: number = MAX_RECENTLY_VIEWED
): {
  profiles: Profile[];
  invalidSlugs: string[];
} {
  if (!Array.isArray(entries) || entries.length === 0) {
    return { profiles: [], invalidSlugs: [] };
  }
  if (!Array.isArray(publishedProfiles) || publishedProfiles.length === 0) {
    return { profiles: [], invalidSlugs: [] };
  }

  const bySlug = new Map<string, Profile>();
  for (const profile of publishedProfiles) {
    if (!profile || !isProfileActive(profile)) continue;
    const slug = typeof profile.slug === 'string' ? profile.slug.trim() : '';
    if (slug && !bySlug.has(slug)) {
      bySlug.set(slug, profile);
    }
  }

  const resolved: Profile[] = [];
  const invalidSlugs: string[] = [];
  const seenProfileIds = new Set<string>();

  for (const entry of entries) {
    const matched = bySlug.get(entry.slug);
    if (!matched) {
      invalidSlugs.push(entry.slug);
      continue;
    }

    const dedupeKey = matched.id || matched.slug;
    if (seenProfileIds.has(dedupeKey)) {
      continue;
    }
    seenProfileIds.add(dedupeKey);
    resolved.push(matched);

    if (resolved.length >= limit) {
      break;
    }
  }

  return { profiles: resolved, invalidSlugs };
}

export function pruneInvalidRecentlyViewed(invalidSlugs: string[]): RecentlyViewedEntry[] {
  if (!Array.isArray(invalidSlugs) || invalidSlugs.length === 0) {
    return getRecentlyViewedEntries();
  }

  const invalidSet = new Set(invalidSlugs);
  const current = getRecentlyViewedEntries();
  const cleaned = current.filter((entry) => !invalidSet.has(entry.slug));

  if (cleaned.length !== current.length) {
    writeEntries(cleaned);
    dispatchRecentlyViewedUpdate(cleaned);
  }

  return cleaned;
}
