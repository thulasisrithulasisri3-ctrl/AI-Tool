"use strict";

/* =====================================================
   VIGGO AI - SERVER.JS
   FULL VERSION
   ACCURACY + CURRENT DATE/TIME FIX
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
   CURRENT INDIA DATE & TIME
===================================================== */

function getCurrentIndiaDateTime() {

    return new Date().toLocaleString(
        "en-IN",
        {
            timeZone: "Asia/Kolkata",
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        }
    );

}


/* =====================================================
   CURRENT INDIA DATE
===================================================== */

function getCurrentIndiaDate() {

    return new Date().toLocaleDateString(
        "en-IN",
        {
            timeZone: "Asia/Kolkata",
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );

}


/* =====================================================
   CURRENT INDIA TIME
===================================================== */

function getCurrentIndiaTime() {

    return new Date().toLocaleTimeString(
        "en-IN",
        {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        }
    );

}


/* =====================================================
   DATE QUESTION DETECTOR
===================================================== */

function isDateQuestion(message) {

    const text =
        String(message || "").toLowerCase();

    return (
        /today/.test(text) ||
        /today's date/.test(text) ||
        /current date/.test(text) ||
        /what date/.test(text) ||
        /what day is today/.test(text) ||
        /date today/.test(text) ||
        /இன்று/.test(text) ||
        /இன்றைய தேதி/.test(text) ||
        /தேதி என்ன/.test(text) ||
        /இன்று தேதி/.test(text)
    );

}


/* =====================================================
   TIME QUESTION DETECTOR
===================================================== */

function isTimeQuestion(message) {

    const text =
        String(message || "").toLowerCase();

    return (
        /current time/.test(text) ||
        /what time is it/.test(text) ||
        /time now/.test(text) ||
        /what is the time/.test(text) ||
        /india time/.test(text) ||
        /இப்போது மணி என்ன/.test(text) ||
        /நேரம் என்ன/.test(text) ||
        /இப்போ நேரம் என்ன/.test(text)
    );

}


/* =====================================================
   TOMORROW QUESTION DETECTOR
===================================================== */

function isTomorrowQuestion(message) {

    const text =
        String(message || "").toLowerCase();

    return (
        /tomorrow/.test(text) ||
        /நாளை/.test(text) ||
        /நாளைக்கு/.test(text)
    );

}


/* =====================================================
   YESTERDAY QUESTION DETECTOR
===================================================== */

function isYesterdayQuestion(message) {

    const text =
        String(message || "").toLowerCase();

    return (
        /yesterday/.test(text) ||
        /நேற்று/.test(text) ||
        /நேற்றைய/.test(text)
    );

}


/* =====================================================
   GET INDIA DATE WITH OFFSET
===================================================== */

function getIndiaDateWithOffset(days) {

    const now =
        new Date();

    const indiaDateString =
        now.toLocaleString(
            "en-US",
            {
                timeZone: "Asia/Kolkata"
            }
        );

    const indiaDate =
        new Date(
            indiaDateString
        );

    indiaDate.setDate(
        indiaDate.getDate() + days
    );

    return indiaDate.toLocaleDateString(
        "en-IN",
        {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );

}


/* =====================================================
   VIGGO AI SYSTEM INSTRUCTION
===================================================== */

const VIGGO_SYSTEM_INSTRUCTION = `
You are Viggo AI, a helpful, accurate and friendly AI assistant.

IMPORTANT RULES:

1. Always understand the user's question before answering.

2. Give accurate, useful and direct answers.

3. NEVER invent facts, names, numbers, dates, links,
   sources or technical information.

4. If you are not certain about something, clearly say
   that you are not certain instead of making up an answer.

5. For mathematics, calculations, conversions and numerical
   problems, carefully verify the calculation before answering.

6. For technical questions, explain the answer clearly
   and step-by-step when useful.

7. If the user asks a simple question, keep the answer simple.

8. If the user asks for a detailed explanation, provide
   a structured and detailed explanation.

9. If the user asks in Tamil, answer primarily in Tamil.

10. If the user asks in English, answer primarily in English.

11. If the user mixes Tamil and English, naturally use
    Tamil + English as appropriate.

12. Do not claim that you performed an action that you
    did not actually perform.

13. Do not pretend to have live internet access unless
    live information is actually available.

14. When information may have changed over time, clearly
    say that it may need verification.

15. For educational questions, give correct definitions,
    formulas, examples and steps when appropriate.

16. For multiple-choice questions, identify the correct
    option and briefly explain why.

17. If the user's question is ambiguous, ask a short
    clarification instead of guessing.

18. Always prioritize correctness over creativity.

19. Do not change the meaning of the user's question.

20. Be friendly, natural and respectful.

21. Never guess the current date or time.

22. Current date and time must use the server-provided
    India date/time information.

23. The current timezone is Asia/Kolkata.

24. If the user asks about a current date or time,
    use the server information provided with the request.

25. Do not use old dates from model training knowledge
    for current date questions.

Your main goal is:

ACCURACY + CLARITY + HELPFULNESS.
`;


/* =====================================================
   HOME
===================================================== */

app.get(
    "/",
    (req, res) => {

        res.status(200).json({

            status: "online",

            service:
                "Viggo AI Server",

            model:
                MODEL,

            apiConfigured:
                Boolean(
                    GEMINI_API_KEY
                ),

            timezone:
                "Asia/Kolkata",

            currentDate:
                getCurrentIndiaDate(),

            currentTime:
                getCurrentIndiaTime()

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

            status: "ok",

            service:
                "Viggo AI",

            model:
                MODEL,

            apiConfigured:
                Boolean(
                    GEMINI_API_KEY
                ),

            timezone:
                "Asia/Kolkata",

            currentDate:
                getCurrentIndiaDate(),

            currentTime:
                getCurrentIndiaTime(),

            currentDateTime:
                getCurrentIndiaDateTime(),

            time:
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

                    success: false,

                    error:
                        "Message is required.",

                    reply:
                        "Please enter a message."

                });

            }


            /* =================================================
               DIRECT CURRENT DATE ANSWER
            ================================================= */

            if (
                userMessage &&
                isDateQuestion(
                    userMessage
                )
            ) {

                const currentDate =
                    getCurrentIndiaDate();


                console.log(
                    "DIRECT DATE RESPONSE:",
                    currentDate
                );


                return res.status(200).json({

                    success:
                        true,

                    reply:
                        `Today is ${currentDate}.`,

                    response:
                        `Today is ${currentDate}.`,

                    text:
                        `Today is ${currentDate}.`,

                    model:
                        "server-date"

                });

            }


            /* =================================================
               DIRECT CURRENT TIME ANSWER
            ================================================= */

            if (
                userMessage &&
                isTimeQuestion(
                    userMessage
                )
            ) {

                const currentTime =
                    getCurrentIndiaTime();


                console.log(
                    "DIRECT TIME RESPONSE:",
                    currentTime
                );


                return res.status(200).json({

                    success:
                        true,

                    reply:
                        `The current time in India is ${currentTime}.`,

                    response:
                        `The current time in India is ${currentTime}.`,

                    text:
                        `The current time in India is ${currentTime}.`,

                    model:
                        "server-time"

                });

            }


            /* =================================================
               DIRECT TOMORROW ANSWER
            ================================================= */

            if (
                userMessage &&
                isTomorrowQuestion(
                    userMessage
                )
            ) {

                const tomorrow =
                    getIndiaDateWithOffset(
                        1
                    );


                console.log(
                    "DIRECT TOMORROW RESPONSE:",
                    tomorrow
                );


                return res.status(200).json({

                    success:
                        true,

                    reply:
                        `Tomorrow is ${tomorrow}.`,

                    response:
                        `Tomorrow is ${tomorrow}.`,

                    text:
                        `Tomorrow is ${tomorrow}.`,

                    model:
                        "server-date"

                });

            }


            /* =================================================
               DIRECT YESTERDAY ANSWER
            ================================================= */

            if (
                userMessage &&
                isYesterdayQuestion(
                    userMessage
                )
            ) {

                const yesterday =
                    getIndiaDateWithOffset(
                        -1
                    );


                console.log(
                    "DIRECT YESTERDAY RESPONSE:",
                    yesterday
                );


                return res.status(200).json({

                    success:
                        true,

                    reply:
                        `Yesterday was ${yesterday}.`,

                    response:
                        `Yesterday was ${yesterday}.`,

                    text:
                        `Yesterday was ${yesterday}.`,

                    model:
                        "server-date"

                });

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

                    success: false,

                    error:
                        "Gemini API key is not configured.",

                    reply:
                        "Sorry friend, the Viggo AI API key is not configured on the server."

                });

            }


            /* =================================================
               CURRENT INDIA DATE/TIME
            ================================================= */

            const currentIndiaDate =
                getCurrentIndiaDate();


            const currentIndiaDateTime =
                getCurrentIndiaDateTime();


            const currentIndiaTime =
                getCurrentIndiaTime();


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

                    success: false,

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
Asia/Kolkata (India)

IMPORTANT:
The server-provided date and time above are authoritative
for current date/time questions.
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
                        0.25,

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

                    success: false,

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
            "TIMEZONE: Asia/Kolkata"
        );


        console.log(
            "================================="
        );

    }
);
