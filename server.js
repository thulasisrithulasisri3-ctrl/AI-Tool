"use strict";

/* =====================================================
   VIGGO AI SERVER
   EXPRESS + GOOGLE GEMINI
===================================================== */

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");


/* =====================================================
   APP
===================================================== */

const app = express();

const PORT =
    process.env.PORT || 10000;

const API_KEY =
    process.env.GEMINI_API_KEY;

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

    console.log(
        "Gemini API: CONFIGURED"
    );

} else {

    console.log(
        "Gemini API: NOT CONFIGURED"
    );

}


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
            "Content-Type"
        ]
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

app.get(
    "/",
    (req, res) => {

        res.json({

            status:
                "online",

            message:
                "Viggo AI Server is running.",

            model:
                MODEL,

            apiConfigured:
                Boolean(API_KEY)

        });

    }
);


/* =====================================================
   HEALTH
===================================================== */

app.get(
    "/health",
    (req, res) => {

        res.json({

            status:
                "healthy",

            server:
                "Viggo AI",

            model:
                MODEL,

            apiConfigured:
                Boolean(API_KEY),

            serverTime:
                new Date().toISOString()

        });

    }
);


/* =====================================================
   INDIA DATE / TIME
===================================================== */

function getIndiaDateTime() {

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
   DATE / TIME DETECTOR
===================================================== */

function detectDateTimeQuestion(
    message
) {

    const text =
        String(
            message || ""
        )
        .toLowerCase()
        .trim();


    const datePatterns = [

        "date",
        "today date",
        "today's date",
        "todays date",
        "what date",
        "what is the date",
        "what's the date",
        "which date",

        "தேதி",
        "இன்றைய தேதி",
        "இன்று என்ன தேதி",
        "இன்னைக்கு என்ன தேதி"

    ];


    const timePatterns = [

        "time",
        "current time",
        "what time",
        "what is the time",
        "what's the time",
        "tell me the time",
        "now time",
        "current date and time",

        "நேரம்",
        "இப்போ நேரம்",
        "இப்போது நேரம்",
        "என்ன நேரம்",
        "இப்ப என்ன நேரம்"

    ];


    const asksDate =
        datePatterns.some(
            pattern =>
                text.includes(pattern)
        );


    const asksTime =
        timePatterns.some(
            pattern =>
                text.includes(pattern)
        );


    return {
        asksDate,
        asksTime
    };

}


/* =====================================================
   DATE / TIME REPLY
===================================================== */

function getDateTimeReply(
    message
) {

    const {
        asksDate,
        asksTime
    } =
        detectDateTimeQuestion(
            message
        );


    if (
        !asksDate &&
        !asksTime
    ) {

        return null;

    }


    const {
        date,
        time
    } =
        getIndiaDateTime();


    /* -----------------------------------------------
       DATE ONLY
    ----------------------------------------------- */

    if (
        asksDate &&
        !asksTime
    ) {

        return date;

    }


    /* -----------------------------------------------
       TIME ONLY
    ----------------------------------------------- */

    if (
        asksTime &&
        !asksDate
    ) {

        return time;

    }


    /* -----------------------------------------------
       BOTH DATE + TIME
    ----------------------------------------------- */

    return `Date: ${date}\nTime: ${time}`;

}


/* =====================================================
   SYSTEM PROMPT
===================================================== */

function getSystemPrompt(
    language
) {

    return `

You are Viggo AI.

You are a helpful, friendly and concise AI assistant.

IMPORTANT RULES:

1. Answer the user's question directly.

2. Do not add unnecessary information.

3. Do not add a separate date or time below your answer.

4. If the user asks only for the date,
   answer only with the date.

5. If the user asks only for the time,
   answer only with the time.

6. If the user asks for both date and time,
   provide both.

7. Do not automatically append the current
   date or time to normal answers.

8. Do not mention the current date or time
   unless the user asks for it.

9. Use the selected language when appropriate.

10. Be clear and concise.

Selected language:
${language || "en-IN"}

`;

}


/* =====================================================
   GEMINI RESPONSE TEXT
===================================================== */

function extractText(
    response
) {

    if (!response) {

        return "";

    }


    /* -----------------------------------------------
       DIRECT TEXT
    ----------------------------------------------- */

    if (
        typeof response.text ===
        "string"
    ) {

        return response.text;

    }


    /* -----------------------------------------------
       TEXT FUNCTION
    ----------------------------------------------- */

    if (
        typeof response.text ===
        "function"
    ) {

        try {

            return response.text();

        } catch (error) {

            console.error(
                "Text extraction error:",
                error
            );

        }

    }


    /* -----------------------------------------------
       CANDIDATES
    ----------------------------------------------- */

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
            "Candidate extraction error:",
            error
        );

    }


    return "";

}


/* =====================================================
   CHAT API
===================================================== */

app.post(
    "/chat",
    async (req, res) => {

        try {

            const {
                message,
                language,
                file
            } =
                req.body || {};


            /* ---------------------------------------
               VALIDATION
            --------------------------------------- */

            if (
                !message &&
                !file
            ) {

                return res.status(
                    400
                ).json({

                    error:
                        "Message is required."

                });

            }


            /* ---------------------------------------
               DATE / TIME
               
               IMPORTANT:
               This happens BEFORE Gemini.
               
               So Gemini cannot add extra
               information underneath.
            --------------------------------------- */

            if (message) {

                const specialReply =
                    getDateTimeReply(
                        message
                    );


                if (
                    specialReply !== null
                ) {

                    return res.json({

                        reply:
                            specialReply

                    });

                }

            }


            /* ---------------------------------------
               GEMINI KEY
            --------------------------------------- */

            if (!ai) {

                return res.status(
                    500
                ).json({

                    error:
                        "Gemini API key is not configured."

                });

            }


            /* ---------------------------------------
               TEXT CHAT
            --------------------------------------- */

            if (!file) {

                const prompt =

                    getSystemPrompt(
                        language
                    ) +

                    "\n\nUSER MESSAGE:\n" +

                    String(
                        message
                    );


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

                    return res.status(
                        500
                    ).json({

                        error:
                            "Gemini returned an empty response."

                    });

                }


                return res.json({

                    reply:
                        reply.trim()

                });

            }


            /* ---------------------------------------
               FILE / IMAGE
            --------------------------------------- */

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


                const prompt = `

${getSystemPrompt(
    language
)}

The user uploaded a file.

File name:
${file.name || "Uploaded file"}

File type:
${file.type}

User request:
${message || "Please analyze this file."}

Analyze the uploaded file and answer
the user's request directly.

Do not add unnecessary date or time
information to the response.

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

                    return res.status(
                        500
                    ).json({

                        error:
                            "Gemini returned an empty file response."

                    });

                }


                return res.json({

                    reply:
                        reply.trim()

                });

            }


            /* ---------------------------------------
               INVALID FILE
            --------------------------------------- */

            return res.status(
                400
            ).json({

                error:
                    "Invalid uploaded file."

            });


        } catch (error) {

            console.error(
                "================================="
            );

            console.error(
                "VIGGO AI CHAT ERROR"
            );

            console.error(
                error
            );

            console.error(
                "================================="
            );


            return res.status(
                500
            ).json({

                error:
                    error.message ||
                    "Internal server error.",

                message:
                    "Viggo AI could not process the request."

            });

        }

    }
);


/* =====================================================
   404
===================================================== */

app.use(
    (req, res) => {

        res.status(
            404
        ).json({

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
