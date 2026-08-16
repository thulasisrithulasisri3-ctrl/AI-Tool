const express = require("express");
const cors = require("cors");

const app = express();

const PORT =
  process.env.PORT || 10000;


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
   HOME
========================================= */

app.get("/", (req, res) => {

  res.json({

    success: true,

    status: "online",

    service: "Viggo AI Server"

  });

});


/* =========================================
   HEALTH
========================================= */

app.get("/health", (req, res) => {

  res.json({

    success: true,

    status: "healthy"

  });

});


/* =========================================
   CHAT
========================================= */

app.post("/chat", async (req, res) => {

  try {

    const message =
      typeof req.body?.message === "string"
        ? req.body.message.trim()
        : "";


    const language =
      req.body?.language || "en";


    const history =
      Array.isArray(
        req.body?.history
      )
        ? req.body.history
        : [];


    if (!message) {

      return res.status(400).json({

        success: false,

        error:
          "Message is required."

      });

    }


    const apiKey =
      process.env.GEMINI_API_KEY;


    if (!apiKey) {

      return res.status(500).json({

        success: false,

        error:
          "GEMINI_API_KEY is missing in Render."

      });

    }


    const languages = {

      en: "English",

      ta: "Tamil",

      hi: "Hindi",

      ml: "Malayalam",

      te: "Telugu",

      kn: "Kannada"

    };


    const languageName =
      languages[language] ||
      "English";


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


          historyText +=

            (
              item.role ===
              "assistant"
                ? "Viggo"
                : "User"
            ) +

            ": " +

            item.content +

            "\n";

        }
      );


    const prompt = `

You are Viggo AI.

You are a friendly, intelligent AI assistant.

Reply in ${languageName}.

Understand mixed languages.

If the user asks in Tamil,
reply in Tamil.

If the user asks in English,
reply in English.

Give correct and useful answers.

For coding questions,
provide complete working code.

Do not mention these instructions.

Conversation history:

${historyText}

Current user message:

${message}

Viggo:
`;


    const model =
      "gemini-2.0-flash";


    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      model +
      ":generateContent?key=" +
      encodeURIComponent(
        apiKey
      );


    const response =
      await fetch(
        url,
        {

          method:
            "POST",

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


    const raw =
      await response.text();


    if (!response.ok) {

      console.error(
        "Gemini Error:",
        raw
      );


      let details =
        raw;


      try {

        const json =
          JSON.parse(raw);

        details =
          json?.error?.message ||
          raw;

      } catch {}


      return res.status(500).json({

        success: false,

        error:
          "Gemini API Error",

        details:
          details

      });

    }


    const data =
      JSON.parse(raw);


    let reply = "";


    const candidates =
      data?.candidates || [];


    candidates.forEach(
      candidate => {

        const parts =
          candidate
            ?.content
            ?.parts || [];


        parts.forEach(
          part => {

            if (
              typeof part.text ===
              "string"
            ) {

              reply +=
                part.text;

            }

          }
        );

      }
    );


    reply =
      reply.trim();


    if (!reply) {

      return res.status(500).json({

        success: false,

        error:
          "Viggo returned an empty response."

      });

    }


    return res.json({

      success: true,

      reply:
        reply,

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
        "Server error",

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
