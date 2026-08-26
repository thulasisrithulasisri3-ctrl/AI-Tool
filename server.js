"use strict";

/* =====================================================
   VIGGO AI - SERVER.JS
   FULL CORRECTED VERSION
   CURRENT DATE/TIME + MULTI-LANGUAGE + GEMINI
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
        methods: ["GET", "POST", "OPTIONS"],
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
   COUNTRY / LANGUAGE TIMEZONE MAP
===================================================== */

const LANGUAGE_TIMEZONES = {

    "en-IN": "Asia/Kolkata",
    "ta-IN": "Asia/Kolkata",
    "hi-IN": "Asia/Kolkata",
    "te-IN": "Asia/Kolkata",
    "kn-IN": "Asia/Kolkata",
    "ml-IN": "Asia/Kolkata",
    "bn-IN": "Asia/Kolkata",
    "mr-IN": "Asia/Kolkata",
    "gu-IN": "Asia/Kolkata",
    "pa-IN": "Asia/Kolkata",
    "ur-IN": "Asia/Kolkata",
    "or-IN": "Asia/Kolkata",
    "as-IN": "Asia/Kolkata",

    "fr-FR": "Europe/Paris",
    "de-DE": "Europe/Berlin",
    "es-ES": "Europe/Madrid",
    "it-IT": "Europe/Rome",
    "pt-BR": "America/Sao_Paulo",
    "ru-RU": "Europe/Moscow",
    "ja-JP": "Asia/Tokyo",
    "ko-KR": "Asia/Seoul",
    "zh-CN": "Asia/Shanghai",
    "ar-SA": "Asia/Riyadh",
    "tr-TR": "Europe/Istanbul",
    "nl-NL": "Europe/Amsterdam",
    "pl-PL": "Europe/Warsaw",
    "sv-SE": "Europe/Stockholm",
    "da-DK": "Europe/Copenhagen",
    "fi-FI": "Europe/Helsinki",
    "no-NO": "Europe/Oslo",
    "el-GR": "Europe/Athens",
    "he-IL": "Asia/Jerusalem",
    "th-TH": "Asia/Bangkok",
    "vi-VN": "Asia/Ho_Chi_Minh",
    "id-ID": "Asia/Jakarta",
    "ms-MY": "Asia/Kuala_Lumpur"
};

/* =====================================================
   LANGUAGE LOCALE MAP
===================================================== */

const LANGUAGE_LOCALES = {

    "en-IN": "en-IN",
    "ta-IN": "ta-IN",
    "hi-IN": "hi-IN",
    "te-IN": "te-IN",
    "kn-IN": "kn-IN",
    "ml-IN": "ml-IN",
    "bn-IN": "bn-IN",
    "mr-IN": "mr-IN",
    "gu-IN": "gu-IN",
    "pa-IN": "pa-IN",
    "ur-IN": "ur-IN",
    "or-IN": "or-IN",
    "as-IN": "as-IN",

    "fr-FR": "fr-FR",
    "de-DE": "de-DE",
    "es-ES": "es-ES",
    "it-IT": "it-IT",
    "pt-BR": "pt-BR",
    "ru-RU": "ru-RU",
    "ja-JP": "ja-JP",
    "ko-KR": "ko-KR",
    "zh-CN": "zh-CN",
    "ar-SA": "ar-SA",
    "tr-TR": "tr-TR",
    "nl-NL": "nl-NL",
    "pl-PL": "pl-PL",
    "sv-SE": "sv-SE",
    "da-DK": "da-DK",
    "fi-FI": "fi-FI",
    "no-NO": "no-NO",
    "el-GR": "el-GR",
    "he-IL": "he-IL",
    "th-TH": "th-TH",
    "vi-VN": "vi-VN",
    "id-ID": "id-ID",
    "ms-MY": "ms-MY"
};

/* =====================================================
   SAFE LANGUAGE
===================================================== */

function getLanguage(body) {

    const language =
        typeof body?.language === "string"
            ? body.language.trim()
            : "en-IN";

    return LANGUAGE_TIMEZONES[language]
        ? language
        : "en-IN";
}

/* =====================================================
   GET CURRENT DATE/TIME
===================================================== */

function getDateTime(
    timezone,
    locale
) {

    const now =
        new Date();

    const formatter =
        new Intl.DateTimeFormat(
            locale,
            {
                timeZone: timezone,
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

    return formatter.format(now);
}

/* =====================================================
   DATE ONLY
===================================================== */

function getDateOnly(
    timezone,
    locale
) {

    return new Intl.DateTimeFormat(
        locale,
        {
            timeZone: timezone,
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    ).format(new Date());
}

/* =====================================================
   TIME ONLY
===================================================== */

function getTimeOnly(
    timezone,
    locale
) {

    return new Intl.DateTimeFormat(
        locale,
        {
            timeZone: timezone,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        }
    ).format(new Date());
}

/* =====================================================
   DATE OBJECT FOR OFFSET
===================================================== */

function getDateWithOffset(
    timezone,
    locale,
    days
) {

    const parts =
        new Intl.DateTimeFormat(
            "en-US",
            {
                timeZone: timezone,
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        ).formatToParts(new Date());

    const year =
        Number(
            parts.find(
                p => p.type === "year"
            )?.value
        );

    const month =
        Number(
            parts.find(
                p => p.type === "month"
            )?.value
        );

    const day =
        Number(
            parts.find(
                p => p.type === "day"
            )?.value
        );

    const date =
        new Date(
            Date.UTC(
                year,
                month - 1,
                day
            )
        );

    date.setUTCDate(
        date.getUTCDate() + days
    );

    return new Intl.DateTimeFormat(
        locale,
        {
            timeZone: "UTC",
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    ).format(date);
}

/* =====================================================
   QUESTION DETECTORS
===================================================== */

function isDateQuestion(message) {

    const text =
        String(message || "")
            .toLowerCase()
            .trim();

    return (
        /\btoday\b/.test(text) ||
        /today's date/.test(text) ||
        /current date/.test(text) ||
        /what date/.test(text) ||
        /what day is today/.test(text) ||
        /date today/.test(text) ||
        /what is today's date/.test(text) ||
        /இன்று/.test(text) ||
        /இன்றைய தேதி/.test(text) ||
        /தேதி என்ன/.test(text) ||
        /இன்று தேதி/.test(text)
    );
}

function isTimeQuestion(message) {

    const text =
        String(message || "")
            .toLowerCase()
            .trim();

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

function isTomorrowQuestion(message) {

    const text =
        String(message || "")
            .toLowerCase()
            .trim();

    return (
        /\btomorrow\b/.test(text) ||
        /நாளை/.test(text) ||
        /நாளைக்கு/.test(text)
    );
}

function isYesterdayQuestion(message) {

    const text =
        String(message || "")
            .toLowerCase()
            .trim();

    return (
        /\byesterday\b/.test(text) ||
        /நேற்று/.test(text) ||
        /நேற்றைய/.test(text)
    );
}

/* =====================================================
   SYSTEM INSTRUCTION
===================================================== */

const VIGGO_SYSTEM_INSTRUCTION = `
You are Viggo AI.

You must prioritize:
ACCURACY + CLARITY + HELPFULNESS.

IMPORTANT RULES:

1. Understand the user's exact question.

2. Never invent facts.

3. Never invent dates or times.

4. Never use old training-data dates when answering
   current date or current time questions.

5. Current date/time information supplied by the server
   is authoritative.

6. Always use the user's selected language when possible.

7. If the user asks in Tamil, answer in Tamil.

8. If the user asks in English, answer in English.

9. If the user mixes Tamil and English, respond naturally
   using Tamil + English.

10. For mathematics, carefully verify calculations.

11. For technical questions, explain step by step when useful.

12. If uncertain, clearly say that you are uncertain.

13. Do not claim live internet access unless actually available.

14. Do not change the meaning of the user's question.

15. Give only the most accurate answer you can.

16. Do not state May 19, 2024 or any other old date as
    today's date.

17. The server date/time included in the request is newer
    than model training knowledge and must be trusted.

18. When the user asks "today", use the supplied current
    date for the selected timezone.

19. When the user asks "tomorrow", calculate from the supplied
    current date.

20. When the user asks "yesterday", calculate from the supplied
    current date.
`;

/* =====================================================
   HOME
===================================================== */

app.get(
    "/",
    (req, res) => {

        const timezone =
            "Asia/Kolkata";

        const locale =
            "en-IN";

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

            timezone,

            currentDate:
                getDateOnly(
                    timezone,
                    locale
                ),

            currentTime:
                getTimeOnly(
                    timezone,
                    locale
                ),

            currentDateTime:
                getDateTime(
                    timezone,
                    locale
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
            "Asia/Kolkata";

        const locale =
            "en-IN";

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

            timezone,

            currentDate:
                getDateOnly(
                    timezone,
                    locale
                ),

            currentTime:
                getTimeOnly(
                    timezone,
                    locale
                ),

            currentDateTime:
                getDateTime(
                    timezone,
                    locale
                ),

            serverISOTime:
                new Date().toISOString()
        });
    }
);

/* =====================================================
   CHAT
===================================================== */

app.post(
    "/chat",
    async (req, res) => {

        try {

            console.log(
                "================================="
            );

            console.log(
                "POST /chat"
            );

            const body =
                req.body || {};

            const userMessage =
                typeof body.message === "string"
                    ? body.message.trim()
                    : "";

            const uploadedFile =
                body.file || null;

            const language =
                getLanguage(body);

            const timezone =
                LANGUAGE_TIMEZONES[
                    language
                ];

            const locale =
                LANGUAGE_LOCALES[
                    language
                ];

            console.log(
                "Message:",
                userMessage
            );

            console.log(
                "Language:",
                language
            );

            console.log(
                "Timezone:",
                timezone
            );

            /* =================================================
               VALIDATION
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
               CURRENT DATE/TIME
            ================================================= */

            const currentDate =
                getDateOnly(
                    timezone,
                    locale
                );

            const currentTime =
                getTimeOnly(
                    timezone,
                    locale
                );

            const currentDateTime =
                getDateTime(
                    timezone,
                    locale
                );

            console.log(
                "Current Date:",
                currentDate
            );

            console.log(
                "Current Time:",
                currentTime
            );

            /* =================================================
               DIRECT DATE
            ================================================= */

            if (
                userMessage &&
                isDateQuestion(
                    userMessage
                )
            ) {

                return res.status(200).json({

                    success: true,

                    reply:
                        currentDate,

                    response:
                        currentDate,

                    text:
                        currentDate,

                    model:
                        "server-date",

                    language,

                    timezone
                });
            }

            /* =================================================
               DIRECT TIME
            ================================================= */

            if (
                userMessage &&
                isTimeQuestion(
                    userMessage
                )
            ) {

                return res.status(200).json({

                    success: true,

                    reply:
                        currentTime,

                    response:
                        currentTime,

                    text:
                        currentTime,

                    model:
                        "server-time",

                    language,

                    timezone
                });
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

                const tomorrow =
                    getDateWithOffset(
                        timezone,
                        locale,
                        1
                    );

                return res.status(200).json({

                    success: true,

                    reply:
                        tomorrow,

                    response:
                        tomorrow,

                    text:
                        tomorrow,

                    model:
                        "server-date",

                    language,

                    timezone
                });
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

                const yesterday =
                    getDateWithOffset(
                        timezone,
                        locale,
                        -1
                    );

                return res.status(200).json({

                    success: true,

                    reply:
                        yesterday,

                    response:
                        yesterday,

                    text:
                        yesterday,

                    model:
                        "server-date",

                    language,

                    timezone
                });
            }

            /* =================================================
               API KEY
            ================================================= */

            if (!GEMINI_API_KEY) {

                console.error(
                    "GEMINI_API_KEY is missing."
                );

                return res.status(500).json({

                    success: false,

                    error:
                        "Gemini API key is not configured.",

                    reply:
                        "Viggo AI API key is not configured."
                });
            }

            /* =================================================
               GEMINI PARTS
            ================================================= */

            const parts = [];

            if (userMessage) {

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

                if (base64Data) {

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

            if (!parts.length) {

                return res.status(400).json({

                    success: false,

                    error:
                        "No valid content received.",

                    reply:
                        "Please send a message or supported file."
                });
            }

            /* =================================================
               DYNAMIC SYSTEM INSTRUCTION
            ================================================= */

            const dynamicSystemInstruction =

                VIGGO_SYSTEM_INSTRUCTION +

                `

=====================================================
AUTHORITATIVE SERVER DATE/TIME
=====================================================

Selected Language:
${language}

Selected Timezone:
${timezone}

Current Date:
${currentDate}

Current Time:
${currentTime}

Current Date and Time:
${currentDateTime}

These values come directly from the server.

IMPORTANT:
Do NOT replace these values with an older date
from your training data.

If the user asks for today's date, use:
${currentDate}

If the user asks for the current time, use:
${currentTime}

=====================================================
`;

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
                "Gemini Model:",
                MODEL
            );

            /* =================================================
               FETCH
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
                    "================================="
                );

                console.error(
                    "GEMINI HTTP ERROR:",
                    geminiResponse.status
                );

                console.error(
                    "GEMINI RESPONSE:",
                    JSON.stringify(
                        geminiData,
                        null,
                        2
                    )
                );

                console.error(
                    "MODEL:",
                    MODEL
                );

                console.error(
                    "================================="
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
                        "Viggo AI could not connect to the Gemini model.",

                    model:
                        MODEL
                });
            }

            /* =================================================
               EXTRACT RESPONSE
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

            if (!reply) {

                console.error(
                    "Gemini returned empty response:",
                    JSON.stringify(
                        geminiData,
                        null,
                        2
                    )
                );

                return res.status(500).json({

                    success: false,

                    error:
                        "Gemini returned an empty response.",

                    reply:
                        "Viggo AI received an empty response from the AI model."
                });
            }

            /* =================================================
               SUCCESS
            ================================================= */

            console.log(
                "Viggo AI response generated successfully."
            );

            console.log(
                "================================="
            );

            return res.status(200).json({

                success: true,

                reply:
                    reply,

                response:
                    reply,

                text:
                    reply,

                model:
                    MODEL,

                language,

                timezone,

                serverDate:
                    currentDate,

                serverTime:
                    currentTime
            });

        } catch (error) {

            console.error(
                "================================="
            );

            console.error(
                "VIGGO SERVER ERROR"
            );

            console.error(
                error?.stack ||
                error
            );

            console.error(
                "================================="
            );

            return res.status(500).json({

                success: false,

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

            success: false,

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

            success: false,

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
            "CHAT ENDPOINT: /chat"
        );

        console.log(
            "HEALTH ENDPOINT: /health"
        );

        console.log(
            "TIMEZONE SUPPORT: ENABLED"
        );

        console.log(
            "MULTI-LANGUAGE DATE: ENABLED"
        );

        console.log(
            "DIRECT DATE: ENABLED"
        );

        console.log(
            "DIRECT TIME: ENABLED"
        );

        console.log(
            "DIRECT TOMORROW: ENABLED"
        );

        console.log(
            "DIRECT YESTERDAY: ENABLED"
        );

        console.log(
            "ACCURACY MODE: ENABLED"
        );

        console.log(
            "================================="
        );
    }
);
