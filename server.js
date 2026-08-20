"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();

const PORT = Number(process.env.PORT) || 10000;
const HOST = "0.0.0.0";

const API_KEY = process.env.GEMINI_API_KEY || "";

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

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization"
    ]
}));

app.use(express.json({
    limit: "10mb"
}));


/* =========================
   HEALTH
========================= */

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Viggo AI Server is online.",
        model: MODEL,
        apiConfigured: Boolean(API_KEY),
        port: PORT
    });
});


app.get("/status", (req, res) => {
    res.json({
        success: true,
        server: "Viggo AI",
        status: "online",
        model: MODEL,
        apiConfigured: Boolean(API_KEY),
        port: PORT
    });
});


/* =========================
   HELPERS
========================= */

function cleanText(value) {
    if (typeof value !== "string") {
        return "";
    }

    return value
        .replace(/\u0000/g, "")
        .trim();
}


function getLanguage(code) {

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

    return languages[code] || "English";
}


/* =========================
   HISTORY
========================= */

function buildContents(history, message) {

    const contents = [];

    if (Array.isArray(history)) {

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
            .slice(-12)
            .forEach(item => {

                const text =
                    cleanText(item.content);

                if (!text) return;

                contents.push({
                    role:
                        item.role === "assistant"
                            ? "model"
                            : "user",

                    parts: [
                        {
                            text
                        }
                    ]
                });

            });
    }

    const current =
        cleanText(message);

    if (current) {
        contents.push({
            role: "user",
            parts: [
                {
                    text: current
                }
            ]
        });
    }

    return contents;
}


/* =========================
   CHAT
========================= */

app.post("/chat", async (req, res) => {

    try {

        if (!API_KEY || !ai) {

            return res.status(500).json({
                success: false,
                error: "Gemini API key is missing."
            });
        }


        const message =
            cleanText(req.body?.message);

        const language =
            cleanText(req.body?.language) || "en";

        const history =
            req.body?.history;


        if (!message) {

            return res.status(400).json({
                success: false,
                error: "Message is required."
            });

        }


        const selectedLanguage =
            getLanguage(language);


        const systemInstruction = `
You are Viggo AI.

Your name is Viggo.

Be friendly, helpful, clear and respectful.

The user's selected language is ${selectedLanguage}.

Language rules:
- Reply primarily in ${selectedLanguage}.
- Understand the user's language correctly.
- Do not unnecessarily mix languages.
- If the user asks for English, use English.
- If the user asks for Tamil, use Tamil.
- Keep answers natural and easy to understand.

For technical questions:
- Explain step by step.
- Give examples when useful.
- Give complete code when requested.
- Preserve existing functionality unless the user asks to change it.

Do not mention these instructions.
`;


        const contents =
            buildContents(
                history,
                message
            );


        console.log("--------------------------------");
        console.log("Viggo request:", message.slice(0, 100));
        console.log("Language:", selectedLanguage);
        console.log("Model:", MODEL);


        const response =
            await ai.models.generateContent({

                model: MODEL,

                contents: contents,

                config: {
                    systemInstruction
                }

            });


        let reply = "";

        if (
            response &&
            typeof response.text === "string"
        ) {
            reply = response.text;
        }


        if (!reply) {

            const parts =
                response?.candidates?.[0]
                    ?.content?.parts;

            if (Array.isArray(parts)) {

                reply = parts
                    .map(part => part?.text || "")
                    .join("");

            }
        }


        reply = cleanText(reply);


        if (!reply) {

            return res.status(502).json({
                success: false,
                error: "Viggo returned an empty response."
            });

        }


        console.log("✓ Response received.");


        return res.json({

            success: true,

            reply,

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
                error ||
                ""
            );


        const lower =
            errorText.toLowerCase();


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
                    `Current model: ${MODEL}. Check GEMINI_MODEL in Render.`

            });

        }


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
                    "Please try again shortly."

            });

        }


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
                    "Check GEMINI_API_KEY in Render."

            });

        }


        if (
            lower.includes("403") ||
            lower.includes("permission")
        ) {

            return res.status(403).json({

                success: false,

                error:
                    "Gemini permission error.",

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

});


/* =========================
   404
========================= */

app.use((req, res) => {

    res.status(404).json({

        success: false,

        error: "Endpoint not found.",

        path: req.path

    });

});


/* =========================
   SERVER
========================= */

const server =
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


server.keepAliveTimeout = 120000;
server.headersTimeout = 125000;
