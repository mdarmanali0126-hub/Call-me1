const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

// Replace the generic title with our dynamic tags
server = server.replace(
  "return html.replace('</head>', ogTags + '</head>');",
  "return html.replace(/<title>.*?<\\/title>/g, '').replace('</head>', ogTags + '</head>');"
);

// We need to add logic for og:type
// For profiles: profile
// For home: website
server = server.replace(
  "let ogUrl = 'https://call-me1.vercel.app' + url;",
  "let ogUrl = 'https://call-me1.vercel.app' + url;\n  let ogType = 'website';"
);
server = server.replace(
  "image = profile.image && profile.image.trim() !== '' ? profile.image : LOGO_URL;",
  "image = profile.image && profile.image.trim() !== '' ? profile.image : LOGO_URL;\n        ogType = 'profile';"
);
server = server.replace(
  '<meta property="og:type" content="website" />',
  '<meta property="og:type" content="${ogType}" />'
);

fs.writeFileSync('server.ts', server);
console.log('Fixed server.ts');
