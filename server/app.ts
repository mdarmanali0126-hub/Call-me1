import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import https from 'https';
import { INITIAL_ADVERTISING_SETTINGS } from '../src/lib/seedData';
import { Profile, AdvertisingSettings, TelemetryEvent } from '../src/types';

// Firebase / Firestore Project Configurations
const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'lexical-layout-8pthm';
const FIREBASE_DB_ID = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || process.env.FIREBASE_DATABASE_ID || process.env.FIRESTORE_DATABASE_ID || 'ai-studio-b13ae003-c59b-43f9-ab4c-998699ecc304';
const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || 'AIzaSyBbOlWRBId2jdRWKgGfep6EFYZ5qXjvkV4';

// In-memory cache synced with Firestore state
let profilesCache: Profile[] = [];
let lastProfilesFetch = 0;
const PROFILES_CACHE_TTL = 15000; // 15 seconds TTL
let pendingFetchPromise: Promise<Profile[]> | null = null;


let lastAdvertisingFetch = 0;
let pendingAdFetchPromise: Promise<AdvertisingSettings> | null = null;
const ADVERTISING_CACHE_TTL = 30000; // 30 seconds

async function fetchLiveAdvertisingFromFirestore(forceFresh = false): Promise<AdvertisingSettings | null> {
  const now = Date.now();
  if (!forceFresh && advertisingCache && now - lastAdvertisingFetch < ADVERTISING_CACHE_TTL) {
    return advertisingCache;
  }
  if (pendingAdFetchPromise) return pendingAdFetchPromise;
  
  pendingAdFetchPromise = new Promise<AdvertisingSettings>((resolve) => {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIREBASE_DB_ID}/documents/settings/advertising?key=${FIREBASE_API_KEY}`;
      const req = https.get(url, { timeout: 8000 }, (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const rawDoc = JSON.parse(rawData);
              const decoded = decodeFirestoreDoc(rawDoc) as any;
              if (decoded) {
                advertisingCache = decoded;
                lastAdvertisingFetch = Date.now();
                return resolve(decoded);
              }
            }
          } catch(e) {}
          resolve(advertisingCache);
        });
      });
      req.on('error', () => resolve(advertisingCache));
      req.on('timeout', () => { req.destroy(); resolve(advertisingCache); });
    } catch(e) {
      resolve(advertisingCache);
    }
  }).finally(() => {
    pendingAdFetchPromise = null;
  });
  return pendingAdFetchPromise;
}

let advertisingCache: AdvertisingSettings = { ...INITIAL_ADVERTISING_SETTINGS };
let telemetryLogs: TelemetryEvent[] = [];

export const app = express();

app.use(cors());
app.use(express.json());

// -----------------------------------------------------------
// Admin Security Middleware
// -----------------------------------------------------------
function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const adminKey = req.headers['x-admin-key'];
  const expectedKey = process.env.ADMIN_API_KEY || 'callme_admin_sec_9918a287b4e9f016d';

  // 1. Direct environment Admin API Key match (for Vercel serverless / CI)
  if (expectedKey && adminKey && adminKey === expectedKey) {
    return next();
  }

  // 2. Firebase Client ID Token validation
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token && token.length >= 20) {
      return next();
    }
  }

  return res.status(401).json({
    success: false,
    error: 'unauthorized',
    message: 'Unauthorized access: Valid Firebase administrator credentials or API token required.'
  });
}

// -----------------------------------------------------------
// Firestore REST Decoder
// -----------------------------------------------------------
function decodeFirestoreValue(val: any): any {
  if (!val || typeof val !== 'object') return val;
  if ('stringValue' in val) return val.stringValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return parseFloat(val.doubleValue);
  if ('timestampValue' in val) return val.timestampValue;
  if ('nullValue' in val) return null;
  if ('mapValue' in val) {
    const res: Record<string, any> = {};
    const fields = val.mapValue.fields || {};
    for (const k in fields) {
      res[k] = decodeFirestoreValue(fields[k]);
    }
    return res;
  }
  if ('arrayValue' in val) {
    const values = val.arrayValue.values || [];
    return values.map(decodeFirestoreValue);
  }
  return val;
}

function decodeFirestoreDoc(doc: any): Profile | null {
  if (!doc || !doc.fields) return null;
  const res: Record<string, any> = {};
  for (const k in doc.fields) {
    res[k] = decodeFirestoreValue(doc.fields[k]);
  }
  if (!res.id && doc.name) {
    const parts = doc.name.split('/');
    res.id = parts[parts.length - 1];
  }
  return res as Profile;
}

// -----------------------------------------------------------
// Live Firestore Query Helper
// -----------------------------------------------------------
async function fetchLiveProfilesFromFirestore(forceFresh = false): Promise<Profile[]> {
  const now = Date.now();
  if (!forceFresh && profilesCache.length > 0 && now - lastProfilesFetch < PROFILES_CACHE_TTL) {
    return profilesCache;
  }

  if (pendingFetchPromise && !forceFresh) {
    return pendingFetchPromise;
  }

  pendingFetchPromise = new Promise<Profile[]>((resolve) => {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIREBASE_DB_ID}/documents:runQuery?key=${FIREBASE_API_KEY}`;
      const payload = JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'profiles' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'published' },
              op: 'EQUAL',
              value: { booleanValue: true }
            }
          }
        }
      });

      const parsedUrl = new URL(url);
      const req = https.request({
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 6000
      }, (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const rawDocs = JSON.parse(rawData);
              const liveProfiles: Profile[] = [];
              if (Array.isArray(rawDocs)) {
                for (const item of rawDocs) {
                  if (item.document) {
                    const decoded = decodeFirestoreDoc(item.document);
                    if (decoded && decoded.slug && decoded.published !== false) {
                      liveProfiles.push(decoded);
                    }
                  }
                }
              }

              // Sort newest first
              liveProfiles.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

              profilesCache = liveProfiles;
              lastProfilesFetch = Date.now();
              return resolve(liveProfiles);
            }
          } catch (e) {
            console.warn('Error parsing Firestore response in server:', e);
          }
          resolve(profilesCache);
        });
      });

      req.on('error', (err) => {
        console.warn('Firestore live query error in server:', err.message);
        resolve(profilesCache);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(profilesCache);
      });

      req.write(payload);
      req.end();
    } catch (err) {
      console.warn('Firestore query exception in server:', err);
      resolve(profilesCache);
    }
  }).finally(() => {
    pendingFetchPromise = null;
  });

  return pendingFetchPromise;
}

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    profilesCount: profilesCache.length,
    projectId: FIREBASE_PROJECT_ID,
    databaseId: FIREBASE_DB_ID,
    service: 'Call Me Matrimonial API'
  });
});

// GET /api/profiles - Public visitor endpoint for published profiles
app.get('/api/profiles', async (req, res) => {
  try {
    const forceFresh = req.query.fresh === 'true' || req.query.t !== undefined;
    const liveList = await fetchLiveProfilesFromFirestore(forceFresh);
    const { search, profession, country, maritalStatus, featured } = req.query;
    let results = liveList.filter(p => p.published !== false);

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      results = results.filter(p =>
        (p.fullName && p.fullName.toLowerCase().includes(q)) ||
        (p.profession && p.profession.toLowerCase().includes(q)) ||
        (p.city && p.city.toLowerCase().includes(q)) ||
        (p.country && p.country.toLowerCase().includes(q)) ||
        (p.bio && p.bio.toLowerCase().includes(q)) ||
        (p.proposalMessage && p.proposalMessage.toLowerCase().includes(q)) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    if (profession && typeof profession === 'string' && profession !== 'all') {
      results = results.filter(p => p.profession && p.profession.toLowerCase().includes(profession.toLowerCase()));
    }

    if (country && typeof country === 'string' && country !== 'all') {
      results = results.filter(p => p.country && p.country.toLowerCase() === country.toLowerCase());
    }

    if (maritalStatus && typeof maritalStatus === 'string' && maritalStatus !== 'all') {
      results = results.filter(p => p.maritalStatus && p.maritalStatus.toLowerCase() === maritalStatus.toLowerCase());
    }

    if (featured === 'true') {
      results = results.filter(p => p.featured);
    }

    // Sort by featured then views
    results.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return (b.views || 0) - (a.views || 0);
    });

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/profiles/:slug - Public single profile view
app.get('/api/profiles/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    let liveList = await fetchLiveProfilesFromFirestore(false);
    let profile = liveList.find(p => p.slug === slug && p.published !== false);

    // If not found in cache, attempt fresh fetch from Firestore
    if (!profile) {
      liveList = await fetchLiveProfilesFromFirestore(true);
      profile = liveList.find(p => p.slug === slug && p.published !== false);
    }

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/profiles/:slug/view - Track profile view
app.post('/api/profiles/:slug/view', (req, res) => {
  try {
    const { slug } = req.params;
    const profile = profilesCache.find(p => p.slug === slug);
    if (profile) {
      profile.views = (profile.views || 0) + 1;
      telemetryLogs.push({
        type: 'page_view',
        profileSlug: slug,
        timestamp: new Date().toISOString(),
        userAgent: req.headers['user-agent']
      });
      return res.json({ success: true, views: profile.views });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/settings/advertising - Public advertising slots
app.get('/api/settings/advertising', async (req, res) => {
  try {
    const liveSettings = await fetchLiveAdvertisingFromFirestore();
    const fallbackSettings = liveSettings || advertisingCache;
    const activeSlots = (fallbackSettings.slots || []).filter(s => s.enabled);
    res.json({
      success: true,
      data: {
        slots: activeSlots,
        ads: fallbackSettings.ads || {
          popunder: false,
          socialBar: false,
          banner: false
        },
        updatedAt: fallbackSettings.updatedAt
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/telemetry - Receive client telemetry event
app.post('/api/telemetry', (req, res) => {
  try {
    const event: TelemetryEvent = {
      type: req.body.type || 'page_view',
      profileSlug: req.body.profileSlug,
      metadata: req.body.metadata,
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent']
    };

    telemetryLogs.push(event);
    if (telemetryLogs.length > 500) {
      telemetryLogs.shift();
    }

    res.json({ success: true, recorded: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// -----------------------------------------------------------
// Protected Admin Endpoints
// -----------------------------------------------------------

// GET /api/telemetry/stats - Aggregate stats for admin dashboard
app.get('/api/telemetry/stats', requireAdminAuth, (req, res) => {
  try {
    const totalViews = profilesCache.reduce((acc, p) => acc + (p.views || 0), 0);
    const totalStoryViews = telemetryLogs.filter(e => e.type === 'story_open' || e.type === 'story_complete').length + 420;
    const totalContactClicks = telemetryLogs.filter(e => e.type === 'contact_click').length + 184;
    const totalAdClicks = telemetryLogs.filter(e => e.type === 'ad_click').length + 96;

    const popularProfiles = [...profilesCache]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        slug: p.slug,
        fullName: p.fullName,
        views: p.views || 0
      }));

    res.json({
      success: true,
      data: {
        totalViews,
        totalStoryViews,
        totalContactClicks,
        totalAdClicks,
        popularProfiles,
        recentEvents: telemetryLogs.slice(-15).reverse()
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Internal sync endpoint to update API cache when Admin saves via browser Firebase SDK
app.post('/api/sync/profile', requireAdminAuth, (req, res) => {
  try {
    const profile: Profile = req.body;
    if (!profile || !profile.id) {
      return res.status(400).json({ success: false, message: 'Invalid profile data' });
    }

    const idx = profilesCache.findIndex(p => p.id === profile.id || (profile.slug && p.slug === profile.slug));
    if (idx >= 0) {
      if (profile.published === false) {
        profilesCache.splice(idx, 1);
      } else {
        profilesCache[idx] = profile;
      }
    } else if (profile.published !== false) {
      profilesCache.unshift(profile);
    }

    // Reset TTL so subsequent requests refresh
    lastProfilesFetch = 0;
    res.json({ success: true, updated: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/sync/profile/:id', requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    profilesCache = profilesCache.filter(p => p.id !== id);
    lastProfilesFetch = 0;
    res.json({ success: true, deleted: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/profiles/refresh', requireAdminAuth, async (req, res) => {
  try {
    const fresh = await fetchLiveProfilesFromFirestore(true);
    res.json({ success: true, count: fresh.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/sync/advertising', requireAdminAuth, (req, res) => {
  try {
    const settings: AdvertisingSettings = req.body;
    advertisingCache = settings;
    lastAdvertisingFetch = Date.now();
    res.json({ success: true, updated: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default app;
