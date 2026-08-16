// ======================================================
// VIGGO AI SERVER
// ======================================================

const express =
    require("express");

const cors =
    require("cors");

const dotenv =
    require("dotenv");


dotenv.config();


const app =
    express();


const PORT =
    process.env.PORT || 10000;


// ======================================================
// MIDDLEWARE
// ======================================================

app.use(
    cors({
        origin: "*",
        methods: [
            "GET",
            "POST",
            "OPTIONS"
        ],
        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ]
    })
);


app.use(
    express.json({
        limit: "2mb"
    })
);


// ======================================================
// HOME
// ======================================================

app.get(
    "/",
    (req, res) => {

        res.json({

            success: true,

            name:
                "Viggo AI Server",

            status:
                "online",

            message:
                "Viggo server is running."

        });

    }
);


// ======================================================
// HEALTH
// ======================================================

app.get(
    "/api/health",
    (req, res) => {

        res.json({

            success: true,

            status:
                "online",

            service:
                "Viggo AI Server",

            time:
                new Date().toISOString()

        });

    }
);


// ======================================================
// CHAT
// ======================================================

app.post(
    "/api/chat",
    async (req, res) => {

        try {

            const message =
                typeof req.body.message ===
                "string"
                    ? req.body.message.trim()
                    : "";


            const history =
                Array.isArray(
                    req.body.history
                )
                    ? req.body.history
                    : [];


            if (!message) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Message is required."

                });

            }


            const apiKey =
                process.env.OPENAI_API_KEY;


            if (!apiKey) {

                return res.json({

                    success: true,

                    reply:
                        "Viggo server is online, but OPENAI_API_KEY is not configured on the server."

                });

            }


            // ==================================================
            // SYSTEM
            // ==================================================

            const messages = [

                {

                    role:
                        "system",

                    content:
                        `You are Viggo, a friendly AI assistant.

Call the user "friend" naturally when appropriate.

If the user writes Tamil or Tanglish, respond naturally in Tamil or Tanglish.

Give clear, useful and simple answers.

Be friendly and helpful.

Do not claim to be human.`

                }

            ];


            // ==================================================
            // HISTORY
            // ==================================================

            history
                .slice(-20)
                .forEach(
                    item => {

                        if (
                            !item ||
                            typeof item.content !==
                            "string"
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
                                item.role ===
                                "user"
                                    ? "user"
                                    : "assistant",

                            content:
                                item.content.substring(
                                    0,
                                    8000
                                )

                        });

                    }
                );


            // ==================================================
            // CURRENT MESSAGE
            // ==================================================

            messages.push({

                role:
                    "user",

                content:
                    message.substring(
                        0,
                        12000
                    )

            });


            // ==================================================
            // OPENAI
            // ==================================================

            const response =
                await fetch(
                    "https://api.openai.com/v1/chat/completions",
                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${apiKey}`

                        },

                        body:
                            JSON.stringify({

                                model:
                                    process.env.OPENAI_MODEL ||
                                    "gpt-4o-mini",

                                messages,

                                temperature:
                                    0.7,

                                max_tokens:
                                    1500

                            })

                    }
                );


            if (!response.ok) {

                const errorText =
                    await response.text();


                console.error(
                    "OpenAI Error:",
                    errorText
                );


                return res.status(500).json({

                    success: false,

                    error:
                        "AI service error."

                });

            }


            const data =
                await response.json();


            const reply =
                data?.choices?.[0]
                    ?.message
                    ?.content;


            if (!reply) {

                return res.status(500).json({

                    success: false,

                    error:
                        "No AI response."

                });

            }


            res.json({

                success: true,

                reply:
                    reply.trim()

            });


        } catch (error) {

            console.error(
                "Viggo server error:",
                error
            );


            res.status(500).json({

                success: false,

                error:
                    "Viggo server error."

            });

        }

    }
);


// ======================================================
// 404
// ======================================================

app.use(
    (req, res) => {

        res.status(404).json({

            success: false,

            error:
                "Route not found."

        });

    }
);


// ======================================================
// START
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
            "Health check: /api/health"
        );

        console.log(
            "================================"
        );

    }
);
