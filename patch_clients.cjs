const fs = require('fs');

// AIChatSection.tsx
let aiChat = fs.readFileSync('src/components/sections/AIChatSection.tsx', 'utf8');
aiChat = aiChat.replace(
  /const res = await fetch\(`https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\/\$\{modelToUse\}:generateContent\?key=\$\{apiKey\}`,\s*\{\s*method:\s*'POST',\s*headers:\s*\{\s*'Content-Type':\s*'application\/json'\s*\},\s*body:\s*JSON\.stringify\(\{\s*contents:\s*formattedMessages,\s*systemInstruction:\s*\{\s*parts:\s*\[\{\s*text:\s*sysInstruction\s*\}\]\s*\}\s*\}\)\s*\}\);/g,
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
          systemInstruction: sysInstruction,
          apiKey
        })
      });`
);
fs.writeFileSync('src/components/sections/AIChatSection.tsx', aiChat);

// NotesSection.tsx
let notes = fs.readFileSync('src/components/sections/NotesSection.tsx', 'utf8');
notes = notes.replace(
  /const response = await fetch\(`https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-3\.5-flash:generateContent\?key=\$\{apiKey\}`,\s*\{\s*method:\s*'POST',\s*headers:\s*\{\s*'Content-Type':\s*'application\/json'\s*\},\s*body:\s*JSON\.stringify\(\{\s*contents:\s*\[\{\s*role:\s*'user',\s*parts:\s*\[\{\s*text:\s*prompt\s*\}\]\s*\}\],\s*tools:\s*\[\{\s*googleSearch:\s*\{\}\s*\}\]\s*\}\)\s*\}\);/g,
  `const response = await fetch(prompt.includes('practice quiz') ? '/api/generate-quiz' : '/api/ai-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: note.title,
          noteContent: note.content,
          subject: note.subject,
          apiKey
        })
      });`
);
// Fix the text extraction for NotesSection
notes = notes.replace(
  /const replyText = data\.candidates\?\.\[0\]\?\.content\?\.parts\?\.\[0\]\?\.text;/g,
  `const replyText = data.quiz || data.explanation;`
);
fs.writeFileSync('src/components/sections/NotesSection.tsx', notes);

// AIStudyPlannerSection.tsx
let planner = fs.readFileSync('src/components/sections/AIStudyPlannerSection.tsx', 'utf8');
planner = planner.replace(
  /const response = await fetch\(`https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-3\.5-flash:generateContent\?key=\$\{apiKey\}`,\s*\{\s*method:\s*'POST',\s*headers:\s*\{\s*'Content-Type':\s*'application\/json'\s*\},\s*body:\s*JSON\.stringify\(\{\s*contents:\s*\[\{\s*role:\s*'user',\s*parts:\s*\[\{\s*text:\s*prompt\s*\}\]\s*\}\],\s*tools:\s*\[\{\s*googleSearch:\s*\{\}\s*\}\]\s*\}\)\s*\}\);/g,
  `const response = await fetch('/api/study-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedClass,
          selectedSubject,
          apiKey
        })
      });`
);
planner = planner.replace(
  /const replyText = data\.candidates\?\.\[0\]\?\.content\?\.parts\?\.\[0\]\?\.text;/g,
  `const replyText = data.schedule;`
);
fs.writeFileSync('src/components/sections/AIStudyPlannerSection.tsx', planner);

// NoticeChatSection.tsx
let notice = fs.readFileSync('src/components/sections/NoticeChatSection.tsx', 'utf8');
notice = notice.replace(
  /const res = await fetch\(`https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-3\.1-flash-lite:generateContent\?key=\$\{apiKey\}`,\s*\{\s*method:\s*'POST',\s*headers:\s*\{\s*'Content-Type':\s*'application\/json'\s*\},\s*body:\s*JSON\.stringify\(\{\s*contents:\s*formattedMessages,\s*systemInstruction:\s*\{\s*parts:\s*\[\{\s*text:\s*'You are a helpful AI assistant for the Margdarshan Institute notice board\. Answer questions clearly based on the provided context\.'\s*\}\]\s*\}\s*\}\)\s*\}\);/g,
  `const res = await fetch('/api/gemini-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: formattedMessages.map(m => {
            const out = { role: m.role };
            if (m.parts[0]?.text) out.text = m.parts[0].text;
            return out;
          }),
          systemInstruction: 'You are a helpful AI assistant for the Margdarshan Institute notice board. Answer questions clearly based on the provided context.',
          apiKey
        })
      });`
);
// Fix text extraction
notice = notice.replace(
  /const replyText = data\.candidates\?\.\[0\]\?\.content\?\.parts\?\.\[0\]\?\.text;/g,
  `const replyText = data.text;`
);
fs.writeFileSync('src/components/sections/NoticeChatSection.tsx', notice);

// AnalyticsSection.tsx
let analytics = fs.readFileSync('src/components/sections/AnalyticsSection.tsx', 'utf8');
analytics = analytics.replace(
  /const response = await fetch\(`https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-3\.5-flash:generateContent\?key=\$\{apiKey\}`,\s*\{\s*method:\s*'POST',\s*headers:\s*\{\s*'Content-Type':\s*'application\/json'\s*\},\s*body:\s*JSON\.stringify\(\{\s*contents:\s*\[\{\s*role:\s*'user',\s*parts:\s*\[\{\s*text:\s*prompt\s*\}\]\s*\}\]\s*\}\)\s*\}\);/g,
  `const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: mockPerformanceData,
          apiKey
        })
      });`
);
analytics = analytics.replace(
  /const replyText = data\.candidates\?\.\[0\]\?\.content\?\.parts\?\.\[0\]\?\.text;/g,
  `const replyText = data.text;`
);
fs.writeFileSync('src/components/sections/AnalyticsSection.tsx', analytics);

// AdminAILab.tsx
let adminAILab = fs.readFileSync('src/components/admin/AdminAILab.tsx', 'utf8');
adminAILab = adminAILab.replace(
  /const res = await fetch\(`https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\/\$\{modelToUse\}:generateContent\?key=\$\{apiKey\}`,\s*\{\s*method:\s*'POST',\s*headers:\s*\{\s*'Content-Type':\s*'application\/json'\s*\},\s*body:\s*JSON\.stringify\(\{\s*contents:\s*formattedMessages,\s*systemInstruction:\s*\{\s*parts:\s*\[\{\s*text:\s*systemInstruction\s*\}\]\s*\}\s*\}\)\s*\}\);/g,
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
          systemInstruction,
          temperature,
          apiKey
        })
      });`
);
adminAILab = adminAILab.replace(
  /const replyText = data\.candidates\?\.\[0\]\?\.content\?\.parts\?\.\[0\]\?\.text;/g,
  `const replyText = data.text;`
);
fs.writeFileSync('src/components/admin/AdminAILab.tsx', adminAILab);

