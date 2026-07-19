import { WebSocketServer } from 'ws';
import { LiveServerMessage, Modality } from '@google/genai';
console.log("GEMINI_API_KEY in server:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 5) : "undefined");
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { Resend } from "resend";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Route for general Gemini Chat
  app.post("/api/gemini-chat", async (req, res) => {
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
  });

  // API Route for AI Study Planner
  app.post("/api/study-planner", async (req, res) => {
    try {
      const { selectedClass, selectedSubject } = req.body;
      
      const ai = new GoogleGenAI({ apiKey: req.body.apiKey || process.env.GEMINI_API_KEY });
      const prompt = `Generate a personalized, structured 7-day study schedule for a student in ${selectedClass} studying ${selectedSubject}. 
      Include specific topics to cover each day, practical exercises, and review sessions. 
      Format the response in clean Markdown with clear headings and bullet points.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ schedule: response.text });
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate study plan." });
    }
  });

  // API Route for AI Tutor
  app.post("/api/ai-tutor", async (req, res) => {
    try {
      const { noteContent, title, subject } = req.body;
      
      const ai = new GoogleGenAI({ apiKey: req.body.apiKey || process.env.GEMINI_API_KEY });
      const prompt = `Act as an AI Tutor for ${subject}. Based on the following class notes titled "${title}", provide a clear, subject-specific explanation of the key concepts and 3 practical study tips to master this material. Format the output in clean Markdown.

      Class Notes:
      ${noteContent}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });
      res.json({ explanation: response.text });
    } catch (error: any) {
      console.error("AI Tutor Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI Tutor explanation." });
    }
  });

  // API Route for generating Quiz from Notes
  app.post("/api/generate-quiz", async (req, res) => {
    try {
      const { noteContent, title } = req.body;
      
      const ai = new GoogleGenAI({ apiKey: req.body.apiKey || process.env.GEMINI_API_KEY });
      const prompt = `Based on the following class notes titled "${title}", generate a 5-question multiple choice practice quiz.
      Format the output in clean Markdown. Include an answer key at the very bottom.
      
      Class Notes:
      ${noteContent}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ quiz: response.text });
    } catch (error: any) {
      console.error("Quiz Generation Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate quiz." });
    }
  });

  // API Route for Email Notifications
  app.post("/api/notify", async (req, res) => {
    try {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        throw new Error("RESEND_API_KEY environment variable is missing.");
      }

      const resend = new Resend(apiKey);
      const { emails, title, type, content, class: targetClass, subject } = req.body;

      if (!emails || emails.length === 0) {
        return res.json({ success: true, message: "No recipients to notify." });
      }

      let emailSubject = '';
      let emailHtml = '';

      if (type === 'Notice') {
        emailSubject = `📢 New Announcement: ${title}`;
        emailHtml = `
          <h2>New Announcement from Margdarshan Institute</h2>
          <p><strong>${title}</strong></p>
          <p>${content}</p>
        `;
      } else {
        emailSubject = `📚 New Study Material: ${title}`;
        emailHtml = `
          <h2>New Study Material Added</h2>
          <p>A new ${type} has been uploaded for <strong>${targetClass} - ${subject}</strong>.</p>
          <p><strong>Title:</strong> ${title}</p>
          <p>Please log in to the portal to view the materials.</p>
        `;
      }

      // Resend has a limit on the number of recipients per request (e.g. 50).
      // For simplicity, we chunk it into 50.
      const BATCH_SIZE = 50;
      for (let i = 0; i < emails.length; i += BATCH_SIZE) {
        const batch = emails.slice(i, i + BATCH_SIZE);
        await resend.emails.send({
          from: 'Margdarshan Institute <onboarding@resend.dev>',
          to: batch,
          subject: emailSubject,
          html: emailHtml,
        });
      }

      res.json({ success: true, message: "Notifications sent." });
    } catch (error: any) {
      console.error("Email Notification Error:", error);
      res.status(500).json({ error: error.message || "Failed to send notifications." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const wss = new WebSocketServer({ server, path: '/live' });
  
  wss.on("connection", async (clientWs, req) => {
    try {
      const url = new URL(req.url || '', `http://localhost:${PORT}`);
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
  });
}

startServer();
