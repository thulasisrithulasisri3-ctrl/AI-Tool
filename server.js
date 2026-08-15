const express = require("express");
const cors = require("cors");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing");
}

const ai = API_KEY
  ? new GoogleGenAI({ apiKey: API_KEY })
  : null;

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Viggo AI Assistant is running"
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body?.message?.trim();

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Message is required"
      });
    }

    if (!ai) {
      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY is missing in Render Environment Variables"
      });
    }

    console.log("User:", message);

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: message
    });

    const reply = result.text;

    if (!reply) {
      throw new Error("Gemini returned an empty response");
    }

    console.log("Viggo:", reply);

    res.json({
      success: true,
      reply: reply
    });

  } catch (error) {
    console.error("❌ GEMINI ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Unknown Gemini error"
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Viggo AI Assistant running on port ${PORT}`);
});
