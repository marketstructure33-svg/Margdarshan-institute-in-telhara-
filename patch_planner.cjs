const fs = require('fs');

let code = fs.readFileSync('src/components/sections/AIStudyPlannerSection.tsx', 'utf8');

if (!code.includes("import { GoogleGenAI }")) {
  code = code.replace(
    /import \{ doc, getDoc \} from 'firebase\/firestore';/,
    "import { doc, getDoc } from 'firebase/firestore';\nimport { GoogleGenAI } from '@google/genai';"
  );
}

const fetchBlockRegex = /const response = await fetch\('\/api\/study-planner', \{[\s\S]*?\}\);[\s\S]*?const data = await response\.json\(\);/;

const newLogic = `
      if (!apiKey) {
        throw new Error("API Key is missing. Please contact admin to configure it.");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const prompt = \`Generate a personalized, structured 7-day study schedule for a student in \${selectedClass} studying \${selectedSubject}. 
       Include specific topics to cover each day, practical exercises, and review sessions. 
       Format the response in clean Markdown with clear headings and bullet points.\`;
      
      const res = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const data = { schedule: res.text };
`;

code = code.replace(fetchBlockRegex, newLogic.trim());
fs.writeFileSync('src/components/sections/AIStudyPlannerSection.tsx', code);
