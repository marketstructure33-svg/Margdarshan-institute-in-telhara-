const fs = require('fs');

function patchFile(filepath, systemInstruction, type) {
  let code = fs.readFileSync(filepath, 'utf8');

  if (!code.includes("import { GoogleGenAI }")) {
    code = code.replace(
      /import \{ doc, getDoc \} from 'firebase\/firestore';/,
      "import { doc, getDoc } from 'firebase/firestore';\nimport { GoogleGenAI } from '@google/genai';"
    );
  }
  
  if (type === 'chat') {
      const fetchBlockRegex = /const res = await fetch\('\/api\/gemini-chat', \{[\s\S]*?\}\);[\s\S]*?const data = await res\.json\(\);/;
      const newLogic = `
      if (!apiKey) {
        throw new Error("API Key is missing. Please contact admin to configure it.");
      }
      const ai = new GoogleGenAI({ apiKey });
      
      const formattedMessages = chatMessages.map((m: any) => {
          const parts: any[] = [];
          if (m.text) parts.push({ text: m.text });
          if (m.image) {
              let base64Data = m.image;
              if (base64Data.includes(',')) {
                  base64Data = base64Data.split(',')[1];
              }
              parts.push({
                  inlineData: {
                      data: base64Data,
                      mimeType: m.imageType || 'image/jpeg'
                  }
              });
          }
          return { role: m.role === 'model' ? 'model' : 'user', parts };
      });

      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: formattedMessages,
          config: {
              systemInstruction: '${systemInstruction}'
          }
      });
      
      const data = { text: response.text };
`;
      code = code.replace(fetchBlockRegex, newLogic.trim());
  }

  fs.writeFileSync(filepath, code);
}

patchFile('src/components/sections/AIChatSection.tsx', 'You are the Margdarshan AI Tutor, an intelligent and helpful virtual assistant for students. Provide accurate, encouraging, and clear answers.', 'chat');
patchFile('src/components/sections/NoticeChatSection.tsx', 'You are a helpful AI assistant for the Margdarshan Institute notice board. Answer questions clearly based on the provided context.', 'chat');

