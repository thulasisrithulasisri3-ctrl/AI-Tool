// ============================================
// VIGGO AI SERVER
// ============================================

const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 10000;

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// ============================================
// HOME
// ============================================

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        service: "Viggo AI Server",
        status: "online",
        message: "Viggo server is running.",
        endpoints: {
            health: "/api/health",
            chat: "/api/chat"
        }
    });
});

// ============================================
// HEALTH CHECK
// ============================================

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        status: "online",
        service: "Viggo AI Server"
    });
});

// ============================================
// CHAT
// ============================================

app.post("/api/chat", async (req, res) => {

    try {

        const message = req.body?.message;

        if (!message || !String(message).trim()) {

            return res.status(400).json({
                success: false,
                error: "Message is required."
            });

        }

        const apiKey = process.env.OPENAI_API_KEY;

        // ----------------------------------------
        // API KEY CHECK
        // ----------------------------------------

        if (!apiKey) {

            return res.status(500).json({
                success: false,
                error: "OPENAI_API_KEY is not configured."
            });

        }

        // ----------------------------------------
        // OPENAI REQUEST
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

                    messages: [
                        {
                            role: "system",
                            content: `
You are Viggo, a friendly AI assistant.

Be helpful, natural and clear.

The user may call you "friend".
You can call the user "friend" naturally.

If the user speaks Tamil or Tanglish,
reply naturally in Tamil/Tanglish.

Give direct answers.
For programming questions, give working code.
`
                        },
                        {
                            role: "user",
                            content: String(message)
                        }
                    ],

                    temperature: 0.7,
                    max_tokens: 1500
                })
            }
        );

        // ----------------------------------------
        // OPENAI ERROR
        // ----------------------------------------

        if (!response.ok) {

            const errorText = await response.text();

            console.error(
                "OpenAI Error:",
                errorText
            );

            return res.status(500).json({
                success: false,
                error: "AI request failed.",
                details: errorText
            });
        }

        const data = await response.json();

        const reply =
            data?.choices?.[0]?.message?.content;

        if (!reply) {

            return res.status(500).json({
                success: false,
                error: "No AI response received."
            });

        }

        // ----------------------------------------
        // SEND RESPONSE
        // ----------------------------------------

        return res.status(200).json({
            success: true,
            reply: reply
        });

    } catch (error) {

        console.error(
            "SERVER ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }

});

// ============================================
// 404
// ============================================

app.use((req, res) => {

    res.status(404).json({
        success: false,
        error: "Route not found",
        path: req.originalUrl
    });

});

// ============================================
// START
// ============================================

app.listen(PORT, "0.0.0.0", () => {

    console.log("");
    console.log("================================");
    console.log("        VIGGO AI SERVER");
    console.log("================================");

    console.log(
        `Viggo running on port: ${PORT}`
    );

    console.log(
        `Health check: /api/health`
    );

    console.log(
        `Chat API: /api/chat`
    );

    console.log("================================");
    console.log("");

});
