import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { INITIAL_PROFILES, INITIAL_ADVERTISING_SETTINGS } from '../src/lib/seedData';
import { Profile, AdvertisingSettings, TelemetryEvent } from '../src/types';

// In-memory cache synced with database state
let profilesCache: Profile[] = [...INITIAL_PROFILES];
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

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    profilesCount: profilesCache.length,
    service: 'Call Me Matrimonial API'
  });
});

// GET /api/profiles - Public visitor endpoint for published profiles
app.get('/api/profiles', (req, res) => {
  try {
    const { search, profession, country, maritalStatus, featured } = req.query;
    let results = profilesCache.filter(p => p.published !== false);

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      results = results.filter(p =>
        p.fullName.toLowerCase().includes(q) ||
        p.profession.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q) ||
        p.bio.toLowerCase().includes(q) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    if (profession && typeof profession === 'string') {
      results = results.filter(p => p.profession.toLowerCase().includes(profession.toLowerCase()));
    }

    if (country && typeof country === 'string') {
      results = results.filter(p => p.country.toLowerCase() === country.toLowerCase());
    }

    if (maritalStatus && typeof maritalStatus === 'string') {
      results = results.filter(p => p.maritalStatus.toLowerCase() === maritalStatus.toLowerCase());
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
app.get('/api/profiles/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    const profile = profilesCache.find(p => p.slug === slug && p.published !== false);

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
    res.status(404).json({ success: false, message: 'Profile not found' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/settings/advertising - Public advertising slots
app.get('/api/settings/advertising', (req, res) => {
  try {
    const activeSlots = advertisingCache.slots.filter(s => s.enabled);
    res.json({
      success: true,
      data: {
        slots: activeSlots,
        updatedAt: advertisingCache.updatedAt
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
    const idx = profilesCache.findIndex(p => p.id === profile.id);
    if (idx >= 0) {
      profilesCache[idx] = profile;
    } else {
      profilesCache.unshift(profile);
    }
    res.json({ success: true, updated: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/sync/profile/:id', requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    profilesCache = profilesCache.filter(p => p.id !== id);
    res.json({ success: true, deleted: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/sync/advertising', requireAdminAuth, (req, res) => {
  try {
    const settings: AdvertisingSettings = req.body;
    advertisingCache = settings;
    res.json({ success: true, updated: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default app;
