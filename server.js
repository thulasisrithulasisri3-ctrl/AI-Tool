"use strict";

/* =====================================================
   VIGGO AI - SERVER.JS
   FULL CODE
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


/*
 * Large JSON limit is needed because
 * your frontend can send base64 files.
 */
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

        res.json({
            status: "online",
            service: "Viggo AI Server",
            model: MODEL,
            apiConfigured:
                Boolean(GEMINI_API_KEY)
        });

    }
);


/* =====================================================
   HEALTH
===================================================== */

app.get(
    "/health",
    (req, res) => {

        res.json({
            status: "ok",
            service: "Viggo AI",
            model: MODEL,
            apiConfigured:
                Boolean(GEMINI_API_KEY),
            time:
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

            const body =
                req.body || {};


            const userMessage =
                typeof body.message === "string"
                    ? body.message.trim()
                    : "";


            const uploadedFile =
                body.file || null;


            if (
                !userMessage &&
                !uploadedFile
            ) {

                return res.status(400).json({
                    error: "Message is required."
                });

            }


            if (!GEMINI_API_KEY) {

                console.error(
                    "GEMINI_API_KEY is missing."
                );


                return res.status(500).json({

                    error:
                        "Gemini API key is not configured on the server.",

                    reply:
                        "Sorry friend, the AI server API key is not configured."
                });

            }


            /* =================================================
               BUILD CONTENT
            ================================================= */

            const parts = [];


            if (userMessage) {

                parts.push({
                    text: userMessage
                });

            }


            /* =================================================
               FILE SUPPORT
            ================================================= */

            if (
                uploadedFile &&
                uploadedFile.data &&
                uploadedFile.type
            ) {

                const dataUrl =
                    String(
                        uploadedFile.data
                    );


                let base64Data =
                    dataUrl;


                /*
                 * Remove:
                 * data:image/png;base64,
                 * data:video/mp4;base64,
                 * etc.
                 */

                if (
                    base64Data.includes(
                        "base64,"
                    )
                ) {

                    base64Data =
                        base64Data.split(
                            "base64,"
                        )[1];

                }


                /*
                 * Gemini inlineData format
                 */

                parts.push({

                    inlineData: {

                        mimeType:
                            uploadedFile.type,

                        data:
                            base64Data

                    }

                });

            }


            /* =================================================
               GEMINI REQUEST
            ================================================= */

            const url =
                "https://generativelanguage.googleapis.com/v1beta/models/" +
                encodeURIComponent(MODEL) +
                ":generateContent?key=" +
                encodeURIComponent(
                    GEMINI_API_KEY
                );


            const geminiResponse =
                await fetch(
                    url,
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                contents: [

                                    {
                                        role: "user",

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
                    raw: rawText
                };

            }


            /* =================================================
               GEMINI ERROR
            ================================================= */

            if (
                !geminiResponse.ok
            ) {

                console.error(
                    "Gemini API error:",
                    geminiData
                );


                const apiMessage =
                    geminiData?.error?.message ||
                    "Gemini API request failed.";


                return res.status(
                    geminiResponse.status >= 400 &&
                    geminiResponse.status < 600
                        ? geminiResponse.status
                        : 500
                ).json({

                    error:
                        apiMessage,

                    reply:
                        "Sorry friend, Viggo AI could not get a response from Gemini."
                });

            }


            /* =================================================
               EXTRACT RESPONSE
            ================================================= */

            let reply = "";


            if (
                Array.isArray(
                    geminiData?.candidates
                )
            ) {

                for (
                    const candidate
                    of geminiData.candidates
                ) {

                    const candidateParts =
                        candidate?.content?.parts;


                    if (
                        Array.isArray(
                            candidateParts
                        )
                    ) {

                        for (
                            const part
                            of candidateParts
                        ) {

                            if (
                                typeof part.text ===
                                "string"
                            ) {

                                reply +=
                                    part.text;

                            }

                        }

                    }

                }

            }


            reply =
                reply.trim();


            if (!reply) {

                reply =
                    "Sorry friend, I couldn't generate a response.";

            }


            /* =================================================
               SEND RESPONSE TO FRONTEND
            ================================================= */

            return res.json({

                success: true,

                reply: reply,

                response: reply,

                text: reply,

                model: MODEL

            });

        } catch (error) {

            console.error(
                "Viggo /chat error:",
                error
            );


            return res.status(500).json({

                success: false,

                error:
                    error.message ||
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

            error:
                "Route not found.",

            path:
                req.originalUrl

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
            "Global server error:",
            error
        );


        if (
            res.headersSent
        ) {

            return next(
                error
            );

        }


        res.status(500).json({

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
            "================================="
        );

    }
);
