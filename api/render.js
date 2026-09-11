import fs from 'fs';
import path from 'path';
import https from 'https';

const LOGO_URL = 'https://freepngimg.com/save/70086-logo-whatsapp-computer-viber-icons-free-download-image/1000x1000';
const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'lexical-layout-8pthm';
const FIREBASE_DB_ID = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || process.env.FIREBASE_DATABASE_ID || process.env.FIRESTORE_DATABASE_ID || 'ai-studio-b13ae003-c59b-43f9-ab4c-998699ecc304';
const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || 'AIzaSyBbOlWRBId2jdRWKgGfep6EFYZ5qXjvkV4';

function decodeFirestoreDoc(doc) {
  if (!doc || !doc.fields) return null;
  const decoded = { id: doc.name.split('/').pop() };
  for (const [key, value] of Object.entries(doc.fields)) {
    decoded[key] = decodeValue(value);
  }
  return decoded;
}

function decodeValue(val) {
  if (val.stringValue !== undefined) return val.stringValue;
  if (val.integerValue !== undefined) return parseInt(val.integerValue, 10);
  if (val.doubleValue !== undefined) return parseFloat(val.doubleValue);
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.nullValue !== undefined) return null;
  if (val.timestampValue !== undefined) return val.timestampValue;
  if (val.arrayValue !== undefined) return (val.arrayValue.values || []).map(decodeValue);
  if (val.mapValue !== undefined) {
    const obj = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      obj[k] = decodeValue(v);
    }
    return obj;
  }
  return val;
}

async function fetchProfile(slug) {
  return new Promise((resolve) => {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIREBASE_DB_ID}/documents/profiles?key=${FIREBASE_API_KEY}`;
      https.get(url, { timeout: 5000 }, (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const rawDoc = JSON.parse(rawData);
              const docs = rawDoc.documents || [];
              const profiles = docs.map(decodeFirestoreDoc).filter(p => p !== null);
              const profile = profiles.find(p => p.slug === slug && p.published !== false);
              resolve(profile || null);
            } else {
              resolve(null);
            }
          } catch(e) {
            resolve(null);
          }
        });
      }).on('error', () => resolve(null));
    } catch (e) {
      resolve(null);
    }
  });
}

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
       .replace(/&/g, "&amp;")
       .replace(/</g, "&lt;")
       .replace(/>/g, "&gt;")
       .replace(/"/g, "&quot;")
       .replace(/'/g, "&#039;")
       .replace(/\n/g, " ");
}

export default async function handler(req, res) {
  let htmlPath = path.join(process.cwd(), 'dist', 'index.html');
  if (!fs.existsSync(htmlPath)) {
    htmlPath = path.join(process.cwd(), 'index.html');
  }
  
  let html = '';
  try {
    html = fs.readFileSync(htmlPath, 'utf8');
  } catch (e) {
    return res.status(500).send('Error reading index.html');
  }

  const url = req.url || '/';
  
  let title = 'Call Me — Find Your Perfect Match';
  let description = 'Discover verified matrimonial profiles and connect with the right match.';
  let image = LOGO_URL;
  let ogUrl = 'https://call-me1.vercel.app' + url;
  let ogType = 'website';

  const urlParts = url.split('?')[0].split('/');
  if (urlParts.length === 2 && urlParts[1] && urlParts[1] !== 'admin' && urlParts[1] !== 'api' && urlParts[1] !== 'assets') {
    const slug = urlParts[1];
    const profile = await fetchProfile(slug);
    
    if (profile) {
      title = profile.fullName;
      if (profile.profession && profile.city) {
        description = `${profile.profession} in ${profile.city}. ${profile.bio ? profile.bio.substring(0, 120) + '...' : ''}`;
      } else if (profile.bio) {
        description = profile.bio.substring(0, 150) + '...';
      } else {
        description = `View ${profile.fullName}'s verified profile.`;
      }
      image = profile.image && profile.image.trim() !== '' ? profile.image : LOGO_URL;
      ogType = 'profile';
    }
  }

  const ogTags = `
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:url" content="${escapeHtml(ogUrl)}" />
    <meta property="og:type" content="${escapeHtml(ogType)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    <title>${escapeHtml(title)}</title>
  `;

  html = html.replace(/<title>.*?<\/title>/g, '').replace('</head>', ogTags + '</head>');
  
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
  res.status(200).send(html);
}
