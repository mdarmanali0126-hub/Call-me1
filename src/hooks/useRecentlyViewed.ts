import { useState, useEffect, useMemo } from 'react';
import { Profile } from '../types';
import {
  RecentlyViewedEntry,
  RECENTLY_VIEWED_STORAGE_KEY,
  RECENTLY_VIEWED_UPDATED_EVENT,
  MAX_RECENTLY_VIEWED,
  getRecentlyViewedEntries,
  resolveRecentlyViewedProfiles,
  pruneInvalidRecentlyViewed,
} from '../lib/recentlyViewed';

export function useRecentlyViewed(
  publishedProfiles: Profile[],
  profilesLoaded: boolean = true,
  limit: number = MAX_RECENTLY_VIEWED
): Profile[] {
  const [entries, setEntries] = useState<RecentlyViewedEntry[]>(getRecentlyViewedEntries);

  useEffect(() => {
    setEntries(getRecentlyViewedEntries());

    const handleCustomUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<RecentlyViewedEntry[]>;
      if (Array.isArray(customEvent.detail)) {
        setEntries(customEvent.detail);
      } else {
        setEntries(getRecentlyViewedEntries());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key === RECENTLY_VIEWED_STORAGE_KEY) {
        setEntries(getRecentlyViewedEntries());
      }
    };

    window.addEventListener(RECENTLY_VIEWED_UPDATED_EVENT, handleCustomUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(RECENTLY_VIEWED_UPDATED_EVENT, handleCustomUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const { profiles, invalidSlugs } = useMemo(
    () => resolveRecentlyViewedProfiles(entries, publishedProfiles, limit),
    [entries, publishedProfiles, limit]
  );

  // Clean up unpublished/deleted slugs safely once live profiles have finished loading
  useEffect(() => {
    if (!profilesLoaded || publishedProfiles.length === 0 || invalidSlugs.length === 0) {
      return;
    }
    pruneInvalidRecentlyViewed(invalidSlugs);
  }, [profilesLoaded, publishedProfiles.length, invalidSlugs]);

  return profiles;
}
