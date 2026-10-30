import path from 'path';
import fs from 'fs';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { app, fetchLiveProfilesFromFirestore } from './server/app';

const LOGO_URL = 'https://freepngimg.com/save/70086-logo-whatsapp-computer-viber-icons-free-download-image/1000x1000';


function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
       .replace(/&/g, "&amp;")
       .replace(/</g, "&lt;")
       .replace(/>/g, "&gt;")
       .replace(/"/g, "&quot;")
       .replace(/'/g, "&#039;")
       .replace(/\n/g, " ");
}

async function injectOpenGraphTags(html, url) {

  let title = 'Call Me — Find Your Perfect Match';
  let description = 'Discover verified matrimonial profiles and connect with the right match.';
  let image = LOGO_URL;
  let ogUrl = 'https://call-me1.vercel.app' + url;
  let ogType = 'website';

  // Check if this is a profile page
  // A profile page is typically /<slug> but avoiding /admin, /api etc.
  // We can just match /[^/]+ and see if it corresponds to a slug in the DB.
  
  try {
    // Robust route matching for candidate profiles: matches /profile/:slug, /story/:slug, or direct /:slug
    const urlParts = url.split('?')[0].split('/').filter(Boolean);
    let candidateSlug = '';

    if (urlParts.length === 2 && (urlParts[0] === 'profile' || urlParts[0] === 'story')) {
      candidateSlug = urlParts[1];
    } else if (urlParts.length === 1 && !['admin', 'api', 'assets', 'settings'].includes(urlParts[0])) {
      candidateSlug = urlParts[0];
    }

    if (candidateSlug) {
      const profiles = await fetchLiveProfilesFromFirestore(false);
      const profile = profiles.find(p => p.slug === candidateSlug && p.published !== false);
      
      if (profile) {
        title = `${profile.fullName} — Call Me Matrimonial Portfolio`;
        if (profile.profession && profile.city) {
          description = `${profile.age} yrs • ${profile.profession} based in ${profile.city}, ${profile.country}. ${profile.proposalMessage || profile.bio || ''}`.trim();
        } else if (profile.bio) {
          description = `${profile.age} yrs • ${profile.bio.substring(0, 160)}...`;
        } else {
          description = `Explore ${profile.fullName}'s verified matrimonial portfolio and proposal on Call Me.`;
        }
        image = profile.image && profile.image.trim() !== '' ? profile.image : LOGO_URL;
        ogType = 'profile';
        ogUrl = `https://call-me1.vercel.app/profile/${profile.slug}`;
      }
    }
  } catch (err) {
    console.error('Error fetching profile for OG tags:', err);
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

  // Inject before </head>
  return html.replace(/<title>.*?<\/title>/g, '').replace('</head>', ogTags + '</head>');
}

async function startServer() {
  const PORT = 3000;
  
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api') || url.startsWith('/assets')) return next();
      
      try {
        let template = fs.readFileSync(path.resolve('index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        const html = await injectOpenGraphTags(template, url);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false })); // Disable automatic index.html serving
    
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api') || url.startsWith('/assets')) return next();
      
      try {
        const template = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');
        const html = await injectOpenGraphTags(template, url);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        next(e);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Call Me platform server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
