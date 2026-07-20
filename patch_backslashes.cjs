const fs = require('fs');

const files = [
  'src/components/sections/BookmarksSection.tsx',
  'src/components/sections/VideoSection.tsx',
  'src/components/sections/PdfSection.tsx',
  'src/components/sections/NotesSection.tsx'
];

for (const file of files) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/\\\$\{/g, '${');
  code = code.replace(/\\`/g, '`');
  fs.writeFileSync(file, code);
}
