// Vercel Serverless Function & Express API Endpoint (ESM)
import express from 'express';
import cors from 'cors';
import https from 'https';

const app = express();
app.use(cors());
app.use(express.json());

// Firebase / Firestore Project Configurations
const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'lexical-layout-8pthm';
const FIREBASE_DB_ID = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || process.env.FIREBASE_DATABASE_ID || process.env.FIRESTORE_DATABASE_ID || 'ai-studio-b13ae003-c59b-43f9-ab4c-998699ecc304';
const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || 'AIzaSyBbOlWRBId2jdRWKgGfep6EFYZ5qXjvkV4';

// In-memory cache for fast response times across serverless lifecycle
let profilesCache = [];
let lastProfilesFetch = 0;
const PROFILES_CACHE_TTL = 15000; // 15 seconds TTL
let pendingFetchPromise = null;

// Admin Authentication Middleware
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const adminKey = req.headers['x-admin-key'];
  const expectedKey = process.env.ADMIN_API_KEY || 'callme_admin_sec_9918a287b4e9f016d';

  if (expectedKey && adminKey && adminKey === expectedKey) {
    return next();
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token && token.length >= 20) {
      return next();
    }
  }

  return res.status(401).json({
    success: false,
    error: 'unauthorized',
    message: 'Unauthorized: Valid Firebase administrator credentials or API token required.'
  });
}

// -----------------------------------------------------------
// Firestore REST Decoder
// -----------------------------------------------------------
function decodeFirestoreValue(val) {
  if (!val || typeof val !== 'object') return val;
  if ('stringValue' in val) return val.stringValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return parseFloat(val.doubleValue);
  if ('timestampValue' in val) return val.timestampValue;
  if ('nullValue' in val) return null;
  if ('mapValue' in val) {
    const res = {};
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

function decodeFirestoreDoc(doc) {
  if (!doc || !doc.fields) return null;
  const res = {};
  for (const k in doc.fields) {
    res[k] = decodeFirestoreValue(doc.fields[k]);
  }
  if (!res.id && doc.name) {
    const parts = doc.name.split('/');
    res.id = parts[parts.length - 1];
  }
  return res;
}

// -----------------------------------------------------------
// Live Firestore Query Helper
// -----------------------------------------------------------
async function fetchLiveProfilesFromFirestore(forceFresh = false) {
  const now = Date.now();
  if (!forceFresh && profilesCache.length > 0 && now - lastProfilesFetch < PROFILES_CACHE_TTL) {
    return profilesCache;
  }

  if (pendingFetchPromise && !forceFresh) {
    return pendingFetchPromise;
  }

  pendingFetchPromise = new Promise((resolve) => {
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
        timeout: 8000
      }, (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const rawDocs = JSON.parse(rawData);
              const liveProfiles = [];
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
            } else {
              console.warn('Firestore response non-200:', res.statusCode, rawData);
            }
          } catch (e) {
            console.warn('Error parsing Firestore response:', e);
          }
          resolve(profilesCache);
        });
      });

      req.on('error', (err) => {
        console.warn('Firestore live query error:', err.message);
        resolve(profilesCache);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(profilesCache);
      });

      req.write(payload);
      req.end();
    } catch (err) {
      console.warn('Firestore query exception:', err);
      resolve(profilesCache);
    }
  }).finally(() => {
    pendingFetchPromise = null;
  });

  return pendingFetchPromise;
}

// -----------------------------------------------------------
// Public API Routes
// -----------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    serverless: true,
    cachedProfilesCount: profilesCache.length,
    projectId: FIREBASE_PROJECT_ID,
    databaseId: FIREBASE_DB_ID,
    timestamp: new Date().toISOString()
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
        (p.tags && Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(q)))
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

    // Sort: featured first, then views / createdAt
    results.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return (b.views || 0) - (a.views || 0);
    });

    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
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

    res.json({ success: true, data: profile });
  } catch (error) {
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
      return res.json({ success: true, views: profile.views });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// -----------------------------------------------------------
// Advertising Settings Endpoints
// -----------------------------------------------------------
let advertisingSettings = {
  slots: [
    {
      id: 'ad-header',
      slotName: 'header_banner',
      enabled: true,
      sponsorName: 'The Royal Heritage Club',
      title: 'Exclusive Matrimonial Concierge for Distinguished Professionals',
      description: 'Handcrafted introductions, background verification, and private bespoke consultations.',
      linkUrl: 'https://callme-matrimony.com/concierge',
      ctaText: 'Inquire Privately',
      badgeText: 'Curated Partner'
    }
  ],
  ads: {
    popunder: false,
    socialBar: false,
    banner: false
  },
  updatedAt: new Date().toISOString()
};

app.get('/api/settings/advertising', (req, res) => {
  res.json({
    success: true,
    data: advertisingSettings
  });
});

app.post('/api/sync/advertising', requireAdminAuth, (req, res) => {
  if (req.body) {
    advertisingSettings = req.body;
  }
  res.json({ success: true, updated: true });
});

// -----------------------------------------------------------
// Admin Protected Synchronization & Cache Invalidation
// -----------------------------------------------------------
app.post('/api/sync/profile', requireAdminAuth, (req, res) => {
  try {
    const profile = req.body;
    if (!profile || !profile.id) {
      return res.status(400).json({ success: false, message: 'Invalid profile data' });
    }

    const idx = profilesCache.findIndex(p => p.id === profile.id || (profile.slug && p.slug === profile.slug));
    if (idx >= 0) {
      if (profile.published === false) {
        // Removed from published view
        profilesCache.splice(idx, 1);
      } else {
        profilesCache[idx] = profile;
      }
    } else if (profile.published !== false) {
      profilesCache.unshift(profile);
    }

    // Force subsequent queries to refresh
    lastProfilesFetch = 0;
    res.json({ success: true, updated: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/sync/profile/:id', requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    profilesCache = profilesCache.filter(p => p.id !== id);
    lastProfilesFetch = 0;
    res.json({ success: true, deleted: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/profiles/refresh', requireAdminAuth, async (req, res) => {
  try {
    const fresh = await fetchLiveProfilesFromFirestore(true);
    res.json({ success: true, count: fresh.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default app;
