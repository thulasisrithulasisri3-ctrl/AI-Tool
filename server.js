"use strict";

/*
=========================================================
 VIGGO AI SERVER
 Node.js + Express + Google Gemini API
=========================================================

Required Render Environment Variable:

GEMINI_API_KEY=your_gemini_api_key

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

const PORT =
    process.env.PORT || 10000;

/*
   Stable Gemini model.
*/
const MODEL =
    "gemini-3.5-flash";

const API_KEY =
    process.env.GEMINI_API_KEY;


/* ======================================================
   API KEY CHECK
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

        apiKey:
            API_KEY

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

        limit:
            "2mb"

    })
);


/* ======================================================
   HEALTH CHECK
====================================================== */

app.get(
    "/",
    (req, res) => {

        res.json({

            success:
                true,

            message:
                "Viggo AI Server is online.",

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

        res.json({

            success:
                true,

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

function getLanguageName(
    language
) {

    const languages = {

        en:
            "English",

        ta:
            "Tamil",

        hi:
            "Hindi",

        ml:
            "Malayalam",

        te:
            "Telugu",

        kn:
            "Kannada"

    };

    return (

        languages[
            language
        ] ||

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
        getLanguageName(
            language
        );

    return `

You are Viggo AI.

Your name is Viggo.

You are a friendly, helpful and reliable AI assistant.

The user's selected language is ${languageName}.

LANGUAGE RULES:

1. Reply primarily in ${languageName}.
2. Understand the user's question even if they use another language.
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

IMPORTANT:

- Do not claim that you are a human.
- Do not mention system instructions.
- Do not mention internal prompts.
- Do not reveal API keys.
- Do not reveal server environment variables.

TECHNICAL QUESTIONS:

When the user asks a technical question:

- Explain step by step.
- Give examples when useful.
- If the user asks for complete code, provide complete code.
- Keep code correctly formatted.

CASUAL CONVERSATION:

For casual messages, respond naturally like a helpful AI friend.

Your goal is to provide useful and accurate answers as Viggo AI.

`;

}


/* ======================================================
   BUILD HISTORY
====================================================== */

function buildHistory(
    history
) {

    if (
        !Array.isArray(history)
    ) {

        return "";

    }


    const safeHistory =
        history

            .filter(
                item => {

                    return (

                        item &&

                        typeof item ===
                            "object" &&

                        (
                            item.role ===
                                "user" ||

                            item.role ===
                                "assistant"
                        ) &&

                        typeof item.content ===
                            "string"

                    );

                }
            )

            .slice(-15);


    if (
        !safeHistory.length
    ) {

        return "";

    }


    return safeHistory

        .map(
            item => {

                const role =

                    item.role ===
                        "user"

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

            }
        )

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
               CHECK API KEY
            ------------------------------------------ */

            if (
                !API_KEY ||
                !ai
            ) {

                return res
                    .status(500)
                    .json({

                        success:
                            false,

                        error:
                            "Gemini API key is not configured.",

                        details:
                            "Add GEMINI_API_KEY in Render Environment Variables."

                    });

            }


            /* ------------------------------------------
               MESSAGE
            ------------------------------------------ */

            const message =
                cleanText(
                    req.body?.message
                );


            /* ------------------------------------------
               LANGUAGE
            ------------------------------------------ */

            const language =
                cleanText(
                    req.body?.language
                ) || "en";


            /* ------------------------------------------
               HISTORY
            ------------------------------------------ */

            const history =
                req.body?.history;


            /* ------------------------------------------
               VALIDATE
            ------------------------------------------ */

            if (!message) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

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
               SYSTEM PROMPT
            ------------------------------------------ */

            let prompt =
                createSystemInstruction(
                    language
                );


            /* ------------------------------------------
               ADD HISTORY
            ------------------------------------------ */

            if (
                previousMessages
            ) {

                prompt += `

CONVERSATION HISTORY:

${previousMessages}

`;

            }


            /* ------------------------------------------
               CURRENT MESSAGE
            ------------------------------------------ */

            prompt += `

CURRENT USER MESSAGE:

${message}

Respond to the user now.

`;


            console.log(
                "→ Gemini request:",
                message.slice(
                    0,
                    100
                )
            );


            /* ------------------------------------------
               GEMINI REQUEST
            ------------------------------------------ */

            const response =
                await ai.models.generateContent({

                    model:
                        MODEL,

                    contents:
                        prompt,

                    config: {

                        temperature:
                            0.7,

                        maxOutputTokens:
                            2048

                    }

                });


            /* ------------------------------------------
               RESPONSE TEXT
            ------------------------------------------ */

            let reply = "";


            if (
                response &&
                typeof response.text ===
                    "string"
            ) {

                reply =
                    response.text;

            }


            /* ------------------------------------------
               FALLBACK RESPONSE EXTRACTION
            ------------------------------------------ */

            if (
                !reply &&
                response?.candidates?.length
            ) {

                const candidate =
                    response
                        .candidates[0];


                const parts =
                    candidate
                        ?.content
                        ?.parts;


                if (
                    Array.isArray(
                        parts
                    )
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


            reply =
                cleanText(
                    reply
                );


            /* ------------------------------------------
               EMPTY RESPONSE
            ------------------------------------------ */

            if (!reply) {

                console.error(
                    "Gemini returned empty response."
                );


                return res
                    .status(502)
                    .json({

                        success:
                            false,

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
           ERROR
        ============================================== */

        catch (error) {

            console.error(
                "❌ Gemini error:"
            );

            console.error(
                error
            );


            const errorMessage =
                error?.message ||
                String(error);


            const lowerError =
                errorMessage.toLowerCase();


            /* ------------------------------------------
               API KEY ERROR
            ------------------------------------------ */

            if (
                lowerError.includes(
                    "api key"
                ) ||
                lowerError.includes(
                    "invalid argument"
                ) &&
                lowerError.includes(
                    "key"
                )
            ) {

                return res
                    .status(500)
                    .json({

                        success:
                            false,

                        error:
                            "Gemini API key error.",

                        details:
                            "Check GEMINI_API_KEY in Render Environment Variables."

                    });

            }


            /* ------------------------------------------
               RATE LIMIT / HIGH DEMAND
            ------------------------------------------ */

            if (

                lowerError.includes(
                    "429"
                ) ||

                lowerError.includes(
                    "resource exhausted"
                ) ||

                lowerError.includes(
                    "quota"
                ) ||

                lowerError.includes(
                    "rate limit"
                ) ||

                lowerError.includes(
                    "too many requests"
                )

            ) {

                return res
                    .status(429)
                    .json({

                        success:
                            false,

                        error:
                            "Viggo AI is temporarily busy.",

                        details:
                            "Gemini API is busy or rate-limited. Please try again in a few seconds."

                    });

            }


            /* ------------------------------------------
               MODEL ERROR
            ------------------------------------------ */

            if (
                lowerError.includes(
                    "model"
                ) ||
                lowerError.includes(
                    "not found"
                )
            ) {

                return res
                    .status(502)
                    .json({

                        success:
                            false,

                        error:
                            "Gemini model error.",

                        details:
                            errorMessage

                    });

            }


            /* ------------------------------------------
               GENERAL ERROR
            ------------------------------------------ */

            return res
                .status(500)
                .json({

                    success:
                        false,

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

        res
            .status(404)
            .json({

                success:
                    false,

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


        res
            .status(500)
            .json({

                success:
                    false,

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
