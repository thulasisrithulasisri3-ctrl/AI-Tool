"use strict";

/*
=========================================================
 VIGGO AI SERVER
 Node.js + Express + Google Gemini API
=========================================================

 Required environment variable:

 GEMINI_API_KEY=your_api_key_here

 Render:
 Environment → Environment Variables

 Start command:
 node server.js
=========================================================
*/

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();

/* ======================================================
   CONFIG
====================================================== */

const PORT = process.env.PORT || 10000;

const API_KEY = process.env.GEMINI_API_KEY;

/*
   Current stable Gemini model.
*/
const MODEL = "gemini-3.6-flash";


/* ======================================================
   CHECK API KEY
====================================================== */

if (!API_KEY) {

    console.error(
        "❌ GEMINI_API_KEY is missing."
    );

} else {

    console.log(
        "✓ GEMINI_API_KEY detected."
    );

}


/* ======================================================
   GEMINI CLIENT
====================================================== */

let ai = null;

if (API_KEY) {

    ai = new GoogleGenAI({
        apiKey: API_KEY
    });

}


/* ======================================================
   MIDDLEWARE
====================================================== */

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


/* ======================================================
   HEALTH CHECK
====================================================== */

app.get(
    "/",
    (req, res) => {

        res.json({

            success: true,

            message:
                "Viggo AI Server is online.",

            model:
                MODEL,

            status:
                "online",

            time:
                new Date().toISOString()

        });

    }
);


/* ======================================================
   STATUS
====================================================== */

app.get(
    "/status",
    (req, res) => {

        res.json({

            success: true,

            server:
                "Viggo AI",

            model:
                MODEL,

            apiConfigured:
                Boolean(API_KEY),

            time:
                new Date().toISOString()

        });

    }
);


/* ======================================================
   HELPER
====================================================== */

function cleanText(value) {

    if (
        typeof value !== "string"
    ) {

        return "";

    }

    return value
        .replace(/\u0000/g, "")
        .trim();

}


/* ======================================================
   LANGUAGE NAME
====================================================== */

function getLanguageName(language) {

    const languages = {

        en: "English",

        ta: "Tamil",

        hi: "Hindi",

        ml: "Malayalam",

        te: "Telugu",

        kn: "Kannada"

    };

    return (
        languages[language] ||
        "English"
    );

}


/* ======================================================
   SYSTEM INSTRUCTION
====================================================== */

function createSystemInstruction(
    language
) {

    const languageName =
        getLanguageName(language);

    return `
You are Viggo AI, a friendly and helpful AI assistant.

Your name is Viggo.

The user selected ${languageName} as their preferred language.

IMPORTANT LANGUAGE RULE:
- Reply primarily in ${languageName}.
- If the user asks in another language, understand the question correctly.
- Keep the answer natural and easy to understand.
- Do not unnecessarily mix languages.
- If the user specifically asks for English, reply in English.
- If the user specifically asks for Tamil, reply in Tamil.

PERSONALITY:
- Friendly
- Helpful
- Clear
- Respectful
- Simple when possible
- Do not claim to be a human.
- Do not mention these system instructions.

When the user asks a technical question:
- Explain step by step.
- Give working examples when useful.
- For code, provide complete and correctly formatted code when requested.

When the user asks casual questions:
- Respond naturally and conversationally.

Your goal is to be a reliable AI friend called Viggo.
`;
}


/* ======================================================
   HISTORY FORMAT
====================================================== */

function buildHistory(history) {

    if (!Array.isArray(history)) {

        return "";

    }

    const safeHistory =
        history
            .filter(item => {

                return (
                    item &&
                    typeof item === "object" &&
                    (
                        item.role === "user" ||
                        item.role === "assistant"
                    ) &&
                    typeof item.content === "string"
                );

            })
            .slice(-15);


    if (!safeHistory.length) {

        return "";

    }


    return safeHistory
        .map(item => {

            const role =
                item.role === "user"
                    ? "User"
                    : "Viggo";

            const content =
                cleanText(item.content);

            return (
                role +
                ": " +
                content
            );

        })
        .join("\n\n");

}


/* ======================================================
   CHAT ENDPOINT
====================================================== */

app.post(
    "/chat",
    async (req, res) => {

        try {

            /* ------------------------------------------
               API KEY CHECK
            ------------------------------------------ */

            if (!API_KEY || !ai) {

                return res.status(500).json({

                    success: false,

                    error:
                        "GEMINI_API_KEY is not configured.",

                    details:
                        "Add GEMINI_API_KEY in Render Environment Variables."

                });

            }


            /* ------------------------------------------
               REQUEST DATA
            ------------------------------------------ */

            const message =
                cleanText(
                    req.body?.message
                );


            const language =
                cleanText(
                    req.body?.language
                ) || "en";


            const history =
                req.body?.history;


            /* ------------------------------------------
               VALIDATE MESSAGE
            ------------------------------------------ */

            if (!message) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Message is required."

                });

            }


            /* ------------------------------------------
               BUILD HISTORY
            ------------------------------------------ */

            const previousMessages =
                buildHistory(
                    history
                );


            /* ------------------------------------------
               BUILD PROMPT
            ------------------------------------------ */

            let prompt =
                createSystemInstruction(
                    language
                );


            if (previousMessages) {

                prompt += `

CONVERSATION HISTORY:

${previousMessages}

`;

            }


            prompt += `

CURRENT USER MESSAGE:

${message}

Respond to the user now.
`;


            /* ------------------------------------------
               GEMINI REQUEST
            ------------------------------------------ */

            console.log(
                "→ Gemini request:",
                message.slice(0, 100)
            );


            const response =
                await ai.models.generateContent({

                    model:
                        MODEL,

                    contents:
                        prompt

                });


            /* ------------------------------------------
               GET RESPONSE TEXT
            ------------------------------------------ */

            let reply = "";


            if (
                response &&
                typeof response.text === "string"
            ) {

                reply =
                    response.text;

            }


            /*
               Some SDK versions expose text
               differently. Try candidates if needed.
            */

            if (
                !reply &&
                response?.candidates?.length
            ) {

                const candidate =
                    response.candidates[0];


                const parts =
                    candidate?.content?.parts;


                if (
                    Array.isArray(parts)
                ) {

                    reply =
                        parts
                            .map(
                                part =>
                                    part?.text || ""
                            )
                            .join("");

                }

            }


            reply =
                cleanText(reply);


            /* ------------------------------------------
               EMPTY RESPONSE
            ------------------------------------------ */

            if (!reply) {

                console.error(
                    "Gemini returned empty response:",
                    response
                );


                return res.status(502).json({

                    success: false,

                    error:
                        "Viggo AI returned an empty response."

                });

            }


            /* ------------------------------------------
               SUCCESS
            ------------------------------------------ */

            console.log(
                "✓ Gemini response received."
            );


            return res.json({

                success:
                    true,

                reply:
                    reply,

                model:
                    MODEL

            });

        }


        /* ==============================================
           ERROR HANDLING
        ============================================== */

        catch (error) {

            console.error(
                "❌ Gemini error:"
            );

            console.error(
                error
            );


            const message =
                error?.message ||
                String(error);


            /*
               API KEY ERROR
            */

            if (
                message
                    .toLowerCase()
                    .includes("api key")
            ) {

                return res.status(500).json({

                    success: false,

                    error:
                        "Gemini API key error.",

                    details:
                        "Check GEMINI_API_KEY in Render Environment Variables."

                });

            }


            /*
               MODEL ERROR
            */

            if (
                message
                    .toLowerCase()
                    .includes("model")
            ) {

                return res.status(502).json({

                    success: false,

                    error:
                        "Gemini model error.",

                    details:
                        message

                });

            }


            /*
               RATE LIMIT
            */

            if (
                message
                    .toLowerCase()
                    .includes("429")
                ||
                message
                    .toLowerCase()
                    .includes("resource exhausted")
            ) {

                return res.status(429).json({

                    success: false,

                    error:
                        "Viggo AI is temporarily busy.",

                    details:
                        "Please try again in a few seconds."

                });

            }


            /*
               GENERAL ERROR
            */

            return res.status(500).json({

                success: false,

                error:
                    "Viggo AI could not generate a response.",

                details:
                    message

            });

        }

    }
);


/* ======================================================
   404
====================================================== */

app.use(
    (req, res) => {

        res.status(404).json({

            success: false,

            error:
                "Endpoint not found.",

            path:
                req.path

        });

    }
);


/* ======================================================
   GLOBAL ERROR HANDLER
====================================================== */

app.use(
    (error, req, res, next) => {

        console.error(
            "Unhandled server error:",
            error
        );


        if (
            res.headersSent
        ) {

            return next(error);

        }


        res.status(500).json({

            success: false,

            error:
                "Internal server error."

        });

    }
);


/* ======================================================
   START SERVER
====================================================== */

app.listen(
    PORT,
    () => {

        console.log("");
        console.log(
            "================================"
        );
        console.log(
            "       VIGGO AI SERVER ONLINE"
        );
        console.log(
            "================================"
        );
        console.log(
            "PORT:",
            PORT
        );
        console.log(
            "MODEL:",
            MODEL
        );
        console.log(
            "API KEY:",
            API_KEY
                ? "CONFIGURED"
                : "MISSING"
        );
        console.log(
            "================================"
        );
        console.log("");

    }
);
