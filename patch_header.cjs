const fs = require('fs');

let code = fs.readFileSync('src/components/Header.tsx', 'utf8');

code = code.replace(
  /\{ id: 'home', label: 'Home' \},/,
  "{ id: 'home', label: 'Home' },\n  { id: 'video', label: 'Videos' },"
);

fs.writeFileSync('src/components/Header.tsx', code);
