const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

code = code.replace(
  /bookmarks\?: string\[\];\s*\}/,
  "bookmarks?: string[];\n  completedMaterials?: string[];\n}"
);

fs.writeFileSync('src/types.ts', code);
