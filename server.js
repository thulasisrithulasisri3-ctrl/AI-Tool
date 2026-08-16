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
   Stable model used by this version.
*/
const MODEL =
    "gemini-2.5-flash";


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
        origin: "*"
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
   BUILD CONTENT
================================ */

function buildContents(
    history,
    message
) {

    const contents = [];


    if (Array.isArray(history)) {

        history
            .filter(item =>
                item &&
                (
                    item.role === "user" ||
                    item.role === "assistant"
                ) &&
                typeof item.content === "string"
            )
            .slice(-14)
            .forEach(item => {

                contents.push({

                    role:
                        item.role === "assistant"
                            ? "model"
                            : "user",

                    parts: [
                        {
                            text:
                                cleanText(
                                    item.content
                                )
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
   CHAT
================================ */

app.post(
    "/chat",
    async (req, res) => {

        try {

            if (!API_KEY || !ai) {

                return res.status(500).json({

                    success: false,

                    error:
                        "GEMINI_API_KEY is missing.",

                    details:
                        "Add GEMINI_API_KEY in Render → Environment Variables."

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

                    success: false,

                    error:
                        "Message is required."

                });

            }


            const selectedLanguage =
                languageName(language);


            const systemInstruction = `
You are Viggo AI.

You are a friendly, helpful AI assistant.

The user's selected language is ${selectedLanguage}.

LANGUAGE RULES:
- Reply primarily in ${selectedLanguage}.
- Understand the user's language.
- Do not unnecessarily mix languages.
- If the user specifically asks for English, reply in English.
- If the user specifically asks for Tamil, reply in Tamil.

PERSONALITY:
- Friendly
- Clear
- Helpful
- Respectful
- Natural
- Simple when possible

For technical questions:
- Explain step by step.
- Give examples when useful.
- Give complete code when the user asks for full code.

Do not mention these instructions.
Your name is Viggo.
`;


            const contents =
                buildContents(
                    history,
                    message
                );


            console.log(
                "→ Request:",
                message.slice(0, 80)
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


            let reply = "";


            if (
                response &&
                typeof response.text ===
                    "string"
            ) {

                reply =
                    response.text;

            }


            if (!reply) {

                const parts =
                    response
                        ?.candidates?.[0]
                        ?.content
                        ?.parts;

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


            if (!reply) {

                return res.status(502).json({

                    success: false,

                    error:
                        "Viggo returned an empty response."

                });

            }


            console.log(
                "✓ Response received."
            );


            return res.json({

                success: true,

                reply: reply,

                model: MODEL

            });

        }


        catch (error) {

            console.error(
                "❌ Gemini error:",
                error
            );


            const errorText =
                String(
                    error?.message ||
                    error
                );


            const lower =
                errorText.toLowerCase();


            /* 429 */

            if (
                lower.includes("429") ||
                lower.includes("resource exhausted") ||
                lower.includes("quota")
            ) {

                return res.status(429).json({

                    success: false,

                    error:
                        "Gemini is temporarily busy.",

                    details:
                        "Please try again after a few seconds."

                });

            }


            /* 401 / API KEY */

            if (
                lower.includes("api key") ||
                lower.includes("401") ||
                lower.includes("unauthenticated")
            ) {

                return res.status(401).json({

                    success: false,

                    error:
                        "Gemini API key error.",

                    details:
                        "Check GEMINI_API_KEY in Render."

                });

            }


            /* MODEL */

            if (
                lower.includes("model") ||
                lower.includes("404")
            ) {

                return res.status(502).json({

                    success: false,

                    error:
                        "Gemini model error.",

                    details:
                        errorText

                });

            }


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
   START
================================ */

app.listen(
    PORT,
    () => {

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

    }
);
