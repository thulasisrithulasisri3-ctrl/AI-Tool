"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();

const PORT = Number(process.env.PORT) || 10000;
const HOST = "0.0.0.0";

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// CORS configuration to allow requests from GitHub Pages
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
  })
);

app.use(express.json({ limit: "5mb" }));

// Root route check
app.get("/", (req, res) => {
  res.json({
    success: true,
    status: "online",
    message: "Viggo AI Server is running",
    model: MODEL,
    apiConfigured: Boolean(API_KEY)
  });
});

// Chat POST route
app.post("/chat", async (req, res) => {
  try {
    if (!API_KEY || !ai) {
      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY is missing on server"
      });
    }

    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";

    if (!message) {
      return res.status(400).json({ success: false, error: "Message is required" });
    }

    const prompt = `You are Viggo AI, a helpful, friendly, and intelligent AI assistant.\nUser message:\n${message}`;

    const result = await ai.models.generateContent({
      model: MODEL,
      contents: prompt
    });

    let reply = result?.text?.trim() || "";

    if (!reply) {
      return res.status(502).json({ success: false, error: "Empty response from AI model" });
    }

    return res.json({ success: true, reply: reply });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Viggo AI server error",
      details: String(error?.message || error)
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: "Endpoint not found", path: req.path });
});

app.listen(PORT, HOST, () => {
  console.log(`Viggo AI Server running on port ${PORT}`);
});
