const fs = require('fs');

let index = fs.readFileSync('index.html', 'utf8');

// Remove existing og: and twitter: tags, as well as the default title and description
const metaTagsToRemove = [
  /<title>.*?<\/title>\s*/g,
  /<meta name="description" content=".*?" \/>\s*/g,
  /<meta property="og:title" content=".*?" \/>\s*/g,
  /<meta property="og:description" content=".*?" \/>\s*/g,
  /<meta property="og:type" content=".*?" \/>\s*/g,
  /<meta name="twitter:card" content=".*?" \/>\s*/g
];

metaTagsToRemove.forEach(regex => {
  index = index.replace(regex, '');
});

// We should also put a default title just in case our injection fails?
// Let's rely on injection. The </head> replacement injects it.
// Actually, let's put a placeholder we replace so we don't end up without one if static served by accident.
const headEnd = '</head>';
index = index.replace(headEnd, '    <title>Call Me - Find Your Perfect Match</title>\n  </head>');

fs.writeFileSync('index.html', index);
console.log('Fixed index.html meta tags');
