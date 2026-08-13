const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing");
}

const ai = GEMINI_API_KEY
    ? new GoogleGenAI({
        apiKey: GEMINI_API_KEY
      })
    : null;


// ===============================
// HOME
// ===============================

app.get("/", (req, res) => {
    res.json({
        status: "online",
        message: "AI Assistant Backend is running 🤖"
    });
});


// ===============================
// HEALTH CHECK
// ===============================

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        geminiConfigured: !!GEMINI_API_KEY
    });
});


// ===============================
// CHAT
// ===============================

app.post("/chat", async (req, res) => {

    const message = req.body.message;

    if (!message) {
        return res.status(400).json({
            error: "Message is required"
        });
    }

    if (!ai) {
        return res.status(500).json({
            error: "GEMINI_API_KEY is missing on server"
        });
    }

    try {

        console.log("User:", message);

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: message
        });

        const reply = response.text;

        console.log("AI:", reply);

        return res.json({
            reply: reply || "No response received."
        });

    } catch (error) {

        console.error("Gemini Error:", error);

        return res.status(500).json({
            error: "AI request failed",
            details: error.message
        });
    }
});


// ===============================
// START SERVER
// ===============================

app.listen(PORT, "0.0.0.0", () => {

    console.log(
        `AI Assistant running on port ${PORT}`
    );

});
