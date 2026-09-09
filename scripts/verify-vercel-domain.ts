import https from 'https';
import fs from 'fs';

interface ProjectConfig {
  projectId: string;
  authorizedDomains: string[];
}

interface AuthUriResponse {
  kind: string;
  authUri: string;
  providerId: string;
}

function fetchJson<T>(url: string, postData?: object): Promise<T> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const body = postData ? JSON.stringify(postData) : null;
    const req = https.request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: body ? 'POST' : 'GET',
        headers: body
          ? {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(body),
            }
          : {},
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(raw) as T);
          } catch (e) {
            reject(new Error(`Failed to parse response: ${raw.slice(0, 200)}`));
          }
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function run() {
  const configFile = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
  const apiKey = configFile.apiKey;
  const targetDomain = 'call-me1.vercel.app';

  console.log('======================================================================');
  console.log(' VERIFY VERCEL DOMAIN AUTHORIZATION & GOOGLE SIGN-IN STATUS');
  console.log(` Target Domain:   ${targetDomain}`);
  console.log(` Firebase Project: ${configFile.projectId}`);
  console.log(` Auth Domain:     ${configFile.authDomain}`);
  console.log('======================================================================\n');

  // 1. Fetch authorized domains
  console.log('1. Checking Firebase Authentication Authorized Domains list...');
  try {
    const config = await fetchJson<ProjectConfig>(
      `https://identitytoolkit.googleapis.com/v1/projects?key=${apiKey}`
    );

    const domains = config.authorizedDomains || [];
    console.log(`   Found ${domains.length} authorized domains currently in project:`);
    domains.forEach((d) => console.log(`    - ${d}`));

    const isAuthorized = domains.includes(targetDomain);
    if (isAuthorized) {
      console.log(`\n   [✓] SUCCESS: "${targetDomain}" IS AUTHORIZED in Firebase Authentication!`);
    } else {
      console.log(
        `\n   [!] ACTION REQUIRED: "${targetDomain}" is NOT YET in the Authorized Domains list.`
      );
      console.log(
        `       Firebase Auth SDK will return "auth/unauthorized-domain" until added in Firebase Console.`
      );
    }

    // 2. Check Google OAuth Provider Status
    console.log('\n2. Checking Google Sign-In provider configuration...');
    const authUriRes = await fetchJson<AuthUriResponse>(
      `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${apiKey}`,
      {
        providerId: 'google.com',
        continueUri: `https://${targetDomain}/admin/login`,
      }
    );

    if (authUriRes.providerId === 'google.com' && authUriRes.authUri) {
      console.log('   [✓] SUCCESS: Google Sign-In provider is ENABLED and healthy.');
      console.log(`   Client ID: ${configFile.oAuthClientId}`);
    } else {
      console.log('   [✗] Google Sign-In returned unexpected response:', authUriRes);
    }

    // 3. Check Vercel Production Environment consistency
    console.log('\n3. Checking Production Frontend Bundle configuration...');
    const indexHtml = fs.readFileSync('index.html', 'utf8');
    const firebaseTs = fs.readFileSync('src/lib/firebase.ts', 'utf8');
    const hasCorrectFallback =
      firebaseTs.includes('firebaseConfigRaw.projectId') &&
      firebaseTs.includes('firebaseConfigRaw.authDomain');

    console.log(`   Firebase initialization fallback verified: ${hasCorrectFallback ? 'YES' : 'NO'}`);
    console.log(`   Project ID: ${configFile.projectId}`);
    console.log(`   Auth Domain: ${configFile.authDomain}`);
    console.log('======================================================================');

    return {
      isAuthorized,
      domains,
    };
  } catch (err) {
    console.error('Error during verification:', err);
    throw err;
  }
}

run();
