const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors());
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("GEMINI_API_KEY is missing");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

app.get("/", (req, res) => {
    res.json({
        status: "online",
        message: "AI Assistant Backend is running 🤖"
    });
});

app.post("/chat", async (req, res) => {
    const message = req.body.message;

    if (!message) {
        return res.status(400).json({
            error: "Message is required"
        });
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash"
        });

        const result = await model.generateContent(message);

        const reply = result.response.text();

        res.json({
            reply: reply
        });

    } catch (error) {
        console.error("Gemini Error:", error);

        res.status(500).json({
            error: "AI request failed"
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`AI Assistant running on port ${PORT}`);
});
