const fs = require('fs');

const file = 'src/pages/AdminProfileEditPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Change sm:grid-cols-2 lg:grid-cols-3 to sm:grid-cols-2
content = content.replace(/grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3/g, 'grid grid-cols-1 md:grid-cols-2');

// Change text-xs to text-sm for larger inputs
content = content.replace(/text-xs/g, 'text-sm');
content = content.replace(/py-2\.5/g, 'py-3');
content = content.replace(/py-2/g, 'py-3');

fs.writeFileSync(file, content);
console.log('Fixed grids and text sizes');
