const fs = require('fs');

let code = fs.readFileSync('src/components/sections/AIStudyPlannerSection.tsx', 'utf8');
code = code.replace(/import \{ GoogleGenAI \} from '@google\/genai';\n/g, '');

const regex = /if \(!apiKey\) \{[\s\S]*?const data = \{ schedule: res\.text \};/g;

const newLogic = `
      if (!apiKey) {
        throw new Error("API Key is missing. Please contact admin to configure it.");
      }
      
      const response = await fetch('/api/study-planner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedClass, selectedSubject, apiKey }),
      });
      if (!response.ok) {
        throw new Error('Failed to generate study schedule');
      }
      const data = await response.json();
`;

code = code.replace(regex, newLogic.trim());
fs.writeFileSync('src/components/sections/AIStudyPlannerSection.tsx', code);
