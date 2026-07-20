const fs = require('fs');
let code = fs.readFileSync('src/components/sections/VideoSection.tsx', 'utf8');

code = code.replace(
  /url\.match\(\/\(\?:youtu\\\\\.be\\\\\/\|youtube\\\\\.com\\\\\/\(\?:embed\\\\\/\|v\\\\\/\|watch\\\\\?v=\|watch\\\\\?\.\+&v=\)\)\(\[\^&\?\\\\n\]\+\)\//,
  "url.match(/(?:youtu\\.be\\/|youtube\\.com\\/(?:embed\\/|v\\/|watch\\?v=|watch\\?.+&v=))([^&?\\n]+)/)"
);

fs.writeFileSync('src/components/sections/VideoSection.tsx', code);
