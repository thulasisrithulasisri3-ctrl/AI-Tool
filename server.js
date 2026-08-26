"use strict";

/* =====================================================
   VIGGO AI - SERVER.JS
   FULL CORRECTED VERSION
   ACCURACY + INDIA DATE/TIME FIX
===================================================== */

const express = require("express");
const cors = require("cors");

/* =====================================================
   APP
===================================================== */

const app = express();

const PORT =
    process.env.PORT || 10000;


/* =====================================================
   GEMINI CONFIG
===================================================== */

const GEMINI_API_KEY =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    "";

const MODEL =
    process.env.GEMINI_MODEL ||
    "gemini-2.5-flash";


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
        limit: "50mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "50mb"
    })
);


/* =====================================================
   INDIA TIMEZONE
===================================================== */

const INDIA_TIMEZONE =
    "Asia/Kolkata";


/* =====================================================
   CURRENT INDIA DATE + TIME
===================================================== */

function getCurrentIndiaDateTime() {

    return new Intl.DateTimeFormat(
        "en-IN",
        {
            timeZone: INDIA_TIMEZONE,
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        }
    ).format(new Date());

}


/* =====================================================
   CURRENT INDIA DATE
===================================================== */

function getCurrentIndiaDate() {

    return new Intl.DateTimeFormat(
        "en-IN",
        {
            timeZone: INDIA_TIMEZONE,
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    ).format(new Date());

}


/* =====================================================
   CURRENT INDIA TIME
===================================================== */

function getCurrentIndiaTime() {

    return new Intl.DateTimeFormat(
        "en-IN",
        {
            timeZone: INDIA_TIMEZONE,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        }
    ).format(new Date());

}


/* =====================================================
   INDIA DATE PARTS
===================================================== */

function getIndiaDateParts() {

    const parts =
        new Intl.DateTimeFormat(
            "en-US",
            {
                timeZone: INDIA_TIMEZONE,
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        ).formatToParts(
            new Date()
        );

    const result = {};

    for (const part of parts) {

        if (
            part.type !== "literal"
        ) {

            result[part.type] =
                part.value;
        }
    }

    return {
        year:
            Number(result.year),

        month:
            Number(result.month),

        day:
            Number(result.day)
    };

}


/* =====================================================
   INDIA DATE WITH OFFSET
===================================================== */

function getIndiaDateWithOffset(
    days
) {

    const parts =
        getIndiaDateParts();

    const utcDate =
        new Date(
            Date.UTC(
                parts.year,
                parts.month - 1,
                parts.day
            )
        );

    utcDate.setUTCDate(
        utcDate.getUTCDate() + days
    );

    return new Intl.DateTimeFormat(
        "en-IN",
        {
            timeZone: "UTC",
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    ).format(
        utcDate
    );

}


/* =====================================================
   NORMALIZE USER TEXT
===================================================== */

function normalizeText(
    message
) {

    return String(
        message || ""
    )
        .toLowerCase()
        .replace(
            /[?!.,;:]+/g,
            " "
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


/* =====================================================
   DATE QUESTION DETECTOR
===================================================== */

function isDateQuestion(
    message
) {

    const text =
        normalizeText(
            message
        );

    const patterns = [

        /* English */

        /\btoday\b/,
        /\btodays date\b/,
        /\btoday date\b/,
        /\bcurrent date\b/,
        /\bdate today\b/,
        /\bwhat date\b/,
        /\bwhat is todays date\b/,
        /\bwhat is today's date\b/,
        /\bwhat day is today\b/,
        /\bwhich date is today\b/,
        /\bwhat is the date\b/,

        /* Tamil */

        /இன்று/,
        /இன்றைய தேதி/,
        /இன்று தேதி/,
        /இன்னைக்கு தேதி/,
        /இன்னைக்கு என்ன தேதி/,
        /இன்றைக்கு தேதி/,
        /இன்றைக்கு என்ன தேதி/,
        /தேதி என்ன/,
        /இன்று என்ன தேதி/,
        /இன்றைய நாள்/,
        /இன்று என்ன நாள்/
    ];

    return patterns.some(
        pattern =>
            pattern.test(text)
    );

}


/* =====================================================
   TIME QUESTION DETECTOR
===================================================== */

function isTimeQuestion(
    message
) {

    const text =
        normalizeText(
            message
        );

    const patterns = [

        /* English */

        /\bcurrent time\b/,
        /\bwhat time is it\b/,
        /\bwhat is the time\b/,
        /\bwhat's the time\b/,
        /\btime now\b/,
        /\btime right now\b/,
        /\bindia time\b/,
        /\btime in india\b/,
        /\bwhat time\b/,

        /* Tamil */

        /இப்போது மணி என்ன/,
        /இப்போ மணி என்ன/,
        /இப்பொழுது மணி என்ன/,
        /நேரம் என்ன/,
        /இப்போ நேரம் என்ன/,
        /இப்போது நேரம் என்ன/,
        /இந்தியா நேரம்/,
        /இந்திய நேரம்/
    ];

    return patterns.some(
        pattern =>
            pattern.test(text)
    );

}


/* =====================================================
   TOMORROW QUESTION DETECTOR
===================================================== */

function isTomorrowQuestion(
    message
) {

    const text =
        normalizeText(
            message
        );

    return (
        /\btomorrow\b/.test(text) ||
        /\btomorrows date\b/.test(text) ||
        /நாளை/.test(text) ||
        /நாளைக்கு/.test(text) ||
        /நாளைய தேதி/.test(text)
    );

}


/* =====================================================
   YESTERDAY QUESTION DETECTOR
===================================================== */

function isYesterdayQuestion(
    message
) {

    const text =
        normalizeText(
            message
        );

    return (
        /\byesterday\b/.test(text) ||
        /\byesterdays date\b/.test(text) ||
        /நேற்று/.test(text) ||
        /நேற்றைய/.test(text)
    );

}


/* =====================================================
   DATE-ONLY ANSWER
===================================================== */

function createDateResponse() {

    const currentDate =
        getCurrentIndiaDate();

    return {

        success: true,

        reply:
            `Today is ${currentDate}.`,

        response:
            `Today is ${currentDate}.`,

        text:
            `Today is ${currentDate}.`,

        model:
            "server-date",

        timezone:
            INDIA_TIMEZONE,

        currentDate:
            currentDate
    };

}


/* =====================================================
   TIME-ONLY ANSWER
===================================================== */

function createTimeResponse() {

    const currentTime =
        getCurrentIndiaTime();

    return {

        success: true,

        reply:
            `The current time in India is ${currentTime}.`,

        response:
            `The current time in India is ${currentTime}.`,

        text:
            `The current time in India is ${currentTime}.`,

        model:
            "server-time",

        timezone:
            INDIA_TIMEZONE,

        currentTime:
            currentTime
    };

}


/* =====================================================
   TOMORROW RESPONSE
===================================================== */

function createTomorrowResponse() {

    const tomorrow =
        getIndiaDateWithOffset(
            1
        );

    return {

        success: true,

        reply:
            `Tomorrow is ${tomorrow}.`,

        response:
            `Tomorrow is ${tomorrow}.`,

        text:
            `Tomorrow is ${tomorrow}.`,

        model:
            "server-date",

        timezone:
            INDIA_TIMEZONE,

        date:
            tomorrow
    };

}


/* =====================================================
   YESTERDAY RESPONSE
===================================================== */

function createYesterdayResponse() {

    const yesterday =
        getIndiaDateWithOffset(
            -1
        );

    return {

        success: true,

        reply:
            `Yesterday was ${yesterday}.`,

        response:
            `Yesterday was ${yesterday}.`,

        text:
            `Yesterday was ${yesterday}.`,

        model:
            "server-date",

        timezone:
            INDIA_TIMEZONE,

        date:
            yesterday
    };

}


/* =====================================================
   VIGGO AI SYSTEM INSTRUCTION
===================================================== */

const VIGGO_SYSTEM_INSTRUCTION = `

You are Viggo AI, a helpful, accurate and friendly AI assistant.

IMPORTANT ACCURACY RULES:

1. Always understand the user's question before answering.

2. Give accurate, useful and direct answers.

3. NEVER invent facts, names, numbers, dates, links,
   sources or technical information.

4. If you are not certain about something, clearly say
   that you are not certain instead of making up an answer.

5. For mathematics, calculations, conversions and numerical
   problems, carefully verify the calculation.

6. For technical questions, explain clearly and step-by-step
   when useful.

7. If the user asks a simple question, keep the answer simple.

8. If the user asks for a detailed explanation, provide
   a structured and detailed explanation.

9. If the user asks in Tamil, answer primarily in Tamil.

10. If the user asks in English, answer primarily in English.

11. If the user mixes Tamil and English, naturally use
    Tamil + English as appropriate.

12. Do not claim that you performed an action that you
    did not actually perform.

13. Do not pretend to have live internet access.

14. When information may have changed over time, clearly
    say that it may need verification.

15. For educational questions, give correct definitions,
    formulas, examples and steps when appropriate.

16. For multiple-choice questions, identify the correct
    option and briefly explain why.

17. If the question is ambiguous, ask a short clarification
    instead of guessing.

18. Always prioritize correctness over creativity.

19. Do not change the meaning of the user's question.

20. Be friendly, natural and respectful.

21. NEVER GUESS THE CURRENT DATE.

22. NEVER GUESS THE CURRENT TIME.

23. The current timezone is Asia/Kolkata.

24. Current date/time questions are handled by the server
    before the Gemini request.

25. NEVER replace the server date with a date from training
    data or memory.

26. If server date/time information is provided, treat it
    as authoritative.

27. Do not say an old year such as 2024 for a current-date
    question unless the user explicitly asks about 2024.

MAIN GOAL:

ACCURACY + CLARITY + HELPFULNESS.

`;


/* =====================================================
   HOME
===================================================== */

app.get(
    "/",
    (req, res) => {

        res.status(200).json({

            status:
                "online",

            service:
                "Viggo AI Server",

            model:
                MODEL,

            apiConfigured:
                Boolean(
                    GEMINI_API_KEY
                ),

            timezone:
                INDIA_TIMEZONE,

            currentDate:
                getCurrentIndiaDate(),

            currentTime:
                getCurrentIndiaTime(),

            currentDateTime:
                getCurrentIndiaDateTime()

        });

    }
);


/* =====================================================
   HEALTH
===================================================== */

app.get(
    "/health",
    (req, res) => {

        res.status(200).json({

            status:
                "ok",

            service:
                "Viggo AI",

            model:
                MODEL,

            apiConfigured:
                Boolean(
                    GEMINI_API_KEY
                ),

            timezone:
                INDIA_TIMEZONE,

            currentDate:
                getCurrentIndiaDate(),

            currentTime:
                getCurrentIndiaTime(),

            currentDateTime:
                getCurrentIndiaDateTime(),

            serverISOTime:
                new Date().toISOString()

        });

    }
);


/* =====================================================
   CHAT API
===================================================== */

app.post(
    "/chat",
    async (req, res) => {

        try {

            console.log(
                "---------------------------------"
            );

            console.log(
                "POST /chat"
            );


            /* =================================================
               BODY
            ================================================= */

            const body =
                req.body || {};


            const userMessage =
                typeof body.message ===
                "string"
                    ? body.message.trim()
                    : "";


            const uploadedFile =
                body.file || null;


            console.log(
                "Message:",
                userMessage
            );


            console.log(
                "File:",
                uploadedFile
                    ? uploadedFile.name
                    : "none"
            );


            /* =================================================
               CHECK MESSAGE
            ================================================= */

            if (
                !userMessage &&
                !uploadedFile
            ) {

                return res.status(400).json({

                    success:
                        false,

                    error:
                        "Message is required.",

                    reply:
                        "Please enter a message."

                });

            }


            /* =================================================
               IMPORTANT:
               CURRENT DATE/TIME QUESTIONS MUST NEVER
               GO TO GEMINI.
            ================================================= */

            if (
                userMessage &&
                isDateQuestion(
                    userMessage
                )
            ) {

                const result =
                    createDateResponse();

                console.log(
                    "DIRECT CURRENT DATE:",
                    result.currentDate
                );

                return res.status(
                    200
                ).json(
                    result
                );

            }


            /* =================================================
               CURRENT TIME
            ================================================= */

            if (
                userMessage &&
                isTimeQuestion(
                    userMessage
                )
            ) {

                const result =
                    createTimeResponse();

                console.log(
                    "DIRECT CURRENT TIME:",
                    result.currentTime
                );

                return res.status(
                    200
                ).json(
                    result
                );

            }


            /* =================================================
               TOMORROW
            ================================================= */

            if (
                userMessage &&
                isTomorrowQuestion(
                    userMessage
                )
            ) {

                const result =
                    createTomorrowResponse();

                console.log(
                    "DIRECT TOMORROW:",
                    result.date
                );

                return res.status(
                    200
                ).json(
                    result
                );

            }


            /* =================================================
               YESTERDAY
            ================================================= */

            if (
                userMessage &&
                isYesterdayQuestion(
                    userMessage
                )
            ) {

                const result =
                    createYesterdayResponse();

                console.log(
                    "DIRECT YESTERDAY:",
                    result.date
                );

                return res.status(
                    200
                ).json(
                    result
                );

            }


            /* =================================================
               CHECK API KEY
            ================================================= */

            if (
                !GEMINI_API_KEY
            ) {

                console.error(
                    "GEMINI_API_KEY is missing."
                );

                return res.status(500).json({

                    success:
                        false,

                    error:
                        "Gemini API key is not configured.",

                    reply:
                        "Sorry friend, the Viggo AI API key is not configured on the server."

                });

            }


            /* =================================================
               CURRENT SERVER DATE/TIME
            ================================================= */

            const currentIndiaDate =
                getCurrentIndiaDate();


            const currentIndiaTime =
                getCurrentIndiaTime();


            const currentIndiaDateTime =
                getCurrentIndiaDateTime();


            console.log(
                "India Date:",
                currentIndiaDate
            );


            console.log(
                "India Time:",
                currentIndiaTime
            );


            /* =================================================
               BUILD GEMINI PARTS
            ================================================= */

            const parts = [];


            /* =================================================
               TEXT
            ================================================= */

            if (
                userMessage
            ) {

                parts.push({

                    text:
                        userMessage

                });

            }


            /* =================================================
               FILE
            ================================================= */

            if (
                uploadedFile &&
                uploadedFile.data &&
                uploadedFile.type
            ) {

                let base64Data =
                    String(
                        uploadedFile.data
                    );


                if (
                    base64Data.includes(
                        "base64,"
                    )
                ) {

                    base64Data =
                        base64Data.substring(
                            base64Data.indexOf(
                                "base64,"
                            ) + 7
                        );

                }


                base64Data =
                    base64Data.trim();


                if (
                    base64Data
                ) {

                    parts.push({

                        inlineData: {

                            mimeType:
                                uploadedFile.type,

                            data:
                                base64Data

                        }

                    });

                }

            }


            /* =================================================
               CHECK PARTS
            ================================================= */

            if (
                !parts.length
            ) {

                return res.status(400).json({

                    success:
                        false,

                    error:
                        "No valid content received.",

                    reply:
                        "Please send a message or supported file."

                });

            }


            /* =================================================
               GEMINI URL
            ================================================= */

            const geminiURL =
                "https://generativelanguage.googleapis.com/v1beta/models/" +
                encodeURIComponent(
                    MODEL
                ) +
                ":generateContent";


            /* =================================================
               DYNAMIC SYSTEM INSTRUCTION
            ================================================= */

            const dynamicSystemInstruction =

                VIGGO_SYSTEM_INSTRUCTION +

                `

=====================================================
SERVER CURRENT DATE AND TIME
=====================================================

Current India Date:
${currentIndiaDate}

Current India Time:
${currentIndiaTime}

Current India Date and Time:
${currentIndiaDateTime}

Timezone:
Asia/Kolkata

IMPORTANT:
These values come directly from the server.

For current-date/current-time questions,
the server handles the answer before Gemini.

Never substitute an old training-data date.
`;


            /* =================================================
               GEMINI REQUEST
            ================================================= */

            const requestBody = {

                systemInstruction: {

                    parts: [

                        {
                            text:
                                dynamicSystemInstruction
                        }

                    ]

                },

                contents: [

                    {

                        role:
                            "user",

                        parts:
                            parts

                    }

                ],

                generationConfig: {

                    temperature:
                        0.15,

                    maxOutputTokens:
                        2048,

                    topP:
                        0.8

                }

            };


            console.log(
                "Sending request to Gemini..."
            );


            console.log(
                "Model:",
                MODEL
            );


            /* =================================================
               GEMINI API CALL
            ================================================= */

            const geminiResponse =
                await fetch(
                    geminiURL,
                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "x-goog-api-key":
                                GEMINI_API_KEY

                        },

                        body:
                            JSON.stringify(
                                requestBody
                            )

                    }
                );


            /* =================================================
               READ RESPONSE
            ================================================= */

            const rawText =
                await geminiResponse.text();


            let geminiData;


            try {

                geminiData =
                    JSON.parse(
                        rawText
                    );

            } catch {

                geminiData = {

                    raw:
                        rawText

                };

            }


            /* =================================================
               GEMINI ERROR
            ================================================= */

            if (
                !geminiResponse.ok
            ) {

                console.error(
                    "Gemini HTTP Error:",
                    geminiResponse.status
                );


                console.error(
                    "Gemini Response:",
                    geminiData
                );


                const apiError =
                    geminiData
                        ?.error
                        ?.message ||
                    "Gemini API request failed.";


                return res.status(500).json({

                    success:
                        false,

                    error:
                        apiError,

                    reply:
                        "Sorry friend, Viggo AI could not connect to the AI model."

                });

            }


            /* =================================================
               GET AI RESPONSE
            ================================================= */

            let reply = "";


            const candidates =
                Array.isArray(
                    geminiData?.candidates
                )
                    ? geminiData.candidates
                    : [];


            for (
                const candidate
                of candidates
            ) {

                const candidateParts =
                    candidate
                        ?.content
                        ?.parts;


                if (
                    !Array.isArray(
                        candidateParts
                    )
                ) {

                    continue;

                }


                for (
                    const part
                    of candidateParts
                ) {

                    if (
                        typeof part?.text ===
                        "string"
                    ) {

                        reply +=
                            part.text;

                    }

                }

            }


            reply =
                reply.trim();


            /* =================================================
               EMPTY RESPONSE
            ================================================= */

            if (
                !reply
            ) {

                reply =
                    "Sorry friend, I couldn't generate a response.";

            }


            /* =================================================
               SUCCESS
            ================================================= */

            console.log(
                "Viggo AI response generated."
            );


            console.log(
                "---------------------------------"
            );


            return res.status(200).json({

                success:
                    true,

                reply:
                    reply,

                response:
                    reply,

                text:
                    reply,

                model:
                    MODEL

            });

        } catch (error) {

            console.error(
                "================================="
            );


            console.error(
                "VIGGO SERVER ERROR"
            );


            console.error(
                error
            );


            console.error(
                "================================="
            );


            return res.status(500).json({

                success:
                    false,

                error:
                    error?.message ||
                    "Internal server error.",

                reply:
                    "Sorry friend, I couldn't connect to Viggo AI right now."

            });

        }

    }
);


/* =====================================================
   404
===================================================== */

app.use(
    (req, res) => {

        res.status(404).json({

            success:
                false,

            error:
                "Route not found.",

            path:
                req.originalUrl

        });

    }
);


/* =====================================================
   GLOBAL ERROR
===================================================== */

app.use(
    (
        error,
        req,
        res,
        next
    ) => {

        console.error(
            "Global error:",
            error
        );


        if (
            res.headersSent
        ) {

            return next(
                error
            );

        }


        return res.status(500).json({

            success:
                false,

            error:
                "Internal server error.",

            reply:
                "Sorry friend, something went wrong on the Viggo AI server."

        });

    }
);


/* =====================================================
   START SERVER
===================================================== */

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "================================="
        );


        console.log(
            "VIGGO AI SERVER ONLINE"
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
            GEMINI_API_KEY
                ? "CONFIGURED"
                : "MISSING"
        );


        console.log(
            "CHAT ENDPOINT:"
        );


        console.log(
            "/chat"
        );


        console.log(
            "HEALTH ENDPOINT:"
        );


        console.log(
            "/health"
        );


        console.log(
            "ACCURACY MODE: ENABLED"
        );


        console.log(
            "INDIA DATE/TIME: ENABLED"
        );


        console.log(
            "DIRECT DATE ANSWER: ENABLED"
        );


        console.log(
            "DIRECT TIME ANSWER: ENABLED"
        );


        console.log(
            "DIRECT TOMORROW ANSWER: ENABLED"
        );


        console.log(
            "DIRECT YESTERDAY ANSWER: ENABLED"
        );


        console.log(
            "GEMINI DATE GUESSING: BLOCKED"
        );


        console.log(
            "TIMEZONE: Asia/Kolkata"
        );


        console.log(
            "================================="
        );

    }
);
