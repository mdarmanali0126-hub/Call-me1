const fs = require('fs');
const file = 'src/pages/AdminProfileEditPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove SECTION 3 UI
const section3Regex = /\{\/\* SECTION 3: Interactive Story Mode Content Builder \*\/\}[\s\S]*?(?=\{\/\* Bottom Save Bar \*\/\})/g;
content = content.replace(section3Regex, '');

// Remove handler functions
const handleAddSlideRegex = /const handleAddSlide = \(\) => \{[\s\S]*?\}\;\n/g;
content = content.replace(handleAddSlideRegex, '');

const handleRemoveSlideRegex = /const handleRemoveSlide = \([^\)]+\) => \{[\s\S]*?\}\;\n/g;
content = content.replace(handleRemoveSlideRegex, '');

const handleSlideChangeRegex = /const handleSlideChange = \([^\)]+\) => \{[\s\S]*?\}\;\n/g;
content = content.replace(handleSlideChangeRegex, '');

fs.writeFileSync(file, content);
console.log('Story Mode section removed.');
