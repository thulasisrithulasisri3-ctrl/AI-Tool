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

app.get("/", function (req, res) {

    res.json({
        success: true,
        service: "Viggo AI",
        status: "online"
    });

});


/* =========================================
   HEALTH CHECK
========================================= */

app.get("/health", function (req, res) {

    res.json({
        success: true,
        status: "healthy",
        service: "Viggo AI"
    });

});


/* =========================================
   CHAT API
========================================= */

app.post("/chat", async function (req, res) {

    try {

        const message =
            typeof req.body.message === "string"
                ? req.body.message.trim()
                : "";


        const language =
            typeof req.body.language === "string"
                ? req.body.language
                : "en";


        const history =
            Array.isArray(req.body.history)
                ? req.body.history
                : [];


        /* =====================================
           CHECK MESSAGE
        ===================================== */

        if (!message) {

            return res.status(400).json({

                success: false,

                error:
                    "Message is required."

            });

        }


        /* =====================================
           GEMINI API KEY
        ===================================== */

        const apiKey =
            process.env.GEMINI_API_KEY;


        if (!apiKey) {

            console.error(
                "GEMINI_API_KEY is missing."
            );


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
           CONVERSATION HISTORY
        ===================================== */

        let historyText = "";


        history
            .slice(-15)
            .forEach(function (item) {

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
                    role +
                    ": " +
                    item.content +
                    "\n";

            });


        /* =====================================
           VIGGO PROMPT
        ===================================== */

        const prompt =
            "You are Viggo AI.\n\n" +

            "You are a friendly, intelligent " +
            "and helpful AI assistant.\n\n" +

            "The selected language is " +
            languageName +
            ".\n\n" +

            "Rules:\n" +

            "1. Understand English.\n" +

            "2. Understand Tamil.\n" +

            "3. Understand Tanglish.\n" +

            "4. Understand Hindi.\n" +

            "5. Understand Malayalam.\n" +

            "6. Understand Telugu.\n" +

            "7. Understand Kannada.\n\n" +

            "Reply naturally in the user's language.\n" +

            "If the user writes Tamil or Tanglish, " +
            "reply in Tamil/Tanglish.\n\n" +

            "If the user writes English, " +
            "reply in English.\n\n" +

            "For coding questions, " +
            "give complete working code.\n\n" +

            "Be accurate and helpful.\n\n" +

            "Previous conversation:\n\n" +

            historyText +

            "\nCurrent user message:\n\n" +

            message +

            "\n\nAnswer the user now.";


        /* =====================================
           GEMINI MODEL
        ===================================== */

        const model =
            "gemini-flash-latest";


        const apiURL =
            "https://generativelanguage.googleapis.com/" +
            "v1beta/models/" +
            model +
            ":generateContent?key=" +
            encodeURIComponent(apiKey);


        console.log(
            "Sending request to Gemini..."
        );


        /* =====================================
           GEMINI REQUEST
        ===================================== */

        const response =
            await fetch(
                apiURL,
                {

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

                }
            );


        const raw =
            await response.text();


        console.log(
            "Gemini status:",
            response.status
        );


        /* =====================================
           GEMINI API ERROR
        ===================================== */

        if (!response.ok) {

            let details =
                raw;


            try {

                const errorData =
                    JSON.parse(raw);


                if (
                    errorData &&
                    errorData.error &&
                    errorData.error.message
                ) {

                    details =
                        errorData.error.message;

                }

            } catch (parseError) {

                console.error(
                    "Could not parse error response."
                );

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
           PARSE GEMINI RESPONSE
        ===================================== */

        let data;


        try {

            data =
                JSON.parse(raw);

        } catch (parseError) {

            console.error(
                "JSON parse error:",
                parseError
            );


            return res.status(500).json({

                success: false,

                error:
                    "Invalid Gemini response."

            });

        }


        /* =====================================
           EXTRACT AI RESPONSE
        ===================================== */

        let reply = "";


        if (
            data &&
            Array.isArray(data.candidates)
        ) {

            data.candidates.forEach(
                function (candidate) {

                    if (
                        candidate &&
                        candidate.content &&
                        Array.isArray(
                            candidate.content.parts
                        )
                    ) {

                        candidate.content.parts
                            .forEach(
                                function (part) {

                                    if (
                                        part &&
                                        typeof part.text ===
                                        "string"
                                    ) {

                                        reply +=
                                            part.text;

                                    }

                                }
                            );

                    }

                }
            );

        }


        reply =
            reply.trim();


        /* =====================================
           EMPTY RESPONSE
        ===================================== */

        if (!reply) {

            console.error(
                "Empty response from Gemini:",
                data
            );


            return res.status(500).json({

                success: false,

                error:
                    "Viggo returned an empty response."

            });

        }


        /* =====================================
           SUCCESS
        ===================================== */

        console.log(
            "Viggo response received."
        );


        return res.json({

            success: true,

            reply: reply,

            language:
                language

        });


    } catch (error) {

        console.error(
            "SERVER ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            error:
                "Server error.",

            details:
                error.message

        });

    }

});


/* =========================================
   404 HANDLER
========================================= */

app.use(
    function (req, res) {

        res.status(404).json({

            success: false,

            error:
                "Endpoint not found."

        });

    }
);


/* =========================================
   START SERVER
========================================= */

app.listen(
    PORT,
    "0.0.0.0",
    function () {

        console.log(
            "================================"
        );

        console.log(
            "VIGGO AI SERVER ONLINE"
        );

        console.log(
            "PORT: " +
            PORT
        );

        console.log(
            "MODEL: " +
            "gemini-flash-latest"
        );

        console.log(
            "================================"
        );

    }
);
