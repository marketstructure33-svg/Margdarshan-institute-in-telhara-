const fs = require('fs');

const filesToPatch = [
  'src/components/sections/AIChatSection.tsx',
  'src/components/admin/AdminAILab.tsx',
  'src/components/sections/NoticeChatSection.tsx'
];

filesToPatch.forEach(file => {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');

  // Replace data.candidates with data.text
  code = code.replace(/const replyText = data\.candidates\?\.\[0\]\?\.content\?\.parts\?\.\[0\]\?\.text \|\| "I couldn't generate a response\.";/g, 'const replyText = data.text || "I couldn\'t generate a response.";');

  fs.writeFileSync(file, code);
});
