const fs = require('fs');
let code = fs.readFileSync('src/components/sections/AIChatSection.tsx', 'utf8');

code = code.replace(
  /const res = await fetch\([\s\S]*?\n\s*\}\);\s*if \(!res\.ok\)/,
  `const res = await fetch('/api/gemini-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: formattedMessages.map(m => {
            const out = { role: m.role };
            if (m.parts[0]?.text) out.text = m.parts[0].text;
            if (m.parts[0]?.inlineData) {
              out.image = m.parts[0].inlineData.data;
              out.imageType = m.parts[0].inlineData.mimeType;
            }
            return out;
          }),
          systemInstruction: 'You are the Margdarshan AI Tutor, an intelligent and helpful virtual assistant for students. Provide accurate, encouraging, and clear answers.',
          temperature: 0.7,
          apiKey
        })
      });
      if (!res.ok)`
);
code = code.replace(
  /const replyText = data\.candidates\?\.\[0\]\?\.content\?\.parts\?\.\[0\]\?\.text;/g,
  `const replyText = data.text;`
);

fs.writeFileSync('src/components/sections/AIChatSection.tsx', code);
