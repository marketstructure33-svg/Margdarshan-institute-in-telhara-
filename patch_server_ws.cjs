const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('WebSocketServer')) {
  code = "import { WebSocketServer } from 'ws';\nimport { LiveServerMessage, Modality } from '@google/genai';\n" + code;
  
  code = code.replace(
    /app\.listen\(PORT, "0\.0\.0\.0", \(\) => \{\n\s*console\.log\(`Server running on http:\/\/localhost:\$\{PORT\}`\);\n\s*\}\);/,
    `const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(\`Server running on http://localhost:\$\{PORT\}\`);
  });

  const wss = new WebSocketServer({ server, path: '/live' });
  
  wss.on("connection", async (clientWs, req) => {
    try {
      const url = new URL(req.url || '', \`http://localhost:\${PORT}\`);
      const apiKey = url.searchParams.get('apiKey') || process.env.GEMINI_API_KEY;
      
      const ai = new GoogleGenAI({ apiKey });
      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are a helpful AI tutor for a student. Be concise, encouraging, and clear.",
        },
        callbacks: {
          onmessage: (message) => {
            const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audio) {
              if (clientWs.readyState === 1) { // OPEN
                 clientWs.send(JSON.stringify({ audio }));
              }
            }
            if (message.serverContent?.interrupted) {
              if (clientWs.readyState === 1) {
                 clientWs.send(JSON.stringify({ interrupted: true }));
              }
            }
          },
        },
      });

      clientWs.on("message", (data) => {
        try {
          const { audio } = JSON.parse(data.toString());
          if (audio) {
            session.sendRealtimeInput({
              audio: { data: audio, mimeType: "audio/pcm;rate=16000" },
            });
          }
        } catch(e) {
          console.error("Live input error", e);
        }
      });
      
      clientWs.on("close", () => {
        try {
           session.close();
        } catch(e) {}
      });
    } catch (err) {
      console.error("Failed to start Live API session", err);
      clientWs.close();
    }
  });`
  );
  fs.writeFileSync('server.ts', code);
}
