const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /const formattedMessages = messages \? messages\.map : \(\) => \[\];/,
  `const formattedMessages = messages ? messages.map : () => [];`
);

// I will just replace the whole /api/gemini-chat route to be safe and clean.
code = code.replace(/app\.post\("\/api\/gemini-chat", async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: error\.message \|\| "Failed to generate chat response\." \}\);\s*\}\s*\}\);/, `app.post("/api/gemini-chat", async (req, res) => {
    try {
      const { messages, systemInstruction, temperature } = req.body;
      const ai = new GoogleGenAI({ apiKey: req.body.apiKey || process.env.GEMINI_API_KEY });
      
      const formattedMessages = messages.map((msg: any) => {
        const parts: any[] = [];
        if (msg.text) {
          parts.push({ text: msg.text });
        }
        if (msg.image) {
          parts.push({
            inlineData: {
              data: msg.image,
              mimeType: msg.imageType || 'image/jpeg'
            }
          });
        }
        return {
          role: msg.role === 'model' ? 'model' : 'user',
          parts
        };
      });

      while (formattedMessages.length > 0 && formattedMessages[0].role === 'model') {
        formattedMessages.shift();
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedMessages,
        config: {
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
          temperature: temperature || 0.7
        }
      });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Chat Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate chat response." });
    }
  });`);

fs.writeFileSync('server.ts', code);
