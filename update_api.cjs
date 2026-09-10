const fs = require('fs');

const apiFile = 'api/index.js';
let content = fs.readFileSync(apiFile, 'utf8');

// Inject the fetchLiveAdvertisingFromFirestore function
const adFetcher = `
let lastAdvertisingFetch = 0;
let advertisingCache = null;
let pendingAdFetchPromise = null;
const ADVERTISING_CACHE_TTL = 30000; // 30 seconds

async function fetchLiveAdvertisingFromFirestore(forceFresh = false) {
  const now = Date.now();
  if (!forceFresh && advertisingCache && now - lastAdvertisingFetch < ADVERTISING_CACHE_TTL) {
    return advertisingCache;
  }
  if (pendingAdFetchPromise) return pendingAdFetchPromise;
  
  pendingAdFetchPromise = new Promise((resolve) => {
    try {
      const url = \`https://firestore.googleapis.com/v1/projects/\${FIREBASE_PROJECT_ID}/databases/\${FIREBASE_DB_ID}/documents/settings/advertising?key=\${FIREBASE_API_KEY}\`;
      const req = https.get(url, { timeout: 8000 }, (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const rawDoc = JSON.parse(rawData);
              const decoded = decodeFirestoreDoc(rawDoc);
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
`;

content = content.replace('let advertisingSettings = {', adFetcher + '\nlet advertisingSettings = {');

// Rewrite the /api/settings/advertising handler
const handlerOld = `app.get('/api/settings/advertising', (req, res) => {
  res.json({
    success: true,
    data: advertisingSettings
  });
});`;

const handlerNew = `app.get('/api/settings/advertising', async (req, res) => {
  try {
    const liveSettings = await fetchLiveAdvertisingFromFirestore();
    const fallbackSettings = liveSettings || advertisingSettings;
    res.json({
      success: true,
      data: {
        slots: fallbackSettings.slots || [],
        ads: fallbackSettings.ads || { popunder: false, socialBar: false, banner: false },
        updatedAt: fallbackSettings.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});`;

content = content.replace(handlerOld, handlerNew);

// Rewrite the POST /api/sync/advertising handler
const syncOld = `app.post('/api/sync/advertising', requireAdminAuth, (req, res) => {
  if (req.body) {
    advertisingSettings = req.body;
  }
  res.json({ success: true, updated: true });
});`;

const syncNew = `app.post('/api/sync/advertising', requireAdminAuth, (req, res) => {
  if (req.body) {
    advertisingSettings = req.body;
    advertisingCache = req.body; // update cache memory
    lastAdvertisingFetch = Date.now();
  }
  res.json({ success: true, updated: true });
});`;

content = content.replace(syncOld, syncNew);

fs.writeFileSync(apiFile, content);
console.log('Updated api/index.js');
