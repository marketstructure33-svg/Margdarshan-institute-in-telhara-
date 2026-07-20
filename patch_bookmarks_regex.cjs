const fs = require('fs');
let code = fs.readFileSync('src/components/sections/BookmarksSection.tsx', 'utf8');

code = code.replace(
  /className=\{\\`p-2 rounded-lg shrink-0 \\\$\{/g,
  "className={`p-2 rounded-lg shrink-0 ${"
);

code = code.replace(/\\`\}/g, "`}");

fs.writeFileSync('src/components/sections/BookmarksSection.tsx', code);
