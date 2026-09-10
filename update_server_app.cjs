const fs = require('fs');

const apiFile = 'server/app.ts';
let content = fs.readFileSync(apiFile, 'utf8');

const adFetcher = `
let lastAdvertisingFetch = 0;
let pendingAdFetchPromise: Promise<AdvertisingSettings> | null = null;
const ADVERTISING_CACHE_TTL = 30000; // 30 seconds

async function fetchLiveAdvertisingFromFirestore(forceFresh = false): Promise<AdvertisingSettings | null> {
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
`;

content = content.replace('let advertisingCache: AdvertisingSettings = { ...INITIAL_ADVERTISING_SETTINGS };', adFetcher + '\nlet advertisingCache: AdvertisingSettings = { ...INITIAL_ADVERTISING_SETTINGS };');

const handlerOld = `app.get('/api/settings/advertising', (req, res) => {
  try {
    const activeSlots = advertisingCache.slots.filter(s => s.enabled);
    res.json({
      success: true,
      data: {
        slots: activeSlots,
        ads: advertisingCache.ads || {
          popunder: false,
          socialBar: false,
          banner: false
        },
        updatedAt: advertisingCache.updatedAt
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});`;

const handlerNew = `app.get('/api/settings/advertising', async (req, res) => {
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
});`;

content = content.replace(handlerOld, handlerNew);

const syncOld = `app.post('/api/sync/advertising', requireAdminAuth, (req, res) => {
  try {
    const settings: AdvertisingSettings = req.body;
    advertisingCache = settings;
    res.json({ success: true, updated: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});`;

const syncNew = `app.post('/api/sync/advertising', requireAdminAuth, (req, res) => {
  try {
    const settings: AdvertisingSettings = req.body;
    advertisingCache = settings;
    lastAdvertisingFetch = Date.now();
    res.json({ success: true, updated: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});`;

content = content.replace(syncOld, syncNew);

fs.writeFileSync(apiFile, content);
console.log('Updated server/app.ts');
