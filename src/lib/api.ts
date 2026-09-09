import { Profile, AdvertisingSettings, TelemetryEvent, AnalyticsSummary } from '../types';
import { INITIAL_PROFILES, INITIAL_ADVERTISING_SETTINGS } from './seedData';
import { getCurrentUserToken } from './firestoreService';

// Base API URL points to the Express endpoints
const API_BASE = '/api';

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
  try {
    const res = await fetch(`${API_BASE}/settings/advertising`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.warn('API advertising fetch failed, using defaults:', error);
    return INITIAL_ADVERTISING_SETTINGS;
  }
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
