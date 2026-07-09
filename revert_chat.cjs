const fs = require('fs');

function patchFile(filepath, systemInstruction) {
  let code = fs.readFileSync(filepath, 'utf8');
  code = code.replace(/import \{ GoogleGenAI \} from '@google\/genai';\n/g, '');

  const regex = /if \(!apiKey\) \{[\s\S]*?const data = \{ text: response\.text \};/g;

  const newLogic = `
      if (!apiKey) {
        throw new Error("API Key is missing. Please contact admin to configure it.");
      }
      
      const res = await fetch('/api/gemini-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey,
          messages: chatMessages,
          systemInstruction: '${systemInstruction}'
        })
      });
      
      if (!res.ok) throw new Error("Failed to get response");
      const data = await res.json();
`;

  code = code.replace(regex, newLogic.trim());
  fs.writeFileSync(filepath, code);
}

patchFile('src/components/sections/AIChatSection.tsx', 'You are the Margdarshan AI Tutor, an intelligent and helpful virtual assistant for students. Provide accurate, encouraging, and clear answers.');
patchFile('src/components/sections/NoticeChatSection.tsx', 'You are a helpful AI assistant for the Margdarshan Institute notice board. Answer questions clearly based on the provided context.');
