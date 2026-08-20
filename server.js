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
    process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

const ai = API_KEY
    ? new GoogleGenAI({ apiKey: API_KEY })
    : null;


/* =========================
   MIDDLEWARE
========================= */

app.use(cors());

app.use(express.json({
    limit: "5mb"
}));


/* =========================
   HOME
========================= */

app.get("/", (req, res) => {

    res.json({
        success: true,
        status: "online",
        message: "Viggo AI Server is running",
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
        status: "online",
        model: MODEL,
        apiConfigured: Boolean(API_KEY)
    });

});


/* =========================
   CHAT
========================= */

app.post("/chat", async (req, res) => {

    try {

        if (!ai) {

            return res.status(500).json({
                success: false,
                error: "GEMINI_API_KEY is missing"
            });

        }


        const message =
            typeof req.body?.message === "string"
                ? req.body.message.trim()
                : "";


        const language =
            typeof req.body?.language === "string"
                ? req.body.language
                : "en";


        if (!message) {

            return res.status(400).json({
                success: false,
                error: "Message is required"
            });

        }


        const languageNames = {

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
            ur: "Urdu"

        };


        const selectedLanguage =
            languageNames[language] ||
            "English";


        console.log(
            "Viggo request:",
            message
        );

        console.log(
            "Model:",
            MODEL
        );


        const prompt = `

You are Viggo AI.

Reply primarily in ${selectedLanguage}.

User message:

${message}

Give a helpful, natural answer.

`;


        const result =
            await ai.models.generateContent({

                model: MODEL,

                contents: prompt

            });


        let reply = "";


        if (
            result &&
            typeof result.text === "string"
        ) {

            reply =
                result.text.trim();

        }


        if (!reply) {

            const parts =
                result?.candidates?.[0]
                    ?.content?.parts;


            if (Array.isArray(parts)) {

                reply =
                    parts
                        .map(
                            p =>
                                p?.text || ""
                        )
                        .join("")
                        .trim();

            }

        }


        if (!reply) {

            return res.status(502).json({

                success: false,

                error:
                    "Gemini returned empty response"

            });

        }


        console.log(
            "Viggo reply generated successfully"
        );


        return res.json({

            success: true,

            reply: reply,

            model: MODEL

        });

    }


    catch (error) {

        console.error(
            "VIGGO CHAT ERROR:",
            error
        );


        const errorMessage =
            String(
                error?.message ||
                error ||
                ""
            );


        const lower =
            errorMessage.toLowerCase();


        if (
            lower.includes("401") ||
            lower.includes("api key") ||
            lower.includes("unauthenticated")
        ) {

            return res.status(401).json({

                success: false,

                error:
                    "Gemini API key is invalid",

                details:
                    errorMessage

            });

        }


        if (
            lower.includes("404") ||
            lower.includes("not found") ||
            lower.includes("not available")
        ) {

            return res.status(502).json({

                success: false,

                error:
                    "Gemini model unavailable",

                details:
                    `Current model: ${MODEL}. Check GEMINI_MODEL in Render.`

            });

        }


        if (
            lower.includes("429") ||
            lower.includes("quota") ||
            lower.includes("resource exhausted")
        ) {

            return res.status(429).json({

                success: false,

                error:
                    "Gemini quota/rate limit reached",

                details:
                    errorMessage

            });

        }


        return res.status(500).json({

            success: false,

            error:
                "Viggo AI server error",

            details:
                errorMessage

        });

    }

});


/* =========================
   404
========================= */

app.use((req, res) => {

    res.status(404).json({

        success: false,

        error: "Endpoint not found",

        path: req.path

    });

});


/* =========================
   START SERVER
========================= */

app.listen(
    PORT,
    HOST,
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

    }
);
