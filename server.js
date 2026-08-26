```javascript
"use strict";

/* =====================================================
   VIGGO AI - SERVER.JS
   FULL CORRECTED VERSION

   FEATURES:
   - Gemini AI
   - Strict accuracy instructions
   - India Date / Time
   - Strict Current Date detection
   - Strict Current Time detection
   - Tomorrow / Yesterday
   - File / Image upload
   - /chat
   - /health
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
   NORMALIZE USER TEXT
===================================================== */

function normalizeText(message) {

    return String(message || "")
        .toLowerCase()
        .replace(/[?!.,;:'"]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

}


/* =====================================================
   STRICT CURRENT DATE QUESTION
===================================================== */

function isDateQuestion(message) {

    const text =
        normalizeText(message);


    const exactPatterns = [

        /^today$/,
        /^today s date$/,
        /^what is today s date$/,
        /^what is todays date$/,
        /^what s today s date$/,
        /^what date is it$/,
        /^what is the date today$/,
        /^what is today date$/,
        /^current date$/,
        /^what is the current date$/,
        /^tell me today s date$/,
        /^tell me todays date$/,
        /^tell me the current date$/,
        /^date today$/,
        /^today date$/,
        /^what day is today$/,
        /^what is today$/,

        /^இன்று$/,
        /^இன்றைய தேதி$/,
        /^இன்று தேதி என்ன$/,
        /^இன்றைய தேதி என்ன$/,
        /^தேதி என்ன$/,
        /^இன்று என்ன தேதி$/,
        /^இன்று என்ன நாள்$/,
        /^இன்றைக்கு என்ன தேதி$/,
        /^இப்போ என்ன தேதி$/,
        /^இப்போது என்ன தேதி$/

    ];


    return exactPatterns.some(
        pattern =>
            pattern.test(text)
    );

}


/* =====================================================
   STRICT CURRENT TIME QUESTION
===================================================== */

function isTimeQuestion(message) {

    const text =
        normalizeText(message);


    const exactPatterns = [

        /^current time$/,
        /^what time is it$/,
        /^what is the time$/,
        /^what is the current time$/,
        /^time now$/,
        /^what time now$/,
        /^tell me the time$/,
        /^tell me current time$/,
        /^india time$/,
        /^what is india time$/,
        /^what time is it in india$/,
        /^current india time$/,

        /^இப்போது மணி என்ன$/,
        /^இப்போ மணி என்ன$/,
        /^நேரம் என்ன$/,
        /^இப்போ நேரம் என்ன$/,
        /^இப்போது நேரம் என்ன$/,
        /^தற்போதைய நேரம் என்ன$/,
        /^இந்திய நேரம் என்ன$/

    ];


    return exactPatterns.some(
        pattern =>
            pattern.test(text)
    );

}


/* =====================================================
   STRICT TOMORROW QUESTION
===================================================== */

function isTomorrowQuestion(message) {

    const text =
        normalizeText(message);


    const exactPatterns = [

        /^tomorrow$/,
        /^what is tomorrow$/,
        /^what day is tomorrow$/,
        /^what date is tomorrow$/,
        /^tomorrow date$/,
        /^tomorrow s date$/,
        /^what is tomorrow s date$/,
        /^what is the date tomorrow$/,

        /^நாளை$/,
        /^நாளைக்கு$/,
        /^நாளை என்ன தேதி$/,
        /^நாளைக்கு என்ன தேதி$/,
        /^நாளை என்ன நாள்$/,
        /^நாளைக்கு என்ன நாள்$/

    ];


    return exactPatterns.some(
        pattern =>
            pattern.test(text)
    );

}


/* =====================================================
   STRICT YESTERDAY QUESTION
===================================================== */

function isYesterdayQuestion(message) {

    const text =
        normalizeText(message);


    const exactPatterns = [

        /^yesterday$/,
        /^what was yesterday$/,
        /^what date was yesterday$/,
        /^what was yesterday s date$/,
        /^yesterday date$/,
        /^yesterday s date$/,
        /^what was the date yesterday$/,

        /^நேற்று$/,
        /^நேற்றைய தேதி$/,
        /^நேற்று என்ன தேதி$/,
        /^நேற்று என்ன நாள்$/,
        /^நேற்றைய தேதி என்ன$/

    ];


    return exactPatterns.some(
        pattern =>
            pattern.test(text)
    );

}


/* =====================================================
   INDIA DATE WITH OFFSET
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

You are Viggo AI.

Your priority is:

ACCURACY > CLARITY > HELPFULNESS.

IMPORTANT ACCURACY RULES:

1. Understand the user's exact question before answering.

2. NEVER invent facts.

3. NEVER guess an answer when you are uncertain.

4. NEVER invent names, numbers, dates, links, sources,
   technical information or statistics.

5. If you do not know something, clearly say that you
   do not know instead of guessing.

6. For mathematics and calculations, carefully calculate
   and verify the result before answering.

7. For technical questions, give correct step-by-step
   explanations when useful.

8. For educational questions, provide accurate definitions,
   formulas, examples and explanations.

9. For multiple-choice questions, identify the correct
   option and explain briefly.

10. If the question is ambiguous, ask for clarification
    instead of assuming.

11. Do not change the meaning of the user's question.

12. Do not claim that you performed an action that you
    did not actually perform.

13. Do not claim to have live internet access unless
    live information is actually available.

14. Information that can change over time must not be
    presented as certainly current unless current
    information is available.

15. CURRENT DATE AND TIME RULE:

    The server-provided India date and time are the
    ONLY authoritative source for the current date
    and current time.

16. NEVER use training knowledge to determine today's
    date or the current time.

17. NEVER guess today's date.

18. NEVER guess the current time.

19. If the server provides a current date/time,
    use that information exactly.

20. Current timezone is:

    Asia/Kolkata

21. If the user asks a date/time question and the
    server information is available, use the server
    information.

22. If the user asks in Tamil, answer primarily in Tamil.

23. If the user asks in English, answer primarily in English.

24. If the user mixes Tamil and English, naturally use
    Tamil + English.

25. Keep simple questions simple.

26. Give detailed answers when the user asks for details.

27. Never replace a known correct answer with a guess.

28. If there is insufficient information, say so clearly.

29. Do not use old dates from model training knowledge
    for current-date questions.

30. Accuracy is more important than sounding confident.

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

                    success:
                        false,

                    error:
                        "Message is required.",

                    reply:
                        "Please enter a message."

                });

            }


            /* =================================================
               DIRECT CURRENT DATE
               NEVER SEND TO GEMINI
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
                        "server-date",

                    timezone:
                        "Asia/Kolkata"

                });

            }


            /* =================================================
               DIRECT CURRENT TIME
               NEVER SEND TO GEMINI
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
                        "server-time",

                    timezone:
                        "Asia/Kolkata"

                });

            }


            /* =================================================
               DIRECT TOMORROW
               NEVER SEND TO GEMINI
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
                        "server-date",

                    timezone:
                        "Asia/Kolkata"

                });

            }


            /* =================================================
               DIRECT YESTERDAY
               NEVER SEND TO GEMINI
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
                        "server-date",

                    timezone:
                        "Asia/Kolkata"

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

                    success:
                        false,

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

=====================================================
AUTHORITATIVE DATE/TIME RULE
=====================================================

The server date/time above is authoritative.

Do NOT replace it with a date or time from
your training knowledge.

Do NOT guess.

If the user asks for the current date or time,
use the server-provided information.

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
                        0.1,

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
            "ACCURACY MODE: STRICT"
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
            "DATE/TIME GUESSING: DISABLED"
        );


        console.log(
            "TIMEZONE: Asia/Kolkata"
        );


        console.log(
            "================================="
        );

    }
);
```
