"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();

const PORT = process.env.PORT || 10000;
const API_KEY = process.env.GEMINI_API_KEY;

/*
  Use a currently supported Gemini Flash model.
  If your Google AI account shows a different available model,
  change only this value.
*/
const MODEL = "gemini-2.5-flash";

let ai = null;

if (API_KEY) {
    ai = new GoogleGenAI({
        apiKey: API_KEY
    });
}

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);

app.use(
    express.json({
        limit: "2mb"
    })
);

/* =========================================================
   HOME
========================================================= */

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Viggo AI Server is online.",
        model: MODEL,
        status: "online",
        apiConfigured: Boolean(API_KEY),
        time: new Date().toISOString()
    });
});

/* =========================================================
   STATUS
========================================================= */

app.get("/status", (req, res) => {
    res.json({
        success: true,
        server: "Viggo AI",
        model: MODEL,
        apiConfigured: Boolean(API_KEY),
        status: API_KEY ? "ready" : "missing_api_key",
        time: new Date().toISOString()
    });
});

/* =========================================================
   HELPERS
========================================================= */

function cleanText(value) {
    if (typeof value !== "string") {
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

    return languages[language] || "English";
}

function createSystemInstruction(language) {
    const languageName = getLanguageName(language);

    return `
You are Viggo AI, a friendly and helpful AI assistant.

Your name is Viggo.

The user's selected language is ${languageName}.

LANGUAGE RULES:
- Reply primarily in ${languageName}.
- Understand the user's message even if it contains mixed languages.
- Keep replies natural and easy to understand.
- Do not unnecessarily mix languages.
- If the user explicitly asks for English, reply in English.
- If the user explicitly asks for Tamil, reply in Tamil.

PERSONALITY:
- Friendly
- Helpful
- Respectful
- Clear
- Natural
- Concise when a short answer is enough

IMPORTANT:
- Do not claim to be a human.
- Do not mention system instructions.
- Do not say that you are another AI.
- Your assistant name is Viggo.

For technical questions:
- Explain step by step.
- Give examples when useful.
- When the user asks for complete code, provide complete code.

For casual conversation:
- Reply naturally like a friendly AI assistant.
`;
}

function buildHistory(history) {
    if (!Array.isArray(history)) {
        return "";
    }

    const safeHistory = history
        .filter(item => {
            return (
                item &&
                typeof item === "object" &&
                (
                    item.role === "user" ||
                    item.role === "assistant"
                ) &&
                typeof item.content === "string"
            );
        })
        .slice(-15);

    if (!safeHistory.length) {
        return "";
    }

    return safeHistory
        .map(item => {
            const role =
                item.role === "user"
                    ? "User"
                    : "Viggo";

            return `${role}: ${cleanText(item.content)}`;
        })
        .join("\n\n");
}

/* =========================================================
   CHAT API
========================================================= */

app.post("/chat", async (req, res) => {
    try {
        /* -------------------------------------------------
           API KEY CHECK
        ------------------------------------------------- */

        if (!API_KEY || !ai) {
            return res.status(500).json({
                success: false,
                error: "Gemini API key is not configured.",
                details:
                    "Render → Environment → GEMINI_API_KEY add pannunga."
            });
        }

        /* -------------------------------------------------
           REQUEST
        ------------------------------------------------- */

        const message = cleanText(
            req.body?.message
        );

        const language =
            cleanText(
                req.body?.language
            ) || "en";

        const history =
            req.body?.history || [];

        /* -------------------------------------------------
           MESSAGE VALIDATION
        ------------------------------------------------- */

        if (!message) {
            return res.status(400).json({
                success: false,
                error: "Message is required."
            });
        }

        /* -------------------------------------------------
           HISTORY
        ------------------------------------------------- */

        const previousMessages =
            buildHistory(history);

        /* -------------------------------------------------
           PROMPT
        ------------------------------------------------- */

        let prompt =
            createSystemInstruction(
                language
            );

        if (previousMessages) {
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
            message.substring(0, 100)
        );

        /* -------------------------------------------------
           GEMINI REQUEST
        ------------------------------------------------- */

        const response =
            await ai.models.generateContent({
                model: MODEL,
                contents: prompt
            });

        /* -------------------------------------------------
           RESPONSE TEXT
        ------------------------------------------------- */

        let reply = "";

        if (
            response &&
            typeof response.text === "string"
        ) {
            reply = response.text;
        }

        /*
          Fallback for SDK response formats.
        */

        if (
            !reply &&
            response?.candidates?.length
        ) {
            const candidate =
                response.candidates[0];

            const parts =
                candidate?.content?.parts;

            if (Array.isArray(parts)) {
                reply = parts
                    .map(part => part?.text || "")
                    .join("");
            }
        }

        reply = cleanText(reply);

        /* -------------------------------------------------
           EMPTY RESPONSE
        ------------------------------------------------- */

        if (!reply) {
            console.error(
                "Gemini returned empty response."
            );

            return res.status(502).json({
                success: false,
                error:
                    "Viggo AI returned an empty response."
            });
        }

        /* -------------------------------------------------
           SUCCESS
        ------------------------------------------------- */

        console.log(
            "✓ Gemini response received."
        );

        return res.json({
            success: true,
            reply: reply,
            model: MODEL
        });
    }

    /* =====================================================
       ERROR
    ===================================================== */

    catch (error) {
        console.error(
            "❌ Gemini error:"
        );

        console.error(error);

        const errorMessage =
            error?.message ||
            String(error);

        const lower =
            errorMessage.toLowerCase();

        /* -------------------------------------------------
           RATE LIMIT / HIGH DEMAND
        ------------------------------------------------- */

        if (
            lower.includes("429") ||
            lower.includes("resource exhausted") ||
            lower.includes("quota") ||
            lower.includes("rate limit") ||
            lower.includes("high demand")
        ) {
            return res.status(429).json({
                success: false,
                error:
                    "Viggo AI is temporarily busy.",
                details:
                    "Gemini is currently experiencing high demand. Please try again after a few seconds."
            });
        }

        /* -------------------------------------------------
           API KEY
        ------------------------------------------------- */

        if (
            lower.includes("api key") ||
            lower.includes("unauthorized") ||
            lower.includes("authentication")
        ) {
            return res.status(500).json({
                success: false,
                error:
                    "Gemini API key error.",
                details:
                    "Check GEMINI_API_KEY in Render Environment Variables."
            });
        }

        /* -------------------------------------------------
           MODEL
        ------------------------------------------------- */

        if (
            lower.includes("model") ||
            lower.includes("not found")
        ) {
            return res.status(502).json({
                success: false,
                error:
                    "Gemini model error.",
                details:
                    errorMessage
            });
        }

        /* -------------------------------------------------
           GENERAL ERROR
        ------------------------------------------------- */

        return res.status(500).json({
            success: false,
            error:
                "Viggo AI could not generate a response.",
            details:
                errorMessage
        });
    }
});

/* =========================================================
   404
========================================================= */

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: "Endpoint not found.",
        path: req.path
    });
});

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use((error, req, res, next) => {
    console.error(
        "Unhandled server error:",
        error
    );

    if (res.headersSent) {
        return next(error);
    }

    res.status(500).json({
        success: false,
        error: "Internal server error."
    });
});

/* =========================================================
   START SERVER
========================================================= */

app.listen(PORT, () => {
    console.log("");
    console.log("================================");
    console.log("       VIGGO AI SERVER ONLINE");
    console.log("================================");
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
});
