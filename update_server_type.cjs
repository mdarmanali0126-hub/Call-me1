const fs = require('fs');
let content = fs.readFileSync('server/app.ts', 'utf8');

// The error is in:
// pendingAdFetchPromise = new Promise((resolve) => {
// We should cast resolve or use: new Promise<AdvertisingSettings>((resolve) => {

content = content.replace('pendingAdFetchPromise = new Promise((resolve) => {', 'pendingAdFetchPromise = new Promise<AdvertisingSettings>((resolve) => {');

fs.writeFileSync('server/app.ts', content);
