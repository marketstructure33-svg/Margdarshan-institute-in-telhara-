const fs = require('fs');

let code = fs.readFileSync('src/components/admin/AdminAILab.tsx', 'utf8');

code = code.replace(
  /const chatMessages = \[\.\.\.messages, newUserMessage\]\.map\(m => \(\{\n          role: m\.role,/g,
  "const finalChatMessages = [...messages, newUserMessage].map(m => ({\n          role: m.role,"
);

code = code.replace(
  /messages: chatMessages,\n          systemInstruction/g,
  "messages: finalChatMessages,\n          systemInstruction"
);

fs.writeFileSync('src/components/admin/AdminAILab.tsx', code);
