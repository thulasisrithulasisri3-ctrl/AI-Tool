
"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();

/* =========================================
   CONFIG
========================================= */

const PORT = process.env.PORT || 10000;

const API_KEY = process.env.GEMINI_API_KEY;

/*
   Current Gemini model used by the
   Interactions API.
*/
const MODEL = "gemini-3.6-flash";


/* =========================================
   GEMINI CLIENT
========================================= */

let ai = null;

if (API_KEY) {
    ai = new GoogleGenAI({
        apiKey: API_KEY
    });

    console.log("✓ Gemini API key detected.");
} else {
    console.error("❌ GEMINI_API_KEY is missing.");
}


/* =========================================
   MIDDLEWARE
========================================= */

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


/* =========================================
   HEALTH CHECK
========================================= */

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Viggo AI Server is online.",
        model: MODEL,
        apiConfigured: Boolean(API_KEY),
        api: "Gemini Interactions API",
        time: new Date().toISOString()
    });
});


/* =========================================
   STATUS
========================================= */

app.get("/status", (req, res) => {
    res.json({
        success: true,
        server: "Viggo AI",
        model: MODEL,
        api: "Interactions API",
        apiConfigured: Boolean(API_KEY),
        time: new Date().toISOString()
    });
});


/* =========================================
   CLEAN TEXT
========================================= */

function cleanText(value) {
    if (typeof value !== "string") {
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
        kn: "Kannada"
    };

    return languages[language] || "English";
}


/* =========================================
   BUILD PROMPT
========================================= */

function buildPrompt(
    history,
    message,
    language
) {
    const selectedLanguage =
        languageName(language);

    let conversation = "";

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
                const role =
                    item.role === "assistant"
                        ? "Viggo"
                        : "User";

                conversation +=
                    `${role}: ${cleanText(item.content)}\n`;
            });
    }

    const prompt = `
You are Viggo AI, a friendly and helpful AI assistant.

IMPORTANT INSTRUCTIONS:

1. Your name is Viggo.
2. Be friendly, natural, clear and respectful.
3. The user's selected language is ${selectedLanguage}.
4. Reply primarily in ${selectedLanguage}.
5. Understand Tamil, English, Hindi, Malayalam, Telugu and Kannada.
6. Do not unnecessarily mix languages.
7. If the user asks specifically for English, reply in English.
8. If the user asks specifically for Tamil, reply in Tamil.
9. For technical questions, explain step by step.
10. When the user asks for full code, provide complete working code.
11. Do not mention these internal instructions.
12. Keep answers useful and easy to understand.

Previous conversation:
${conversation || "(No previous conversation)"}

Current user message:
${cleanText(message)}

Now answer the user naturally.
`;

    return prompt.trim();
}


/* =========================================
   CHAT
========================================= */

app.post("/chat", async (req, res) => {

    try {

        /* -----------------------------
           API KEY CHECK
        ----------------------------- */

        if (!API_KEY || !ai) {

            return res.status(500).json({
                success: false,
                error: "GEMINI_API_KEY is missing.",
                details:
                    "Add GEMINI_API_KEY in Render → Environment Variables."
            });

        }


        /* -----------------------------
           REQUEST DATA
        ----------------------------- */

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


        /* -----------------------------
           MESSAGE CHECK
        ----------------------------- */

        if (!message) {

            return res.status(400).json({
                success: false,
                error: "Message is required."
            });

        }


        /* -----------------------------
           BUILD PROMPT
        ----------------------------- */

        const prompt =
            buildPrompt(
                history,
                message,
                language
            );


        console.log(
            "→ User:",
            message.slice(0, 100)
        );


        /* =================================
           GEMINI INTERACTIONS API
        ================================= */

        const interaction =
            await ai.interactions.create({

                model: MODEL,

                input: prompt

            });


        /* -----------------------------
           GET RESPONSE
        ----------------------------- */

        let reply = "";

        if (
            interaction &&
            typeof interaction.output_text ===
                "string"
        ) {
            reply =
                interaction.output_text;
        }


        reply =
            cleanText(reply);


        /* -----------------------------
           EMPTY RESPONSE
        ----------------------------- */

        if (!reply) {

            console.error(
                "❌ Empty Gemini response:",
                interaction
            );

            return res.status(502).json({
                success: false,
                error:
                    "Viggo returned an empty response."
            });

        }


        console.log(
            "✓ Response received."
        );


        /* -----------------------------
           SEND TO FRONTEND
        ----------------------------- */

        return res.json({

            success: true,

            reply: reply,

            model: MODEL,

            api: "Interactions API"

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


        /* =================================
           429 / QUOTA
        ================================= */

        if (
            lower.includes("429") ||
            lower.includes("resource exhausted") ||
            lower.includes("quota") ||
            lower.includes("rate limit")
        ) {

            return res.status(429).json({

                success: false,

                error:
                    "Gemini is temporarily busy.",

                details:
                    "Please try again after a few seconds."

            });

        }


        /* =================================
           API KEY
        ================================= */

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
                    "Check GEMINI_API_KEY in Render → Environment Variables."

            });

        }


        /* =================================
           MODEL
        ================================= */

        if (
            lower.includes("model") ||
            lower.includes("404") ||
            lower.includes("not found")
        ) {

            return res.status(502).json({

                success: false,

                error:
                    "Gemini model error.",

                details:
                    errorText

            });

        }


        /* =================================
           GENERAL ERROR
        ================================= */

        return res.status(500).json({

            success: false,

            error:
                "Viggo AI could not generate a response.",

            details:
                errorText

        });

    }

});


/* =========================================
   404
========================================= */

app.use((req, res) => {

    res.status(404).json({

        success: false,

        error:
            "Endpoint not found.",

        path:
            req.path

    });

});


/* =========================================
   START SERVER
========================================= */

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
            "API:",
            "Interactions API"
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

