const fs = require('fs');
const file = 'src/pages/AdminProfileEditPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const storyRegex = /\s*story: \{\s*title: 'Life, Values & Vision',\s*subtitle: 'A personal story portfolio',\s*slides: \[\s*\{\s*id: 'slide-1',\s*title: 'Foundations & Values',\s*text: 'What matters most to me is integrity, mutual respect, and building a peaceful, warm home together\.',\s*mediaUrl: SAMPLE_PORTRAITS\[0\],\s*quote: '"A meaningful life is built on genuine partnerships\."',\s*bgGradient: 'from-rose-950 via-slate-900 to-black'\s*\}\s*\]\s*\}/;

content = content.replace(storyRegex, '');

fs.writeFileSync(file, content);
console.log('Removed default story initialization');
