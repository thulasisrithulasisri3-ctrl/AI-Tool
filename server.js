"use strict";

/* =====================================================
   VIGGO AI SERVER
   Express + Google Gemini
===================================================== */

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();

/* =====================================================
   CONFIG
===================================================== */

const PORT = process.env.PORT || 10000;

const API_KEY = process.env.GEMINI_API_KEY;

const MODEL =
    process.env.GEMINI_MODEL ||
    "gemini-3.6-flash";


/* =====================================================
   GEMINI
===================================================== */

let ai = null;

if (API_KEY) {

    ai = new GoogleGenAI({
        apiKey: API_KEY
    });

    console.log("Gemini API: CONFIGURED");

} else {

    console.log("Gemini API: NOT CONFIGURED");

}


/* =====================================================
   MIDDLEWARE
===================================================== */

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type"]
    })
);

app.use(
    express.json({
        limit: "50mb"
    })
);


/* =====================================================
   HOME
===================================================== */

app.get("/", (req, res) => {

    res.json({

        status: "online",

        message:
            "Viggo AI Server is running.",

        model:
            MODEL,

        apiConfigured:
            Boolean(API_KEY)

    });

});


/* =====================================================
   HEALTH CHECK
===================================================== */

app.get("/health", (req, res) => {

    res.json({

        status: "healthy",

        server: "Viggo AI",

        model: MODEL,

        apiConfigured:
            Boolean(API_KEY),

        time:
            new Date().toISOString()

    });

});


/* =====================================================
   CURRENT DATE / TIME
===================================================== */

function getCurrentDateTime() {

    const now =
        new Date();


    const date =
        now.toLocaleDateString(
            "en-IN",
            {
                timeZone:
                    "Asia/Kolkata",

                day:
                    "2-digit",

                month:
                    "2-digit",

                year:
                    "numeric"
            }
        );


    const time =
        now.toLocaleTimeString(
            "en-IN",
            {
                timeZone:
                    "Asia/Kolkata",

                hour:
                    "2-digit",

                minute:
                    "2-digit",

                second:
                    "2-digit",

                hour12:
                    true
            }
        );


    return {
        date,
        time
    };

}


/* =====================================================
   DETECT DATE / TIME QUESTIONS
===================================================== */

function detectDateTimeQuestion(message) {

    const text =
        String(message || "")
            .toLowerCase()
            .trim();


    const dateWords = [
        "date",
        "today date",
        "todays date",
        "today's date",
        "what date",
        "which date",
        "தேதி",
        "இன்றைய தேதி",
        "இன்று என்ன தேதி"
    ];


    const timeWords = [
        "time",
        "current time",
        "what time",
        "what's the time",
        "what is the time",
        "now time",
        "நேரம்",
        "இப்போ நேரம்",
        "இப்போது நேரம்",
        "என்ன நேரம்"
    ];


    const asksDate =
        dateWords.some(
            word =>
                text.includes(word)
        );


    const asksTime =
        timeWords.some(
            word =>
                text.includes(word)
        );


    return {
        asksDate,
        asksTime
    };

}


/* =====================================================
   DATE / TIME RESPONSE
===================================================== */

function dateTimeReply(message) {

    const {
        asksDate,
        asksTime
    } =
        detectDateTimeQuestion(
            message
        );


    if (!asksDate && !asksTime) {

        return null;

    }


    const {
        date,
        time
    } =
        getCurrentDateTime();


    /*
       IMPORTANT:
       User wants ONLY the requested
       date OR time.

       No extra date/time information
       below the reply.
    */


    if (asksDate && !asksTime) {

        return date;

    }


    if (asksTime && !asksDate) {

        return time;

    }


    return `Date: ${date}\nTime: ${time}`;

}


/* =====================================================
   SYSTEM PROMPT
===================================================== */

function getSystemPrompt(language) {

    return `
You are Viggo AI, a helpful AI assistant.

Rules:

1. Answer the user's question directly.
2. Keep answers clear and useful.
3. Do not add unnecessary information.
4. Do not display a separate date or time below your answer.
5. If the user asks specifically for the date, return only the date.
6. If the user asks specifically for the time, return only the time.
7. Use the requested language when appropriate.
8. Do not invent information.
9. Be friendly and concise.

Selected language:
${language || "en-IN"}
`;

}


/* =====================================================
   EXTRACT GEMINI TEXT
===================================================== */

function extractText(response) {

    if (!response) {

        return "";

    }


    if (
        typeof response.text ===
        "string"
    ) {

        return response.text;

    }


    if (
        response.text &&
        typeof response.text === "function"
    ) {

        try {

            return response.text();

        } catch (error) {

            console.error(
                "Response text error:",
                error
            );

        }

    }


    try {

        if (
            response.candidates &&
            response.candidates.length
        ) {

            const candidate =
                response.candidates[0];


            if (
                candidate.content &&
                candidate.content.parts
            ) {

                return candidate.content.parts
                    .map(
                        part =>
                            part.text || ""
                    )
                    .join("");

            }

        }

    } catch (error) {

        console.error(
            "Extract text error:",
            error
        );

    }


    return "";

}


/* =====================================================
   CHAT ROUTE
===================================================== */

app.post("/chat", async (req, res) => {

    try {

        const {
            message,
            language,
            file
        } = req.body || {};


        /* ---------------------------------------------
           VALIDATION
        --------------------------------------------- */

        if (
            !message &&
            !file
        ) {

            return res.status(400).json({

                error:
                    "Message is required."

            });

        }


        /* ---------------------------------------------
           DATE / TIME
           
           Handle locally so it always works.
        --------------------------------------------- */

        if (message) {

            const specialReply =
                dateTimeReply(
                    message
                );


            if (specialReply) {

                return res.json({

                    reply:
                        specialReply

                });

            }

        }


        /* ---------------------------------------------
           API KEY
        --------------------------------------------- */

        if (!ai) {

            return res.status(500).json({

                error:
                    "Gemini API key is not configured."

            });

        }


        /* ---------------------------------------------
           USER MESSAGE
        --------------------------------------------- */

        const userMessage =
            String(
                message ||
                "Please analyze the uploaded file."
            );


        /* ---------------------------------------------
           NORMAL TEXT CHAT
        --------------------------------------------- */

        if (!file) {

            const prompt =

                getSystemPrompt(
                    language
                ) +

                "\n\nUser message:\n" +

                userMessage;


            const response =
                await ai.models.generateContent({

                    model:
                        MODEL,

                    contents:
                        prompt

                });


            const reply =
                extractText(
                    response
                );


            if (!reply) {

                return res.status(500).json({

                    error:
                        "Gemini returned an empty response."

                });

            }


            return res.json({

                reply:
                    reply.trim()

            });

        }


        /* ---------------------------------------------
           FILE / IMAGE
        --------------------------------------------- */

        if (
            file.data &&
            file.type
        ) {

            const base64Data =
                String(
                    file.data
                ).replace(
                    /^data:[^;]+;base64,/,
                    ""
                );


            const prompt =

                getSystemPrompt(
                    language
                ) +

                `

The user uploaded a file.

File name:
${file.name || "Uploaded file"}

File type:
${file.type}

User request:
${userMessage}

Analyze the uploaded content and answer the user.
`;


            const response =
                await ai.models.generateContent({

                    model:
                        MODEL,

                    contents: [

                        {
                            role:
                                "user",

                            parts: [

                                {
                                    text:
                                        prompt
                                },

                                {
                                    inlineData: {

                                        mimeType:
                                            file.type,

                                        data:
                                            base64Data

                                    }

                                }

                            ]

                        }

                    ]

                });


            const reply =
                extractText(
                    response
                );


            if (!reply) {

                return res.status(500).json({

                    error:
                        "Gemini returned an empty file response."

                });

            }


            return res.json({

                reply:
                    reply.trim()

            });

        }


        /* ---------------------------------------------
           INVALID FILE
        --------------------------------------------- */

        return res.status(400).json({

            error:
                "Invalid uploaded file."

        });


    } catch (error) {

        console.error(
            "================================="
        );

        console.error(
            "VIGGO CHAT ERROR"
        );

        console.error(
            error
        );

        console.error(
            "================================="
        );


        return res.status(500).json({

            error:
                error.message ||
                "Internal server error.",

            message:
                "Viggo AI could not process the request."

        });

    }

});


/* =====================================================
   404
===================================================== */

app.use(
    (req, res) => {

        res.status(404).json({

            error:
                "Route not found.",

            path:
                req.path

        });

    }
);


/* =====================================================
   SERVER START
===================================================== */

app.listen(
    PORT,
    () => {

        console.log(
            "================================="
        );

        console.log(
            "VIGGO AI SERVER ONLINE"
        );

        console.log(
            "================================="
        );

        console.log(
            `PORT: ${PORT}`
        );

        console.log(
            `MODEL: ${MODEL}`
        );

        console.log(
            `API KEY: ${
                API_KEY
                    ? "CONFIGURED"
                    : "NOT CONFIGURED"
            }`
        );

        console.log(
            "================================="
        );

    }
);
