"use strict";

const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 10000;
const API_KEY = process.env.GEMINI_API_KEY;

// =====================================================
// MODEL
// =====================================================

const MODEL = "gemini-3.6-flash";

// =====================================================
// TIMEZONE
// =====================================================

const DEFAULT_TIMEZONE = "Asia/Kolkata";

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type"]
    })
);

app.use(
    express.json({
        limit: "25mb"
    })
);

// =====================================================
// DATE / TIME
// =====================================================

function getDateTime(timeZone = DEFAULT_TIMEZONE) {

    const now = new Date();

    const dateFormatter =
        new Intl.DateTimeFormat("en-US", {
            timeZone,
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });

    const timeFormatter =
        new Intl.DateTimeFormat("en-US", {
            timeZone,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        });

    return {
        date: dateFormatter.format(now),
        time: timeFormatter.format(now),
        dateTime:
            `${dateFormatter.format(now)} at ${timeFormatter.format(now)}`,
        iso: now.toISOString(),
        timezone: timeZone
    };
}

// =====================================================
// DATE CALCULATION
// =====================================================

function getRelativeDate(days, timeZone = DEFAULT_TIMEZONE) {

    const now = new Date();

    const parts =
        new Intl.DateTimeFormat("en-US", {
            timeZone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).formatToParts(now);

    const year =
        Number(
            parts.find(
                p => p.type === "year"
            ).value
        );

    const month =
        Number(
            parts.find(
                p => p.type === "month"
            ).value
        );

    const day =
        Number(
            parts.find(
                p => p.type === "day"
            ).value
        );

    const localDate =
        new Date(
            Date.UTC(
                year,
                month - 1,
                day + days
            )
        );

    return new Intl.DateTimeFormat(
        "en-US",
        {
            timeZone: "UTC",
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    ).format(localDate);
}

// =====================================================
// LANGUAGE
// =====================================================

const LANGUAGE_NAMES = {

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

// =====================================================
// LANGUAGE → TIMEZONE
// =====================================================

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

// =====================================================
// DIRECT DATE DETECTION
// =====================================================

function isDateQuestion(text) {

    const q =
        String(text || "")
            .toLowerCase()
            .trim();

    return (
        q.includes("today") ||
        q.includes("date today") ||
        q.includes("today's date") ||
        q.includes("what date") ||
        q.includes("current date") ||
        q.includes("இன்று") ||
        q.includes("தேதி") ||
        q.includes("இன்றைய தேதி") ||
        q.includes("आज") ||
        q.includes("आज की तारीख")
    );
}

// =====================================================
// DIRECT TIME DETECTION
// =====================================================

function isTimeQuestion(text) {

    const q =
        String(text || "")
            .toLowerCase()
            .trim();

    return (
        q.includes("current time") ||
        q.includes("what time") ||
        q.includes("time now") ||
        q.includes("time is it") ||
        q.includes("நேரம்") ||
        q.includes("இப்போது மணி") ||
        q.includes("समय") ||
        q.includes("अभी कितने बजे")
    );
}

// =====================================================
// TOMORROW
// =====================================================

function isTomorrowQuestion(text) {

    const q =
        String(text || "")
            .toLowerCase()
            .trim();

    return (
        q.includes("tomorrow") ||
        q.includes("நாளை") ||
        q.includes("कल")
    );
}

// =====================================================
// YESTERDAY
// =====================================================

function isYesterdayQuestion(text) {

    const q =
        String(text || "")
            .toLowerCase()
            .trim();

    return (
        q.includes("yesterday") ||
        q.includes("நேற்று") ||
        q.includes("நேற்றைய") ||
        q.includes("कल")
    );
}

// =====================================================
// GEMINI API
// =====================================================

async function callGemini(
    userMessage,
    language,
    dateTime
) {

    if (!API_KEY) {

        throw new Error(
            "GEMINI_API_KEY is not configured on Render."
        );
    }

    const languageName =
        LANGUAGE_NAMES[language] ||
        "English";

    const systemInstruction = `
You are Viggo AI.

IMPORTANT ACCURACY RULES:

1. NEVER invent the current date.
2. NEVER use a date from your training data as today's date.
3. The server-provided date below is the ONLY trusted current date.
4. If the user asks today's date, use the SERVER CURRENT DATE.
5. If the user asks current time, use the SERVER CURRENT TIME.
6. If the user asks tomorrow, calculate from the SERVER CURRENT DATE.
7. If the user asks yesterday, calculate from the SERVER CURRENT DATE.
8. Do not say May 19 2024.
9. Do not say May 20 2024.
10. Do not claim the current date is 2024.
11. Answer accurately and directly.
12. Respond in the user's selected language when possible.

SELECTED LANGUAGE:
${languageName}

SERVER TIMEZONE:
${dateTime.timezone}

SERVER CURRENT DATE:
${dateTime.date}

SERVER CURRENT TIME:
${dateTime.time}

SERVER CURRENT DATE AND TIME:
${dateTime.dateTime}

SERVER ISO TIME:
${dateTime.iso}
`;

    const url =
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(API_KEY)}`;

    const body = {

        systemInstruction: {
            parts: [
                {
                    text:
                        systemInstruction
                }
            ]
        },

        contents: [
            {
                role: "user",
                parts: [
                    {
                        text:
                            String(userMessage)
                    }
                ]
            }
        ],

        generationConfig: {

            temperature: 0,

            topP: 0.1,

            topK: 1,

            maxOutputTokens: 2048
        }
    };

    const response =
        await fetch(
            url,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(body)
            }
        );

    const rawText =
        await response.text();

    let data = null;

    try {

        data =
            JSON.parse(
                rawText
            );

    } catch {

        data = null;
    }

    if (!response.ok) {

        console.error(
            "GEMINI API ERROR:",
            response.status,
            rawText
        );

        throw new Error(
            data?.error?.message ||
            `Gemini API error ${response.status}`
        );
    }

    const reply =
        data?.candidates?.[0]?.content?.parts
            ?.map(part => part.text || "")
            .join("")
            .trim();

    if (!reply) {

        console.error(
            "EMPTY GEMINI RESPONSE:",
            JSON.stringify(
                data
            )
        );

        throw new Error(
            "Gemini returned an empty response."
        );
    }

    return reply;
}

// =====================================================
// HEALTH
// =====================================================

app.get(
    "/health",
    (req, res) => {

        const language =
            req.query.language ||
            "en-IN";

        const timezone =
            LANGUAGE_TIMEZONES[language] ||
            DEFAULT_TIMEZONE;

        const dateTime =
            getDateTime(
                timezone
            );

        res.json({

            status: "ok",

            service:
                "Viggo AI Server",

            apiConfigured:
                Boolean(API_KEY),

            model:
                MODEL,

            timezone:
                timezone,

            language:
                language,

            languageName:
                LANGUAGE_NAMES[language] ||
                "English",

            currentDate:
                dateTime.date,

            currentTime:
                dateTime.time,

            currentDateTime:
                dateTime.dateTime
        });
    }
);

// =====================================================
// CHAT
// =====================================================

app.post(
    "/chat",
    async (req, res) => {

        try {

            const userMessage =
                String(
                    req.body?.message ||
                    ""
                ).trim();

            const language =
                String(
                    req.body?.language ||
                    "en-IN"
                );

            const timezone =
                LANGUAGE_TIMEZONES[language] ||
                DEFAULT_TIMEZONE;

            const dateTime =
                getDateTime(
                    timezone
                );

            if (!userMessage) {

                return res.status(400).json({

                    error:
                        "Message is required."
                });
            }

            console.log(
                "---------------------------------"
            );

            console.log(
                "CHAT REQUEST"
            );

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

            console.log(
                "Current Date:",
                dateTime.date
            );

            console.log(
                "Current Time:",
                dateTime.time
            );

            // =================================================
            // DIRECT DATE ANSWER
            // =================================================

            if (
                isDateQuestion(
                    userMessage
                )
            ) {

                const languageName =
                    LANGUAGE_NAMES[language] ||
                    "English";

                let answer;

                if (
                    languageName ===
                    "Tamil"
                ) {

                    answer =
                        `இன்றைய தேதி ${dateTime.date}.`;

                } else if (
                    languageName ===
                    "Hindi"
                ) {

                    answer =
                        `आज की तारीख ${dateTime.date} है।`;

                } else {

                    answer =
                        `Today's date is ${dateTime.date}.`;
                }

                console.log(
                    "DIRECT DATE ANSWER:",
                    answer
                );

                return res.json({

                    reply:
                        answer,

                    date:
                        dateTime.date,

                    time:
                        dateTime.time,

                    timezone:
                        timezone,

                    language:
                        language
                });
            }

            // =================================================
            // DIRECT TIME ANSWER
            // =================================================

            if (
                isTimeQuestion(
                    userMessage
                )
            ) {

                const languageName =
                    LANGUAGE_NAMES[language] ||
                    "English";

                let answer;

                if (
                    languageName ===
                    "Tamil"
                ) {

                    answer =
                        `இப்போது நேரம் ${dateTime.time}.`;

                } else if (
                    languageName ===
                    "Hindi"
                ) {

                    answer =
                        `अभी समय ${dateTime.time} है।`;

                } else {

                    answer =
                        `The current time is ${dateTime.time}.`;
                }

                return res.json({

                    reply:
                        answer,

                    date:
                        dateTime.date,

                    time:
                        dateTime.time,

                    timezone:
                        timezone,

                    language:
                        language
                });
            }

            // =================================================
            // TOMORROW
            // =================================================

            if (
                isTomorrowQuestion(
                    userMessage
                )
            ) {

                const tomorrow =
                    getRelativeDate(
                        1,
                        timezone
                    );

                const languageName =
                    LANGUAGE_NAMES[language] ||
                    "English";

                let answer;

                if (
                    languageName ===
                    "Tamil"
                ) {

                    answer =
                        `நாளை ${tomorrow}.`;

                } else if (
                    languageName ===
                    "Hindi"
                ) {

                    answer =
                        `कल ${tomorrow} है।`;

                } else {

                    answer =
                        `Tomorrow is ${tomorrow}.`;
                }

                return res.json({

                    reply:
                        answer,

                    date:
                        tomorrow,

                    timezone:
                        timezone,

                    language:
                        language
                });
            }

            // =================================================
            // YESTERDAY
            // =================================================

            if (
                isYesterdayQuestion(
                    userMessage
                )
            ) {

                const yesterday =
                    getRelativeDate(
                        -1,
                        timezone
                    );

                const languageName =
                    LANGUAGE_NAMES[language] ||
                    "English";

                let answer;

                if (
                    languageName ===
                    "Tamil"
                ) {

                    answer =
                        `நேற்று ${yesterday}.`;

                } else if (
                    languageName ===
                    "Hindi"
                ) {

                    answer =
                        `कल से पहले की तारीख ${yesterday} है।`;

                } else {

                    answer =
                        `Yesterday was ${yesterday}.`;
                }

                return res.json({

                    reply:
                        answer,

                    date:
                        yesterday,

                    timezone:
                        timezone,

                    language:
                        language
                });
            }

            // =================================================
            // NORMAL GEMINI CHAT
            // =================================================

            const reply =
                await callGemini(
                    userMessage,
                    language,
                    dateTime
                );

            console.log(
                "GEMINI RESPONSE OK"
            );

            return res.json({

                reply:
                    reply,

                date:
                    dateTime.date,

                time:
                    dateTime.time,

                timezone:
                    timezone,

                language:
                    language
            });

        } catch (error) {

            console.error(
                "================================="
            );

            console.error(
                "CHAT ERROR:"
            );

            console.error(
                error?.message ||
                error
            );

            console.error(
                "================================="
            );

            return res.status(500).json({

                error:
                    "Viggo AI server error",

                details:
                    error?.message ||
                    "Unknown server error"
            });
        }
    }
);

// =====================================================
// ROOT
// =====================================================

app.get(
    "/",
    (req, res) => {

        res.json({

            status:
                "online",

            service:
                "Viggo AI Server",

            model:
                MODEL,

            endpoint:
                "/chat",

            health:
                "/health",

            timezone:
                DEFAULT_TIMEZONE,

            currentDate:
                getDateTime(
                    DEFAULT_TIMEZONE
                ).date,

            currentTime:
                getDateTime(
                    DEFAULT_TIMEZONE
                ).time
        });
    }
);

// =====================================================
// START SERVER
// =====================================================

app.listen(
    PORT,
    () => {

        const dateTime =
            getDateTime(
                DEFAULT_TIMEZONE
            );

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
            API_KEY
                ? "CONFIGURED"
                : "NOT CONFIGURED"
        );

        console.log(
            "TIMEZONE:",
            DEFAULT_TIMEZONE
        );

        console.log(
            "CURRENT DATE:",
            dateTime.date
        );

        console.log(
            "CURRENT TIME:",
            dateTime.time
        );

        console.log(
            "CURRENT DATE/TIME:",
            dateTime.dateTime
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
    }
);
