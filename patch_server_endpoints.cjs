const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const analyticsRoute = `
  app.post("/api/analytics", async (req, res) => {
    try {
      const { data } = req.body;
      const ai = new GoogleGenAI({ apiKey: req.body.apiKey || process.env.GEMINI_API_KEY });
      const prompt = \`Act as an AI educational analyst. Analyze this student performance data: \${JSON.stringify(data)}.
      Provide:
      1. Predictive insights: What score are they likely to get next week?
      2. Weak areas needing attention.
      3. Actionable study recommendations for parents and students.
      Format in clean Markdown.\`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });
      res.json({ text: response.text });
    } catch (error) {
      console.error("Analytics Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate analytics insights." });
    }
  });
`;

if (!code.includes('/api/analytics')) {
  code = code.replace("app.post(\"/api/study-planner\",", analyticsRoute + "\n  app.post(\"/api/study-planner\",");
  fs.writeFileSync('server.ts', code);
}
