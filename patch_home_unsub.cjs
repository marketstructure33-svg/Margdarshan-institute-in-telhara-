const fs = require('fs');
let code = fs.readFileSync('src/components/sections/HomeSection.tsx', 'utf8');

// First, fix the return of the first useEffect
code = code.replace(
  /return \(\) => unsub2\(\);/,
  "return () => {\n      unsubSettings();\n      unsub2();\n    };"
);

// Second, fix the return of the second useEffect
code = code.replace(
  /return \(\) => \{\s*unsub\(\);\s*unsubSettings\(\);\s*\};/,
  "return () => unsub();"
);

fs.writeFileSync('src/components/sections/HomeSection.tsx', code);
