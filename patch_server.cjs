const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /const formattedMessages = messages\.map/,
  `let formattedMessages = messages.map`
);

code = code.replace(
  /const response = await ai\.models\.generateContent\(\{/g,
  `
      // Gemini API requires the first message to be from 'user'
      while (formattedMessages.length > 0 && formattedMessages[0].role === 'model') {
        formattedMessages.shift();
      }
      
      const response = await ai.models.generateContent({`
);

fs.writeFileSync('server.ts', code);
