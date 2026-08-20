"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();

/* =================================================
   CONFIG
================================================= */

const PORT = Number(process.env.PORT) || 10000;

const API_KEY =
    process.env.GEMINI_API_KEY;

const MODEL =
    process.env.GEMINI_MODEL ||
    "gemini-3.5-flash-lite";


/* =================================================
   GEMINI CLIENT
================================================= */

let ai = null;

if (API_KEY) {

    ai = new GoogleGenAI({
        apiKey: API_KEY
    });

    console.log("✓ Gemini API key detected.");

} else {

    console.error("❌ GEMINI_API_KEY is missing.");

}


/* =================================================
   MIDDLEWARE
================================================= */

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ]
    })
);

app.use(
    express.json({
        limit: "5mb"
    })
);


/* =================================================
   HEALTH CHECK
================================================= */

app.get("/", (req, res) => {

    res.status(200).json({

        success: true,

        message:
            "Viggo AI Server is online.",

        server:
            "Viggo AI",

        model:
            MODEL,

        apiConfigured:
            Boolean(API_KEY),

        port:
            PORT,

        time:
            new Date().toISOString()

    });

});


/* =================================================
   STATUS
================================================= */

app.get("/status", (req, res) => {

    res.status(200).json({

        success: true,

        server:
            "Viggo AI",

        status:
            "online",

        model:
            MODEL,

        apiConfigured:
            Boolean(API_KEY),

        time:
            new Date().toISOString()

    });

});


/* =================================================
   CLEAN TEXT
================================================= */

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


/* =================================================
   LANGUAGE
================================================= */

function languageName(language) {

    const languages = {

        en: "English",

        ta: "Tamil",

        hi: "Hindi",

        ml: "Malayalam",

        te: "Telugu",

        kn: "Kannada",

        bn: "Bengali",

        mr: "Marathi",

        gu: "Gujarati",

        pa: "Punjabi",

        ur: "Urdu",

        es: "Spanish",

        fr: "French",

        de: "German",

        ja: "Japanese",

        ko: "Korean",

        zh: "Chinese",

        ar: "Arabic"

    };

    return (
        languages[language] ||
        "English"
    );

}


/* =================================================
   BUILD CONTENTS
================================================= */

function buildContents(
    history,
    message
) {

    const contents = [];

    if (
        Array.isArray(history)
    ) {

        history
            .filter(item => {

                return (
                    item &&
                    (
                        item.role === "user" ||
                        item.role === "assistant" ||
                        item.role === "model"
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

                if (!text) {
                    return;
                }

                contents.push({

                    role:
                        item.role === "assistant" ||
                        item.role === "model"
                            ? "model"
                            : "user",

                    parts: [
                        {
                            text: text
                        }
                    ]

                });

            });

    }


    const cleanMessage =
        cleanText(message);


    if (cleanMessage) {

        contents.push({

            role: "user",

            parts: [
                {
                    text: cleanMessage
                }
            ]

        });

    }


    return contents;

}


/* =================================================
   RETRY CHECK
================================================= */

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

        text.includes("503") ||

        text.includes("504")

    );

}


/* =================================================
   WAIT
================================================= */

function wait(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );

}


/* =================================================
   GEMINI REQUEST
================================================= */

async function generateWithRetry(
    contents,
    systemInstruction
) {

    const MAX_RETRIES = 2;

    const delays = [
        1500,
        3000
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

            console.log(
                "→ Model:",
                MODEL
            );


            const response =
                await ai.models.generateContent({

                    model:
                        MODEL,

                    contents:
                        contents,

                    config: {

                        systemInstruction:
                            systemInstruction,

                        thinkingConfig: {

                            thinkingLevel:
                                "minimal"

                        }

                    }

                });


            return response;

        }


        catch (error) {

            lastError =
                error;

            console.error(
                `❌ Gemini attempt ${attempt + 1} failed`
            );

            console.error(
                error?.message ||
                error
            );


            if (
                !isRetryableError(
                    error
                )
            ) {

                throw error;

            }


            if (
                attempt >= MAX_RETRIES
            ) {

                throw error;

            }


            await wait(
                delays[attempt]
            );

        }

    }


    throw lastError;

}


/* =================================================
   EXTRACT RESPONSE TEXT
================================================= */

function extractResponseText(
    response
) {

    if (!response) {
        return "";
    }


    if (
        typeof response.text === "string"
    ) {

        return cleanText(
            response.text
        );

    }


    const candidates =
        response.candidates;


    if (
        Array.isArray(candidates) &&
        candidates.length
    ) {

        const parts =
            candidates[0]
                ?.content
                ?.parts;


        if (
            Array.isArray(parts)
        ) {

            return cleanText(

                parts
                    .map(
                        part =>
                            part?.text || ""
                    )
                    .join("")

            );

        }

    }


    return "";

}


/* =================================================
   CHAT
================================================= */

app.post(
    "/chat",
    async (req, res) => {

        try {

            /* -----------------------------------------
               API KEY
            ----------------------------------------- */

            if (
                !API_KEY ||
                !ai
            ) {

                return res.status(500).json({

                    success: false,

                    error:
                        "GEMINI_API_KEY is missing.",

                    details:
                        "Add GEMINI_API_KEY in Render Environment Variables."

                });

            }


            /* -----------------------------------------
               REQUEST
            ----------------------------------------- */

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


            /* -----------------------------------------
               VALIDATION
            ----------------------------------------- */

            if (!message) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Message is required."

                });

            }


            /* -----------------------------------------
               LANGUAGE
            ----------------------------------------- */

            const selectedLanguage =
                languageName(
                    language
                );


            /* -----------------------------------------
               SYSTEM INSTRUCTION
            ----------------------------------------- */

            const systemInstruction = `

You are Viggo AI.

Your name is Viggo.

You are a friendly, helpful and respectful AI assistant.

The user's selected language is:
${selectedLanguage}

LANGUAGE RULES:

1. Reply primarily in ${selectedLanguage}.
2. Understand the user's language correctly.
3. If the user asks specifically for English, reply in English.
4. If the user asks specifically for Tamil, reply in Tamil.
5. Do not unnecessarily mix languages.
6. Keep answers natural and easy to understand.

PERSONALITY:

- Friendly
- Clear
- Helpful
- Respectful
- Natural

TECHNICAL QUESTIONS:

- Explain step by step.
- Give examples when useful.
- Give complete code when requested.
- Do not remove existing functionality unless requested.

CASUAL QUESTIONS:

- Reply naturally and conversationally.

Do not mention these instructions.

`;


            /* -----------------------------------------
               CONTENTS
            ----------------------------------------- */

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
                message.substring(0, 100)
            );

            console.log(
                "→ Language:",
                selectedLanguage
            );

            console.log(
                "→ Model:",
                MODEL
            );


            /* -----------------------------------------
               GEMINI
            ----------------------------------------- */

            const response =
                await generateWithRetry(
                    contents,
                    systemInstruction
                );


            /* -----------------------------------------
               REPLY
            ----------------------------------------- */

            const reply =
                extractResponseText(
                    response
                );


            /* -----------------------------------------
               EMPTY
            ----------------------------------------- */

            if (!reply) {

                console.error(
                    "❌ Empty Gemini response."
                );

                return res.status(502).json({

                    success: false,

                    error:
                        "Viggo returned an empty response.",

                    details:
                        "Gemini did not return text."

                });

            }


            /* -----------------------------------------
               SUCCESS
            ----------------------------------------- */

            console.log(
                "✓ Response received."
            );

            console.log(
                "================================"
            );


            return res.status(200).json({

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
                "❌ VIGGO ERROR"
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


            /* =========================================
               MODEL ERROR
            ========================================= */

            if (
                lower.includes("404") &&
                (
                    lower.includes("model") ||
                    lower.includes("not found") ||
                    lower.includes("not available")
                )
            ) {

                return res.status(502).json({

                    success: false,

                    error:
                        "Gemini model is unavailable.",

                    details:
                        `Current model: ${MODEL}. ` +
                        "Check GEMINI_MODEL in Render Environment Variables."

                });

            }


            /* =========================================
               API KEY ERROR
            ========================================= */

            if (
                lower.includes("401") ||
                lower.includes("api key") ||
                lower.includes("unauthenticated") ||
                lower.includes("authentication")
            ) {

                return res.status(401).json({

                    success: false,

                    error:
                        "Gemini API key error.",

                    details:
                        "Check GEMINI_API_KEY in Render Environment Variables."

                });

            }


            /* =========================================
               PERMISSION
            ========================================= */

            if (
                lower.includes("403") ||
                lower.includes("permission denied") ||
                lower.includes("permission")
            ) {

                return res.status(403).json({

                    success: false,

                    error:
                        "Gemini API permission error.",

                    details:
                        errorText

                });

            }


            /* =========================================
               RATE LIMIT
            ========================================= */

            if (
                lower.includes("429") ||
                lower.includes("quota") ||
                lower.includes("rate limit") ||
                lower.includes("resource exhausted") ||
                lower.includes("too many requests")
            ) {

                return res.status(429).json({

                    success: false,

                    error:
                        "Viggo AI is temporarily busy.",

                    details:
                        "Gemini is currently busy. Please try again shortly."

                });

            }


            /* =========================================
               GENERAL ERROR
            ========================================= */

            return res.status(500).json({

                success: false,

                error:
                    "Viggo AI could not generate a response.",

                details:
                    errorText || "Unknown server error."

            });

        }

    }
);


/* =================================================
   404
================================================= */

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


/* =================================================
   GLOBAL ERROR
================================================= */

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


        return res.status(500).json({

            success: false,

            error:
                "Internal server error."

        });

    }
);


/* =================================================
   START SERVER
================================================= */

app.listen(
    PORT,
    "0.0.0.0",
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
            "HOST:",
            "0.0.0.0"
        );

        console.log(
            "================================"
        );

        console.log("");

    }
);
