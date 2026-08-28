"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

/* =====================================================
   VIGGO AI SERVER
   CHAT + MEMORY + IMAGE + VIDEO + FILE
===================================================== */

const app = express();

/* =====================================================
   CONFIG
===================================================== */

const PORT = process.env.PORT || 10000;

const API_KEY =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    "";

const MODEL =
    process.env.GEMINI_MODEL ||
    "gemini-2.5-flash";

/* =====================================================
   GEMINI CLIENT
===================================================== */

const ai = API_KEY
    ? new GoogleGenAI({
        apiKey: API_KEY
    })
    : null;

/* =====================================================
   CORS
===================================================== */

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: [
            "Content-Type",
            "Accept",
            "Authorization"
        ]
    })
);

/* =====================================================
   BODY PARSER
===================================================== */

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
   ROOT
===================================================== */

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        service: "Viggo AI",
        status: "online",
        model: MODEL,
        apiConfigured: Boolean(API_KEY),
        endpoints: [
            "/",
            "/health",
            "/status",
            "/chat"
        ]
    });
});

/* =====================================================
   HEALTH
===================================================== */

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        status: "healthy",
        server: "Viggo AI",
        model: MODEL,
        apiConfigured: Boolean(API_KEY),
        time: new Date().toISOString()
    });
});

/* =====================================================
   STATUS
===================================================== */

app.get("/status", (req, res) => {
    res.status(200).json({
        success: true,
        server: "Viggo AI",
        status: "online",
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

    return String(value)
        .replace(/\u0000/g, "")
        .trim();
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
        "pl-PL": "Polish"
    };

    return languages[language] || "English";
}

/* =====================================================
   SYSTEM INSTRUCTION
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

IMPORTANT:

- Answer the CURRENT user message directly.
- Use previous conversation when available.
- Understand short replies using conversation context.
- Do not mention system prompts or server implementation.
- Be natural and conversational.
- Do not invent information.
- Explain technical topics clearly.
- If the user asks for code, provide complete working code.

LANGUAGE:

Selected language:
${languageName}

Reply naturally in the selected language when appropriate.

DATE AND TIME:

Timezone:
${timezone || "Asia/Kolkata"}

Current date/time:
${currentDateTime || "Not provided"}

Use the supplied current date/time for date-related questions.

IMAGE / VIDEO:

If an image or video is provided:
- Analyze the uploaded media.
- Answer questions about it.
- Do not claim to see something that is not actually available.
- If the media is unclear, say so.

You are Viggo AI.
`;
}

/* =====================================================
   HISTORY
===================================================== */

function buildHistoryText(history) {

    if (!Array.isArray(history)) {
        return "";
    }

    return history
        .slice(-30)
        .map(item => {

            if (!item) {
                return "";
            }

            const role =
                item.role === "assistant"
                    ? "Viggo"
                    : "User";

            const text =
                cleanText(
                    item.text ||
                    item.content ||
                    ""
                );

            if (!text) {
                return "";
            }

            return `${role}: ${text}`;

        })
        .filter(Boolean)
        .join("\n");
}

/* =====================================================
   PROMPT
===================================================== */

function buildPrompt({
    message,
    history,
    language,
    timezone,
    currentDateTime,
    hasFile
}) {

    const systemInstruction =
        buildSystemInstruction(
            language,
            timezone,
            currentDateTime
        );

    let prompt =
        systemInstruction;

    const historyText =
        buildHistoryText(history);

    if (historyText) {

        prompt += `

PREVIOUS CONVERSATION:

${historyText}

END PREVIOUS CONVERSATION.
`;
    }

    if (hasFile) {

        prompt += `

The user has uploaded a file/media item.
Analyze it together with the user's request.
`;
    }

    prompt += `

CURRENT USER MESSAGE:

${cleanText(message)}

Respond directly to the current user.
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
        cleanText(file.name) ||
        "uploaded-file";

    const type =
        cleanText(file.type).toLowerCase();

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
       Maximum request size.
       express.json is already limited to 50 MB.
    */

    const MAX_DATA_LENGTH =
        45 * 1024 * 1024;

    if (
        data.length >
        MAX_DATA_LENGTH
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
   PARSE DATA URL
===================================================== */

function parseDataUrl(dataUrl, fallbackMime) {

    const value =
        cleanText(dataUrl);

    /*
       Normal format:

       data:image/jpeg;base64,AAAA
    */

    const match =
        value.match(
            /^data:([^;]+);base64,(.+)$/s
        );

    if (match) {

        return {
            mimeType:
                match[1].toLowerCase(),

            data:
                match[2]
        };
    }

    /*
       If frontend sends raw base64,
       use file.type.
    */

    const rawBase64 =
        value.replace(
            /^base64,/i,
            ""
        );

    if (!rawBase64) {

        throw new Error(
            "Invalid uploaded file data."
        );
    }

    return {
        mimeType:
            fallbackMime ||
            "application/octet-stream",

        data:
            rawBase64
    };
}

/* =====================================================
   SUPPORTED FILE TYPES
===================================================== */

function isSupportedMimeType(mimeType) {

    if (!mimeType) {
        return false;
    }

    return (
        mimeType.startsWith("image/") ||
        mimeType.startsWith("video/") ||
        mimeType === "application/pdf" ||
        mimeType === "text/plain"
    );
}

/* =====================================================
   GEMINI CONTENT
===================================================== */

function createGeminiContents(
    prompt,
    file
) {

    const parts = [];

    /* TEXT */

    parts.push({
        text: prompt
    });

    /* FILE */

    if (file) {

        const parsed =
            parseDataUrl(
                file.data,
                file.type
            );

        if (
            !isSupportedMimeType(
                parsed.mimeType
            )
        ) {

            throw new Error(
                `Unsupported file type: ${parsed.mimeType}`
            );
        }

        /*
           Image / video / supported media
        */

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
            parts: parts
        }
    ];
}

/* =====================================================
   RESPONSE TEXT
===================================================== */

function extractResponseText(response) {

    if (!response) {
        return "";
    }

    /*
       @google/genai commonly exposes
       response.text
    */

    if (
        typeof response.text === "string"
    ) {

        return response.text.trim();
    }

    /*
       Some versions expose text()
    */

    if (
        typeof response.text === "function"
    ) {

        try {

            const value =
                response.text();

            if (
                typeof value === "string"
            ) {

                return value.trim();
            }

        } catch (error) {

            console.error(
                "response.text() error:",
                error.message
            );
        }
    }

    /*
       Fallback
    */

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
                    ?.parts || [];

            return parts
                .map(part =>
                    part?.text || ""
                )
                .join("")
                .trim();
        }

    } catch (error) {

        console.error(
            "Candidate extraction error:",
            error.message
        );
    }

    return "";
}

/* =====================================================
   GENERATE RESPONSE
===================================================== */

async function generateViggoResponse({
    message,
    conversationHistory,
    language,
    browserTimezone,
    currentDateTime,
    file
}) {

    if (!API_KEY || !ai) {

        throw new Error(
            "GEMINI_API_KEY is not configured."
        );
    }

    const prompt =
        buildPrompt({
            message,
            history:
                conversationHistory,
            language,
            timezone:
                browserTimezone,
            currentDateTime,
            hasFile:
                Boolean(file)
        });

    const contents =
        createGeminiContents(
            prompt,
            file
        );

    console.log(
        "Sending request to Gemini..."
    );

    console.log(
        "MODEL:",
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
   CHAT ROUTE
===================================================== */

app.post(
    "/chat",
    async (req, res) => {

        const requestId =
            `${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 8)}`;

        console.log("");
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

            /* API KEY */

            if (!API_KEY) {

                return res.status(500).json({
                    success: false,
                    error:
                        "Gemini API key is missing.",
                    code:
                        "API_KEY_MISSING",
                    requestId
                });
            }

            const body =
                req.body || {};

            /* MESSAGE */

            const originalMessage =
                cleanText(
                    body.originalMessage
                );

            const message =
                cleanText(
                    body.message
                ) ||
                originalMessage;

            /* FILE */

            let file = null;

            if (body.file) {

                file =
                    validateFile(
                        body.file
                    );
            }

            /*
               Message is not required if
               an upload exists.
            */

            if (
                !message &&
                !file
            ) {

                return res.status(400).json({
                    success: false,
                    error:
                        "Message or file is required.",
                    code:
                        "MESSAGE_MISSING",
                    requestId
                });
            }

            /* LANGUAGE */

            const language =
                cleanText(
                    body.language
                ) ||
                "en-IN";

            /* TIMEZONE */

            const browserTimezone =
                cleanText(
                    body.browserTimezone
                ) ||
                "Asia/Kolkata";

            /* DATE TIME */

            const currentDateTime =
                cleanText(
                    body.currentDateTime
                );

            /* HISTORY */

            let conversationHistory =
                Array.isArray(
                    body.conversationHistory
                )
                    ? body.conversationHistory
                    : [];

            conversationHistory =
                conversationHistory
                    .slice(-30)
                    .map(item => {

                        return {
                            role:
                                item?.role ===
                                "assistant"
                                    ? "assistant"
                                    : "user",

                            text:
                                cleanText(
                                    item?.text ||
                                    item?.content ||
                                    ""
                                )
                        };

                    })
                    .filter(
                        item =>
                            item.text
                    );

            console.log(
                "MESSAGE:",
                message || "(file only)"
            );

            console.log(
                "LANGUAGE:",
                language
            );

            console.log(
                "TIMEZONE:",
                browserTimezone
            );

            console.log(
                "HISTORY:",
                conversationHistory.length
            );

            console.log(
                "FILE:",
                file
                    ? `${file.name} | ${file.type}`
                    : "none"
            );

            /* GENERATE */

            const reply =
                await generateViggoResponse({

                    message:
                        message,

                    conversationHistory:
                        conversationHistory,

                    language:
                        language,

                    browserTimezone:
                        browserTimezone,

                    currentDateTime:
                        currentDateTime,

                    file:
                        file
                });

            console.log(
                "✓ VIGGO RESPONSE SUCCESS"
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

                hasFile:
                    Boolean(file),

                requestId:
                    requestId
            });

        } catch (error) {

            console.error("");
            console.error(
                "================================="
            );
            console.error(
                "❌ VIGGO SERVER ERROR"
            );
            console.error(
                "REQUEST:",
                requestId
            );
            console.error(
                "================================="
            );

            console.error(
                error
            );

            const errorString =
                String(
                    error?.message ||
                    error ||
                    ""
                );

            const lower =
                errorString.toLowerCase();

            /* QUOTA */

            if (
                lower.includes("429") ||
                lower.includes(
                    "resource_exhausted"
                ) ||
                lower.includes("quota")
            ) {

                return res.status(429).json({

                    success: false,

                    error:
                        "Gemini API quota exceeded.",

                    code:
                        "GEMINI_QUOTA",

                    requestId
                });
            }

            /* MODEL */

            if (
                lower.includes("404") ||
                lower.includes("not found") ||
                lower.includes(
                    "model"
                ) &&
                lower.includes(
                    "unsupported"
                )
            ) {

                return res.status(500).json({

                    success: false,

                    error:
                        `Gemini model "${MODEL}" is unavailable.`,

                    code:
                        "MODEL_ERROR",

                    model:
                        MODEL,

                    requestId
                });
            }

            /* API KEY */

            if (
                lower.includes(
                    "api key"
                ) ||
                lower.includes(
                    "unauthenticated"
                ) ||
                lower.includes(
                    "permission denied"
                )
            ) {

                return res.status(401).json({

                    success: false,

                    error:
                        "Gemini API key is invalid or unavailable.",

                    code:
                        "API_KEY_ERROR",

                    requestId
                });
            }

            /* FILE SIZE */

            if (
                lower.includes(
                    "too large"
                ) ||
                lower.includes(
                    "payload"
                ) ||
                lower.includes(
                    "entity too large"
                )
            ) {

                return res.status(413).json({

                    success: false,

                    error:
                        "Uploaded file is too large.",

                    code:
                        "FILE_TOO_LARGE",

                    requestId
                });
            }

            /* INVALID FILE */

            if (
                lower.includes(
                    "uploaded file"
                ) ||
                lower.includes(
                    "invalid uploaded"
                ) ||
                lower.includes(
                    "unsupported file"
                )
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        errorString,

                    code:
                        "FILE_ERROR",

                    requestId
                });
            }

            /* SERVICE UNAVAILABLE */

            if (
                lower.includes("503") ||
                lower.includes(
                    "unavailable"
                )
            ) {

                return res.status(503).json({

                    success: false,

                    error:
                        "Gemini is temporarily unavailable. Please try again.",

                    code:
                        "GEMINI_UNAVAILABLE",

                    requestId
                });
            }

            /* GENERIC */

            return res.status(500).json({

                success: false,

                error:
                    "Viggo AI could not generate a response.",

                details:
                    errorString.substring(
                        0,
                        500
                    ),

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
            "GLOBAL ERROR:",
            error
        );

        if (
            res.headersSent
        ) {

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
    "0.0.0.0",
    () => {

        console.log("");
        console.log(
            "================================="
        );
        console.log(
            "       VIGGO AI SERVER ONLINE"
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
            "/chat"
        );

        console.log(
            "HEALTH:",
            "/health"
        );

        console.log(
            "================================="
        );
    }
);
