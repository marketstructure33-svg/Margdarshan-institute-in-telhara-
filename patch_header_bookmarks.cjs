const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf8');

code = code.replace(
  /\{ id: 'home', label: 'Home' \},/,
  "{ id: 'home', label: 'Home' },\n  { id: 'bookmarks', label: 'Bookmarks' },"
);

fs.writeFileSync('src/components/Header.tsx', code);
