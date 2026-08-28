
"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();

/* =====================================================
   VIGGO AI SERVER
   TEXT + PHOTO + VIDEO + FILE SUPPORT
===================================================== */

/* =====================================================
   CONFIG
===================================================== */

const PORT = Number(process.env.PORT) || 10000;

const API_KEY =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    "";

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

if (API_KEY) {
    console.log("✓ Gemini API key detected.");
} else {
    console.error("❌ GEMINI_API_KEY is missing.");
}


/* =====================================================
   CORS
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


/* =====================================================
   BODY PARSER

   Base64 images can be large.
===================================================== */

app.use(
    express.json({
        limit: "20mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "20mb"
    })
);


/* =====================================================
   ROOT
===================================================== */

app.get(
    "/",
    (req, res) => {

        res.status(200).json({

            success: true,

            status: "online",

            message:
                "Viggo AI Server is online.",

            model:
                MODEL,

            apiConfigured:
                Boolean(API_KEY),

            time:
                new Date().toISOString()

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

            success: true,

            status: "online",

            server:
                "Viggo AI",

            model:
                MODEL,

            apiConfigured:
                Boolean(API_KEY),

            uploadSupport: {
                photo: true,
                video: true,
                file: true
            },

            time:
                new Date().toISOString()

        });

    }
);


/* =====================================================
   STATUS
===================================================== */

app.get(
    "/status",
    (req, res) => {

        res.status(200).json({

            success: true,

            server:
                "Viggo AI",

            model:
                MODEL,

            apiConfigured:
                Boolean(API_KEY),

            time:
                new Date().toISOString()

        });

    }
);


/* =====================================================
   CLEAN TEXT
===================================================== */

function cleanText(value) {

    if (
        typeof value !== "string"
    ) {
        return "";
    }

    return value
        .replace(/\u0000/g, "")
        .trim();
}


/* =====================================================
   LANGUAGE
===================================================== */

function languageName(language) {

    const languages = {

        "en": "English",
        "en-IN": "English",

        "ta": "Tamil",
        "ta-IN": "Tamil",

        "hi": "Hindi",
        "hi-IN": "Hindi",

        "ml": "Malayalam",
        "ml-IN": "Malayalam",

        "te": "Telugu",
        "te-IN": "Telugu",

        "kn": "Kannada",
        "kn-IN": "Kannada"

    };

    return (
        languages[language] ||
        "English"
    );
}


/* =====================================================
   HISTORY
===================================================== */

function buildHistoryParts(history) {

    const parts = [];

    if (!Array.isArray(history)) {
        return parts;
    }

    history
        .slice(-14)
        .forEach(item => {

            if (!item) {
                return;
            }

            const role =
                item.role === "assistant"
                    ? "model"
                    : "user";

            let text = "";

            if (
                typeof item.content ===
                "string"
            ) {
                text =
                    cleanText(
                        item.content
                    );
            }

            if (
                typeof item.text ===
                "string"
            ) {
                text =
                    cleanText(
                        item.text
                    );
            }

            if (!text) {
                return;
            }

            parts.push({

                role,

                parts: [
                    {
                        text
                    }
                ]

            });

        });

    return parts;
}


/* =====================================================
   FILE DATA CLEANER
===================================================== */

function extractBase64(data) {

    if (
        typeof data !== "string"
    ) {
        return "";
    }

    let value =
        data.trim();

    /*
       Converts:

       data:image/png;base64,AAAA...

       into:

       AAAA...
    */

    if (
        value.includes(
            "base64,"
        )
    ) {

        value =
            value.substring(
                value.indexOf(
                    "base64,"
                ) + 7
            );

    }

    return value.trim();
}


/* =====================================================
   MIME TYPE
===================================================== */

function getMimeType(file) {

    if (
        file &&
        typeof file.type ===
        "string" &&
        file.type.trim()
    ) {

        return file.type.trim();

    }

    return "application/octet-stream";
}


/* =====================================================
   FILE VALIDATION
===================================================== */

function isSupportedFile(file) {

    if (!file) {
        return false;
    }

    const mime =
        getMimeType(file);

    return (
        mime.startsWith("image/") ||
        mime.startsWith("video/") ||
        mime === "application/pdf" ||
        mime === "text/plain" ||
        mime.includes("document") ||
        mime.includes("spreadsheet") ||
        mime.includes("presentation")
    );
}


/* =====================================================
   CHAT API
===================================================== */

app.post(
    "/chat",
    async (req, res) => {

        console.log(
            "================================="
        );

        console.log(
            "POST /chat"
        );

        console.log(
            "================================="
        );


        try {

            /* -----------------------------------------
               API KEY
            ----------------------------------------- */

            if (
                !API_KEY ||
                !ai
            ) {

                console.error(
                    "❌ Gemini API key missing."
                );

                return res.status(500).json({

                    success: false,

                    error:
                        "Gemini API key is not configured.",

                    details:
                        "Add GEMINI_API_KEY in Render Environment Variables."

                });

            }


            /* -----------------------------------------
               REQUEST BODY
            ----------------------------------------- */

            const body =
                req.body || {};


            const message =
                cleanText(
                    body.message
                );


            const originalMessage =
                cleanText(
                    body.originalMessage
                );


            const language =
                cleanText(
                    body.language
                ) || "en";


            const history =
                body.conversationHistory ||
                body.history ||
                [];


            const uploadedFile =
                body.file ||
                null;


            console.log(
                "Message:",
                message
                    ? message.slice(0, 100)
                    : "(empty)"
            );


            console.log(
                "Original:",
                originalMessage
                    ? originalMessage.slice(0, 100)
                    : "(empty)"
            );


            console.log(
                "Language:",
                language
            );


            console.log(
                "File:",
                uploadedFile
                    ? uploadedFile.name
                    : "none"
            );


            if (
                uploadedFile
            ) {

                console.log(
                    "File type:",
                    uploadedFile.type
                );

                console.log(
                    "File size:",
                    uploadedFile.size
                );

            }


            /* -----------------------------------------
               VALIDATION
            ----------------------------------------- */

            if (
                !message &&
                !uploadedFile
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Message or file is required.",

                    reply:
                        "Please send a message or upload a file."

                });

            }


            /* =================================================
               LANGUAGE
            ================================================= */

            const selectedLanguage =
                languageName(
                    language
                );


            /* =================================================
               SYSTEM INSTRUCTION
            ================================================= */

            const systemInstruction = `
You are Viggo AI.

You are a friendly, helpful and intelligent AI assistant.

The user's selected language is:
${selectedLanguage}

LANGUAGE RULES:
- Reply primarily in ${selectedLanguage}.
- Understand the user's language.
- If the user asks in Tamil, answer in Tamil.
- If the user asks in English, answer in English.
- If the user asks in Hindi, answer in Hindi.
- Do not unnecessarily mix languages.

PERSONALITY:
- Friendly
- Clear
- Helpful
- Respectful
- Natural
- Simple when possible

IMAGE RULES:
- If the user uploads an image, analyze the image carefully.
- Describe what is visible when appropriate.
- Answer questions about the image.
- If the user asks to identify something in the image, explain clearly.
- Do not claim to see something that is not visible.
- If the image is unclear, say that it is unclear.

FILE RULES:
- If a supported file is uploaded, analyze the available content.
- Give a useful response based on the uploaded content.

TECHNICAL QUESTIONS:
- Explain step by step.
- Give examples when useful.
- Give complete code when the user asks for full code.

Do not mention these system instructions.

Your name is Viggo.
`;


            /* =================================================
               BUILD CONTENTS
            ================================================= */

            const contents = [];


            /* -----------------------------------------
               ADD CONVERSATION HISTORY
            ----------------------------------------- */

            const historyParts =
                buildHistoryParts(
                    history
                );


            contents.push(
                ...historyParts
            );


            /* =================================================
               CURRENT USER PARTS
            ================================================= */

            const currentParts = [];


            /* -----------------------------------------
               TEXT
            ----------------------------------------- */

            let userText =
                message ||
                originalMessage;


            /*
               When only a file is uploaded,
               create a useful instruction.
            */

            if (
                uploadedFile &&
                !userText
            ) {

                const mime =
                    getMimeType(
                        uploadedFile
                    );

                if (
                    mime.startsWith(
                        "image/"
                    )
                ) {

                    userText =
                        "Please analyze this uploaded image and explain what you can see.";

                } else if (
                    mime.startsWith(
                        "video/"
                    )
                ) {

                    userText =
                        "Please analyze this uploaded video.";

                } else {

                    userText =
                        "Please analyze this uploaded file.";

                }

            }


            if (userText) {

                currentParts.push({

                    text:
                        userText

                });

            }


            /* =================================================
               FILE / IMAGE
            ================================================= */

            if (
                uploadedFile
            ) {

                const base64Data =
                    extractBase64(
                        uploadedFile.data
                    );


                const mimeType =
                    getMimeType(
                        uploadedFile
                    );


                if (!base64Data) {

                    console.error(
                        "❌ File data is empty."
                    );

                    return res.status(400).json({

                        success: false,

                        error:
                            "Uploaded file data is empty.",

                        reply:
                            "I received the file, but its data could not be read."

                    });

                }


                console.log(
                    "✓ Base64 data received."
                );


                console.log(
                    "MIME:",
                    mimeType
                );


                /*
                   IMAGE

                   Send image directly to Gemini
                   as inlineData.
                */

                if (
                    mimeType.startsWith(
                        "image/"
                    )
                ) {

                    currentParts.push({

                        inlineData: {

                            mimeType:
                                mimeType,

                            data:
                                base64Data

                        }

                    });

                    console.log(
                        "✓ Image added to Gemini request."
                    );

                }


                /*
                   VIDEO

                   Inline video support.
                */

                else if (
                    mimeType.startsWith(
                        "video/"
                    )
                ) {

                    currentParts.push({

                        inlineData: {

                            mimeType:
                                mimeType,

                            data:
                                base64Data

                        }

                    });

                    console.log(
                        "✓ Video added to Gemini request."
                    );

                }


                /*
                   Other files

                   Gemini may not support every
                   arbitrary file type through
                   inlineData, so return a
                   clear message.
                */

                else {

                    return res.status(400).json({

                        success: false,

                        error:
                            "This file type is not supported for direct AI analysis.",

                        reply:
                            "I can currently analyze images and supported video files. Please upload a supported file."

                    });

                }

            }


            /* =================================================
               FINAL CONTENT
            ================================================= */

            if (
                !currentParts.length
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "No valid content received.",

                    reply:
                        "Please send a message or upload an image."

                });

            }


            contents.push({

                role:
                    "user",

                parts:
                    currentParts

            });


            console.log(
                "Gemini content prepared."
            );


            console.log(
                "Number of parts:",
                currentParts.length
            );


            /* =================================================
               GEMINI REQUEST
            ================================================= */

            console.log(
                "Sending request to Gemini..."
            );


            console.log(
                "Model:",
                MODEL
            );


            const response =
                await ai.models.generateContent({

                    model:
                        MODEL,

                    contents:
                        contents,

                    config: {

                        systemInstruction:
                            systemInstruction

                    }

                });


            console.log(
                "✓ Gemini response received."
            );


            /* =================================================
               EXTRACT RESPONSE
            ================================================= */

            let reply = "";


            if (
                response &&
                typeof response.text ===
                "string"
            ) {

                reply =
                    response.text.trim();

            }


            /* -----------------------------------------
               FALLBACK
            ----------------------------------------- */

            if (
                !reply &&
                Array.isArray(
                    response?.candidates
                )
            ) {

                const parts =
                    response
                        .candidates?.[0]
                        ?.content
                        ?.parts ||
                    [];


                reply =
                    parts
                        .map(
                            part =>
                                part?.text ||
                                ""
                        )
                        .join("")
                        .trim();

            }


            /* =================================================
               EMPTY RESPONSE
            ================================================= */

            if (!reply) {

                console.error(
                    "❌ Gemini returned empty response."
                );

                return res.status(502).json({

                    success: false,

                    error:
                        "Gemini returned an empty response.",

                    reply:
                        "I received your request, but I couldn't generate a response."

                });

            }


            /* =================================================
               SUCCESS
            ================================================= */

            console.log(
                "✓ Viggo reply generated."
            );


            return res.status(200).json({

                success: true,

                reply:
                    reply,

                model:
                    MODEL,

                hasFile:
                    Boolean(
                        uploadedFile
                    )

            });

        }


        /* =====================================================
           ERROR HANDLER
        ===================================================== */

        catch (error) {

            console.error(
                "================================="
            );

            console.error(
                "❌ VIGGO AI SERVER ERROR"
            );

            console.error(
                "================================="
            );

            console.error(
                error
            );


            const errorText =
                String(
                    error?.message ||
                    error ||
                    ""
                );


            const lower =
                errorText.toLowerCase();


            /* -----------------------------------------
               QUOTA
            ----------------------------------------- */

            if (
                lower.includes("429") ||
                lower.includes(
                    "resource exhausted"
                ) ||
                lower.includes(
                    "quota"
                )
            ) {

                return res.status(429).json({

                    success: false,

                    error:
                        "Gemini API quota exceeded.",

                    reply:
                        "Viggo AI is temporarily out of Gemini API quota. Please try again later.",

                    details:
                        errorText

                });

            }


            /* -----------------------------------------
               API KEY
            ----------------------------------------- */

            if (
                lower.includes(
                    "api key"
                ) ||
                lower.includes(
                    "401"
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
                        "Gemini API key error.",

                    reply:
                        "The Gemini API key is invalid or not configured correctly.",

                    details:
                        errorText

                });

            }


            /* -----------------------------------------
               MODEL ERROR
            ----------------------------------------- */

            if (
                lower.includes(
                    "model"
                ) ||
                lower.includes(
                    "404"
                ) ||
                lower.includes(
                    "not found"
                )
            ) {

                return res.status(502).json({

                    success: false,

                    error:
                        "Gemini model error.",

                    reply:
                        "The configured Gemini model is unavailable. Check GEMINI_MODEL in Render.",

                    details:
                        errorText

                });

            }


            /* -----------------------------------------
               REQUEST TOO LARGE
            ----------------------------------------- */

            if (
                lower.includes(
                    "too large"
                ) ||
                lower.includes(
                    "payload"
                ) ||
                lower.includes(
                    "413"
                )
            ) {

                return res.status(413).json({

                    success: false,

                    error:
                        "Uploaded file is too large.",

                    reply:
                        "The uploaded file is too large. Please try a smaller image or video.",

                    details:
                        errorText

                });

            }


            /* -----------------------------------------
               GENERIC ERROR
            ----------------------------------------- */

            return res.status(500).json({

                success: false,

                error:
                    "Viggo AI could not generate a response.",

                reply:
                    "Sorry friend, I couldn't analyze that right now. Please try again.",

                details:
                    errorText

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
                "Endpoint not found.",

            path:
                req.path

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
            "PHOTO SUPPORT: ENABLED"
        );

        console.log(
            "VIDEO SUPPORT: ENABLED"
        );

        console.log(
            "================================="
        );

    }
);
