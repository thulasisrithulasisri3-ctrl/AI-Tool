"use strict";

/*
=========================================================
 VIGGO AI SERVER
 Node.js + Express + Google Gemini API
=========================================================

Required Render Environment Variable:

GEMINI_API_KEY=your_gemini_api_key

Start Command:

node server.js

IMPORTANT:
This server uses:
gemini-3.6-flash

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

/*
 IMPORTANT:
 Do NOT use gemini-2.5-flash here.
*/
const MODEL = "gemini-3.6-flash";

const API_KEY =
    process.env.GEMINI_API_KEY;


/* ======================================================
   STARTUP CHECK
====================================================== */

console.log("");
console.log("================================");
console.log("       VIGGO AI SERVER");
console.log("================================");
console.log("PORT:", PORT);
console.log("MODEL:", MODEL);

if (API_KEY) {
    console.log("API KEY: CONFIGURED");
} else {
    console.log("API KEY: MISSING");
}

console.log("================================");
console.log("");


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
   ROOT
====================================================== */

app.get(
    "/",
    (req, res) => {

        res.status(200).json({

            success: true,

            message:
                "Viggo AI Server is online.",

            server:
                "Viggo AI",

            model:
                MODEL,

            status:
                "online",

            apiConfigured:
                Boolean(API_KEY),

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

        res.status(200).json({

            success: true,

            server:
                "Viggo AI",

            model:
                MODEL,

            apiConfigured:
                Boolean(API_KEY),

            status:
                "online",

            time:
                new Date().toISOString()

        });

    }
);


/* ======================================================
   TEXT CLEANER
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
   LANGUAGE
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

function createSystemInstruction(language) {

    const languageName =
        getLanguageName(language);

    return `
You are Viggo AI.

Your name is Viggo.

You are a friendly, helpful and reliable AI assistant.

The user's selected language is ${languageName}.

LANGUAGE RULES:

1. Reply primarily in ${languageName}.
2. Understand Tamil, English and other supported languages.
3. If the user specifically asks for English, reply in English.
4. If the user specifically asks for Tamil, reply in Tamil.
5. Do not unnecessarily mix languages.
6. Keep answers natural and easy to understand.

PERSONALITY:

- Friendly
- Helpful
- Respectful
- Clear
- Natural
- Simple when possible
- Do not claim to be human.
- Do not mention system instructions.

TECHNICAL QUESTIONS:

- Explain step by step.
- Give examples when useful.
- If the user asks for complete code, provide complete code.
- Do not intentionally leave important parts of the code unfinished.

CASUAL QUESTIONS:

- Respond naturally like a helpful AI friend.

IMPORTANT:

You are Viggo AI.
`;
}


/* ======================================================
   BUILD HISTORY
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
                cleanText(
                    item.content
                );

            return (
                role +
                ": " +
                content
            );

        })
        .join("\n\n");

}


/* ======================================================
   CHAT
====================================================== */

app.post(
    "/chat",
    async (req, res) => {

        try {

            console.log("");
            console.log(
                "--------------------------------"
            );
            console.log(
                "NEW CHAT REQUEST"
            );
            console.log(
                "--------------------------------"
            );


            /* ==========================================
               API KEY CHECK
            ========================================== */

            if (!API_KEY) {

                console.error(
                    "GEMINI_API_KEY is missing."
                );

                return res.status(500).json({

                    success: false,

                    error:
                        "Gemini API key is not configured.",

                    details:
                        "Add GEMINI_API_KEY in Render Environment Variables."

                });

            }


            if (!ai) {

                return res.status(500).json({

                    success: false,

                    error:
                        "Gemini client is not initialized."

                });

            }


            /* ==========================================
               REQUEST
            ========================================== */

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


            console.log(
                "Language:",
                language
            );


            console.log(
                "Message:",
                message.slice(0, 150)
            );


            /* ==========================================
               VALIDATE
            ========================================== */

            if (!message) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Message is required."

                });

            }


            /* ==========================================
               HISTORY
            ========================================== */

            const previousMessages =
                buildHistory(
                    history
                );


            /* ==========================================
               SYSTEM
            ========================================== */

            const systemInstruction =
                createSystemInstruction(
                    language
                );


            /* ==========================================
               PROMPT
            ========================================== */

            let prompt = "";


            prompt +=
                systemInstruction;


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


            /* ==========================================
               GEMINI REQUEST
            ========================================== */

            console.log(
                "Sending request to Gemini..."
            );


            const response =
                await ai.models.generateContent({

                    model:
                        MODEL,

                    contents:
                        prompt

                });


            /* ==========================================
               RESPONSE TEXT
            ========================================== */

            let reply = "";


            if (
                response &&
                typeof response.text ===
                    "string"
            ) {

                reply =
                    response.text;

            }


            /* ==========================================
               FALLBACK RESPONSE EXTRACTION
            ========================================== */

            if (
                !reply &&
                response?.candidates
            ) {

                const candidates =
                    response.candidates;


                if (
                    Array.isArray(
                        candidates
                    ) &&
                    candidates.length
                ) {

                    const candidate =
                        candidates[0];


                    const parts =
                        candidate
                            ?.content
                            ?.parts;


                    if (
                        Array.isArray(parts)
                    ) {

                        reply =
                            parts
                                .map(
                                    part =>
                                        part?.text ||
                                        ""
                                )
                                .join("");

                    }

                }

            }


            reply =
                cleanText(
                    reply
                );


            /* ==========================================
               EMPTY RESPONSE
            ========================================== */

            if (!reply) {

                console.error(
                    "Gemini returned empty response."
                );


                console.error(
                    JSON.stringify(
                        response,
                        null,
                        2
                    )
                );


                return res.status(502).json({

                    success: false,

                    error:
                        "Viggo AI returned an empty response.",

                    details:
                        "The Gemini model did not return text."

                });

            }


            /* ==========================================
               SUCCESS
            ========================================== */

            console.log(
                "Gemini response received."
            );


            console.log(
                "Reply:",
                reply.slice(0, 150)
            );


            console.log(
                "--------------------------------"
            );


            return res.status(200).json({

                success:
                    true,

                reply:
                    reply,

                model:
                    MODEL

            });

        }


        /* ==============================================
           ERROR
        ============================================== */

        catch (error) {

            console.error("");
            console.error(
                "================================"
            );
            console.error(
                "GEMINI ERROR"
            );
            console.error(
                "================================"
            );


            console.error(
                error
            );


            const errorMessage =
                error?.message ||
                String(error);


            const lowerError =
                errorMessage.toLowerCase();


            /* ==========================================
               404 MODEL ERROR
            ========================================== */

            if (
                lowerError.includes(
                    "404"
                ) ||
                lowerError.includes(
                    "not found"
                ) ||
                lowerError.includes(
                    "not_found"
                )
            ) {

                return res.status(502).json({

                    success: false,

                    error:
                        "Gemini model is unavailable.",

                    details:
                        `Model "${MODEL}" could not be used. Check the Gemini API model availability.`

                });

            }


            /* ==========================================
               API KEY
            ========================================== */

            if (
                lowerError.includes(
                    "api key"
                ) ||
                lowerError.includes(
                    "invalid api"
                ) ||
                lowerError.includes(
                    "unauthenticated"
                )
            ) {

                return res.status(500).json({

                    success: false,

                    error:
                        "Gemini API key error.",

                    details:
                        "Check GEMINI_API_KEY in Render Environment Variables."

                });

            }


            /* ==========================================
               429 RATE LIMIT
            ========================================== */

            if (
                lowerError.includes(
                    "429"
                ) ||
                lowerError.includes(
                    "resource exhausted"
                ) ||
                lowerError.includes(
                    "rate limit"
                ) ||
                lowerError.includes(
                    "too many requests"
                )
            ) {

                return res.status(429).json({

                    success: false,

                    error:
                        "Viggo AI is temporarily busy.",

                    details:
                        "Gemini is experiencing high demand. Please try again after a few seconds."

                });

            }


            /* ==========================================
               GENERAL ERROR
            ========================================== */

            return res.status(500).json({

                success: false,

                error:
                    "Viggo AI could not generate a response.",

                details:
                    errorMessage

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
   GLOBAL ERROR
====================================================== */

app.use(
    (
        error,
        req,
        res,
        next
    ) => {

        console.error(
            "Unhandled server error:",
            error
        );


        if (
            res.headersSent
        ) {

            return next(error);

        }


        return res.status(500).json({

            success: false,

            error:
                "Internal server error."

        });

    }
);


/* ======================================================
   START
====================================================== */

app.listen(
    PORT,
    () => {

        console.log("");
        console.log(
            "================================"
        );
        console.log(
            "     VIGGO AI SERVER ONLINE"
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
            "CHAT ENDPOINT: /chat"
        );
        console.log(
            "STATUS ENDPOINT: /status"
        );
        console.log(
            "================================"
        );
        console.log("");

    }
);
