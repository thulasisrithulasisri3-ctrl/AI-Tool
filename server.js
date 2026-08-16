const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        success: true,
        service: "Viggo AI Server",
        status: "online"
    });
});

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        status: "online",
        service: "Viggo AI Server"
    });
});

app.post("/api/chat", async (req, res) => {

    try {

        const message = req.body.message;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: "Message required"
            });
        }

        const apiKey =
            process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                success: false,
                error: "OPENAI_API_KEY missing"
            });
        }

        const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${apiKey}`
                },

                body: JSON.stringify({
                    model:
                        process.env.OPENAI_MODEL ||
                        "gpt-4o-mini",

                    messages: [
                        {
                            role: "system",
                            content:
                                "You are Viggo, a friendly helpful AI assistant. The user may call you friend."
                        },
                        {
                            role: "user",
                            content:
                                String(message)
                        }
                    ]
                })
            }
        );

        const data =
            await response.json();

        if (!response.ok) {

            return res.status(500).json({
                success: false,
                error:
                    data?.error?.message ||
                    "OpenAI request failed"
            });
        }

        res.json({
            success: true,
            reply:
                data.choices[0].message.content
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "================================"
        );

        console.log(
            "        VIGGO AI SERVER"
        );

        console.log(
            "================================"
        );

        console.log(
            `Server running on port ${PORT}`
        );

        console.log(
            "Health: /api/health"
        );

        console.log(
            "Chat: /api/chat"
        );

        console.log(
            "================================"
        );
    }
);
