const fs = require('fs');

let code = fs.readFileSync('src/components/admin/AdminAILab.tsx', 'utf8');

if (!code.includes("import { GoogleGenAI }")) {
  code = code.replace(
    /import \{ doc, getDoc \} from 'firebase\/firestore';/,
    "import { doc, getDoc } from 'firebase/firestore';\nimport { GoogleGenAI } from '@google/genai';"
  );
}

const fetchBlockRegex = /const res = await fetch\('\/api\/gemini-chat', \{[\s\S]*?\}\);[\s\S]*?const data = await res\.json\(\);/;

const newLogic = `
      if (!apiKey) {
        throw new Error("API Key is missing. Please configure it in the Admin Settings.");
      }
      const ai = new GoogleGenAI({ apiKey });
      
      const formattedMessages = [...messages, newUserMessage].map(m => {
          const parts: any[] = [];
          if (m.text) parts.push({ text: m.text });
          if (m.base64Images?.[0]) {
              let base64Data = m.base64Images[0].data;
              if (base64Data.includes(',')) {
                  base64Data = base64Data.split(',')[1];
              }
              parts.push({
                  inlineData: {
                      data: base64Data,
                      mimeType: m.base64Images[0].mimeType
                  }
              });
          }
          return { role: m.role === 'model' ? 'model' : 'user', parts };
      });

      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: formattedMessages,
          config: {
              systemInstruction: 'You are an Executive AI assistant for school administration.'
          }
      });
      
      const data = { text: response.text };
`;

code = code.replace(fetchBlockRegex, newLogic.trim());
fs.writeFileSync('src/components/admin/AdminAILab.tsx', code);
