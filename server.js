"use strict";

/* =====================================================
   VIGGO AI - SERVER.JS
   FULL CORRECTED VERSION

   FEATURES:
   - Accurate current date/time
   - User timezone support
   - Language support
   - No old 2024 date for current-date questions
   - Direct server date/time answers
   - Gemini AI for normal questions
   - Image / video / file support
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
   DEFAULT TIMEZONE
===================================================== */

const DEFAULT_TIMEZONE =
    "Asia/Kolkata";


/* =====================================================
   SUPPORTED TIMEZONES
===================================================== */

const SUPPORTED_TIMEZONES = new Set([

    "Asia/Kolkata",

    "Asia/Tokyo",
    "Asia/Seoul",
    "Asia/Shanghai",
    "Asia/Hong_Kong",
    "Asia/Singapore",
    "Asia/Bangkok",
    "Asia/Jakarta",
    "Asia/Kuala_Lumpur",
    "Asia/Manila",
    "Asia/Dhaka",
    "Asia/Kathmandu",
    "Asia/Colombo",
    "Asia/Karachi",
    "Asia/Dubai",
    "Asia/Riyadh",
    "Asia/Jerusalem",

    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Madrid",
    "Europe/Rome",
    "Europe/Amsterdam",
    "Europe/Brussels",
    "Europe/Stockholm",
    "Europe/Copenhagen",
    "Europe/Helsinki",
    "Europe/Oslo",
    "Europe/Athens",
    "Europe/Warsaw",
    "Europe/Istanbul",
    "Europe/Moscow",

    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Toronto",
    "America/Vancouver",
    "America/Mexico_City",
    "America/Sao_Paulo",

    "Australia/Sydney",
    "Australia/Melbourne",
    "Australia/Perth",

    "Pacific/Auckland",

    "Africa/Cairo",
    "Africa/Johannesburg",
    "Africa/Nairobi"

]);


/* =====================================================
   TIMEZONE VALIDATOR
===================================================== */

function getValidTimezone(
    timezone
) {

    const value =
        String(
            timezone || ""
        ).trim();


    if (
        !value
    ) {

        return DEFAULT_TIMEZONE;

    }


    if (
        SUPPORTED_TIMEZONES.has(
            value
        )
    ) {

        return value;

    }


    /*
     * Extra validation.
     *
     * This allows valid IANA timezones
     * which are not manually listed above.
     */

    try {

        new Intl.DateTimeFormat(
            "en-US",
            {
                timeZone: value
            }
        ).format(
            new Date()
        );

        return value;

    } catch {

        return DEFAULT_TIMEZONE;

    }
}


/* =====================================================
   CURRENT DATE/TIME FOR TIMEZONE
===================================================== */

function getCurrentDateTime(
    timezone
) {

    const validTimezone =
        getValidTimezone(
            timezone
        );


    return new Date().toLocaleString(
        "en-IN",
        {
            timeZone:
                validTimezone,

            weekday:
                "long",

            day:
                "2-digit",

            month:
                "long",

            year:
                "numeric",

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
}


/* =====================================================
   CURRENT DATE
===================================================== */

function getCurrentDate(
    timezone
) {

    const validTimezone =
        getValidTimezone(
            timezone
        );


    return new Date().toLocaleDateString(
        "en-IN",
        {
            timeZone:
                validTimezone,

            weekday:
                "long",

            day:
                "2-digit",

            month:
                "long",

            year:
                "numeric"
        }
    );
}


/* =====================================================
   CURRENT TIME
===================================================== */

function getCurrentTime(
    timezone
) {

    const validTimezone =
        getValidTimezone(
            timezone
        );


    return new Date().toLocaleTimeString(
        "en-IN",
        {
            timeZone:
                validTimezone,

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
}


/* =====================================================
   GET DATE WITH OFFSET
===================================================== */

function getDateWithOffset(
    timezone,
    days
) {

    const validTimezone =
        getValidTimezone(
            timezone
        );


    /*
     * Get today's date in the requested timezone.
     */

    const formatter =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone:
                    validTimezone,

                year:
                    "numeric",

                month:
                    "2-digit",

                day:
                    "2-digit"
            }
        );


    const parts =
        formatter.formatToParts(
            new Date()
        );


    let year = "";
    let month = "";
    let day = "";


    parts.forEach(
        part => {

            if (
                part.type ===
                "year"
            ) {

                year =
                    part.value;

            }

            if (
                part.type ===
                "month"
            ) {

                month =
                    part.value;

            }

            if (
                part.type ===
                "day"
            ) {

                day =
                    part.value;

            }

        }
    );


    /*
     * Use UTC to avoid server-local timezone
     * affecting the calculation.
     */

    const date =
        new Date(
            `${year}-${month}-${day}T00:00:00Z`
        );


    date.setUTCDate(
        date.getUTCDate() +
        Number(days || 0)
    );


    return new Intl.DateTimeFormat(
        "en-IN",
        {
            timeZone:
                "UTC",

            weekday:
                "long",

            day:
                "2-digit",

            month:
                "long",

            year:
                "numeric"
        }
    ).format(
        date
    );
}


/* =====================================================
   DATE QUESTION DETECTOR
===================================================== */

function isDateQuestion(
    message
) {

    const text =
        String(
            message || ""
        )
            .toLowerCase()
            .trim();


    return (

        /\btoday\b/.test(text) ||

        /\btoday's date\b/.test(text) ||

        /\bcurrent date\b/.test(text) ||

        /\bwhat date\b/.test(text) ||

        /\bwhat is today's date\b/.test(text) ||

        /\bwhat is the date today\b/.test(text) ||

        /\bdate today\b/.test(text) ||

        /\bwhat day is today\b/.test(text) ||

        /today date/.test(text) ||

        /இன்று/.test(text) ||

        /இன்றைய தேதி/.test(text) ||

        /இன்று தேதி/.test(text) ||

        /தேதி என்ன/.test(text) ||

        /இன்றைய நாள்/.test(text)

    );

}


/* =====================================================
   TIME QUESTION DETECTOR
===================================================== */

function isTimeQuestion(
    message
) {

    const text =
        String(
            message || ""
        )
            .toLowerCase()
            .trim();


    return (

        /\bcurrent time\b/.test(text) ||

        /\bwhat time is it\b/.test(text) ||

        /\bwhat is the time\b/.test(text) ||

        /\btime now\b/.test(text) ||

        /\btime right now\b/.test(text) ||

        /\bindia time\b/.test(text) ||

        /\bcurrent time in\b/.test(text) ||

        /இப்போது மணி என்ன/.test(text) ||

        /இப்போ மணி என்ன/.test(text) ||

        /நேரம் என்ன/.test(text) ||

        /இப்போ நேரம் என்ன/.test(text)

    );

}


/* =====================================================
   TOMORROW QUESTION
===================================================== */

function isTomorrowQuestion(
    message
) {

    const text =
        String(
            message || ""
        )
            .toLowerCase()
            .trim();


    return (

        /\btomorrow\b/.test(text) ||

        /நாளை/.test(text) ||

        /நாளைக்கு/.test(text)

    );

}


/* =====================================================
   YESTERDAY QUESTION
===================================================== */

function isYesterdayQuestion(
    message
) {

    const text =
        String(
            message || ""
        )
            .toLowerCase()
            .trim();


    return (

        /\byesterday\b/.test(text) ||

        /நேற்று/.test(text) ||

        /நேற்றைய/.test(text)

    );

}


/* =====================================================
   LANGUAGE NAME
===================================================== */

function getLanguageName(
    language
) {

    const languages = {

        "en-IN":
            "English",

        "ta-IN":
            "Tamil",

        "hi-IN":
            "Hindi",

        "te-IN":
            "Telugu",

        "kn-IN":
            "Kannada",

        "ml-IN":
            "Malayalam",

        "bn-IN":
            "Bengali",

        "mr-IN":
            "Marathi",

        "gu-IN":
            "Gujarati",

        "pa-IN":
            "Punjabi",

        "ur-IN":
            "Urdu",

        "or-IN":
            "Odia",

        "as-IN":
            "Assamese",

        "fr-FR":
            "French",

        "de-DE":
            "German",

        "es-ES":
            "Spanish",

        "it-IT":
            "Italian",

        "pt-BR":
            "Portuguese",

        "ru-RU":
            "Russian",

        "ja-JP":
            "Japanese",

        "ko-KR":
            "Korean",

        "zh-CN":
            "Chinese",

        "ar-SA":
            "Arabic",

        "tr-TR":
            "Turkish",

        "nl-NL":
            "Dutch",

        "pl-PL":
            "Polish",

        "sv-SE":
            "Swedish",

        "da-DK":
            "Danish",

        "fi-FI":
            "Finnish",

        "no-NO":
            "Norwegian",

        "el-GR":
            "Greek",

        "he-IL":
            "Hebrew",

        "th-TH":
            "Thai",

        "vi-VN":
            "Vietnamese",

        "id-ID":
            "Indonesian",

        "ms-MY":
            "Malay"

    };


    return (
        languages[
            language
        ] ||
        "English"
    );
}


/* =====================================================
   VIGGO SYSTEM INSTRUCTION
===================================================== */

const VIGGO_SYSTEM_INSTRUCTION = `

You are Viggo AI.

You are a helpful, accurate and friendly AI assistant.

IMPORTANT ACCURACY RULES:

1. Understand the user's question before answering.

2. Never invent facts.

3. Never invent dates.

4. Never invent times.

5. Never invent names, numbers, links or sources.

6. If you do not know something, clearly say so.

7. For calculations, carefully verify the result.

8. For technical questions, explain clearly.

9. Simple questions should receive simple answers.

10. Detailed questions should receive structured answers.

11. Answer in the user's selected language when possible.

12. If the user mixes Tamil and English, naturally use Tamil + English.

13. Never claim to have performed an action that you did not perform.

14. Do not pretend to have live internet access.

15. Information that may change over time should be treated carefully.

16. Educational answers must be accurate.

17. For MCQs, identify the correct option and explain briefly.

18. Do not guess ambiguous questions.

19. Prioritize correctness over creativity.

20. Do not change the meaning of the user's question.

21. Never use an old training date as today's date.

22. CURRENT DATE/TIME PROVIDED BY THE SERVER IS AUTHORITATIVE.

23. The user's selected timezone is authoritative for
    their current date/time request.

24. NEVER answer a current-date question using a date
    from model training knowledge.

25. NEVER say May 19, 2024 or May 20, 2024 as today's
    date unless the server actually provides that date.

26. For current date/time questions, use the SERVER DATE/TIME
    information provided below.

27. Current timezone:

    {{TIMEZONE}}

28. Selected language:

    {{LANGUAGE}}

29. Current date:

    {{CURRENT_DATE}}

30. Current time:

    {{CURRENT_TIME}}

31. Current date and time:

    {{CURRENT_DATE_TIME}}

IMPORTANT:

The server date/time values above are authoritative.
Do not replace them with an older date from your knowledge.

`;


/* =====================================================
   HOME
===================================================== */

app.get(
    "/",
    (req, res) => {

        const timezone =
            DEFAULT_TIMEZONE;


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
                timezone,

            currentDate:
                getCurrentDate(
                    timezone
                ),

            currentTime:
                getCurrentTime(
                    timezone
                ),

            currentDateTime:
                getCurrentDateTime(
                    timezone
                )

        });

    }
);


/* =====================================================
   HEALTH
===================================================== */

app.get(
    "/health",
    (req, res) => {

        const timezone =
            DEFAULT_TIMEZONE;


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
                timezone,

            currentDate:
                getCurrentDate(
                    timezone
                ),

            currentTime:
                getCurrentTime(
                    timezone
                ),

            currentDateTime:
                getCurrentDateTime(
                    timezone
                ),

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
    async (
        req,
        res
    ) => {

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
                body.file ||
                null;


            /* =================================================
               LANGUAGE
            ================================================= */

            const language =
                String(
                    body.language ||
                    "en-IN"
                ).trim();


            const languageName =
                getLanguageName(
                    language
                );


            /* =================================================
               TIMEZONE
            ================================================= */

            const timezone =
                getValidTimezone(
                    body.timezone ||
                    DEFAULT_TIMEZONE
                );


            console.log(
                "Message:",
                userMessage
            );

            console.log(
                "Language:",
                language,
                "(" +
                languageName +
                ")"
            );

            console.log(
                "Timezone:",
                timezone
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
               CURRENT SERVER DATE/TIME
            ================================================= */

            const currentDate =
                getCurrentDate(
                    timezone
                );


            const currentTime =
                getCurrentTime(
                    timezone
                );


            const currentDateTime =
                getCurrentDateTime(
                    timezone
                );


            console.log(
                "CURRENT DATE:",
                currentDate
            );

            console.log(
                "CURRENT TIME:",
                currentTime
            );

            console.log(
                "CURRENT DATETIME:",
                currentDateTime
            );


            /* =================================================
               DIRECT DATE ANSWER
            ================================================= */

            if (
                userMessage &&
                isDateQuestion(
                    userMessage
                )
            ) {

                console.log(
                    "DIRECT CURRENT DATE RESPONSE"
                );


                let reply;


                if (
                    language ===
                    "ta-IN"
                ) {

                    reply =
                        `இன்றைய தேதி ${currentDate}.`;

                } else {

                    reply =
                        `Today is ${currentDate}.`;

                }


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
                        "server-date",

                    language:
                        language,

                    timezone:
                        timezone,

                    currentDate:
                        currentDate,

                    currentTime:
                        currentTime,

                    currentDateTime:
                        currentDateTime

                });

            }


            /* =================================================
               DIRECT TIME ANSWER
            ================================================= */

            if (
                userMessage &&
                isTimeQuestion(
                    userMessage
                )
            ) {

                console.log(
                    "DIRECT CURRENT TIME RESPONSE"
                );


                let reply;


                if (
                    language ===
                    "ta-IN"
                ) {

                    reply =
                        `தற்போதைய நேரம் ${currentTime}.`;

                } else {

                    reply =
                        `The current time is ${currentTime}.`;

                }


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
                        "server-time",

                    language:
                        language,

                    timezone:
                        timezone,

                    currentDate:
                        currentDate,

                    currentTime:
                        currentTime,

                    currentDateTime:
                        currentDateTime

                });

            }


            /* =================================================
               DIRECT TOMORROW
            ================================================= */

            if (
                userMessage &&
                isTomorrowQuestion(
                    userMessage
                )
            ) {

                const tomorrow =
                    getDateWithOffset(
                        timezone,
                        1
                    );


                console.log(
                    "DIRECT TOMORROW:",
                    tomorrow
                );


                let reply;


                if (
                    language ===
                    "ta-IN"
                ) {

                    reply =
                        `நாளை ${tomorrow}.`;

                } else {

                    reply =
                        `Tomorrow is ${tomorrow}.`;

                }


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
                        "server-date",

                    language:
                        language,

                    timezone:
                        timezone

                });

            }


            /* =================================================
               DIRECT YESTERDAY
            ================================================= */

            if (
                userMessage &&
                isYesterdayQuestion(
                    userMessage
                )
            ) {

                const yesterday =
                    getDateWithOffset(
                        timezone,
                        -1
                    );


                console.log(
                    "DIRECT YESTERDAY:",
                    yesterday
                );


                let reply;


                if (
                    language ===
                    "ta-IN"
                ) {

                    reply =
                        `நேற்று ${yesterday}.`;

                } else {

                    reply =
                        `Yesterday was ${yesterday}.`;

                }


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
                        "server-date",

                    language:
                        language,

                    timezone:
                        timezone

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
               BUILD SYSTEM INSTRUCTION
            ================================================= */

            const dynamicSystemInstruction =
                VIGGO_SYSTEM_INSTRUCTION

                    .replace(
                        "{{TIMEZONE}}",
                        timezone
                    )

                    .replace(
                        "{{LANGUAGE}}",
                        languageName +
                        " (" +
                        language +
                        ")"
                    )

                    .replace(
                        "{{CURRENT_DATE}}",
                        currentDate
                    )

                    .replace(
                        "{{CURRENT_TIME}}",
                        currentTime
                    )

                    .replace(
                        "{{CURRENT_DATE_TIME}}",
                        currentDateTime
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
               REQUEST BODY
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

            console.log(
                "Timezone:",
                timezone
            );


            /* =================================================
               GEMINI REQUEST
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
                    MODEL,

                language:
                    language,

                timezone:
                    timezone

            });

        } catch (
            error
        ) {

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
    (
        req,
        res
    ) => {

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
            "CURRENT DATE/TIME: ENABLED"
        );

        console.log(
            "USER TIMEZONE: ENABLED"
        );

        console.log(
            "LANGUAGE: ENABLED"
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
            "DEFAULT TIMEZONE:",
            DEFAULT_TIMEZONE
        );

        console.log(
            "================================="
        );

    }
);
