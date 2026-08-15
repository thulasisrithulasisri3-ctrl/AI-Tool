const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("GEMINI_API_KEY is missing");
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey: apiKey
});

console.log("Gemini AI initialized");

// Home
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AI Assistant is LIVE"
  });
});

// Health
app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy"
  });
});

// Chat
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
      input: message
    });

    const reply = interaction.output_text;

    if (!reply) {
      return res.status(500).json({
        success: false,
        error: "Empty AI response"
      });
    }

    console.log("AI:", reply);

    res.json({
      success: true,
      reply: reply
    });

  } catch (error) {
    console.error("Gemini Error:", error);

    res.status(500).json({
      success: false,
      error: "AI request failed",
      details: error.message
    });
  }
});

// Unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found"
  });
});

app.listen(PORT, () => {
  console.log(`AI Assistant running on port ${PORT}`);
});
