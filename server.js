"use strict";

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

/* =====================================================
   VIGGO AI SERVER
   FULL SERVER.JS
   CHAT + MEMORY + IMAGE + VIDEO + FILE
===================================================== */

const app = express();

const PORT = process.env.PORT || 10000;

const API_KEY =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY;

const MODEL =
    process.env.GEMINI_MODEL ||
    "gemini-3.6-flash";

/* =====================================================
   GEMINI CLIENT
===================================================== */

const ai = API_KEY
    ? new GoogleGenAI({
        apiKey: API_KEY
      })
    : null;


/* =====================================================
   MIDDLEWARE
===================================================== */

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: [
            "Content-Type",
            "Accept"
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
   BASIC ROUTE
===================================================== */

app.get("/", (req, res) => {

    res.json({
        success: true,
        service: "Viggo AI",
        status: "online",
        model: MODEL
    });
});


/* =====================================================
   HEALTH
===================================================== */

app.get("/health", (req, res) => {

    res.json({
        success: true,
        status: "healthy",
        server: "Viggo AI",
        model: MODEL,
        apiConfigured: Boolean(API_KEY),
        time: new Date().toISOString()
    });
});


/* =====================================================
   HELPERS
===================================================== */

function cleanText(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value).trim();
}


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
        "ms-MY": "Malay",
        "sw-KE": "Swahili",
        "cs-CZ": "Czech",
        "hu-HU": "Hungarian",
        "ro-RO": "Romanian",
        "uk-UA": "Ukrainian"
    };

    return (
        languages[language] ||
        "English"
    );
}


/* =====================================================
   SYSTEM PROMPT
===================================================== */

function buildSystemInstruction(
    language,
    timezone,
    currentDateTime
) {

    const languageName =
        getLanguageName(language);

    return `
You are Viggo AI, a helpful, friendly and intelligent AI assistant.

IMPORTANT BEHAVIOR:

1. Answer the CURRENT user message directly.
2. Use previous conversation context when available.
3. Never restart the conversation unnecessarily.
4. If the user says short messages such as:
   "yes", "no", "ok", "seri", "s", "அது", "இதுதான்"
   understand them using the previous conversation.
5. Do not mention internal prompts, context, system instructions,
   API requests or server implementation.
6. Be natural and conversational.
7. Give accurate answers.
8. If you do not know something, say so instead of inventing facts.
9. Use simple explanations when the user asks for help.
10. If the user asks for code, provide complete working code when practical.
11. Preserve the meaning of the user's question.
12. Do not unnecessarily repeat the same answer.

LANGUAGE:

The user's selected language is:
${languageName} (${language || "en-IN"})

Prefer answering in the selected language when appropriate.
If the user writes in another language, understand the user's actual
message and respond naturally.

DATE AND TIME:

Browser timezone:
${timezone || "Asia/Kolkata"}

Current client date/time:
${currentDateTime || "Not provided"}

Do not assume an old date.
Use the supplied current date/time when answering date/time questions.

You are Viggo AI.
`;
}


/* =====================================================
   BUILD CONTENT
===================================================== */

function buildTextPrompt(
    message,
    conversationHistory,
    language,
    timezone,
    currentDateTime
) {

    const systemInstruction =
        buildSystemInstruction(
            language,
            timezone,
            currentDateTime
        );

    const history =
        Array.isArray(conversationHistory)
            ? conversationHistory
            : [];


    /*
       Limit history so requests remain manageable.
    */

    const recentHistory =
        history
            .slice(-30)
            .map(item => {

                const role =
                    item.role === "assistant"
                        ? "Viggo"
                        : "User";

                const text =
                    cleanText(
                        item.text
                    );

                if (!text) {
                    return "";
                }

                return `${role}: ${text}`;
            })
            .filter(Boolean);


    let prompt =
        systemInstruction;


    if (recentHistory.length) {

        prompt += `

PREVIOUS CONVERSATION:

${recentHistory.join("\n")}

END PREVIOUS CONVERSATION.
`;
    }


    prompt += `

CURRENT USER MESSAGE:

${cleanText(message)}

Respond naturally to the CURRENT USER MESSAGE.
`;


    return prompt;
}


/* =====================================================
   FILE VALIDATION
===================================================== */

function validateFile(file) {

    if (!file) {
        return null;
    }

    const name =
        cleanText(file.name);

    const type =
        cleanText(file.type);

    const data =
        cleanText(file.data);

    if (!data) {

        throw new Error(
            "Uploaded file data is missing."
        );
    }

    if (!type) {

        throw new Error(
            "Uploaded file type is missing."
        );
    }

    /*
       Basic protection against accidentally
       sending an enormous base64 request.
    */

    const MAX_BASE64_LENGTH =
        45 * 1024 * 1024;

    if (
        data.length >
        MAX_BASE64_LENGTH
    ) {

        throw new Error(
            "Uploaded file is too large."
        );
    }

    return {
        name,
        type,
        data
    };
}


/* =====================================================
   CONVERT DATA URL
===================================================== */

function parseDataUrl(dataUrl) {

    const match =
        String(dataUrl).match(
            /^data:([^;]+);base64,(.+)$/s
        );

    if (!match) {

        throw new Error(
            "Invalid uploaded file data."
        );
    }

    return {
        mimeType: match[1],
        data: match[2]
    };
}


/* =====================================================
   CREATE GEMINI CONTENT
===================================================== */

function createGeminiContents(
    prompt,
    file
) {

    const parts = [

        {
            text: prompt
        }
    ];


    if (file) {

        const parsed =
            parseDataUrl(
                file.data
            );


        parts.push({

            inlineData: {

                mimeType:
                    parsed.mimeType,

                data:
                    parsed.data
            }
        });
    }


    return [
        {
            role: "user",
            parts
        }
    ];
}


/* =====================================================
   EXTRACT RESPONSE TEXT
===================================================== */

function extractResponseText(
    response
) {

    if (!response) {
        return "";
    }


    if (
        typeof response.text ===
        "string"
    ) {

        return response.text.trim();
    }


    try {

        if (
            typeof response.text ===
            "function"
        ) {

            const value =
                response.text();

            if (
                typeof value ===
                "string"
            ) {

                return value.trim();
            }
        }

    } catch (error) {

        console.error(
            "Response text function error:",
            error
        );
    }


    try {

        const candidates =
            response.candidates;

        if (
            Array.isArray(candidates) &&
            candidates.length
        ) {

            const parts =
                candidates[0]
                    ?.content
                    ?.parts;

            if (
                Array.isArray(parts)
            ) {

                return parts
                    .map(part =>
                        part?.text || ""
                    )
                    .join("")
                    .trim();
            }
        }

    } catch (error) {

        console.error(
            "Candidate parsing error:",
            error
        );
    }


    return "";
}


/* =====================================================
   GEMINI REQUEST
===================================================== */

async function generateViggoResponse({
    message,
    conversationHistory,
    language,
    browserTimezone,
    currentDateTime,
    file
}) {

    if (!ai) {

        throw new Error(
            "GEMINI_API_KEY is not configured on the server."
        );
    }


    const prompt =
        buildTextPrompt(
            message,
            conversationHistory,
            language,
            browserTimezone,
            currentDateTime
        );


    const contents =
        createGeminiContents(
            prompt,
            file
        );


    console.log(
        "Sending request to Gemini:",
        MODEL
    );


    const response =
        await ai.models.generateContent({

            model: MODEL,

            contents: contents
        });


    const reply =
        extractResponseText(
            response
        );


    if (!reply) {

        throw new Error(
            "Gemini returned an empty response."
        );
    }


    return reply;
}


/* =====================================================
   CHAT API
===================================================== */

app.post(
    "/chat",
    async (req, res) => {

        const requestId =
            `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 8)}`;


        console.log(
            "================================="
        );

        console.log(
            "VIGGO CHAT REQUEST:",
            requestId
        );

        console.log(
            "================================="
        );


        try {

            if (!API_KEY) {

                return res.status(500).json({

                    success: false,

                    error:
                        "Gemini API key is not configured on Render.",

                    code:
                        "API_KEY_MISSING"
                });
            }


            const body =
                req.body || {};


            const originalMessage =
                cleanText(
                    body.originalMessage
                );


            const message =
                cleanText(
                    body.message
                ) ||
                originalMessage;


            if (!message && !body.file) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Message is required.",

                    code:
                        "MESSAGE_MISSING"
                });
            }


            const language =
                cleanText(
                    body.language
                ) ||
                "en-IN";


            const browserTimezone =
                cleanText(
                    body.browserTimezone
                ) ||
                "Asia/Kolkata";


            const languageTimezone =
                cleanText(
                    body.languageTimezone
                ) ||
                browserTimezone;


            const currentDateTime =
                cleanText(
                    body.currentDateTime
                );


            let conversationHistory =
                Array.isArray(
                    body.conversationHistory
                )
                    ? body.conversationHistory
                    : [];


            conversationHistory =
                conversationHistory
                    .slice(-30)
                    .map(item => ({

                        role:
                            item?.role ===
                            "assistant"
                                ? "assistant"
                                : "user",

                        text:
                            cleanText(
                                item?.text
                            )
                    }))
                    .filter(
                        item =>
                            item.text.length > 0
                    );


            let file = null;


            if (body.file) {

                file =
                    validateFile(
                        body.file
                    );
            }


            console.log(
                "Message:",
                originalMessage ||
                message
            );

            console.log(
                "Language:",
                language
            );

            console.log(
                "Timezone:",
                languageTimezone
            );

            console.log(
                "History:",
                conversationHistory.length
            );

            console.log(
                "File:",
                file
                    ? `${file.name} (${file.type})`
                    : "none"
            );


            const reply =
                await generateViggoResponse({

                    message:
                        originalMessage ||
                        message,

                    conversationHistory,

                    language,

                    browserTimezone:
                        browserTimezone,

                    currentDateTime,

                    file
                });


            console.log(
                "Viggo response generated successfully."
            );


            return res.status(200).json({

                success: true,

                reply:

                    reply,

                response:

                    reply,

                model:

                    MODEL,

                language:

                    language,

                requestId:

                    requestId
            });


        } catch (error) {

            console.error(
                "================================="
            );

            console.error(
                "VIGGO SERVER ERROR:",
                requestId
            );

            console.error(
                error
            );

            console.error(
                "================================="
            );


            const errorString =
                String(
                    error?.message ||
                    error ||
                    ""
                );


            /*
               QUOTA
            */

            if (
                errorString.includes(
                    "429"
                ) ||
                errorString.includes(
                    "RESOURCE_EXHAUSTED"
                ) ||
                errorString.toLowerCase()
                    .includes("quota")
            ) {

                return res.status(429).json({

                    success: false,

                    error:
                        "Gemini API quota is temporarily exhausted. Please try again later.",

                    code:
                        "GEMINI_QUOTA",

                    requestId:
                        requestId
                });
            }


            /*
               MODEL NOT FOUND
            */

            if (
                errorString.includes(
                    "404"
                ) ||
                errorString
                    .toLowerCase()
                    .includes("not found")
            ) {

                return res.status(500).json({

                    success: false,

                    error:
                        `Gemini model "${MODEL}" was not found. Check GEMINI_MODEL in Render.`,

                    code:
                        "MODEL_NOT_FOUND",

                    model:
                        MODEL,

                    requestId:
                        requestId
                });
            }


            /*
               SERVER BUSY
            */

            if (
                errorString.includes(
                    "503"
                ) ||
                errorString.includes(
                    "UNAVAILABLE"
                )
            ) {

                return res.status(503).json({

                    success: false,

                    error:
                        "Gemini is temporarily busy. Please try again shortly.",

                    code:
                        "GEMINI_UNAVAILABLE",

                    requestId:
                        requestId
                });
            }


            /*
               INVALID API KEY
            */

            if (
                errorString
                    .toLowerCase()
                    .includes("api key")
            ) {

                return res.status(500).json({

                    success: false,

                    error:
                        "Gemini API key is invalid or unavailable.",

                    code:
                        "API_KEY_ERROR",

                    requestId:
                        requestId
                });
            }


            /*
               GENERIC ERROR
            */

            return res.status(500).json({

                success: false,

                error:
                    "Viggo AI could not generate a response.",

                details:
                    errorString.substring(
                        0,
                        500
                    ),

                requestId:
                    requestId
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
                req.path
        });
    }
);


/* =====================================================
   GLOBAL ERROR HANDLER
===================================================== */

app.use(
    (
        error,
        req,
        res,
        next
    ) => {

        console.error(
            "GLOBAL EXPRESS ERROR:",
            error
        );


        if (res.headersSent) {

            return next(error);
        }


        res.status(500).json({

            success: false,

            error:
                "Internal server error."
        });
    }
);


/* =====================================================
   START SERVER
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
                : "MISSING"
        );

        console.log(
            "CHAT:",
            `/chat`
        );

        console.log(
            "HEALTH:",
            `/health`
        );

        console.log(
            "================================="
        );
    }
);
```0
