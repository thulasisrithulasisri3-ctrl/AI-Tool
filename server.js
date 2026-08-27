"use strict";

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

/* =====================================================
   VIGGO AI SERVER
===================================================== */

const app = express();

const PORT = process.env.PORT || 10000;
const API_KEY =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY;

/* =====================================================
   MODEL
===================================================== */

const MODEL = "gemini-3.5-flash-lite";
const DEFAULT_TIMEZONE = "Asia/Kolkata";

/* =====================================================
   MIDDLEWARE
===================================================== */

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ]
    })
);

app.use(
    express.json({
        limit: "25mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "25mb"
    })
);

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
   DATE / TIME
===================================================== */

function getDateTime(
    timeZone = DEFAULT_TIMEZONE
) {
    const now = new Date();

    const dateFormatter =
        new Intl.DateTimeFormat(
            "en-US",
            {
                timeZone,
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );

    const timeFormatter =
        new Intl.DateTimeFormat(
            "en-US",
            {
                timeZone,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true
            }
        );

    return {
        date: dateFormatter.format(now),
        time: timeFormatter.format(now),
        dateTime:
            dateFormatter.format(now) +
            " at " +
            timeFormatter.format(now)
    };
}

/* =====================================================
   LANGUAGE
===================================================== */

function getLanguageName(language) {

    const languages = {

        "en-IN": "English",
        "ta-IN": "Tamil",
        "hi-IN": "Hindi",
        "te-IN": "Telugu",
        "kn-IN": "Kannada",
        "ml-IN": "Malayalam",
        "bn-IN": "Bengali",
        "mr-IN": "Marathi",
        "gu-IN": "Gujarati",
        "pa-IN": "Punjabi",
        "ur-IN": "Urdu",
        "or-IN": "Odia",
        "as-IN": "Assamese",

        "fr-FR": "French",
        "de-DE": "German",
        "es-ES": "Spanish",
        "it-IT": "Italian",
        "pt-BR": "Portuguese",
        "ru-RU": "Russian",
        "ja-JP": "Japanese",
        "ko-KR": "Korean",
        "zh-CN": "Chinese",
        "ar-SA": "Arabic",
        "tr-TR": "Turkish",
        "nl-NL": "Dutch",
        "pl-PL": "Polish",
        "sv-SE": "Swedish",
        "da-DK": "Danish",
        "fi-FI": "Finnish",
        "no-NO": "Norwegian",
        "el-GR": "Greek",
        "he-IL": "Hebrew",
        "th-TH": "Thai",
        "vi-VN": "Vietnamese",
        "id-ID": "Indonesian",
        "ms-MY": "Malay"

    };

    return languages[language] || "English";
}

/* =====================================================
   ROOT
===================================================== */

app.get("/", (req, res) => {

    const dt =
        getDateTime(DEFAULT_TIMEZONE);

    res.json({
        status: "online",
        service: "Viggo AI Server",
        model: MODEL,
        apiConfigured: Boolean(API_KEY),
        timezone: DEFAULT_TIMEZONE,
        currentDate: dt.date,
        currentTime: dt.time,
        currentDateTime: dt.dateTime
    });
});

/* =====================================================
   HEALTH
===================================================== */

app.get("/health", (req, res) => {

    const dt =
        getDateTime(DEFAULT_TIMEZONE);

    res.json({
        status: "ok",
        service: "Viggo AI Server",
        apiConfigured: Boolean(API_KEY),
        model: MODEL,
        timezone: DEFAULT_TIMEZONE,
        currentDate: dt.date,
        currentTime: dt.time,
        currentDateTime: dt.dateTime
    });
});

/* =====================================================
   CHAT
===================================================== */

app.post("/chat", async (req, res) => {

    try {

        const {
            message,
            language = "en-IN",
            file = null,
            history = []
        } = req.body || {};

        console.log("=================================");
        console.log("CHAT REQUEST");
        console.log("Language:", language);
        console.log("Message:", message);
        console.log(
            "History messages:",
            Array.isArray(history)
                ? history.length
                : 0
        );
        console.log(
            "File:",
            file ? file.name : "none"
        );
        console.log("=================================");

        /* =================================================
           API KEY
        ================================================= */

        if (!API_KEY || !ai) {

            return res.status(500).json({
                success: false,
                error:
                    "Gemini API key is not configured on the server."
            });
        }

        /* =================================================
           MESSAGE CHECK
        ================================================= */

        if (
            (!message ||
                !String(message).trim()) &&
            !file
        ) {

            return res.status(400).json({
                success: false,
                error: "Message is required."
            });
        }

        /* =================================================
           DATE / TIME
        ================================================= */

        const timeZone =
            DEFAULT_TIMEZONE;

        const dt =
            getDateTime(timeZone);

        const languageName =
            getLanguageName(language);

        /* =================================================
           SYSTEM INSTRUCTION
        ================================================= */

        const systemInstruction = `
You are Viggo AI, a helpful AI assistant.

IMPORTANT RULES:

1. Current date:
${dt.date}

2. Current time:
${dt.time}

3. Current date and time:
${dt.dateTime}

4. Timezone:
${timeZone}

5. User selected language:
${languageName} (${language})

6. Always use the current date and time information above
when answering date/time questions.

7. If the user asks "today", answer using the current date.

8. If the user asks "tomorrow", calculate tomorrow correctly
from the current date.

9. If the user asks "yesterday", calculate yesterday correctly
from the current date.

10. If the user asks for the current time, answer using the
current time above.

11. If the user asks about a country, state, city, or timezone,
use the appropriate local date/time when you can determine it.

12. Reply in the user's selected language when practical.

13. Do not claim that the current date is 2024 or another old date.

14. IMPORTANT:
Use the previous conversation provided below to understand
the user's current question.

15. Do NOT restart the conversation for every new message.

16. Do NOT automatically say:
"Hello! How can I help you today?"
unless the user is actually greeting you or starting
a completely new conversation.

17. If the user asks a follow-up question, answer it based
on the previous conversation.

18. Be accurate, friendly and concise.

19. You can naturally call the user "friend" when appropriate.
`;

        /* =================================================
           BUILD CONVERSATION CONTEXT
================================================= */

        let conversationContext = "";

        if (Array.isArray(history)) {

            conversationContext =
                history
                    .slice(-30)
                    .map(item => {

                        const role =
                            item.role === "assistant"
                                ? "Viggo"
                                : "User";

                        /*
                         * FIX:
                         * Accept text, content, or message
                         * so conversation history continues.
                         */

                        const text =
                            String(
                                item.text ||
                                item.content ||
                                item.message ||
                                ""
                            ).trim();

                        if (!text) {
                            return "";
                        }

                        return (
                            role +
                            ": " +
                            text
                        );
                    })
                    .filter(Boolean)
                    .join("\n\n");
        }

        /* =================================================
           CONTENT
        ================================================= */

        let contents = "";

        if (conversationContext) {

            contents += `
${systemInstruction}

PREVIOUS CONVERSATION:

${conversationContext}

CURRENT USER MESSAGE:

${String(message || "").trim()}
`;

        } else {

            contents = `
${systemInstruction}

CURRENT USER MESSAGE:

${String(message || "").trim()}
`;
        }

        /* =================================================
           FILE
        ================================================= */

        if (file) {

            contents += `

The user uploaded a file.

File name:
${file.name || "unknown"}

File type:
${file.type || "unknown"}

File size:
${file.size || 0} bytes

USER REQUEST:
${String(message || "").trim()}

If the uploaded file content is not directly available
to you, clearly explain that instead of pretending
that you analyzed it.
`;
        }

        /* =================================================
           GEMINI REQUEST
        ================================================= */

        console.log(
            "Sending request to Gemini..."
        );

        console.log(
            "Model:",
            MODEL
        );

        const response =
            await ai.models.generateContent({
                model: MODEL,
                contents: contents
            });

        /* =================================================
           RESPONSE
        ================================================= */

        let reply = "";

        if (response) {

            if (
                typeof response.text ===
                "string"
            ) {

                reply =
                    response.text;

            } else if (
                response.text &&
                typeof response.text ===
                "function"
            ) {

                reply =
                    response.text();
            }
        }

        if (
            !reply &&
            response?.candidates?.length
        ) {

            const candidate =
                response.candidates[0];

            const parts =
                candidate?.content?.parts ||
                [];

            reply =
                parts
                    .map(
                        part =>
                            part.text || ""
                    )
                    .join("")
                    .trim();
        }

        if (!reply) {

            console.error(
                "Gemini returned an empty response:",
                response
            );

            return res.status(500).json({
                success: false,
                error:
                    "Gemini returned an empty response."
            });
        }

        console.log(
            "Gemini response received."
        );

        return res.json({

            success: true,

            reply:
                String(reply),

            language,

            timezone:
                timeZone,

            currentDate:
                dt.date,

            currentTime:
                dt.time,

            currentDateTime:
                dt.dateTime,

            model:
                MODEL
        });

    } catch (error) {

        console.error("=================================");
        console.error("VIGGO AI CHAT ERROR");
        console.error(error);
        console.error("=================================");

        const status =
            error?.status ||
            error?.code ||
            500;

        let errorMessage =
            error?.message ||
            "Viggo AI server error.";

        if (Number(status) === 429) {

            errorMessage =
                "Gemini API quota exceeded. Please try again later.";
        }

        if (Number(status) === 503) {

            errorMessage =
                "Gemini is temporarily busy. Please try again in a few seconds.";
        }

        return res.status(500).json({

            success: false,

            error:
                errorMessage
        });
    }
});

/* =====================================================
   404
===================================================== */

app.use((req, res) => {

    res.status(404).json({

        status: "error",

        error:
            "Endpoint not found.",

        path:
            req.path,

        method:
            req.method
    });
});

/* =====================================================
   SERVER
===================================================== */

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        const dt =
            getDateTime(
                DEFAULT_TIMEZONE
            );

        console.log("");
        console.log("=================================");
        console.log("VIGGO AI SERVER ONLINE");
        console.log("PORT:", PORT);
        console.log("MODEL:", MODEL);

        console.log(
            "API KEY:",
            API_KEY
                ? "CONFIGURED"
                : "MISSING"
        );

        console.log(
            "TIMEZONE:",
            DEFAULT_TIMEZONE
        );

        console.log(
            "CURRENT DATE:",
            dt.date
        );

        console.log(
            "CURRENT TIME:",
            dt.time
        );

        console.log(
            "CURRENT DATE/TIME:",
            dt.dateTime
        );

        console.log(
            "CHAT ENDPOINT: /chat"
        );

        console.log(
            "HEALTH ENDPOINT: /health"
        );

        console.log(
            "================================="
        );

        console.log("");
    }
);
