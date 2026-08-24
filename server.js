"use strict";

/* =====================================================
   VIGGO AI - SERVER.JS
   FULL VERSION
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


                /*
                 * Example:
                 *
                 * data:image/png;base64,AAAA...
                 *
                 * becomes:
                 *
                 * AAAA...
                 */

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
                            JSON.stringify({

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
                                        0.7,

                                    maxOutputTokens:
                                        2048

                                }

                            })

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
            "================================="
        );

    }
);
