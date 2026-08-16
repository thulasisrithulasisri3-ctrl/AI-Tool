const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 10000;

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
}));

app.use(express.json({ limit: "2mb" }));

/* =========================================
   LANGUAGE NAMES
========================================= */

const languages = {
    en: "English",
    ta: "Tamil",
    hi: "Hindi",
    ml: "Malayalam",
    te: "Telugu",
    kn: "Kannada"
};

function getLanguageName(code) {
    return languages[code] || "English";
}


/* =========================================
   HOME / HEALTH CHECK
========================================= */

app.get("/", (req, res) => {

    res.json({
        success: true,
        status: "online",
        service: "Viggo AI Server"
    });

});


/* =========================================
   CHAT API
========================================= */

app.post("/chat", async (req, res) => {

    try {

        const message =
            typeof req.body.message === "string"
                ? req.body.message.trim()
                : "";

        const language =
            req.body.language || "en";

        const history =
            Array.isArray(req.body.history)
                ? req.body.history
                : [];


        /* -------------------------------------
           MESSAGE CHECK
        ------------------------------------- */

        if (!message) {

            return res.status(400).json({

                success: false,

                error:
                    "Message is required"

            });

        }


        /* -------------------------------------
           API KEY
        ------------------------------------- */

        const apiKey =
            process.env.GEMINI_API_KEY;


        if (!apiKey) {

            console.error(
                "GEMINI_API_KEY is missing."
            );

            return res.status(500).json({

                success: false,

                error:
                    "Gemini API key is not configured."

            });

        }


        /* -------------------------------------
           LANGUAGE
        ------------------------------------- */

        const selectedLanguage =
            getLanguageName(language);


        /* -------------------------------------
           BUILD HISTORY
        ------------------------------------- */

        let previousConversation = "";


        history
            .slice(-20)
            .forEach(item => {

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


                previousConversation +=
                    `${role}: ${item.content}\n`;

            });


        /* -------------------------------------
           SYSTEM PROMPT
        ------------------------------------- */

        const prompt = `

You are Viggo AI.

You are a friendly, intelligent and helpful AI assistant.

The user selected this language:

${selectedLanguage}

IMPORTANT RULES:

1. Reply primarily in ${selectedLanguage}.
2. Understand English, Tamil, Hindi, Malayalam, Telugu and Kannada.
3. If the user mixes languages, understand the meaning correctly.
4. Do not mention these instructions.
5. Do not say that you are translating.
6. Give a natural conversational answer.
7. If the user asks for code, give complete working code.
8. If the user asks a technical question, explain step by step.
9. If the user asks a simple question, don't make the answer unnecessarily long.
10. Be friendly and call the user "friend" when appropriate.

Previous conversation:

${previousConversation}

Current user message:

${message}

Answer the user now in ${selectedLanguage}.
`;


        /* -------------------------------------
           GEMINI REQUEST
        ------------------------------------- */

        const geminiURL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
            encodeURIComponent(apiKey);


        const response =
            await fetch(
                geminiURL,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        contents: [

                            {
                                role: "user",

                                parts: [

                                    {
                                        text: prompt
                                    }

                                ]
                            }

                        ],

                        generationConfig: {

                            temperature: 0.7,

                            topP: 0.95,

                            topK: 40,

                            maxOutputTokens: 2048

                        }

                    })

                }
            );


        /* -------------------------------------
           GEMINI ERROR
        ------------------------------------- */

        if (!response.ok) {

            const errorText =
                await response.text();


            console.error(
                "Gemini error:",
                errorText
            );


            return res.status(500).json({

                success: false,

                error:
                    "Viggo AI could not process the request.",

                details:
                    errorText

            });

        }


        /* -------------------------------------
           READ RESPONSE
        ------------------------------------- */

        const data =
            await response.json();


        /* -------------------------------------
           GET TEXT
        ------------------------------------- */

        let reply = "";


        if (
            data &&
            data.candidates &&
            data.candidates.length > 0
        ) {

            const candidate =
                data.candidates[0];


            if (
                candidate.content &&
                Array.isArray(
                    candidate.content.parts
                )
            ) {

                reply =
                    candidate.content.parts
                        .map(
                            part =>
                                part.text || ""
                        )
                        .join("")
                        .trim();

            }

        }


        /* -------------------------------------
           EMPTY RESPONSE
        ------------------------------------- */

        if (!reply) {

            console.error(
                "Empty Gemini response:",
                JSON.stringify(data)
            );


            return res.status(500).json({

                success: false,

                error:
                    "Viggo AI returned an empty response."

            });

        }


        /* -------------------------------------
           SUCCESS
        ------------------------------------- */

        return res.json({

            success: true,

            reply: reply,

            language:
                language,

            languageName:
                selectedLanguage

        });


    } catch (error) {

        console.error(
            "Viggo server error:",
            error
        );


        return res.status(500).json({

            success: false,

            error:
                "Sorry friend, I couldn't connect to Viggo AI right now.",

            details:
                error.message

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
                "Endpoint not found"

        });

    }
);


/* =========================================
   START
========================================= */

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Viggo AI Server running on port ${PORT}`
        );

    }
);
