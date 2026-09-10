const fs = require('fs');
const file = 'src/pages/AdminLoginPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Initial State
content = content.replace(
  /const \[email, setEmail\] = useState\('mdarmanali0126@gmail\.com'\);/g,
  "const [email, setEmail] = useState('');"
);

// 2. Error message in handleGoogleSignIn
content = content.replace(
  /Please choose mdarmanali0126@gmail\.com in the Google prompt\./g,
  "Please choose the correct administrator account."
);

// 3. Line 130 Text
content = content.replace(
  /<span className="text-rose-300 font-medium font-mono">mdarmanali0126@gmail\.com<\/span>\./g,
  '<span className="text-rose-300 font-medium font-mono">Authorized administrator access</span>.'
);

// 4. Line 241 Switch Text
content = content.replace(
  /<span>Switch to mdarmanali0126@gmail\.com<\/span>/g,
  '<span>Switch to authorized account</span>'
);

// 5. Line 297 Button Text
content = content.replace(
  /<span>Sign In with Google \(mdarmanali0126@gmail\.com\)<\/span>/g,
  '<span>Sign in with Google</span>'
);

// 6. Line 335 Placeholder
content = content.replace(
  /placeholder="mdarmanali0126@gmail\.com"/g,
  'placeholder="admin@example.com"'
);

fs.writeFileSync(file, content);
console.log("Updated AdminLoginPage");
