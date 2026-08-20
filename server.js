"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();

const PORT = Number(process.env.PORT) || 10000;
const HOST = "0.0.0.0";

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL =
    process.env.GEMINI_MODEL ||
    "gemini-3.5-flash-lite";

let ai = null;

if (API_KEY) {
    ai = new GoogleGenAI({
        apiKey: API_KEY
    });

    console.log("✓ Gemini API key detected.");
} else {
    console.error("❌ GEMINI_API_KEY is missing.");
}


/* =========================
   MIDDLEWARE
========================= */

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);

app.use(
    express.json({
        limit: "5mb"
    })
);


/* =========================
   HOME
========================= */

app.get("/", (req, res) => {

    res.json({
        success: true,
        status: "online",
        message: "Viggo AI Server is running 🤖",
        model: MODEL,
        apiConfigured: Boolean(API_KEY)
    });

});


/* =========================
   STATUS
========================= */

app.get("/status", (req, res) => {

    res.json({
        success: true,
        server: "Viggo AI",
        status: "online",
        model: MODEL,
        apiConfigured: Boolean(API_KEY)
    });

});


/* =========================
   CLEAN TEXT
========================= */

function cleanText(value) {

    if (typeof value !== "string") {
        return "";
    }

    return value
        .replace(/\u0000/g, "")
        .trim();

}


/* =========================
   LANGUAGE
========================= */

function getLanguage(language) {

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

    return languages[language] || "English";

}


/* =========================
   HISTORY
========================= */

function buildHistory(history) {

    if (!Array.isArray(history)) {
        return [];
    }

    return history
        .filter(item =>
            item &&
            (
                item.role === "user" ||
                item.role === "assistant"
            ) &&
            typeof item.content === "string"
        )
        .slice(-12)
        .map(item => ({

            role:
                item.role === "assistant"
                    ? "model"
                    : "user",

            parts: [
                {
                    text:
                        cleanText(item.content)
                }
            ]

        }));

}


/* =========================
   CHAT
========================= */

app.post("/chat", async (req, res) => {

    try {

        console.log("================================");
        console.log("→ /chat request received");

        if (!API_KEY || !ai) {

            return res.status(500).json({

                success: false,

                error:
                    "Gemini API key is not configured.",

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

                success: false,

                error:
                    "Message is required."

            });

        }


        const selectedLanguage =
            getLanguage(language);


        console.log(
            "Message:",
            message.substring(0, 100)
        );

        console.log(
            "Language:",
            selectedLanguage
        );

        console.log(
            "Model:",
            MODEL
        );


        const contents =
            buildHistory(history);


        contents.push({

            role: "user",

            parts: [
                {
                    text: message
                }
            ]

        });


        const systemInstruction = `

You are Viggo AI.

You are a friendly and helpful AI assistant.

Reply primarily in ${selectedLanguage}.

Understand the user's language naturally.

If the user asks for Tamil, reply in Tamil.

If the user asks for English, reply in English.

Do not unnecessarily mix languages.

For technical questions:
- Explain clearly.
- Give step-by-step answers.
- Provide complete code when requested.

Be friendly, natural and concise.

`;


        const response =
            await ai.models.generateContent({

                model: MODEL,

                contents: contents,

                config: {
                    systemInstruction:
                        systemInstruction
                }

            });


        let reply = "";


        if (
            response &&
            typeof response.text === "string"
        ) {

            reply =
                response.text;

        }


        if (!reply) {

            const parts =
                response
                    ?.candidates?.[0]
                    ?.content?.parts;


            if (Array.isArray(parts)) {

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

            console.error(
                "❌ Empty Gemini response"
            );

            return res.status(502).json({

                success: false,

                error:
                    "Gemini returned an empty response."

            });

        }


        console.log(
            "✓ Gemini response received"
        );

        console.log("================================");


        return res.json({

            success: true,

            reply: reply,

            model: MODEL

        });

    }


    catch (error) {

        console.error(
            "❌ Gemini error:"
        );

        console.error(error);


        const errorText =
            String(
                error?.message ||
                error ||
                ""
            );


        const lower =
            errorText.toLowerCase();


        /* MODEL ERROR */

        if (
            lower.includes("404") ||
            lower.includes("not found") ||
            lower.includes("not available")
        ) {

            return res.status(502).json({

                success: false,

                error:
                    "Gemini model unavailable.",

                details:
                    `Model "${MODEL}" is not available for this API account. Check GEMINI_MODEL in Render.`

            });

        }


        /* API KEY */

        if (
            lower.includes("401") ||
            lower.includes("api key") ||
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


        /* QUOTA */

        if (
            lower.includes("429") ||
            lower.includes("quota") ||
            lower.includes("resource exhausted") ||
            lower.includes("rate limit")
        ) {

            return res.status(429).json({

                success: false,

                error:
                    "Gemini temporarily unavailable.",

                details:
                    "Gemini API quota or rate limit was reached."

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

});


/* =========================
   404
========================= */

app.use((req, res) => {

    res.status(404).json({

        success: false,

        error:
            "Endpoint not found.",

        path:
            req.path

    });

});


/* =========================
   START
========================= */

app.listen(
    PORT,
    HOST,
    () => {

        console.log("");
        console.log("================================");
        console.log("       VIGGO AI SERVER ONLINE");
        console.log("================================");
        console.log("HOST:", HOST);
        console.log("PORT:", PORT);
        console.log("MODEL:", MODEL);
        console.log(
            "API KEY:",
            API_KEY
                ? "CONFIGURED"
                : "MISSING"
        );
        console.log("================================");
        console.log("");

    }
);
