"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();

const PORT = Number(process.env.PORT) || 10000;
const HOST = "0.0.0.0";

const API_KEY = process.env.GEMINI_API_KEY;

// Updated to a valid Gemini model
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
   MIDDLEWARE
========================================= */

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
  })
);

app.use(
  express.json({
    limit: "5mb"
  })
);


/* =========================================
   HOME
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
   STATUS
========================================= */

app.get("/status", (req, res) => {
  res.json({
    success: true,
    status: "online",
    model: MODEL,
    apiConfigured: Boolean(API_KEY)
  });
});


/* =========================================
   CHAT
========================================= */

app.post("/chat", async (req, res) => {
  console.log("================================");
  console.log("NEW VIGGO CHAT REQUEST");
  console.log("================================");

  try {
    /* =====================================
       API KEY
    ===================================== */
    if (!API_KEY || !ai) {
      console.error("GEMINI_API_KEY is missing");
      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY is missing"
      });
    }

    /* =====================================
       MESSAGE
    ===================================== */
    const message =
      typeof req.body?.message === "string"
        ? req.body.message.trim()
        : "";

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Message is required"
      });
    }

    /* =====================================
       LANGUAGE
    ===================================== */
    const language =
      typeof req.body?.language === "string"
        ? req.body.language
        : "English";

    const languageNames = {
      en: "English",
      English: "English",
      ta: "Tamil",
      Tamil: "Tamil",
      hi: "Hindi",
      Hindi: "Hindi",
      te: "Telugu",
      Telugu: "Telugu",
      kn: "Kannada",
      Kannada: "Kannada",
      ml: "Malayalam",
      Malayalam: "Malayalam",
      bn: "Bengali",
      Bengali: "Bengali",
      mr: "Marathi",
      Marathi: "Marathi",
      gu: "Gujarati",
      Gujarati: "Gujarati",
      pa: "Punjabi",
      Punjabi: "Punjabi",
      ur: "Urdu",
      Urdu: "Urdu"
    };

    const selectedLanguage = languageNames[language] || "English";

    console.log("User message:", message);
    console.log("Language:", selectedLanguage);
    console.log("Model:", MODEL);

    /* =====================================
       PROMPT
    ===================================== */
    const prompt = `
You are Viggo AI, a helpful, friendly and intelligent AI assistant.

Answer the user's question clearly and naturally.

Preferred response language:
${selectedLanguage}

Always answer primarily in the preferred language.

If the user asks in another language, understand the question correctly and answer in the selected language.

User message:
${message}
`;

    /* =====================================
       GEMINI REQUEST
    ===================================== */
    console.log("Sending request to Gemini...");

    const result = await ai.models.generateContent({
      model: MODEL,
      contents: prompt
    });

    console.log("Gemini response received.");

    /* =====================================
       RESPONSE TEXT
    ===================================== */
    let reply = "";

    if (result && typeof result.text === "string") {
      reply = result.text.trim();
    }

    /* =====================================
       FALLBACK RESPONSE
    ===================================== */
    if (!reply) {
      const parts = result?.candidates?.[0]?.content?.parts;

      if (Array.isArray(parts)) {
        reply = parts
          .map(part => part?.text || "")
          .join("")
          .trim();
      }
    }

    /* =====================================
       EMPTY RESPONSE
    ===================================== */
    if (!reply) {
      console.error("Gemini returned empty response");
      return res.status(502).json({
        success: false,
        error: "Gemini returned empty response"
      });
    }

    /* =====================================
       SUCCESS
    ===================================== */
    console.log("Viggo AI reply:", reply.substring(0, 200));

    return res.json({
      success: true,
      reply: reply,
      model: MODEL
    });

  } catch (error) {
    console.error("================================");
    console.error("VIGGO CHAT ERROR");
    console.error(error);
    console.error("================================");

    const errorMessage = String(error?.message || error || "");
    const lower = errorMessage.toLowerCase();

    /* =====================================
       API KEY ERROR
    ===================================== */
    if (
      lower.includes("401") ||
      lower.includes("403") ||
      lower.includes("api key") ||
      lower.includes("unauthenticated") ||
      lower.includes("permission denied")
    ) {
      return res.status(401).json({
        success: false,
        error: "Gemini API key is invalid or not configured",
        details: errorMessage
      });
    }

    /* =====================================
       MODEL ERROR
    ===================================== */
    if (
      lower.includes("model") &&
      (lower.includes("404") || lower.includes("not found") || lower.includes("unsupported"))
    ) {
      return res.status(502).json({
        success: false,
        error: "Gemini model is unavailable",
        details: "Current model: " + MODEL + ". Check GEMINI_MODEL in Render."
      });
    }

    /* =====================================
       QUOTA ERROR
    ===================================== */
    if (
      lower.includes("429") ||
      lower.includes("quota") ||
      lower.includes("resource exhausted") ||
      lower.includes("rate limit")
    ) {
      return res.status(429).json({
        success: false,
        error: "Gemini quota or rate limit reached",
        details: errorMessage
      });
    }

    /* =====================================
       OTHER ERROR
    ===================================== */
    return res.status(500).json({
      success: false,
      error: "Viggo AI server error",
      details: errorMessage
    });
  }
});


/* =========================================
   404 HANDLER
========================================= */

app.use((req, res) => {
  console.log("404 ENDPOINT:", req.method, req.path);
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.path
  });
});


/* =========================================
   SERVER START
========================================= */

app.listen(PORT, HOST, () => {
  console.log("================================");
  console.log("       VIGGO AI SERVER ONLINE");
  console.log("================================");
  console.log("HOST:", HOST);
  console.log("PORT:", PORT);
  console.log("MODEL:", MODEL);
  console.log("API KEY:", API_KEY ? "CONFIGURED" : "MISSING");
  console.log("CHAT ENDPOINT:");
  console.log("POST /chat");
  console.log("================================");
});
