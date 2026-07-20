const fs = require('fs');

// AdminAILab.tsx
let adminLab = fs.readFileSync('src/components/admin/AdminAILab.tsx', 'utf8');
adminLab = adminLab.replace(
  /const out = \{ role: m\.role \};/g,
  `const out: any = { role: m.role };`
);
adminLab = adminLab.replace(
  /systemInstruction,\s*temperature,/g,
  `systemInstruction: 'You are a helpful AI assistant.',\n          temperature: 0.7,`
);
fs.writeFileSync('src/components/admin/AdminAILab.tsx', adminLab);

// AIChatSection.tsx
let aiChat = fs.readFileSync('src/components/sections/AIChatSection.tsx', 'utf8');
aiChat = aiChat.replace(
  /const out = \{ role: m\.role \};/g,
  `const out: any = { role: m.role };`
);
fs.writeFileSync('src/components/sections/AIChatSection.tsx', aiChat);

// NoticeChatSection.tsx
let notice = fs.readFileSync('src/components/sections/NoticeChatSection.tsx', 'utf8');
notice = notice.replace(
  /const out = \{ role: m\.role \};/g,
  `const out: any = { role: m.role };`
);
fs.writeFileSync('src/components/sections/NoticeChatSection.tsx', notice);

