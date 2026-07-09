const fs = require('fs');

let code = fs.readFileSync('src/components/sections/NotesSection.tsx', 'utf8');
code = code.replace(/import \{ GoogleGenAI \} from '@google\/genai';\n/g, '');

const quizRegex = /if \(!apiKey\) \{[\s\S]*?const data = \{ quiz: res\.text \};/g;
const quizLogic = `
      if (!apiKey) {
        throw new Error("API Key is missing. Please contact admin to configure it.");
      }
      
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          noteContent: note.content,
          title: note.title,
          apiKey: apiKey
        }),
      });
      if (!response.ok) throw new Error("Failed to get response");
      const data = await response.json();
`;
code = code.replace(quizRegex, quizLogic.trim());

const tutorRegex = /if \(!apiKey\) \{[\s\S]*?const data = \{ explanation: res\.text \};/g;
const tutorLogic = `
      if (!apiKey) {
        throw new Error("API Key is missing. Please contact admin to configure it.");
      }
      
      const response = await fetch('/api/ai-tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          noteContent: note.content,
          title: note.title,
          subject: note.subject,
          apiKey: apiKey
        }),
      });
      if (!response.ok) throw new Error("Failed to get response");
      const data = await response.json();
`;
code = code.replace(tutorRegex, tutorLogic.trim());

fs.writeFileSync('src/components/sections/NotesSection.tsx', code);
