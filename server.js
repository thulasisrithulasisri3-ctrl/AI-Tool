const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("ERROR: GEMINI_API_KEY is missing");
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY
});

console.log("Gemini AI initialized");

app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "AI Assistant Backend is running",
    model: "gemini-3.6-flash"
  });
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "AI Assistant",
    model: "gemini-3.6-flash"
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body?.message;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        error: "Message is required"
      });
    }

    console.log("User:", message);

    const interaction = await ai.interactions.create({
      model: "gemini-3.6-flash",
      input: message,
      generation_config: {
        thinking_level: "low"
      }
    });

    const answer = interaction.output_text || "";

    console.log("AI:", answer);

    return res.json({
      success: true,
      reply: answer,
      interactionId: interaction.id
    });

  } catch (error) {
    console.error("Gemini Error:", error);

    return res.status(500).json({
      success: false,
      error: "AI request failed",
      details: error?.message || "Unknown Gemini error"
    });
  }
});

app.listen(PORT, () => {
  console.log(`AI Assistant running on port ${PORT}`);
});
