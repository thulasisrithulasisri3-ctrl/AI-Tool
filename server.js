
"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { GoogleGenAI } = require("@google/genai");

const app = express();

/* =========================================
   SERVER CONFIG
========================================= */

const PORT = Number(process.env.PORT) || 10000;
const HOST = "0.0.0.0";

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL =
  process.env.GEMINI_MODEL || "gemini-3.6-flash";

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
   SHARED CHAT STORAGE
   NOTE:
   This is temporary in-memory storage.
========================================= */

const sharedChats = new Map();

/* =========================================
   ROOT / HEALTH CHECK
========================================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    status: "online",
    message: "Viggo AI Server is running",
    model: MODEL,
    apiConfigured: Boolean(API_KEY),
    shareEnabled: true
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
    apiConfigured: Boolean(API_KEY),
    shareEnabled: true,
    sharedChats: sharedChats.size
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

    /* -----------------------------------------
       FALLBACK RESPONSE EXTRACTION
    ----------------------------------------- */

    if (
      !reply &&
      Array.isArray(result?.candidates)
    ) {
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
      console.error(
        "Gemini returned an empty response"
      );

      return res.status(502).json({
        success: false,
        error: "Empty response from AI model"
      });
    }

    console.log(
      "Reply generated successfully"
    );

    /* -----------------------------------------
       SEND RESPONSE
    ----------------------------------------- */

    return res.status(200).json({
      success: true,
      reply: reply
    });

  } catch (error) {
    console.error(
      "================================="
    );

    console.error(
      "VIGGO AI SERVER ERROR"
    );

    console.error(
      "================================="
    );

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
   CREATE SHARE LINK
========================================= */

app.post("/share", (req, res) => {
  try {
    console.log(
      "================================="
    );

    console.log(
      "CREATE SHARE LINK"
    );

    console.log(
      "================================="
    );

    const chat =
      req.body?.chat;

    /* -----------------------------------------
       VALIDATE CHAT
    ----------------------------------------- */

    if (!chat || typeof chat !== "object") {
      return res.status(400).json({
        success: false,
        error: "Chat data is required"
      });
    }

    if (
      !Array.isArray(chat.messages) ||
      chat.messages.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "Chat has no messages to share"
      });
    }

    /* -----------------------------------------
       CREATE UNIQUE ID
    ----------------------------------------- */

    const shareId =
      crypto.randomBytes(9).toString("base64url");

    /* -----------------------------------------
       CLEAN CHAT DATA
    ----------------------------------------- */

    const safeChat = {
      id: shareId,

      title:
        typeof chat.title === "string"
          ? chat.title.substring(0, 200)
          : "Viggo AI Chat",

      messages: chat.messages
        .filter(
          item =>
            item &&
            typeof item.text === "string" &&
            (
              item.role === "user" ||
              item.role === "assistant"
            )
        )
        .map(item => ({
          role: item.role,
          text: item.text
        })),

      createdAt:
        new Date().toISOString()
    };

    /* -----------------------------------------
       SAVE
    ----------------------------------------- */

    sharedChats.set(
      shareId,
      safeChat
    );

    /* -----------------------------------------
       FRONTEND URL
       Change this only if your GitHub Pages
       URL changes.
    ----------------------------------------- */

    const frontendURL =
      "https://thulasisrithulasisri3-ctrl.github.io/AI-Tool/";

    const shareURL =
      `${frontendURL}?share=${encodeURIComponent(
        shareId
      )}`;

    console.log(
      "Share ID:",
      shareId
    );

    console.log(
      "Share URL:",
      shareURL
    );

    /* -----------------------------------------
       RESPONSE
    ----------------------------------------- */

    return res.status(200).json({
      success: true,

      shareId:
        shareId,

      url:
        shareURL,

      title:
        safeChat.title
    });

  } catch (error) {
    console.error(
      "Share creation error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: "Could not create share link"
    });
  }
});

/* =========================================
   GET SHARED CHAT
========================================= */

app.get("/share/:id", (req, res) => {
  try {
    const shareId =
      String(req.params.id || "").trim();

    if (!shareId) {
      return res.status(400).json({
        success: false,
        error: "Share ID is required"
      });
    }

    const chat =
      sharedChats.get(shareId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: "Shared chat not found or expired"
      });
    }

    return res.status(200).json({
      success: true,
      chat: chat
    });

  } catch (error) {
    console.error(
      "Get shared chat error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: "Could not load shared chat"
    });
  }
});

/* =========================================
   SHARE PREVIEW
========================================= */

app.get("/share/:id/preview", (req, res) => {
  try {
    const shareId =
      String(req.params.id || "").trim();

    const chat =
      sharedChats.get(shareId);

    if (!chat) {
      return res.status(404).send(
        "Shared chat not found"
      );
    }

    const previewMessages =
      chat.messages
        .slice(0, 4)
        .map(item => {
          const name =
            item.role === "user"
              ? "You"
              : "Viggo AI";

          return `${name}: ${item.text}`;
        })
        .join("\n");

    res
      .status(200)
      .type("html")
      .send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">

<title>${escapeHTML(
      chat.title
    )} - Viggo AI</title>

<meta
  name="description"
  content="${escapeHTML(
    previewMessages.substring(0, 300)
  )}"
>

<meta
  property="og:title"
  content="${escapeHTML(
    chat.title
  )}"
>

<meta
  property="og:description"
  content="${escapeHTML(
    previewMessages.substring(0, 300)
  )}"
>

<meta
  property="og:type"
  content="website"
>

</head>

<body>

<h1>
${escapeHTML(chat.title)}
</h1>

<p>
${escapeHTML(
  previewMessages
).replace(/\n/g, "<br>")}
</p>

</body>
</html>
      `);

  } catch (error) {
    console.error(
      "Preview error:",
      error
    );

    res.status(500).send(
      "Preview error"
    );
  }
});

/* =========================================
   HTML ESCAPE HELPER
========================================= */

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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
  console.error(
    "Global server error:",
    err
  );

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

app.listen(
  PORT,
  HOST,
  () => {

    console.log(
      "================================="
    );

    console.log(
      "Viggo AI Server ONLINE"
    );

    console.log(
      "================================="
    );

    console.log(
      `HOST: ${HOST}`
    );

    console.log(
      `PORT: ${PORT}`
    );

    console.log(
      `MODEL: ${MODEL}`
    );

    console.log(
      `API KEY: ${
        API_KEY
          ? "CONFIGURED"
          : "MISSING"
      }`
    );

    console.log(
      "CHAT API: /chat"
    );

    console.log(
      "SHARE API: /share"
    );

    console.log(
      "SHARE GET: /share/:id"
    );

    console.log(
      "SHARE PREVIEW: /share/:id/preview"
    );

    console.log(
      "================================="
    );
  }
);
