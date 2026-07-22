const fs = require('fs');

const files = [
  'src/components/admin/AdminAILab.tsx',
  'src/components/sections/AIChatSection.tsx',
  'src/components/sections/NoticeChatSection.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');

  code = code.replace(
    /messages: formattedMessages\.map\(m => \{[\s\S]*?return out;\s*\}\),/,
    `messages: formattedMessages.map(m => {
            const out: any = { role: m.role };
            const textPart = m.parts.find((p: any) => p.text);
            const imagePart = m.parts.find((p: any) => p.inlineData);
            if (textPart) out.text = textPart.text;
            if (imagePart) {
              out.image = imagePart.inlineData.data;
              out.imageType = imagePart.inlineData.mimeType;
            }
            return out;
          }),`
  );
  
  fs.writeFileSync(file, code);
});
