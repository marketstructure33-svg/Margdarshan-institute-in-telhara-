const fs = require('fs');

let code = fs.readFileSync('src/components/sections/NotesSection.tsx', 'utf8');

// I'll manually recreate handleAITutor and fix handleGenerateQuiz
const handleGenerateQuizRegex = /const handleGenerateQuiz = async \(note: any, e: React\.MouseEvent\) => \{[\s\S]*?catch \(error: any\) \{[\s\S]*?\}\s*\};/g;

const newHandlers = `
  const handleGenerateQuiz = async (note: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuizNote(note);
    setQuizContent('');
    setGeneratingQuiz(true);
    try {
      if (!apiKey) {
        throw new Error("API Key is missing. Please contact admin to configure it.");
      }
      
      const prompt = \`Based on the following class notes titled "\${note.title}", generate a 5-question multiple choice practice quiz.
    Format the output in clean Markdown. Include an answer key at the very bottom.
    
    Class Notes:
    \${note.content}\`;
      
      const response = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=\${apiKey}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }]
        })
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || "Failed to generate quiz");
      }
      
      const data = await response.json();
      const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      setQuizContent(replyText);
    } catch (error: any) {
      console.error('Quiz Generation Error:', error);
      alert(error.message || 'Failed to generate quiz. Please try again.');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleAITutor = async (note: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setTutorNote(note);
    setTutorContent('');
    setGeneratingTutor(true);
    try {
      if (!apiKey) {
        throw new Error("API Key is missing. Please contact admin to configure it.");
      }
      
      const prompt = \`Act as an AI Tutor for \${note.subject}. Based on the following class notes titled "\${note.title}", provide a clear, subject-specific explanation of the key concepts and 3 practical study tips to master this material. Format the output in clean Markdown.

    Class Notes:
    \${note.content}\`;
      
      const response = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=\${apiKey}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }]
        })
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || "Failed to get tutor explanation");
      }
      
      const data = await response.json();
      const replyTextTutor = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      setTutorContent(replyTextTutor);
    } catch (error: any) {
      console.error('AI Tutor Error:', error);
      alert(error.message || 'Failed to get tutor explanation. Please try again.');
    } finally {
      setGeneratingTutor(false);
    }
  };
`;

code = code.replace(handleGenerateQuizRegex, newHandlers.trim());

fs.writeFileSync('src/components/sections/NotesSection.tsx', code);
