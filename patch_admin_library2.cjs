const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminContentLibrary.tsx', 'utf8');

code = code.replace(
  /<option value="Note">Notes Only<\/option>\s*<option value="Notice">Notices Only<\/option>/,
  `<option value="Note">Notes Only</option>\n            <option value="Video">Videos Only</option>\n            <option value="Notice">Notices Only</option>`
);

fs.writeFileSync('src/components/admin/AdminContentLibrary.tsx', code);
