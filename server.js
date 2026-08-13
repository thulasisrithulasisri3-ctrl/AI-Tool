const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();

app.use(cors());
app.use(express.json());

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

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

        const response = await client.responses.create({
            model: "gpt-5-mini",
            input: message
        });

        res.json({
            reply: response.output_text
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "AI request failed"
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(
        `AI Assistant running on port ${PORT}`
    );
});
