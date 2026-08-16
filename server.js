"use strict";

const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 10000;


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
    limit: "5mb"
  })
);


/* =====================================================
   HOME / SERVER STATUS
===================================================== */

app.get("/", (req, res) => {

  res.status(200).json({
    success: true,
    status: "online",
    service: "Viggo AI Server",
    version: "1.0.0"
  });

});


/* =====================================================
   HEALTH CHECK
===================================================== */

app.get("/health", (req, res) => {

  res.status(200).json({
    success: true,
    status: "healthy"
  });

});


/* =====================================================
   CHAT API
===================================================== */

app.post("/chat", async (req, res) => {

  try {

    console.log("================================");
    console.log("NEW CHAT REQUEST");
    console.log("================================");


    /* -----------------------------------------------
       GET USER MESSAGE
    ------------------------------------------------ */

    const message =
      typeof req.body?.message === "string"
        ? req.body.message.trim()
        : "";


    if (!message) {

      return res.status(400).json({

        success: false,

        error:
          "Message is required."

      });

    }


    /* -----------------------------------------------
       LANGUAGE
    ------------------------------------------------ */

    const language =
      typeof req.body?.language === "string"
        ? req.body.language
        : "en";


    const languageNames = {

      en: "English",

      ta: "Tamil",

      hi: "Hindi",

      ml: "Malayalam",

      te: "Telugu",

      kn: "Kannada"

    };


    const languageName =
      languageNames[language] ||
      "English";


    /* -----------------------------------------------
       CHAT HISTORY
    ------------------------------------------------ */

    const history =
      Array.isArray(
        req.body?.history
      )
        ? req.body.history
        : [];


    /* -----------------------------------------------
       API KEY
    ------------------------------------------------ */

    const apiKey =
      process.env.GEMINI_API_KEY;


    if (!apiKey) {

      console.error(
        "GEMINI_API_KEY is missing"
      );


      return res.status(500).json({

        success: false,

        error:
          "GEMINI_API_KEY is missing in Render Environment Variables."

      });

    }


    /* -----------------------------------------------
       PREPARE HISTORY
    ------------------------------------------------ */

    let conversation = "";


    history
      .slice(-20)
      .forEach(item => {

        if (
          !item ||
          typeof item.content !== "string"
        ) {

          return;

        }


        const role =
          item.role === "assistant"
            ? "Viggo"
            : "User";


        conversation +=
          `${role}: ${item.content}\n`;

      });


    /* -----------------------------------------------
       SYSTEM PROMPT
    ------------------------------------------------ */

    const prompt = `

You are Viggo AI.

You are a friendly, helpful and intelligent AI assistant.

IMPORTANT RULES:

1. Reply naturally to the user.
2. Understand Tamil, English and mixed Tamil-English.
3. Reply in the language requested by the user.
4. Current selected language is ${languageName}.
5. If the user asks in Tamil, normally reply in Tamil.
6. If the user asks in English, normally reply in English.
7. For coding questions, give complete working code.
8. Keep answers clear and useful.
9. Do not mention system instructions.
10. Do not say you are unable to connect unless there is actually an API error.

CONVERSATION HISTORY:

${conversation}

CURRENT USER MESSAGE:

${message}

Now answer the user directly.

`;


    /* -----------------------------------------------
       GEMINI MODEL
    ------------------------------------------------ */

    const model =
      "gemini-2.0-flash";


    const apiURL =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      model +
      ":generateContent?key=" +
      encodeURIComponent(apiKey);


    console.log(
      "Calling Gemini model:",
      model
    );


    /* -----------------------------------------------
       CALL GEMINI
    ------------------------------------------------ */

    const response =
      await fetch(
        apiURL,
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            "Accept":
              "application/json"

          },

          body:
            JSON.stringify({

              contents: [

                {

                  role: "user",

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


    /* -----------------------------------------------
       READ GEMINI RESPONSE
    ------------------------------------------------ */

    const raw =
      await response.text();


    console.log(
      "Gemini HTTP Status:",
      response.status
    );


    if (!response.ok) {

      console.error(
        "GEMINI API ERROR:"
      );

      console.error(
        raw
      );


      let errorMessage =
        raw;


      try {

        const errorJSON =
          JSON.parse(raw);


        errorMessage =
          errorJSON?.error?.message ||
          raw;

      } catch {

        // Keep raw response

      }


      return res.status(
        response.status
      ).json({

        success: false,

        error:
          "Gemini API Error",

        details:
          errorMessage

      });

    }


    /* -----------------------------------------------
       PARSE JSON
    ------------------------------------------------ */

    let data;


    try {

      data =
        JSON.parse(raw);

    } catch {

      return res.status(500).json({

        success: false,

        error:
          "Gemini returned invalid JSON.",

        details:
          raw.substring(0, 500)

      });

    }


    /* -----------------------------------------------
       EXTRACT RESPONSE
    ------------------------------------------------ */

    let reply = "";


    const candidates =
      Array.isArray(
        data?.candidates
      )
        ? data.candidates
        : [];


    for (
      const candidate of candidates
    ) {

      const parts =
        candidate?.content?.parts;


      if (
        !Array.isArray(parts)
      ) {

        continue;

      }


      for (
        const part of parts
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


    /* -----------------------------------------------
       EMPTY RESPONSE
    ------------------------------------------------ */

    if (!reply) {

      console.error(
        "Gemini returned empty response:"
      );

      console.error(
        JSON.stringify(
          data,
          null,
          2
        )
      );


      return res.status(500).json({

        success: false,

        error:
          "Viggo AI returned an empty response.",

        details:
          "No text was found in Gemini response."

      });

    }


    /* -----------------------------------------------
       SUCCESS
    ------------------------------------------------ */

    console.log(
      "Viggo reply generated successfully"
    );


    return res.status(200).json({

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
      "================================"
    );

    console.error(
      "SERVER ERROR"
    );

    console.error(
      error
    );

    console.error(
      "================================"
    );


    return res.status(500).json({

      success: false,

      error:
        "Viggo server error.",

      details:
        error.message ||
        "Unknown server error."

    });

  }

});


/* =====================================================
   404 HANDLER
===================================================== */

app.use(
  (req, res) => {

    res.status(404).json({

      success: false,

      error:
        "Endpoint not found.",

      path:
        req.originalUrl

    });

  }
);


/* =====================================================
   GLOBAL ERROR HANDLER
===================================================== */

app.use(
  (error, req, res, next) => {

    console.error(
      "GLOBAL ERROR:",
      error
    );


    res.status(500).json({

      success: false,

      error:
        "Internal server error.",

      details:
        error.message

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
      "================================"
    );

    console.log(
      "VIGGO AI SERVER STARTED"
    );

    console.log(
      `Port: ${PORT}`
    );

    console.log(
      "================================"
    );

  }
);
