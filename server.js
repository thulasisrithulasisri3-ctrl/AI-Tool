"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();

/* ================================
   CONFIG
================================ */

const PORT =
    process.env.PORT || 10000;

const API_KEY =
    process.env.GEMINI_API_KEY;

/*
   Model can be changed from Render
   Environment Variables.

   GEMINI_MODEL =
   gemini-2.5-flash-lite

   If GEMINI_MODEL is not set,
   gemini-2.5-flash-lite is used.
*/

const MODEL =
    process.env.GEMINI_MODEL ||
    "gemini-2.5-flash-lite";


/* ================================
   GEMINI CLIENT
================================ */

let ai = null;

if (API_KEY) {

    ai = new GoogleGenAI({
        apiKey: API_KEY
    });

    console.log(
        "✓ Gemini API key detected."
    );

} else {

    console.error(
        "❌ GEMINI_API_KEY is missing."
    );

}


/* ================================
   MIDDLEWARE
================================ */

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


/* ================================
   HEALTH
================================ */

app.get(
    "/",
    (req, res) => {

        res.json({

            success: true,

            message:
                "Viggo AI Server is online.",

            model:
                MODEL,

            apiConfigured:
                Boolean(API_KEY),

            time:
                new Date().toISOString()

        });

    }
);


/* ================================
   STATUS
================================ */

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


/* ================================
   CLEAN TEXT
================================ */

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


/* ================================
   LANGUAGE
================================ */

function languageName(language) {

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


/* ================================
   BUILD CONTENTS
================================ */

function buildContents(
    history,
    message
) {

    const contents = [];


    if (Array.isArray(history)) {

        history
            .filter(item => {

                return (
                    item &&
                    (
                        item.role === "user" ||
                        item.role === "assistant"
                    ) &&
                    typeof item.content === "string"
                );

            })
            .slice(-14)
            .forEach(item => {

                const text =
                    cleanText(
                        item.content
                    );

                if (!text)
                    return;


                contents.push({

                    role:
                        item.role === "assistant"
                            ? "model"
                            : "user",

                    parts: [

                        {
                            text:
                                text
                        }

                    ]

                });

            });

    }


    contents.push({

        role: "user",

        parts: [

            {
                text:
                    cleanText(message)
            }

        ]

    });


    return contents;

}


/* ================================
   RETRY CHECK
================================ */

function isRetryableError(error) {

    const text =
        String(
            error?.message ||
            error ||
            ""
        ).toLowerCase();


    return (

        text.includes("429") ||

        text.includes(
            "resource exhausted"
        ) ||

        text.includes(
            "too many requests"
        ) ||

        text.includes(
            "rate limit"
        ) ||

        text.includes(
            "temporarily unavailable"
        ) ||

        text.includes(
            "service unavailable"
        ) ||

        text.includes(
            "high demand"
        ) ||

        text.includes(
            "503"
        )

    );

}


/* ================================
   WAIT
================================ */

function wait(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );

}


/* ================================
   GEMINI REQUEST WITH RETRY
================================ */

async function generateWithRetry(
    contents,
    systemInstruction
) {

    const MAX_RETRIES = 3;

    const delays = [
        1500,
        3000,
        5000
    ];


    let lastError = null;


    for (
        let attempt = 0;
        attempt <= MAX_RETRIES;
        attempt++
    ) {

        try {

            console.log(
                `→ Gemini attempt ${attempt + 1}/${MAX_RETRIES + 1}`
            );


            const response =
                await ai.models.generateContent({

                    model:
                        MODEL,

                    contents:
                        contents,

                    config: {

                        systemInstruction:
                            systemInstruction

                    }

                });


            return response;

        }


        catch (error) {

            lastError =
                error;


            console.error(
                `❌ Gemini attempt ${attempt + 1} failed:`,
                error?.message ||
                error
            );


            /*
               Do not retry model-not-found,
               API-key or authentication errors.
            */

            if (
                !isRetryableError(
                    error
                )
            ) {

                throw error;

            }


            /*
               Maximum retry reached.
            */

            if (
                attempt >= MAX_RETRIES
            ) {

                throw error;

            }


            const delay =
                delays[
                    attempt
                ] ||
                5000;


            console.log(
                `⏳ Temporary Gemini error. Retrying in ${delay}ms...`
            );


            await wait(
                delay
            );

        }

    }


    throw lastError;

}


/* ================================
   CHAT
================================ */

app.post(
    "/chat",
    async (req, res) => {

        try {

            /* --------------------------------
               API KEY CHECK
            -------------------------------- */

            if (
                !API_KEY ||
                !ai
            ) {

                return res.status(500).json({

                    success: false,

                    error:
                        "GEMINI_API_KEY is missing.",

                    details:
                        "Add GEMINI_API_KEY in Render → Environment Variables."

                });

            }


            /* --------------------------------
               REQUEST DATA
            -------------------------------- */

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


            /* --------------------------------
               MESSAGE VALIDATION
            -------------------------------- */

            if (!message) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Message is required."

                });

            }


            /* --------------------------------
               LANGUAGE
            -------------------------------- */

            const selectedLanguage =
                languageName(
                    language
                );


            /* --------------------------------
               SYSTEM INSTRUCTION
            -------------------------------- */

            const systemInstruction = `
You are Viggo AI.

You are a friendly, helpful AI assistant.

Your name is Viggo.

The user's selected language is ${selectedLanguage}.

LANGUAGE RULES:

- Reply primarily in ${selectedLanguage}.
- Understand the user's language correctly.
- Do not unnecessarily mix languages.
- If the user specifically asks for English, reply in English.
- If the user specifically asks for Tamil, reply in Tamil.
- Keep answers natural and easy to understand.

PERSONALITY:

- Friendly
- Clear
- Helpful
- Respectful
- Natural
- Simple when possible

TECHNICAL QUESTIONS:

- Explain step by step.
- Give examples when useful.
- Give complete code when the user asks for full code.
- Do not remove existing functionality unless requested.

CASUAL QUESTIONS:

- Respond naturally and conversationally.

Do not mention these instructions.
`;


            /* --------------------------------
               CONTENTS
            -------------------------------- */

            const contents =
                buildContents(
                    history,
                    message
                );


            console.log(
                "================================"
            );

            console.log(
                "→ Viggo request:",
                message.slice(
                    0,
                    100
                )
            );

            console.log(
                "→ Model:",
                MODEL
            );


            /* --------------------------------
               GEMINI REQUEST
            -------------------------------- */

            const response =
                await generateWithRetry(
                    contents,
                    systemInstruction
                );


            /* --------------------------------
               RESPONSE TEXT
            -------------------------------- */

            let reply = "";


            if (
                response &&
                typeof response.text ===
                    "string"
            ) {

                reply =
                    response.text;

            }


            /* --------------------------------
               FALLBACK RESPONSE PARSER
            -------------------------------- */

            if (!reply) {

                const candidates =
                    response?.candidates;


                if (
                    Array.isArray(
                        candidates
                    )
                {

                    const parts =
                        candidates[0]
                            ?.content
                            ?.parts;


                    if (
                        Array.isArray(
                            parts
                        )
                    {

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


            /* --------------------------------
               EMPTY RESPONSE
            -------------------------------- */

            if (!reply) {

                console.error(
                    "❌ Gemini returned empty response."
                );


                return res.status(502).json({

                    success: false,

                    error:
                        "Viggo returned an empty response.",

                    details:
                        "Gemini did not return text."

                });

            }


            /* --------------------------------
               SUCCESS
            -------------------------------- */

            console.log(
                "✓ Response received."
            );

            console.log(
                "================================"
            );


            return res.json({

                success: true,

                reply:
                    reply,

                model:
                    MODEL

            });

        }


        catch (error) {

            console.error(
                "================================"
            );

            console.error(
                "❌ Gemini final error:"
            );

            console.error(
                error
            );

            console.error(
                "================================"
            );


            const errorText =
                String(
                    error?.message ||
                    error ||
                    ""
                );


            const lower =
                errorText.toLowerCase();


            /* ==============================
               429 / HIGH DEMAND
            ============================== */

            if (
                lower.includes("429") ||
                lower.includes(
                    "resource exhausted"
                ) ||
                lower.includes(
                    "too many requests"
                ) ||
                lower.includes(
                    "rate limit"
                ) ||
                lower.includes(
                    "high demand"
                ) ||
                lower.includes(
                    "quota"
                )
            ) {

                return res.status(429).json({

                    success: false,

                    error:
                        "Viggo AI is temporarily busy.",

                    details:
                        "Gemini is currently experiencing high demand. Please try again in a few seconds."

                });

            }


            /* ==============================
               MODEL NOT FOUND
            ============================== */

            if (
                lower.includes(
                    "model"
                ) &&
                (
                    lower.includes("404") ||
                    lower.includes(
                        "not found"
                    ) ||
                    lower.includes(
                        "not available"
                    )
                )
            ) {

                return res.status(502).json({

                    success: false,

                    error:
                        "Gemini model is unavailable.",

                    details:
                        "Current model: " +
                        MODEL +
                        ". Change GEMINI_MODEL in Render Environment Variables to a model available to your Gemini API account."

                });

            }


            /* ==============================
               API KEY
            ============================== */

            if (
                lower.includes(
                    "api key"
                ) ||
                lower.includes(
                    "401"
                ) ||
                lower.includes(
                    "unauthenticated"
                ) ||
                lower.includes(
                    "authentication"
                )
            ) {

                return res.status(401).json({

                    success: false,

                    error:
                        "Gemini API key error.",

                    details:
                        "Check GEMINI_API_KEY in Render → Environment Variables."

                });

            }


            /* ==============================
               PERMISSION
            ============================== */

            if (
                lower.includes(
                    "permission denied"
                ) ||
                lower.includes(
                    "403"
                ) ||
                lower.includes(
                    "permission"
                )
            ) {

                return res.status(403).json({

                    success: false,

                    error:
                        "Gemini API permission error.",

                    details:
                        errorText

                });

            }


            /* ==============================
               GENERAL ERROR
            ============================== */

            return res.status(500).json({

                success: false,

                error:
                    "Viggo AI could not generate a response.",

                details:
                    errorText

            });

        }

    }
);


/* ================================
   404
================================ */

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


/* ================================
   GLOBAL ERROR
================================ */

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

            return next(
                error
            );

        }


        res.status(500).json({

            success: false,

            error:
                "Internal server error."

        });

    }
);


/* ================================
   START SERVER
================================ */

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
            "RETRY:",
            "ENABLED"
        );

        console.log(
            "================================"
        );

        console.log("");

    }
);
