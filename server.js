"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();

/* =========================================
   SERVER CONFIG
   ========================================= */

const PORT = Number(process.env.PORT) || 10000;
const HOST = "0.0.0.0";

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

/* =========================================
   GEMINI AI
   ========================================= */

const ai = API_KEY
  ? new GoogleGenAI({
      apiKey: API_KEY
    })
  : null;

/* =========================================
   CORS
   ========================================= */

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
  })
);

/* =========================================
   BODY PARSER
   ========================================= */

app.use(
  express.json({
    limit: "5mb"
  })
);

/* =========================================
   ROOT / HEALTH CHECK
   ========================================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    status: "online",
    message: "Viggo AI Server is running",
    model: MODEL,
    apiConfigured: Boolean(API_KEY)
  });
});

/* =========================================
   HEALTH API
   ========================================= */

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "online",
    server: "Viggo AI",
    model: MODEL,
    apiConfigured: Boolean(API_KEY)
  });
});

/* =========================================
   CHAT API
   ========================================= */

app.post("/chat", async (req, res) => {
  try {
    console.log("=================================");
    console.log("New chat request received");
    console.log("=================================");

    /* -----------------------------------------
       CHECK API KEY
       ----------------------------------------- */

    if (!API_KEY || !ai) {
      console.error("GEMINI_API_KEY is missing");

      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY is missing on server"
      });
    }

    /* -----------------------------------------
       GET REQUEST DATA
       ----------------------------------------- */

    const message =
      typeof req.body?.message === "string"
        ? req.body.message.trim()
        : "";

    const chatId =
      typeof req.body?.chatId === "string"
        ? req.body.chatId
        : "";

    const language =
      typeof req.body?.language === "string"
        ? req.body.language
        : "English";

    console.log("Chat ID:", chatId);
    console.log("Language:", language);
    console.log("Message:", message);

    /* -----------------------------------------
       VALIDATE MESSAGE
       ----------------------------------------- */

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Message is required"
      });
    }

    /* -----------------------------------------
       SYSTEM PROMPT
       ----------------------------------------- */

    const prompt = `
You are Viggo AI, a helpful, friendly, intelligent AI assistant.

Important instructions:
- Give clear and useful answers.
- Be friendly and respectful.
- Keep answers easy to understand.
- If the user asks for technical help, explain step-by-step.
- Respond in the requested language when possible.

Requested language:
${language}

User message:
${message}
`;

    console.log("Sending request to Gemini...");
    console.log("Model:", MODEL);

    /* -----------------------------------------
       GEMINI REQUEST
       ----------------------------------------- */

    const result = await ai.models.generateContent({
      model: MODEL,
      contents: prompt
    });

    console.log("Gemini response received");

    /* -----------------------------------------
       EXTRACT RESPONSE
       ----------------------------------------- */

    let reply = "";

    if (typeof result?.text === "string") {
      reply = result.text.trim();
    }

    /*
      Fallback response extraction for SDK
      versions where text may be inside candidates.
    */

    if (!reply && Array.isArray(result?.candidates)) {
      const parts =
        result.candidates[0]?.content?.parts || [];

      reply = parts
        .map(part => part?.text || "")
        .join("")
        .trim();
    }

    /* -----------------------------------------
       EMPTY RESPONSE CHECK
       ----------------------------------------- */

    if (!reply) {
      console.error("Gemini returned an empty response");

      return res.status(502).json({
        success: false,
        error: "Empty response from AI model"
      });
    }

    console.log("Reply generated successfully");

    /* -----------------------------------------
       SEND RESPONSE
       ----------------------------------------- */

    return res.status(200).json({
      success: true,
      reply: reply
    });

  } catch (error) {
    console.error("=================================");
    console.error("Viggo AI SERVER ERROR");
    console.error("=================================");
    console.error(error);

    return res.status(500).json({
      success: false,
      error: "Viggo AI server error",
      details: String(
        error?.message || error
      )
    });
  }
});

/* =========================================
   404 HANDLER
   ========================================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.path
  });
});

/* =========================================
   GLOBAL ERROR HANDLER
   ========================================= */

app.use((err, req, res, next) => {
  console.error("Global server error:", err);

  res.status(500).json({
    success: false,
    error: "Internal server error",
    details: String(
      err?.message || err
    )
  });
});

/* =========================================
   START SERVER
   ========================================= */

app.listen(PORT, HOST, () => {
  console.log("=================================");
  console.log("Viggo AI Server ONLINE");
  console.log("=================================");
  console.log(`HOST: ${HOST}`);
  console.log(`PORT: ${PORT}`);
  console.log(`MODEL: ${MODEL}`);
  console.log(
    `API KEY: ${API_KEY ? "CONFIGURED" : "MISSING"}`
  );
  console.log("CHAT API: /chat");
  console.log("=================================");
});
