const fs = require('fs');

const file = 'src/pages/AdminProfileEditPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace handleNameChange to auto-generate slug with profession if available
const nameChangeOld = `
  const handleNameChange = (name: string) => {
    const slugified = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    setProfile((prev) => ({
      ...prev,
      fullName: name,
      slug: isNew && (!prev.slug || prev.slug === '') ? slugified : prev.slug
    }));
  };
`;
const nameChangeNew = `
  const handleNameChange = (name: string) => {
    setProfile((prev) => ({
      ...prev,
      fullName: name
    }));
  };
`;
content = content.replace(nameChangeOld.trim(), nameChangeNew.trim());

// We also need to change handleSave to generate slug
const handleSaveOld = `
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.fullName.trim() || !profile.slug.trim()) {
      setError('Please provide a Full Name and unique URL Slug.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const profileId = profile.id || \`prof-\${profile.slug.replace(/[^a-zA-Z0-9-]/g, '') || Date.now()}\`;
`;

const handleSaveNew = `
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.fullName.trim()) {
      setError('Please provide a Full Name.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const generatedSlug = profile.slug || \`\${profile.fullName} \${profile.profession || ''}\`
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const profileId = profile.id || \`prof-\${generatedSlug.replace(/[^a-zA-Z0-9-]/g, '') || Date.now()}\`;
      
      const updatedProfile = { ...profile, slug: generatedSlug };
`;
content = content.replace(handleSaveOld.trim(), handleSaveNew.trim());

// And replace `const dataToSave = { ...profile,` with `const dataToSave = { ...updatedProfile,`
content = content.replace('const dataToSave = {\n        ...profile,\n        id: profileId,', 'const dataToSave = {\n        ...updatedProfile,\n        id: profileId,');

// Delete Slug Input
const slugInputRegex = /<div>\s*<label className="block text-slate-300 font-semibold mb-1\.5">Unique URL Slug \*\<\/label>\s*<div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-2\.5 text-slate-400 font-mono text-xs focus-within:border-rose-500">\s*<span className="text-slate-500">\/profile\/<\/span>\s*<input\s*type="text"\s*required\s*value=\{profile\.slug\}\s*onChange=\{\(e\) => setProfile\(\{ \.\.\.profile, slug: e\.target\.value \}\)\}\s*placeholder="elena-vance-physician"\s*className="bg-transparent text-white outline-none flex-1 font-mono"\s*\/>\s*<\/div>\s*<\/div>/;
content = content.replace(slugInputRegex, '');

// Delete Religion Input
const religionInputRegex = /<div>\s*<label className="block text-slate-300 font-semibold mb-1\.5">Religion \/ Beliefs<\/label>\s*<input\s*type="text"\s*value=\{profile\.religion \|\| ''\}\s*onChange=\{\(e\) => setProfile\(\{ \.\.\.profile, religion: e\.target\.value \}\)\}\s*placeholder="e\.g\. Hindu \/ Progressive"\s*className="w-full px-3\.5 py-2\.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-rose-500"\s*\/>\s*<\/div>/;
content = content.replace(religionInputRegex, '');

// Replace Bio and Proposal
const bioRegex = /\{\/\* Bio & Proposal Message \*\/\}\s*<div className="pt-3 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">\s*<div>\s*<label className="block text-slate-300 font-semibold mb-1\.5">Full Biography<\/label>\s*<textarea\s*rows=\{4\}\s*value=\{profile\.bio\}\s*onChange=\{\(e\) => setProfile\(\{ \.\.\.profile, bio: e\.target\.value \}\)\}\s*placeholder="Share personal background, daily rhythm, interests, and family values\.\.\."\s*className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-rose-500 text-xs leading-relaxed"\s*\/>\s*<\/div>\s*<div>\s*<label className="block text-slate-300 font-semibold mb-1\.5">\s*Personal Matrimonial Proposal Message\s*<\/label>\s*<textarea\s*rows=\{4\}\s*value=\{profile\.proposalMessage\}\s*onChange=\{\(e\) => setProfile\(\{ \.\.\.profile, proposalMessage: e\.target\.value \}\)\}\s*placeholder="What is your philosophy on marriage and what kind of companionship are you looking for\?"\s*className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-rose-500 text-xs leading-relaxed"\s*\/>\s*<\/div>\s*<\/div>/;

const newBio = `{/* Bio */}
            <div className="pt-3 border-t border-slate-800">
              <label className="block text-slate-300 font-semibold mb-1.5">Short Bio</label>
              <textarea
                rows={4}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Share a short, compelling biography..."
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-rose-500 text-xs leading-relaxed"
              />
            </div>`;
content = content.replace(bioRegex, newBio);

// Delete Phone, Insta, LinkedIn
const phoneRegex = /<div>\s*<label className="block text-slate-300 font-semibold mb-1\.5">Phone Number<\/label>\s*<input\s*type="text"\s*value=\{profile\.publicContact\?\.phone \|\| ''\}\s*onChange=\{\(e\) =>\s*setProfile\(\{\s*\.\.\.profile,\s*publicContact: \{ \.\.\.profile\.publicContact, phone: e\.target\.value \}\s*\}\)\s*\}\s*placeholder="\+1 \(617\) 555-0142"\s*className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-rose-500"\s*\/>\s*<\/div>\s*<div>\s*<label className="block text-slate-300 font-semibold mb-1\.5">Instagram Handle<\/label>\s*<input\s*type="text"\s*value=\{profile\.publicContact\?\.instagram \|\| ''\}\s*onChange=\{\(e\) =>\s*setProfile\(\{\s*\.\.\.profile,\s*publicContact: \{ \.\.\.profile\.publicContact, instagram: e\.target\.value \}\s*\}\)\s*\}\s*placeholder="@candidate\.profile"\s*className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-rose-500"\s*\/>\s*<\/div>\s*<div>\s*<label className="block text-slate-300 font-semibold mb-1\.5">LinkedIn URL<\/label>\s*<input\s*type="text"\s*value=\{profile\.publicContact\?\.linkedin \|\| ''\}\s*onChange=\{\(e\) =>\s*setProfile\(\{\s*\.\.\.profile,\s*publicContact: \{ \.\.\.profile\.publicContact, linkedin: e\.target\.value \}\s*\}\)\s*\}\s*placeholder="https:\/\/linkedin\.com\/in\/\.\.\."\s*className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-rose-500"\s*\/>\s*<\/div>/;
content = content.replace(phoneRegex, '');

// Delete Slide Quote
const quoteRegex = /<div>\s*<label className="block text-slate-400 mb-1">Highlight Quote \(Optional\)<\/label>\s*<input\s*type="text"\s*value=\{slide\.quote \|\| ''\}\s*onChange=\{\(e\) => handleSlideChange\(sIdx, 'quote', e\.target\.value\)\}\s*placeholder='"Success is waking up excited\."'\s*className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-rose-500 italic"\s*\/>\s*<\/div>/;
content = content.replace(quoteRegex, '');

// Also check adding slide logic to ensure max chapters
const addSlideOld = `
  const handleAddSlide = () => {
    const newSlide: StorySlide = {
`;
const addSlideNew = `
  const handleAddSlide = () => {
    if ((profile.story?.slides?.length || 0) >= 4) {
      setError('Maximum 4 chapters allowed.');
      return;
    }
    const newSlide: StorySlide = {
`;
content = content.replace(addSlideOld.trim(), addSlideNew.trim());

// And hide the Add Slide button if >= 4
content = content.replace(
  '<button\n                type="button"\n                onClick={handleAddSlide}',
  '{((profile.story?.slides?.length || 0) < 4) && (<button\n                type="button"\n                onClick={handleAddSlide}'
);
content = content.replace(
  '<span>Add Story Chapter</span>\n              </button>',
  '<span>Add Story Chapter</span>\n              </button>)}'
);

fs.writeFileSync(file, content);
console.log('Admin Profile Edit Page Simplified.');
