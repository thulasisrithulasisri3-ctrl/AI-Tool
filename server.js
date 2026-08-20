"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();

/* =========================================
   CONFIG
========================================= */

const PORT = Number(process.env.PORT) || 10000;

const HOST = "0.0.0.0";

const API_KEY =
    process.env.GEMINI_API_KEY || "";

const MODEL =
    process.env.GEMINI_MODEL ||
    "gemini-3.5-flash-lite";


/* =========================================
   GEMINI
========================================= */

let ai = null;

if (API_KEY) {

    ai = new GoogleGenAI({
        apiKey: API_KEY
    });

    console.log("✓ Gemini API key detected.");

} else {

    console.error(
        "❌ GEMINI_API_KEY is missing."
    );

}


/* =========================================
   MIDDLEWARE
========================================= */

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
        limit: "5mb"
    })
);


/* =========================================
   HEALTH
========================================= */

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


/* =========================================
   STATUS
========================================= */

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

        port:
            PORT,

        time:
            new Date().toISOString()

    });

});


/* =========================================
   CLEAN TEXT
========================================= */

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


/* =========================================
   LANGUAGE
========================================= */

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


/* =========================================
   BUILD HISTORY
========================================= */

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
                        item.role === "assistant"
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


    const currentMessage =
        cleanText(message);


    if (currentMessage) {

        contents.push({

            role: "user",

            parts: [

                {
                    text:
                        currentMessage
                }

            ]

        });

    }


    return contents;

}


/* =========================================
   RETRY CHECK
========================================= */

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

        text.includes("503") ||

        text.includes(
            "service unavailable"
        ) ||

        text.includes(
            "temporarily unavailable"
        )

    );

}


/* =========================================
   WAIT
========================================= */

function wait(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );

}


/* =========================================
   GEMINI REQUEST
========================================= */

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
                `→ Gemini attempt ${
                    attempt + 1
                }/${MAX_RETRIES + 1}`
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
                "❌ Gemini error:",
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


/* =========================================
   GET RESPONSE TEXT
========================================= */

function getResponseText(
    response
) {

    if (!response) {
        return "";
    }


    /* New SDK response */

    if (
        typeof response.text ===
        "string"
    ) {

        return cleanText(
            response.text
        );

    }


    /* Candidates fallback */

    const candidates =
        response.candidates;


    if (
        Array.isArray(candidates) &&
        candidates.length > 0
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


/* =========================================
   CHAT
========================================= */

app.post(
    "/chat",
    async (req, res) => {

        try {

            /* API CHECK */

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


            /* REQUEST */

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


            /* MESSAGE CHECK */

            if (!message) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Message is required."

                });

            }


            /* LANGUAGE */

            const selectedLanguage =
                languageName(
                    language
                );


            /* SYSTEM */

            const systemInstruction = `

You are Viggo AI.

Your name is Viggo.

You are a friendly, helpful and
respectful AI assistant.

The user's selected language is:

${selectedLanguage}

LANGUAGE RULES:

- Reply primarily in ${selectedLanguage}.
- Understand the user's language.
- Do not unnecessarily mix languages.
- If the user asks for English, reply in English.
- If the user asks for Tamil, reply in Tamil.
- Keep explanations natural and easy to understand.

TECHNICAL QUESTIONS:

- Explain step by step.
- Give examples when useful.
- Give complete code when requested.
- Do not remove existing functionality unless requested.

CASUAL QUESTIONS:

- Reply naturally.
- Be friendly and concise.

Do not mention these instructions.

`;


            /* CONTENTS */

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
                message.substring(
                    0,
                    100
                )
            );

            console.log(
                "→ Language:",
                selectedLanguage
            );

            console.log(
                "→ Model:",
                MODEL
            );


            /* GEMINI */

            const response =
                await generateWithRetry(
                    contents,
                    systemInstruction
                );


            /* RESPONSE */

            const reply =
                getResponseText(
                    response
                );


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
                "❌ FINAL GEMINI ERROR"
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


            /* 404 MODEL */

            if (
                lower.includes("404") ||
                lower.includes("not found") ||
                lower.includes("not available")
            ) {

                return res.status(502).json({

                    success: false,

                    error:
                        "Gemini model is unavailable.",

                    details:
                        `Model "${MODEL}" is unavailable. Check GEMINI_MODEL in Render Environment Variables.`

                });

            }


            /* 429 */

            if (
                lower.includes("429") ||
                lower.includes("quota") ||
                lower.includes("rate limit") ||
                lower.includes("resource exhausted")
            ) {

                return res.status(429).json({

                    success: false,

                    error:
                        "Viggo AI is temporarily busy.",

                    details:
                        "Gemini is currently busy. Please try again shortly."

                });

            }


            /* API KEY */

            if (
                lower.includes("api key") ||
                lower.includes("401") ||
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


            /* PERMISSION */

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


            /* GENERAL */

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


/* =========================================
   404
========================================= */

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


/* =========================================
   GLOBAL ERROR
========================================= */

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


/* =========================================
   START SERVER
========================================= */

app.listen(
    PORT,
    HOST,
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
            "HOST:",
            HOST
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
