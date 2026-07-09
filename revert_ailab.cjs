const fs = require('fs');

let code = fs.readFileSync('src/components/admin/AdminAILab.tsx', 'utf8');
code = code.replace(/import \{ GoogleGenAI \} from '@google\/genai';\n/g, '');

const regex = /if \(!apiKey\) \{[\s\S]*?const data = \{ text: response\.text \};/g;

const newLogic = `
      if (!apiKey) {
        throw new Error("API Key is missing. Please configure it in the Admin Settings.");
      }
      
      const chatMessages = [...messages, newUserMessage].map(m => ({
          role: m.role,
          text: m.text,
          image: m.base64Images?.[0]?.data,
          imageType: m.base64Images?.[0]?.mimeType
      }));
      
      const res = await fetch('/api/gemini-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey,
          messages: chatMessages,
          systemInstruction: 'You are an Executive AI assistant for school administration.'
        })
      });
      
      if (!res.ok) throw new Error("Failed to get response");
      const data = await res.json();
`;

code = code.replace(regex, newLogic.trim());
fs.writeFileSync('src/components/admin/AdminAILab.tsx', code);
