// ======================================================
// VIGGO AI SERVER
// ======================================================

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 10000;

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
}));

app.use(express.json({ limit: "2mb" }));


// ======================================================
// HOME
// ======================================================

app.get("/", (req, res) => {

    res.json({
        success: true,
        name: "Viggo AI Server",
        status: "online",
        message: "Viggo server is running."
    });

});


// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/api/health", (req, res) => {

    res.json({
        success: true,
        status: "online",
        service: "Viggo AI Server",
        time: new Date().toISOString()
    });

});


// ======================================================
// CHAT API
// ======================================================

app.post("/api/chat", async (req, res) => {

    try {

        const message =
            typeof req.body.message === "string"
                ? req.body.message.trim()
                : "";

        const history =
            Array.isArray(req.body.history)
                ? req.body.history
                : [];


        // ------------------------------------------------
        // EMPTY MESSAGE
        // ------------------------------------------------

        if (!message) {

            return res.status(400).json({

                success: false,

                error: "Message is required."

            });

        }


        // =================================================
        // AI API KEY
        // =================================================

        const apiKey =
            process.env.OPENAI_API_KEY;


        // =================================================
        // IF API KEY IS NOT CONFIGURED
        // =================================================

        if (!apiKey) {

            return res.json({

                success: true,

                reply:
                    "Viggo server is online, but the AI API key is not configured yet. Please add OPENAI_API_KEY to your Render environment variables."

            });

        }


        // =================================================
        // PREPARE CONVERSATION
        // =================================================

        const messages = [

            {
                role: "system",

                content:
                    `You are Viggo, a friendly AI assistant.

Address the user as "friend" when appropriate.

Give clear, useful and easy-to-understand answers.

If the user asks in Tamil or Tanglish, reply naturally in Tamil/Tanglish.

Do not claim to be a human.

Be helpful, concise and friendly.`
            }

        ];


        // ------------------------------------------------
        // ADD PREVIOUS CHAT
        // ------------------------------------------------

        history
            .slice(-20)
            .forEach(item => {

                if (
                    !item ||
                    typeof item.content !== "string"
                ) {
                    return;
                }


                if (
                    item.role !== "user" &&
                    item.role !== "ai" &&
                    item.role !== "assistant"
                ) {
                    return;
                }


                messages.push({

                    role:
                        item.role === "user"
                            ? "user"
                            : "assistant",

                    content:
                        item.content.substring(
                            0,
                            8000
                        )

                });

            });


        // ------------------------------------------------
        // CURRENT MESSAGE
        // ------------------------------------------------

        messages.push({

            role: "user",

            content: message.substring(
                0,
                12000
            )

        });


        // =================================================
        // OPENAI REQUEST
        // =================================================

        const response =
            await fetch(
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

                        messages:

                            messages,

                        temperature:
                            0.7,

                        max_tokens:
                            1500

                    })

                }
            );


        // =================================================
        // OPENAI ERROR
        // =================================================

        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "AI API ERROR:",
                errorText
            );


            return res.status(
                response.status
            ).json({

                success: false,

                error:
                    "AI service returned an error.",

                details:
                    errorText

            });

        }


        // =================================================
        // RESPONSE JSON
        // =================================================

        const data =
            await response.json();


        const reply =
            data?.choices?.[0]?.message?.content;


        if (!reply) {

            return res.status(500).json({

                success: false,

                error:
                    "No response received from AI."

            });

        }


        // =================================================
        // SEND TO FRONTEND
        // =================================================

        return res.json({

            success: true,

            reply: reply.trim()

        });


    } catch (error) {

        console.error(
            "VIGGO SERVER ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            error:
                "Viggo server error.",

            message:
                error.message

        });

    }

});


// ======================================================
// 404
// ======================================================

app.use((req, res) => {

    res.status(404).json({

        success: false,

        error: "Route not found."

    });

});


// ======================================================
// SERVER START
// ======================================================

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
            `Viggo running on port: ${PORT}`
        );

        console.log(
            `Health check: /api/health`
        );

        console.log(
            "================================"
        );

    }
);
