const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '..', 'dist');
const entryPath = path.join(distDir, 'main.js');
const typesPath = path.join(distDir, 'main.d.ts');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const banner = `require('./backend/src/main');\n`;
fs.writeFileSync(entryPath, banner);
fs.writeFileSync(typesPath, 'export {};');

console.log(`[ensure-dist-entry] Created stub at ${entryPath}`);
