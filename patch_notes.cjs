const fs = require('fs');

let code = fs.readFileSync('src/components/sections/NotesSection.tsx', 'utf8');

if (!code.includes("import { GoogleGenAI }")) {
  code = code.replace(
    /import \{ doc, getDoc \} from 'firebase\/firestore';/,
    "import { doc, getDoc } from 'firebase/firestore';\nimport { GoogleGenAI } from '@google/genai';"
  );
}

const generateQuizBlockRegex = /const response = await fetch\('\/api\/generate-quiz', \{[\s\S]*?\}\);[\s\S]*?const data = await response\.json\(\);/;

const generateQuizLogic = `
      if (!apiKey) {
        throw new Error("API Key is missing. Please contact admin to configure it.");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const prompt = \`Based on the following class notes titled "\${note.title}", generate a 5-question multiple choice practice quiz.
    Format the output in clean Markdown. Include an answer key at the very bottom.
    
    Class Notes:
    \${note.content}\`;
      
      const res = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const data = { quiz: res.text };
`;

code = code.replace(generateQuizBlockRegex, generateQuizLogic.trim());


const aiTutorBlockRegex = /const response = await fetch\('\/api\/ai-tutor', \{[\s\S]*?\}\);[\s\S]*?const data = await response\.json\(\);/;

const aiTutorLogic = `
      if (!apiKey) {
        throw new Error("API Key is missing. Please contact admin to configure it.");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const prompt = \`Act as an AI Tutor for \${note.subject}. Based on the following class notes titled "\${note.title}", provide a clear, subject-specific explanation of the key concepts and 3 practical study tips to master this material. Format the output in clean Markdown.

    Class Notes:
    \${note.content}\`;
      
      const res = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const data = { explanation: res.text };
`;

code = code.replace(aiTutorBlockRegex, aiTutorLogic.trim());
fs.writeFileSync('src/components/sections/NotesSection.tsx', code);
