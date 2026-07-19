const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');

code = code.replace("globPatterns: ['**/*.{js,css,html,ico,png,svg}']", "globPatterns: ['**/*.{js,css,html,ico,png,svg}'],\n          maximumFileSizeToCacheInBytes: 5000000");
fs.writeFileSync('vite.config.ts', code);
