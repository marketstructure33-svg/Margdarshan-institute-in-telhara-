const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminScheduleMaker.tsx', 'utf8');

code = code.replace(/\\\$\{/g, '${');
code = code.replace(/\\`/g, '`');

fs.writeFileSync('src/components/admin/AdminScheduleMaker.tsx', code);
