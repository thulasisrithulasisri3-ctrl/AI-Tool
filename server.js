// ============================================
// VIGGO AI SERVER
// Express + OpenAI API
// ============================================

const express = require("express");
const cors = require("cors");

const app = express();

// Render PORT
const PORT = process.env.PORT || 10000;

// --------------------------------------------
// Middleware
// --------------------------------------------

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "10mb" }));

// --------------------------------------------
// Home Route
// --------------------------------------------

app.get("/", (req, res) => {
    res.json({
        success: true,
        service: "Viggo AI Server",
        status: "online",
        message: "Viggo server is running successfully.",
        health: "/api/health",
        chat: "/api/chat"
    });
});

// --------------------------------------------
// Health Check
// --------------------------------------------

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        status: "online",
        service: "Viggo AI Server",
        port: PORT,
        openai: process.env.OPENAI_API_KEY ? "connected" : "not configured"
    });
});

// --------------------------------------------
// Chat API
// --------------------------------------------

app.post("/api/chat", async (req, res) => {

    try {

        const { message, messages } = req.body;

        if (!message && (!messages || messages.length === 0)) {
            return res.status(400).json({
                success: false,
                error: "Message is required."
            });
        }

        // ----------------------------------------
        // Check OpenAI API Key
        // ----------------------------------------

        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {

            return res.status(500).json({
                success: false,
                error: "OPENAI_API_KEY is not configured on Render.",
                message:
                    "Please add OPENAI_API_KEY in Render Environment Variables."
            });
        }

        // ----------------------------------------
        // Prepare conversation
        // ----------------------------------------

        let conversation = [];

        if (Array.isArray(messages) && messages.length > 0) {

            conversation = messages
                .filter(item =>
                    item &&
                    item.role &&
                    item.content
                )
                .map(item => ({
                    role: item.role === "assistant"
                        ? "assistant"
                        : "user",
                    content: String(item.content)
                }));

        } else {

            conversation = [
                {
                    role: "user",
                    content: String(message)
                }
            ];

        }

        // ----------------------------------------
        // Viggo system personality
        // ----------------------------------------

        const systemMessage = {
            role: "system",
            content: `
You are Viggo, a friendly AI assistant.

Your personality:
- Friendly
- Helpful
- Simple
- Clear
- Natural
- Supportive

The user may call you "friend".
You can naturally respond using "friend" when appropriate.

Answer the user's question directly.
If the user asks for code, provide complete working code.
If the user asks in Tamil, respond in Tamil or simple Tanglish.
Do not mention that you are a demo server.
`
        };

        const finalMessages = [
            systemMessage,
            ...conversation
        ];

        // ----------------------------------------
        // OpenAI API
        // ----------------------------------------

        const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },

                body: JSON.stringify({
                    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
                    messages: finalMessages,
                    temperature: 0.7,
                    max_tokens: 1200
                })
            }
        );

        // ----------------------------------------
        // OpenAI Error
        // ----------------------------------------

        if (!response.ok) {

            const errorText = await response.text();

            console.error(
                "OpenAI API Error:",
                errorText
            );

            return res.status(response.status).json({
                success: false,
                error: "OpenAI API request failed.",
                details: errorText
            });
        }

        const data = await response.json();

        // ----------------------------------------
        // AI Response
        // ----------------------------------------

        const reply =
            data?.choices?.[0]?.message?.content;

        if (!reply) {

            return res.status(500).json({
                success: false,
                error: "No response received from AI."
            });

        }

        return res.status(200).json({
            success: true,
            reply: reply,
            model: data.model || process.env.OPENAI_MODEL || "gpt-4o-mini"
        });

    } catch (error) {

        console.error(
            "Viggo Server Error:",
            error
        );

        return res.status(500).json({
            success: false,
            error: "Viggo server error.",
            details: error.message
        });
    }

});

// --------------------------------------------
// 404 Handler
// --------------------------------------------

app.use((req, res) => {

    res.status(404).json({
        success: false,
        error: "Route not found.",
        path: req.originalUrl,
        availableRoutes: [
            "GET /",
            "GET /api/health",
            "POST /api/chat"
        ]
    });

});

// --------------------------------------------
// Start Server
// --------------------------------------------

app.listen(PORT, "0.0.0.0", () => {

    console.log("");
    console.log("================================");
    console.log("        VIGGO AI SERVER");
    console.log("================================");
    console.log(
        `Viggo running at: http://localhost:${PORT}`
    );
    console.log(
        `Health check: http://localhost:${PORT}/api/health`
    );
    console.log(
        `Chat API: http://localhost:${PORT}/api/chat`
    );
    console.log("================================");
    console.log("");

});
