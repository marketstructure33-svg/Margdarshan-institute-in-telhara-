const fs = require('fs');
let code = fs.readFileSync('src/components/sections/HomeSection.tsx', 'utf8');

code = code.replace(
  /<\/button>\s*<\/div>\s*\{\/\* Recent Views \*\/\}/,
  "</button>\n      )}\n      </div>\n\n      {/* Recent Views */}"
);

fs.writeFileSync('src/components/sections/HomeSection.tsx', code);
