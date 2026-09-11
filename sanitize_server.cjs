const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

const sanitizerFunc = `
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
       .replace(/&/g, "&amp;")
       .replace(/</g, "&lt;")
       .replace(/>/g, "&gt;")
       .replace(/"/g, "&quot;")
       .replace(/'/g, "&#039;")
       .replace(/\\n/g, " ");
}

async function injectOpenGraphTags(html, url) {
`;

server = server.replace('async function injectOpenGraphTags(html, url) {', sanitizerFunc);

// Then wrap variables in escapeHtml when constructing ogTags
const ogTagsOld = `
  const ogTags = \`
    <meta property="og:title" content="\${title}" />
    <meta property="og:description" content="\${description}" />
    <meta property="og:image" content="\${image}" />
    <meta property="og:url" content="\${ogUrl}" />
    <meta property="og:type" content="\${ogType}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="\${title}" />
    <meta name="twitter:description" content="\${description}" />
    <meta name="twitter:image" content="\${image}" />
    <title>\${title}</title>
  \`;
`;

const ogTagsNew = `
  const ogTags = \`
    <meta property="og:title" content="\${escapeHtml(title)}" />
    <meta property="og:description" content="\${escapeHtml(description)}" />
    <meta property="og:image" content="\${escapeHtml(image)}" />
    <meta property="og:url" content="\${escapeHtml(ogUrl)}" />
    <meta property="og:type" content="\${escapeHtml(ogType)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="\${escapeHtml(title)}" />
    <meta name="twitter:description" content="\${escapeHtml(description)}" />
    <meta name="twitter:image" content="\${escapeHtml(image)}" />
    <title>\${escapeHtml(title)}</title>
  \`;
`;

server = server.replace(ogTagsOld.trim(), ogTagsNew.trim());

fs.writeFileSync('server.ts', server);
console.log('Sanitized server.ts OG tags');
