const fs = require('fs');

const serverContent = `import path from 'path';
import fs from 'fs';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { app, fetchLiveProfilesFromFirestore } from './server/app';

const LOGO_URL = 'https://iili.io/nFUR3HN.png';

async function injectOpenGraphTags(html, url) {
  let title = 'Call Me — Find Your Perfect Match';
  let description = 'Discover verified matrimonial profiles and connect with the right match.';
  let image = LOGO_URL;
  let ogUrl = 'https://call-me1.vercel.app' + url;

  // Check if this is a profile page
  // A profile page is typically /<slug> but avoiding /admin, /api etc.
  // We can just match /[^/]+ and see if it corresponds to a slug in the DB.
  
  try {
    // Basic route matching
    const urlParts = url.split('?')[0].split('/');
    if (urlParts.length === 2 && urlParts[1] && urlParts[1] !== 'admin' && urlParts[1] !== 'api' && urlParts[1] !== 'assets') {
      const slug = urlParts[1];
      const profiles = await fetchLiveProfilesFromFirestore(false);
      const profile = profiles.find(p => p.slug === slug && p.published !== false);
      
      if (profile) {
        title = profile.fullName;
        if (profile.profession && profile.city) {
          description = \`\${profile.profession} in \${profile.city}. \${profile.bio ? profile.bio.substring(0, 120) + '...' : ''}\`;
        } else if (profile.bio) {
          description = profile.bio.substring(0, 150) + '...';
        } else {
          description = \`View \${profile.fullName}'s verified profile.\`;
        }
        image = profile.image && profile.image.trim() !== '' ? profile.image : LOGO_URL;
      }
    }
  } catch (err) {
    console.error('Error fetching profile for OG tags:', err);
  }

  const ogTags = \`
    <meta property="og:title" content="\${title}" />
    <meta property="og:description" content="\${description}" />
    <meta property="og:image" content="\${image}" />
    <meta property="og:url" content="\${ogUrl}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="\${title}" />
    <meta name="twitter:description" content="\${description}" />
    <meta name="twitter:image" content="\${image}" />
    <title>\${title}</title>
  \`;

  // Inject before </head>
  return html.replace('</head>', ogTags + '</head>');
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
    console.log(\`Call Me platform server running on http://0.0.0.0:\${PORT}\`);
  });
}

startServer();
`;

fs.writeFileSync('server.ts', serverContent);
console.log('Rewritten server.ts');
