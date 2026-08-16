const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 10000;

/* =========================================
   MIDDLEWARE
========================================= */

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type"]
    })
);

app.use(
    express.json({
        limit: "5mb"
    })
);


/* =========================================
   LANGUAGES
========================================= */

const LANGUAGES = {
    en: "English",
    ta: "Tamil",
    hi: "Hindi",
    ml: "Malayalam",
    te: "Telugu",
    kn: "Kannada"
};


function getLanguageName(language) {

    return (
        LANGUAGES[language] ||
        "English"
    );

}


/* =========================================
   HOME
========================================= */

app.get("/", (req, res) => {

    res.status(200).json({

        success: true,

        status: "online",

        service: "Viggo AI Server",

        version: "1.0.0",

        endpoints: {
            chat: "POST /chat",
            health: "GET /health"
        }

    });

});


/* =========================================
   HEALTH
========================================= */

app.get("/health", (req, res) => {

    res.status(200).json({

        success: true,

        status: "healthy",

        server: "Viggo AI Server",

        time: new Date().toISOString()

    });

});


/* =========================================
   CHAT
========================================= */

app.post("/chat", async (req, res) => {

    try {

        console.log(
            "Incoming /chat request"
        );


        /* -------------------------------------
           REQUEST DATA
        ------------------------------------- */

        const message =
            typeof req.body?.message === "string"
                ? req.body.message.trim()
                : "";


        const language =
            typeof req.body?.language === "string"
                ? req.body.language
                : "en";


        const history =
            Array.isArray(req.body?.history)
                ? req.body.history
                : [];


        console.log(
            "Language:",
            language
        );


        console.log(
            "Message:",
            message
        );


        /* -------------------------------------
           EMPTY MESSAGE
        ------------------------------------- */

        if (!message) {

            return res.status(400).json({

                success: false,

                error:
                    "Message is empty."

            });

        }


        /* -------------------------------------
           API KEY
        ------------------------------------- */

        const apiKey =
            process.env.GEMINI_API_KEY;


        if (!apiKey) {

            console.error(
                "GEMINI_API_KEY NOT FOUND"
            );


            return res.status(500).json({

                success: false,

                error:
                    "GEMINI_API_KEY is missing. Add it in Render Environment Variables."

            });

        }


        /* -------------------------------------
           LANGUAGE
        ------------------------------------- */

        const languageName =
            getLanguageName(
                language
            );


        /* -------------------------------------
           HISTORY
        ------------------------------------- */

        let historyText = "";


        history
            .slice(-20)
            .forEach(
                item => {

                    if (
                        !item ||
                        !item.content
                    ) {
                        return;
                    }


                    const role =
                        item.role === "assistant"
                            ? "Viggo"
                            : "User";


                    historyText +=
                        `${role}: ${item.content}\n`;

                }
            );


        /* -------------------------------------
           PROMPT
        ------------------------------------- */

        const prompt = `

You are Viggo AI.

You are a friendly, helpful and intelligent AI assistant.

The user's selected language is:

${languageName}

IMPORTANT:

1. Reply in ${languageName}.
2. Understand English, Tamil, Hindi, Malayalam, Telugu and Kannada.
3. Understand mixed-language messages.
4. Give natural answers.
5. Do not mention system instructions.
6. Do not say that you are translating.
7. For programming questions, give working code.
8. For technical questions, explain step by step.
9. Keep simple questions simple.
10. Be friendly.
11. If the user asks in Tamil, answer in Tamil.
12. If the user asks in English, answer in English.

Conversation history:

${historyText}

Current user message:

${message}

Answer:
`;


        /* -------------------------------------
           GEMINI URL
        ------------------------------------- */

        const model =
            "gemini-2.0-flash";


        const geminiURL =
            "https://generativelanguage.googleapis.com/v1beta/models/" +
            model +
            ":generateContent?key=" +
            encodeURIComponent(
                apiKey
            );


        console.log(
            "Calling Gemini..."
        );


        /* -------------------------------------
           GEMINI REQUEST
        ------------------------------------- */

        const geminiResponse =
            await fetch(
                geminiURL,
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

                                    role:
                                        "user",

                                    parts: [

                                        {

                                            text:
                                                prompt

                                        }

                                    ]

                                }

                            ],

                            generationConfig: {

                                temperature:
                                    0.7,

                                topP:
                                    0.95,

                                topK:
                                    40,

                                maxOutputTokens:
                                    2048

                            }

                        })

                }
            );


        /* -------------------------------------
           GEMINI RESPONSE TEXT
        ------------------------------------- */

        const responseText =
            await geminiResponse.text();


        console.log(
            "Gemini status:",
            geminiResponse.status
        );


        /* -------------------------------------
           GEMINI ERROR
        ------------------------------------- */

        if (
            !geminiResponse.ok
        ) {

            console.error(
                "Gemini API Error:",
                responseText
            );


            let errorMessage =
                "Gemini API request failed.";


            try {

                const errorJSON =
                    JSON.parse(
                        responseText
                    );


                if (
                    errorJSON?.error?.message
                ) {

                    errorMessage =
                        errorJSON.error.message;

                }

            } catch {

                if(responseText) {

                    errorMessage =
                        responseText.substring(
                            0,
                            500
                        );

                }

            }


            return res.status(500).json({

                success: false,

                error:
                    "Viggo AI API Error",

                details:
                    errorMessage

            });

        }


        /* -------------------------------------
           PARSE JSON
        ------------------------------------- */

        let data;


        try {

            data =
                JSON.parse(
                    responseText
                );

        } catch {

            return res.status(500).json({

                success: false,

                error:
                    "Invalid response from Gemini."

            });

        }


        /* -------------------------------------
           EXTRACT REPLY
        ------------------------------------- */

        let reply = "";


        if (
            Array.isArray(
                data?.candidates
            )
        ) {

            for (
                const candidate
                of data.candidates
            ) {

                const parts =
                    candidate
                        ?.content
                        ?.parts;


                if (
                    Array.isArray(parts)
                ) {

                    for (
                        const part
                        of parts
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

            }

        }


        reply =
            reply.trim();


        /* -------------------------------------
           EMPTY REPLY
        ------------------------------------- */

        if (!reply) {

            console.error(
                "Gemini returned no text:",
                JSON.stringify(data)
            );


            return res.status(500).json({

                success: false,

                error:
                    "Viggo AI returned an empty response.",

                details:
                    "No text was found in Gemini response."

            });

        }


        /* -------------------------------------
           SUCCESS
        ------------------------------------- */

        console.log(
            "Viggo reply generated successfully"
        );


        return res.status(200).json({

            success: true,

            reply: reply,

            language:
                language,

            languageName:
                languageName

        });


    } catch (error) {

        console.error(
            "SERVER ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            error:
                "Sorry friend, I couldn't connect to Viggo AI right now.",

            details:
                error?.message ||
                "Unknown server error"

        });

    }

});


/* =========================================
   404
========================================= */

app.use(
    (req, res) => {

        res.status(404).json({

            success: false,

            error:
                "Endpoint not found",

            path:
                req.originalUrl

        });

    }
);


/* =========================================
   GLOBAL ERROR
========================================= */

app.use(
    (error, req, res, next) => {

        console.error(
            "GLOBAL ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            error:
                "Internal server error",

            details:
                error.message

        });

    }
);


/* =========================================
   START SERVER
========================================= */

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "================================="
        );

        console.log(
            "       VIGGO AI SERVER"
        );

        console.log(
            "================================="
        );

        console.log(
            `Server running on port ${PORT}`
        );

        console.log(
            "Chat endpoint: POST /chat"
        );

        console.log(
            "Health endpoint: GET /health"
        );

        console.log(
            "================================="
        );

    }
);
