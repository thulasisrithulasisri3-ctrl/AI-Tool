const express = require("express");
const cors = require("cors");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));


// ==============================
// GEMINI
// ==============================

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing");
} else {
  console.log("✅ Gemini API key found");
}

const ai = API_KEY
  ? new GoogleGenAI({
      apiKey: API_KEY
    })
  : null;


// ==============================
// HOME
// ==============================

app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "index.html")
  );
});


// ==============================
// HEALTH
// ==============================

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy"
  });
});


// ==============================
// CHAT
// ==============================

app.post("/api/chat", async (req, res) => {

  try {

    const message =
      req.body?.message?.trim();

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Message is required"
      });
    }

    if (!ai) {
      return res.status(500).json({
        success: false,
        error:
          "GEMINI_API_KEY is not configured in Render"
      });
    }

    console.log("User:", message);


    // Gemini request

    const response =
      await ai.models.generateContent({

        model: "gemini-2.5-flash",

        contents: message

      });


    const reply =
      response.text || "No response received.";


    console.log("AI:", reply);


    return res.json({

      success: true,

      reply: reply

    });


  } catch (error) {

    console.error(
      "❌ Gemini Error:",
      error
    );


    return res.status(500).json({

      success: false,

      error:
        "AI request failed",

      details:
        error.message

    });

  }

});


// ==============================
// 404
// ==============================

app.use((req, res) => {

  res.status(404).json({

    success: false,

    error: "Route not found"

  });

});


// ==============================
// START SERVER
// ==============================

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `🚀 AI Assistant running on port ${PORT}`
    );

  }
);
