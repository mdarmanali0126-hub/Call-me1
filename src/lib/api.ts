import { Profile, AdvertisingSettings, TelemetryEvent, AnalyticsSummary } from '../types';
import { INITIAL_PROFILES, INITIAL_ADVERTISING_SETTINGS } from './seedData';
import { getCurrentUserToken, fetchAdSettingsFromFirestore } from './firestoreService';

// Base API URL points to the Express endpoints
const API_BASE = '/api';

// In-memory cache for public advertising to prevent duplicate network/Firestore calls
let cachedAdSettings: AdvertisingSettings | null = null;
let adSettingsPromise: Promise<AdvertisingSettings> | null = null;
let lastAdFetchTime = 0;
const AD_CACHE_TTL = 30000; // 30 seconds cache

export function invalidateAdvertisingCache(updatedSettings?: AdvertisingSettings): void {
  if (updatedSettings) {
    cachedAdSettings = updatedSettings;
    lastAdFetchTime = Date.now();
  } else {
    cachedAdSettings = null;
    lastAdFetchTime = 0;
  }
  adSettingsPromise = null;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  const token = await getCurrentUserToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export interface ProfileFilters {
  search?: string;
  profession?: string;
  country?: string;
  maritalStatus?: string;
  featured?: boolean;
}

export async function fetchPublicProfiles(filters?: ProfileFilters): Promise<Profile[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.profession) params.append('profession', filters.profession);
    if (filters?.country) params.append('country', filters.country);
    if (filters?.maritalStatus) params.append('maritalStatus', filters.maritalStatus);
    if (filters?.featured) params.append('featured', 'true');

    const res = await fetch(`${API_BASE}/profiles?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.warn('API fetch profiles failed, falling back to local dataset:', error);
    let results = INITIAL_PROFILES.filter(p => p.published);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(p => p.fullName.toLowerCase().includes(q) || p.profession.toLowerCase().includes(q));
    }
    return results;
  }
}

export async function fetchPublicProfileBySlug(slug: string): Promise<Profile | null> {
  try {
    const res = await fetch(`${API_BASE}/profiles/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (error) {
    console.warn('API fetch single profile failed, falling back to local dataset:', error);
    const item = INITIAL_PROFILES.find(p => p.slug === slug && p.published);
    return item || null;
  }
}

export async function recordProfileView(slug: string): Promise<number | null> {
  try {
    const res = await fetch(`${API_BASE}/profiles/${encodeURIComponent(slug)}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) {
      const json = await res.json();
      return json.views;
    }
  } catch (error) {
    console.warn('Failed to record view on API:', error);
  }
  return null;
}

export async function fetchPublicAdvertising(): Promise<AdvertisingSettings> {
  const now = Date.now();
  if (cachedAdSettings && now - lastAdFetchTime < AD_CACHE_TTL) {
    return cachedAdSettings;
  }

  if (adSettingsPromise) {
    return adSettingsPromise;
  }

  adSettingsPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/settings/advertising`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          cachedAdSettings = {
            ...json.data,
            ads: {
              popunder: json.data.ads?.popunder ?? false,
              socialBar: json.data.ads?.socialBar ?? false,
              banner: json.data.ads?.banner ?? false,
            }
          };
          lastAdFetchTime = Date.now();
          return cachedAdSettings;
        }
      }
      throw new Error(`API returned non-ok status: ${res.status}`);
    } catch (error) {
      // Fallback: fetch from Firestore if API route fails (e.g. static hosting)
      try {
        const firestoreSettings = await fetchAdSettingsFromFirestore();
        cachedAdSettings = firestoreSettings;
        lastAdFetchTime = Date.now();
        return firestoreSettings;
      } catch (fErr) {
        console.warn('API and Firestore ad fetch failed, using defaults:', fErr);
        return INITIAL_ADVERTISING_SETTINGS;
      }
    } finally {
      adSettingsPromise = null;
    }
  })();

  return adSettingsPromise;
}

export async function trackTelemetry(event: TelemetryEvent): Promise<void> {
  try {
    await fetch(`${API_BASE}/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
  } catch (err) {
    // Non-blocking telemetry
  }
}

export async function fetchAdminTelemetryStats(): Promise<AnalyticsSummary> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/telemetry/stats`, { headers });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (err) {
    console.warn('Admin stats fetch error:', err);
  }
  return {
    totalViews: 4410,
    totalStoryViews: 580,
    totalContactClicks: 210,
    totalAdClicks: 115,
    popularProfiles: INITIAL_PROFILES.map(p => ({
      id: p.id,
      slug: p.slug,
      fullName: p.fullName,
      views: p.views
    })).slice(0, 5),
    recentEvents: []
  };
}

export async function syncProfileToServer(profile: Profile): Promise<void> {
  try {
    const headers = await getAuthHeaders();
    await fetch(`${API_BASE}/sync/profile`, {
      method: 'POST',
      headers,
      body: JSON.stringify(profile)
    });
  } catch (err) {
    console.warn('Sync profile to server failed:', err);
  }
}

export async function syncDeleteProfileToServer(id: string): Promise<void> {
  try {
    const headers = await getAuthHeaders();
    await fetch(`${API_BASE}/sync/profile/${id}`, {
      method: 'DELETE',
      headers
    });
  } catch (err) {
    console.warn('Sync delete to server failed:', err);
  }
}

export async function syncAdvertisingToServer(settings: AdvertisingSettings): Promise<void> {
  try {
    const headers = await getAuthHeaders();
    await fetch(`${API_BASE}/sync/advertising`, {
      method: 'POST',
      headers,
      body: JSON.stringify(settings)
    });
  } catch (err) {
    console.warn('Sync advertising to server failed:', err);
  }
}
