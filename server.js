"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { GoogleGenAI } = require("@google/genai");

const app = express();

const PORT = process.env.PORT || 10000;

const API_KEY = process.env.GEMINI_API_KEY;

const MODEL = "gemini-3.6-flash";


/* =====================================================
   GEMINI
===================================================== */

let ai = null;

if (API_KEY) {
    ai = new GoogleGenAI({
        apiKey: API_KEY
    });
}


/* =====================================================
   SHORT SHARE STORAGE
===================================================== */

const sharedChats = new Map();

const SHARE_ID_LENGTH = 8;

const SHARE_EXPIRY =
    24 * 60 * 60 * 1000;


/* =====================================================
   MIDDLEWARE
===================================================== */

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


/* =====================================================
   HELPER
===================================================== */

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


/* =====================================================
   SHORT ID
===================================================== */

function createShortId() {

    let id;

    do {

        id =
            crypto
                .randomBytes(6)
                .toString("base64url")
                .slice(
                    0,
                    SHARE_ID_LENGTH
                );

    } while (
        sharedChats.has(id)
    );

    return id;
}


/* =====================================================
   CLEAN EXPIRED SHARES
===================================================== */

function cleanupSharedChats() {

    const now =
        Date.now();

    for (
        const [
            id,
            data
        ] of sharedChats
    ) {

        if (
            now - data.createdAt >
            SHARE_EXPIRY
        ) {

            sharedChats.delete(id);

        }

    }

}

setInterval(
    cleanupSharedChats,
    10 * 60 * 1000
);


/* =====================================================
   SYSTEM INSTRUCTION
===================================================== */

function createSystemInstruction(
    language
) {

    const languageName =
        getLanguageName(language);

    return `
You are Viggo AI.

Your name is Viggo.

You are a friendly, helpful and reliable AI assistant.

The user's preferred language is ${languageName}.

LANGUAGE RULES:

- Reply primarily in ${languageName}.
- Understand English, Tamil and other supported languages.
- If the user asks specifically for English, reply in English.
- If the user asks specifically for Tamil, reply in Tamil.
- Do not unnecessarily mix languages.
- Keep answers natural and easy to understand.

PERSONALITY:

- Friendly
- Helpful
- Respectful
- Clear
- Natural
- Simple when possible

Do not claim to be human.

For technical questions:
- Explain step by step.
- Give examples when useful.
- Provide complete code when requested.

For casual questions:
- Reply naturally like a helpful AI friend.

Your name is Viggo AI.
`;
}


/* =====================================================
   HISTORY
===================================================== */

function buildHistory(history) {

    if (
        !Array.isArray(history)
    ) {

        return "";

    }

    return history
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
        .slice(-15)
        .map(item => {

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

        })
        .join("\n\n");
}


/* =====================================================
   ROOT
===================================================== */

app.get(
    "/",
    (req, res) => {

        res.json({

            success: true,

            server:
                "Viggo AI",

            status:
                "online",

            model:
                MODEL,

            apiConfigured:
                Boolean(API_KEY)

        });

    }
);


/* =====================================================
   STATUS
===================================================== */

app.get(
    "/status",
    (req, res) => {

        res.json({

            success: true,

            server:
                "Viggo AI",

            status:
                "online",

            model:
                MODEL,

            apiConfigured:
                Boolean(API_KEY),

            sharedChats:
                sharedChats.size

        });

    }
);


/* =====================================================
   CHAT
===================================================== */

app.post(
    "/chat",
    async (req, res) => {

        try {

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


            const message =
                cleanText(
                    req.body?.message
                );


            const language =
                cleanText(
                    req.body?.language
                ) || "en";


            const history =
                buildHistory(
                    req.body?.history
                );


            if (!message) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Message is required."

                });

            }


            let prompt =
                createSystemInstruction(
                    language
                );


            if (history) {

                prompt += `

CONVERSATION HISTORY:

${history}

`;

            }


            prompt += `

CURRENT USER MESSAGE:

${message}

Respond to the user now.
`;


            console.log(
                "Gemini request:",
                message.slice(0, 100)
            );


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
                typeof response.text ===
                    "string"
            ) {

                reply =
                    response.text;

            }


            if (
                !reply &&
                Array.isArray(
                    response?.candidates
                )
            ) {

                const parts =
                    response
                        .candidates?.[0]
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


            reply =
                cleanText(
                    reply
                );


            if (!reply) {

                return res.status(502).json({

                    success: false,

                    error:
                        "Viggo returned an empty response."

                });

            }


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
                "Gemini error:",
                error
            );


            const errorMessage =
                error?.message ||
                String(error);


            const lower =
                errorMessage.toLowerCase();


            if (
                lower.includes("429") ||
                lower.includes(
                    "resource exhausted"
                ) ||
                lower.includes(
                    "rate limit"
                )
            ) {

                return res.status(429).json({

                    success: false,

                    error:
                        "Viggo AI is temporarily busy.",

                    details:
                        "Please try again in a few seconds."

                });

            }


            if (
                lower.includes("api key") ||
                lower.includes(
                    "unauthenticated"
                )
            ) {

                return res.status(500).json({

                    success: false,

                    error:
                        "Gemini API key error.",

                    details:
                        "Check GEMINI_API_KEY in Render."

                });

            }


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


/* =====================================================
   CREATE SHORT SHARE
===================================================== */

app.post(
    "/share",
    (req, res) => {

        try {

            cleanupSharedChats();


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


            if (!messages.length) {

                return res.status(400).json({

                    success: false,

                    error:
                        "No chat messages to share."

                });

            }


            const id =
                createShortId();


            sharedChats.set(
                id,
                {

                    title:
                        title.slice(0, 100),

                    messages:
                        messages.slice(-100),

                    createdAt:
                        Date.now()

                }
            );


            const protocol =
                req.headers["x-forwarded-proto"] ||
                req.protocol;


            const host =
                req.get("host");


            const baseUrl =
                `${protocol}://${host}`;


            const shareUrl =
                `${baseUrl}/s/${id}`;


            console.log(
                "Share created:",
                id
            );


            return res.json({

                success:
                    true,

                id:
                    id,

                url:
                    shareUrl,

                expiresIn:
                    SHARE_EXPIRY

            });

        }

        catch (error) {

            console.error(
                "Share error:",
                error
            );


            return res.status(500).json({

                success: false,

                error:
                    "Could not create share link."

            });

        }

    }
);


/* =====================================================
   GET SHORT SHARE
===================================================== */

app.get(
    "/share/:id",
    (req, res) => {

        cleanupSharedChats();


        const id =
            cleanText(
                req.params.id
            );


        const chat =
            sharedChats.get(id);


        if (!chat) {

            return res.status(404).json({

                success: false,

                error:
                    "Shared chat not found or expired."

            });

        }


        return res.json({

            success:
                true,

            id:
                id,

            title:
                chat.title,

            messages:
                chat.messages

        });

    }
);


/* =====================================================
   SHORT URL
===================================================== */

app.get(
    "/s/:id",
    (req, res) => {

        const id =
            cleanText(
                req.params.id
            );


        const frontend =
            process.env.FRONTEND_URL;


        if (frontend) {

            return res.redirect(
                `${frontend}?share=${encodeURIComponent(id)}`
            );

        }


        return res.redirect(
            `/?share=${encodeURIComponent(id)}`
        );

    }
);


/* =====================================================
   404
===================================================== */

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


/* =====================================================
   START
===================================================== */

app.listen(
    PORT,
    () => {

        console.log("");
        console.log(
            "================================"
        );
        console.log(
            "       VIGGO AI ONLINE"
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
            "SHORT SHARE: ENABLED"
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
