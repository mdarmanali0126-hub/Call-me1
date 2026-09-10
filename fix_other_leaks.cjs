const fs = require('fs');

function replaceFile(file, replacements) {
  let content = fs.readFileSync(file, 'utf8');
  for (const r of replacements) {
    content = content.replace(r.search, r.replace);
  }
  fs.writeFileSync(file, content);
}

// 1. firestoreService.ts
replaceFile('src/lib/firestoreService.ts', [
  {
    search: /provider\.setCustomParameters\(\{\s*prompt:\s*'select_account',\s*login_hint:\s*'mdarmanali0126@gmail\.com'\s*\}\);/g,
    replace: "provider.setCustomParameters({ prompt: 'select_account' });"
  }
]);

// 2. AdminProtectedRoute.tsx
replaceFile('src/components/AdminProtectedRoute.tsx', [
  {
    search: /<code className="text-rose-300 font-mono text-\[11px\]">mdarmanali0126@gmail\.com<\/code>/g,
    replace: '<code className="text-rose-300 font-mono text-[11px]">Authorized account</code>'
  },
  {
    search: /<span>Sign in with mdarmanali0126@gmail\.com<\/span>/g,
    replace: '<span>Sign in with authorized account</span>'
  }
]);

// 3. AdminDashboardPage.tsx
replaceFile('src/pages/AdminDashboardPage.tsx', [
  {
    search: /<span className="text-emerald-300 font-semibold">\{user\?\.email \|\| 'mdarmanali0126@gmail\.com'\}<\/span>/g,
    replace: '<span className="text-emerald-300 font-semibold">{user?.email || \'Authorized Admin\'}</span>'
  }
]);

console.log("Fixed other leaks");
