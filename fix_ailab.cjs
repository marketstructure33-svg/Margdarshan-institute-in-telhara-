const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminAILab.tsx', 'utf8');

const regex = /const chatMessages = \[\.\.\.messages, newUserMessage\]\.map\(m => \{\n        const parts: any\[\] = \[\];[\s\S]*?const chatMessages = \[\.\.\.messages, newUserMessage\]\.map\(m => \(\{/g;

code = code.replace(/const chatMessages = \[\.\.\.messages, newUserMessage\]\.map\(m => \{\n        const parts: any\[\] = \[\];[\s\S]*?body: JSON\.stringify\(\{/g, `body: JSON.stringify({`);

fs.writeFileSync('src/components/admin/AdminAILab.tsx', code);
