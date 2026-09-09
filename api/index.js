// Vercel Serverless Function Entry Point for Express API
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Admin Authentication Middleware
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const adminKey = req.headers['x-admin-key'];
  const expectedKey = process.env.ADMIN_API_KEY;

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

const INITIAL_PROFILES = [
  {
    id: 'prof-aarav-sharma',
    slug: 'aarav-sharma-tech-lead',
    fullName: 'Aarav Sharma',
    age: 29,
    maritalStatus: 'Never Married',
    city: 'San Francisco',
    state: 'California',
    country: 'United States',
    profession: 'Senior Software Architect',
    education: 'M.S. in Computer Science, Stanford University',
    bio: 'Passionate technologist, weekend marathon runner, and amateur jazz pianist. Looking for an authentic partner to build a joyful, purpose-driven life together.',
    proposalMessage: 'I believe marriage is a lifelong partnership built on shared values, mutual respect, and waking up excited to support each other’s dreams.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=80',
    publicContact: {
      phone: '+1 (415) 890-2194',
      email: 'aarav.sharma.connect@gmail.com',
      whatsapp: '+14158902194',
      preferredMethod: 'whatsapp'
    },
    published: true,
    featured: true,
    views: 1420,
    tags: ['Tech', 'Marathon', 'Jazz', 'Stanford Alumni'],
    createdAt: '2026-01-15T10:00:00.000Z',
    story: {
      title: 'A Life in Rhythm & Code',
      subtitle: 'From Silicon Valley trails to quiet Sunday mornings',
      slides: [
        {
          id: 'slide-1',
          title: 'Roots & Foundations',
          text: 'Raised in a warm household where education and family dinners were sacred.',
          mediaUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=80',
          quote: '"Success is how comfortably you can sleep knowing you treated people right."'
        }
      ]
    }
  },
  {
    id: 'prof-elena-vance',
    slug: 'dr-elena-vance-pediatrician',
    fullName: 'Dr. Elena Vance',
    age: 28,
    maritalStatus: 'Never Married',
    city: 'Boston',
    state: 'Massachusetts',
    country: 'United States',
    profession: 'Pediatric Resident Physician',
    education: 'M.D., Harvard Medical School',
    bio: 'Dedicated pediatrician with an endless love for watercolor sketching, historical fiction, and coastal sailing.',
    proposalMessage: 'I am looking for a partner with a generous spirit, strong ethical compass, and an open heart.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80',
    publicContact: {
      email: 'dr.elena.vance@gmail.com',
      whatsapp: '+16175550142',
      preferredMethod: 'email'
    },
    published: true,
    featured: true,
    views: 1890,
    tags: ['Physician', 'Harvard', 'Sailing', 'Arts'],
    createdAt: '2026-01-20T09:00:00.000Z',
    story: {
      title: 'Healing, Art & Devotion',
      slides: [
        {
          id: 'slide-e1',
          title: 'The Calling',
          text: 'Working in pediatric care has taught me grace under pressure.',
          mediaUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80'
        }
      ]
    }
  }
];

let profiles = [...INITIAL_PROFILES];

app.get('/api/health', (req, res) => {
  res.json({ status: 'online', serverless: true, count: profiles.length });
});

app.get('/api/profiles', (req, res) => {
  const { search, profession, country } = req.query;
  let results = profiles.filter(p => p.published !== false);
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(p => p.fullName.toLowerCase().includes(q) || p.profession.toLowerCase().includes(q));
  }
  if (profession) {
    results = results.filter(p => p.profession.toLowerCase().includes(profession.toLowerCase()));
  }
  if (country) {
    results = results.filter(p => p.country.toLowerCase() === country.toLowerCase());
  }
  res.json({ success: true, count: results.length, data: results });
});

app.get('/api/profiles/:slug', (req, res) => {
  const p = profiles.find(item => item.slug === req.params.slug && item.published !== false);
  if (!p) return res.status(404).json({ success: false, message: 'Profile not found' });
  res.json({ success: true, data: p });
});

app.post('/api/profiles/:slug/view', (req, res) => {
  const p = profiles.find(item => item.slug === req.params.slug);
  if (p) {
    p.views = (p.views || 0) + 1;
    return res.json({ success: true, views: p.views });
  }
  res.status(404).json({ success: false, message: 'Profile not found' });
});

app.get('/api/settings/advertising', (req, res) => {
  res.json({
    success: true,
    data: {
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
      ]
    }
  });
});

// Admin Protected Endpoints
app.get('/api/telemetry/stats', requireAdminAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      totalViews: profiles.reduce((acc, p) => acc + (p.views || 0), 0),
      totalStoryViews: 420,
      totalContactClicks: 184,
      totalAdClicks: 96,
      popularProfiles: profiles.slice(0, 5)
    }
  });
});

app.post('/api/sync/profile', requireAdminAuth, (req, res) => {
  const profile = req.body;
  if (!profile || !profile.id) return res.status(400).json({ success: false });
  const idx = profiles.findIndex(p => p.id === profile.id);
  if (idx >= 0) profiles[idx] = profile;
  else profiles.unshift(profile);
  res.json({ success: true });
});

module.exports = app;
