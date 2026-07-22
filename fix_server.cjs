const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/let formattedMessages = messages\.map/g, 'const formattedMessages = messages ? messages.map : () => [];');

// Remove all instances of the while loop
code = code.replace(
  /\/\/ Gemini API requires the first message to be from 'user'\s*while \(typeof formattedMessages !== 'undefined' && formattedMessages\.length > 0 && formattedMessages\[0\]\.role === 'model'\) \{\s*formattedMessages\.shift\(\);\s*\}/g,
  ''
);

// I will just replace the specific loop text
code = code.replace(
  /\/\/ Gemini API requires the first message to be from 'user'\s*while \(formattedMessages\.length > 0 && formattedMessages\[0\]\.role === 'model'\) \{\s*formattedMessages\.shift\(\);\s*\}/g,
  ''
);

fs.writeFileSync('server.ts', code);
