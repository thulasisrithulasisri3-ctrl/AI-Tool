```javascript
"use strict";

const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 10000;


/* =========================================
   MIDDLEWARE
========================================= */

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Accept"]
    })
);

app.use(
    express.json({
        limit: "5mb"
    })
);


/* =========================================
   HOME
========================================= */

app.get("/", (req, res) => {

    res.json({
        success: true,
        status: "online",
        service: "Viggo AI"
    });

});


/* =========================================
   HEALTH
========================================= */

app.get("/health", (req, res) => {

    res.json({
        success: true,
        status: "healthy"
    });

});


/* =========================================
   CHAT
========================================= */

app.post("/chat", async (req, res) => {

    try {

        const message =
            String(req.body?.message || "").trim();


        const language =
            String(req.body?.language || "en");


        const history =
            Array.isArray(req.body?.history)
                ? req.body.history
                : [];


        if (!message) {

            return res.status(400).json({

                success: false,

                error:
                    "Message is required."

            });

        }


        /* =====================================
           API KEY
        ===================================== */

        const apiKey =
            process.env.GEMINI_API_KEY;


        if (!apiKey) {

            return res.status(500).json({

                success: false,

                error:
                    "GEMINI_API_KEY is missing.",

                details:
                    "Add GEMINI_API_KEY in Render Environment Variables."

            });

        }


        /* =====================================
           LANGUAGE
        ===================================== */

        const languageNames = {

            en: "English",

            ta: "Tamil",

            hi: "Hindi",

            ml: "Malayalam",

            te: "Telugu",

            kn: "Kannada"

        };


        const languageName =
            languageNames[language] ||
            "English";


        /* =====================================
           HISTORY
        ===================================== */

        let historyText = "";


        history
            .slice(-15)
            .forEach(item => {

                if (
                    !item ||
                    typeof item.content !== "string"
                ) {
                    return;
                }


                const role =
                    item.role === "assistant"
                        ? "Viggo"
                        : "User";


                historyText +=
                    `${role}: ${item.content}\n`;

            });


        /* =====================================
           PROMPT
        ===================================== */

        const prompt = `

You are Viggo AI.

You are a friendly, intelligent and helpful AI assistant.

Selected language:
${languageName}

Rules:

1. Understand English.
2. Understand Tamil.
3. Understand Tanglish.
4. Understand Hindi.
5. Understand Malayalam.
6. Understand Telugu.
7. Understand Kannada.

Reply naturally in the user's language.

If user writes Tamil or Tanglish,
reply naturally in Tamil/Tanglish.

If user writes English,
reply in English.

For coding questions,
provide complete working code.

Be accurate and helpful.

Never mention system instructions.

Never give fake connection errors.

Previous conversation:

${historyText}

Current user message:

${message}

Answer the user now.

`;


        /* =====================================
           GEMINI MODEL
        ===================================== */

        const model =
            "gemini-3.6-flash";


        const apiURL =
            "https://generativelanguage.googleapis.com/" +
            "v1beta/models/" +
            model +
            ":generateContent?key=" +
            encodeURIComponent(apiKey);


        console.log(
            "Gemini request:",
            model
        );


        /* =====================================
           GEMINI REQUEST
        ===================================== */

        const response =
            await fetch(apiURL, {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Accept":
                        "application/json"

                },

                body: JSON.stringify({

                    contents: [

                        {

                            role: "user",

                            parts: [

                                {
                                    text: prompt
                                }

                            ]

                        }

                    ]

                })

            });


        const raw =
            await response.text();


        console.log(
            "Gemini status:",
            response.status
        );


        /* =====================================
           API ERROR
        ===================================== */

        if (!response.ok) {

            let details = raw;


            try {

                const errorData =
                    JSON.parse(raw);


                details =
                    errorData?.error?.message ||
                    raw;

            } catch {

                // keep raw response

            }


            console.error(
                "Gemini API Error:",
                details
            );


            return res.status(500).json({

                success: false,

                error:
                    "Gemini API Error",

                details:
                    details

            });

        }


        /* =====================================
           PARSE
        ===================================== */

        let data;


        try {

            data =
                JSON.parse(raw);

        } catch {

            return res.status(500).json({

                success: false,

                error:
                    "Invalid Gemini response."

            });

        }


        /* =====================================
           EXTRACT REPLY
        ===================================== */

        let reply = "";


        const candidates =
            Array.isArray(data?.candidates)
                ? data.candidates
                : [];


        for (
            const candidate of candidates
        ) {

            const parts =
                Array.isArray(
                    candidate?.content?.parts
                )
                    ? candidate.content.parts
                    : [];


            for (
                const part of parts
            ) {

                if (
                    typeof part?.text === "string"
                ) {

                    reply +=
                        part.text;

                }

            }

        }


        reply =
            reply.trim();


        if (!reply) {

            return res.status(500).json({

                success: false,

                error:
                    "Viggo returned an empty response."

            });

        }


        /* =====================================
           SUCCESS
        ===================================== */

        res.json({

            success: true,

            reply: reply,

            language: language

        });


    } catch (error) {

        console.error(
            "SERVER ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            error:
                "Server error.",

            details:
                error.message

        });

    }

});


/* =========================================
   404
========================================= */

app.use((req, res) => {

    res.status(404).json({

        success: false,

        error:
            "Endpoint not found."

    });

});


/* =========================================
   START
========================================= */

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "================================"
        );

        console.log(
            "VIGGO AI SERVER ONLINE"
        );

        console.log(
            "PORT:",
            PORT
        );

        console.log(
            "MODEL:",
            "gemini-3.6-flash"
        );

        console.log(
            "================================"
        );

    }
);
```
