"use strict";

const express =
  require("express");

const cors =
  require("cors");

const path =
  require("path");

const {
  GoogleGenAI
} =
  require("@google/genai");


const app =
  express();


const PORT =
  process.env.PORT || 10000;


/* =====================================
   MIDDLEWARE
===================================== */

app.use(
  cors({
    origin: "*"
  })
);


app.use(
  express.json()
);


/* =====================================
   GEMINI
===================================== */

const API_KEY =
  process.env.GEMINI_API_KEY;


if (!API_KEY) {

  console.error(
    "❌ GEMINI_API_KEY is missing"
  );

} else {

  console.log(
    "✅ Gemini API key found"
  );

}


const ai =
  API_KEY
    ? new GoogleGenAI({
        apiKey:
          API_KEY,

        httpOptions: {
          apiVersion:
            "v1"
        }
      })
    : null;


/* =====================================
   STATIC FILES
===================================== */

app.use(
  express.static(
    __dirname
  )
);


/* =====================================
   HOME
===================================== */

app.get(
  "/",
  function (req, res) {

    res.sendFile(
      path.join(
        __dirname,
        "index.html"
      )
    );

  }
);


/* =====================================
   HEALTH
===================================== */

app.get(
  "/health",
  function (req, res) {

    res.status(200).json({

      success:
        true,

      app:
        "Viggo AI Assistant",

      status:
        "running"

    });

  }
);


/* =====================================
   CHAT API
===================================== */

app.post(
  "/api/chat",
  async function (req, res) {

    try {

      console.log(
        "📩 POST /api/chat"
      );


      const message =
        typeof req.body?.message ===
        "string"
          ? req.body.message.trim()
          : "";


      if (!message) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "Message is required"

          });

      }


      if (!ai) {

        return res
          .status(500)
          .json({

            success:
              false,

            error:
              "GEMINI_API_KEY is missing"

          });

      }


      console.log(
        "👤 User:",
        message
      );


      const interaction =
        await ai.interactions.create({

          model:
            "gemini-3.6-flash",

          input:
            message

        });


      console.log(
        "Gemini interaction received"
      );


      const reply =
        interaction.output_text ||
        interaction.outputText ||
        "";


      if (!reply) {

        console.error(
          "❌ Empty Gemini response:",
          interaction
        );


        return res
          .status(500)
          .json({

            success:
              false,

            error:
              "Gemini returned an empty response"

          });

      }


      console.log(
        "🤖 Viggo:",
        reply
      );


      return res
        .status(200)
        .json({

          success:
            true,

          reply:
            reply

        });


    } catch (error) {

      console.error(
        "❌ GEMINI ERROR:",
        error
      );


      return res
        .status(500)
        .json({

          success:
            false,

          error:
            error.message ||
            "Gemini request failed"

        });

    }

  }
);


/* =====================================
   API 404
===================================== */

app.use(
  "/api",
  function (req, res) {

    res
      .status(404)
      .json({

        success:
          false,

        error:
          "API route not found"

      });

  }
);


/* =====================================
   SERVER
===================================== */

app.listen(
  PORT,
  "0.0.0.0",
  function () {

    console.log(
      `🚀 Viggo AI Assistant running on port ${PORT}`
    );

  }
);
