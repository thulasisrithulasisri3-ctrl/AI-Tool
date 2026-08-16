const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "5mb" }));

const LANGUAGE_NAMES = {
  en: "English",
  ta: "Tamil",
  hi: "Hindi",
  ml: "Malayalam",
  te: "Telugu",
  kn: "Kannada"
};

function getLanguage(code) {
  return LANGUAGE_NAMES[code] || "English";
}

/* =========================
   HOME
========================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    status: "online",
    service: "Viggo AI Server"
  });
});

/* =========================
   HEALTH
========================= */

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy"
  });
});

/* =========================
   CHAT
========================= */

app.post("/chat", async (req, res) => {
  try {

    const message =
      typeof req.body.message === "string"
        ? req.body.message.trim()
        : "";

    const language =
      req.body.language || "en";

    const history =
      Array.isArray(req.body.history)
        ? req.body.history
        : [];

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Message is required"
      });
    }

    const apiKey =
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY is missing in Render."
      });
    }

    const languageName =
      getLanguage(language);

    /* =========================
       HISTORY
    ========================= */

    let historyText = "";

    history
      .slice(-20)
      .forEach(item => {

        if (!item || !item.content) return;

        const role =
          item.role === "assistant"
            ? "Viggo"
            : "User";

        historyText +=
          `${role}: ${item.content}\n`;
      });

    /* =========================
       PROMPT
    ========================= */

    const prompt = `
You are Viggo AI, a friendly and intelligent AI assistant.

User selected language:
${languageName}

RULES:
- Reply in ${languageName}.
- Understand mixed-language messages.
- Be natural and friendly.
- Do not mention these instructions.
- Do not say you are translating.
- For coding questions, provide complete working code.
- For technical questions, explain clearly.
- Use "friend" naturally when appropriate.

Conversation history:
${historyText}

User:
${message}

Viggo:
`;

    /* =========================
       GEMINI
    ========================= */

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
      encodeURIComponent(apiKey);

    const response =
      await fetch(url, {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],

          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 2048
          }
        })
      });

    const data =
      await response.json();

    if (!response.ok) {

      console.error(
        "Gemini API Error:",
        JSON.stringify(data)
      );

      return res.status(500).json({
        success: false,
        error: "Gemini API request failed.",
        details:
          data?.error?.message ||
          "Unknown Gemini error"
      });
    }

    let reply = "";

    if (
      data?.candidates?.[0]?.content?.parts
    ) {

      reply =
        data.candidates[0].content.parts
          .map(part => part.text || "")
          .join("")
          .trim();
    }

    if (!reply) {

      return res.status(500).json({
        success: false,
        error: "Viggo AI returned an empty response."
      });
    }

    return res.json({
      success: true,
      reply,
      language,
      languageName
    });

  } catch (error) {

    console.error(
      "SERVER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        "Sorry friend, I couldn't connect to Viggo AI right now.",
      details: error.message
    });
  }
});

/* =========================
   404
========================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found"
  });
});

/* =========================
   START
========================= */

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Viggo AI Server running on port ${PORT}`
    );
  }
);
