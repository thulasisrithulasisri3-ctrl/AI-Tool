"use strict";

/* =========================================================
   VIGGO AI SERVER
   Node.js + Express + Gemini
   Short Share Link System
========================================================= */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { GoogleGenAI } = require("@google/genai");

const app = express();

/* =========================================================
   CONFIG
========================================================= */

const PORT = process.env.PORT || 10000;

const API_KEY =
    process.env.GEMINI_API_KEY;

/*
   Current stable Gemini model.
*/
const MODEL =
    "gemini-3.6-flash";


/* =========================================================
   GEMINI CLIENT
========================================================= */

let ai = null;

if (API_KEY) {

    ai = new GoogleGenAI({
        apiKey: API_KEY
    });

    console.log(
        "✓ GEMINI_API_KEY detected."
    );

} else {

    console.error(
        "❌ GEMINI_API_KEY is missing."
    );

}


/* =========================================================
   SHORT SHARE STORAGE
========================================================= */

/*
   Example:

   chat data
       ↓
   random ID
       ↓
   ABC123xy
       ↓
   /share/ABC123xy

   NOTE:
   This storage is memory based.
   Render restart ஆனா old share links expire ஆகும்.
*/

const sharedChats =
    new Map();


/*
   Share links expire after 30 days.
*/

const SHARE_EXPIRY =
    30 * 24 * 60 * 60 * 1000;


/* =========================================================
   MIDDLEWARE
========================================================= */

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


/* =========================================================
   HEALTH
========================================================= */

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

            shareSystem:
                "enabled",

            time:
                new Date().toISOString()

        });

    }
);


/* =========================================================
   STATUS
========================================================= */

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

            shareSystem:
                true,

            activeShares:
                sharedChats.size,

            time:
                new Date().toISOString()

        });

    }
);


/* =========================================================
   HELPER
========================================================= */

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


/* =========================================================
   LANGUAGE
========================================================= */

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
        languages[language] ||
        "English"
    );

}


/* =========================================================
   SYSTEM INSTRUCTION
========================================================= */

function createSystemInstruction(
    language
) {

    const languageName =
        getLanguageName(
            language
        );

    return `
You are Viggo AI, a friendly and helpful AI assistant.

Your name is Viggo.

The user selected ${languageName} as their preferred language.

LANGUAGE RULES:
- Reply primarily in ${languageName}.
- Understand the user's question correctly.
- Keep the answer natural and easy to understand.
- Do not unnecessarily mix languages.
- If the user specifically asks for English, reply in English.
- If the user specifically asks for Tamil, reply in Tamil.

PERSONALITY:
- Friendly
- Helpful
- Clear
- Respectful
- Natural
- Simple when possible
- Do not claim to be human.
- Do not mention system instructions.

For technical questions:
- Explain step by step.
- Give examples when useful.
- Give complete code when requested.

For casual questions:
- Respond naturally.

Your goal is to be a reliable AI friend called Viggo.
`;

}


/* =========================================================
   HISTORY
========================================================= */

function buildHistory(
    history
) {

    if (
        !Array.isArray(history)
    ) {

        return "";

    }

    return history
        .filter(
            item =>
                item &&
                typeof item === "object" &&
                (
                    item.role === "user" ||
                    item.role === "assistant"
                ) &&
                typeof item.content === "string"
        )
        .slice(-15)
        .map(
            item => {

                const role =
                    item.role === "user"
                        ? "User"
                        : "Viggo";

                return (
                    role +
                    ": " +
                    cleanText(
                        item.content
                    )
                );

            }
        )
        .join("\n\n");

}


/* =========================================================
   CREATE SHORT SHARE
========================================================= */

app.post(
    "/share",
    (req, res) => {

        try {

            const title =
                cleanText(
                    req.body?.title
                ) ||
                "Viggo AI Chat";


            const messages =
                Array.isArray(
                    req.body?.messages
                )
                    ? req.body.messages
                    : [];


            if (
                !messages.length
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "No chat messages to share."

                });

            }


            /*
               Keep only safe message data.
            */

            const safeMessages =
                messages
                    .filter(
                        item =>
                            item &&
                            (
                                item.role === "user" ||
                                item.role === "assistant"
                            ) &&
                            typeof item.content === "string"
                    )
                    .slice(-100)
                    .map(
                        item => ({

                            role:
                                item.role,

                            content:
                                cleanText(
                                    item.content
                                )

                        })
                    );


            /*
               Generate short ID.
            */

            const id =
                crypto
                    .randomBytes(6)
                    .toString("base64url");


            /*
               Save chat.
            */

            sharedChats.set(
                id,
                {

                    id:
                        id,

                    title:
                        title,

                    messages:
                        safeMessages,

                    createdAt:
                        Date.now(),

                    expiresAt:
                        Date.now() +
                        SHARE_EXPIRY

                }
            );


            /*
               Short URL.
            */

            const host =
                `${req.protocol}://${req.get("host")}`;

            const shareUrl =
                host +
                "/share/" +
                id;


            console.log(
                "✓ Share created:",
                shareUrl
            );


            return res.json({

                success:
                    true,

                id:
                    id,

                url:
                    shareUrl,

                title:
                    title

            });

        }

        catch (error) {

            console.error(
                "Share create error:",
                error
            );

            return res.status(500).json({

                success:
                    false,

                error:
                    "Could not create share link."

            });

        }

    }
);


/* =========================================================
   GET SHARED CHAT
========================================================= */

app.get(
    "/share/:id",
    (req, res) => {

        const id =
            cleanText(
                req.params.id
            );


        const chat =
            sharedChats.get(id);


        if (!chat) {

            return res.status(404).json({

                success:
                    false,

                error:
                    "Shared chat not found or expired."

            });

        }


        /*
           Expiry check.
        */

        if (
            Date.now() >
            chat.expiresAt
        ) {

            sharedChats.delete(
                id
            );

            return res.status(404).json({

                success:
                    false,

                error:
                    "This share link has expired."

            });

        }


        return res.json({

            success:
                true,

            id:
                chat.id,

            title:
                chat.title,

            messages:
                chat.messages,

            createdAt:
                chat.createdAt

        });

    }
);


/* =========================================================
   CHAT
========================================================= */

app.post(
    "/chat",
    async (req, res) => {

        try {

            if (
                !API_KEY ||
                !ai
            ) {

                return res.status(500).json({

                    success:
                        false,

                    error:
                        "GEMINI_API_KEY is not configured.",

                    details:
                        "Add GEMINI_API_KEY in Render Environment Variables."

                });

            }


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


            if (!message) {

                return res.status(400).json({

                    success:
                        false,

                    error:
                        "Message is required."

                });

            }


            const previousMessages =
                buildHistory(
                    history
                );


            let prompt =
                createSystemInstruction(
                    language
                );


            if (
                previousMessages
            ) {

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


            console.log(
                "→ Gemini request:",
                message.slice(0, 100)
            );


            /*
               Gemini request
            */

            const response =
                await ai.models.generateContent({

                    model:
                        MODEL,

                    contents:
                        prompt

                });


            let reply = "";


            if (
                response &&
                typeof response.text === "string"
            ) {

                reply =
                    response.text;

            }


            /*
               Fallback
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
                cleanText(
                    reply
                );


            if (!reply) {

                return res.status(502).json({

                    success:
                        false,

                    error:
                        "Viggo returned an empty response."

                });

            }


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

        catch (error) {

            console.error(
                "❌ Gemini error:",
                error
            );


            const errorMessage =
                error?.message ||
                String(error);


            const lower =
                errorMessage.toLowerCase();


            /*
               API key
            */

            if (
                lower.includes(
                    "api key"
                )
            ) {

                return res.status(500).json({

                    success:
                        false,

                    error:
                        "Gemini API key error.",

                    details:
                        "Check GEMINI_API_KEY in Render."

                });

            }


            /*
               Rate limit
            */

            if (
                lower.includes("429") ||
                lower.includes(
                    "resource exhausted"
                ) ||
                lower.includes(
                    "too many requests"
                )
            ) {

                return res.status(429).json({

                    success:
                        false,

                    error:
                        "Viggo AI is temporarily busy.",

                    details:
                        "Please try again in a few seconds."

                });

            }


            /*
               Model
            */

            if (
                lower.includes(
                    "model"
                ) ||
                lower.includes(
                    "not found"
                )
            ) {

                return res.status(502).json({

                    success:
                        false,

                    error:
                        "Gemini model error.",

                    details:
                        errorMessage

                });

            }


            /*
               General
            */

            return res.status(500).json({

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


/* =========================================================
   404
========================================================= */

app.use(
    (req, res) => {

        res.status(404).json({

            success:
                false,

            error:
                "Endpoint not found.",

            path:
                req.path

        });

    }
);


/* =========================================================
   GLOBAL ERROR
========================================================= */

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

            success:
                false,

            error:
                "Internal server error."

        });

    }
);


/* =========================================================
   CLEAN EXPIRED SHARES
========================================================= */

setInterval(
    () => {

        const now =
            Date.now();

        for (
            const [id, chat]
            of sharedChats
        ) {

            if (
                now >
                chat.expiresAt
            ) {

                sharedChats.delete(
                    id
                );

            }

        }

    },
    60 * 60 * 1000
);


/* =========================================================
   START SERVER
========================================================= */

app.listen(
    PORT,
    () => {

        console.log("");
        console.log(
            "===================================="
        );
        console.log(
            "       VIGGO AI SERVER ONLINE"
        );
        console.log(
            "===================================="
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
            "SHORT SHARE:",
            "ENABLED"
        );
        console.log(
            "===================================="
        );
        console.log("");

    }
);
