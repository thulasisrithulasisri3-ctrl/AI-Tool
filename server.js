const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const port = process.env.PORT || 10000;

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

app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "AI Assistant is running"
  });
});

app.get("/health", (req, res) => {
  res.json({
    ok: true
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body?.message;

    if (!message) {
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

    const reply = interaction.output_text || "No response received.";

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

app.listen(port, () => {
  console.log(`AI Assistant running on port ${port}`);
});
