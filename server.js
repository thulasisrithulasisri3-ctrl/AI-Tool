/*
=====================================================
VIGGO AI SERVER
server/server.js
=====================================================
*/

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;


/* =====================================================
   MIME TYPES
===================================================== */

const mimeTypes = {

  ".html": "text/html; charset=utf-8",

  ".js": "application/javascript; charset=utf-8",

  ".css": "text/css; charset=utf-8",

  ".json": "application/json; charset=utf-8",

  ".png": "image/png",

  ".jpg": "image/jpeg",

  ".jpeg": "image/jpeg",

  ".svg": "image/svg+xml",

  ".ico": "image/x-icon"

};


/* =====================================================
   READ REQUEST BODY
===================================================== */

function readBody(req) {

  return new Promise(
    (resolve, reject) => {

      let body = "";

      req.on(
        "data",
        chunk => {

          body += chunk;

          if (body.length > 1e6) {

            req.destroy();

            reject(
              new Error(
                "Request too large"
              )
            );

          }

        }
      );


      req.on(
        "end",
        () => {

          try {

            resolve(
              body
                ? JSON.parse(body)
                : {}
            );

          } catch {

            reject(
              new Error(
                "Invalid JSON"
              )
            );

          }

        }
      );


      req.on(
        "error",
        reject
      );

    }
  );
}


/* =====================================================
   SEND JSON
===================================================== */

function sendJSON(
  res,
  status,
  data
) {

  res.writeHead(
    status,
    {
      "Content-Type":
        "application/json; charset=utf-8",

      "Access-Control-Allow-Origin":
        "*",

      "Access-Control-Allow-Headers":
        "Content-Type",

      "Access-Control-Allow-Methods":
        "GET, POST, OPTIONS"
    }
  );


  res.end(
    JSON.stringify(data)
  );
}


/* =====================================================
   AI RESPONSE
===================================================== */

async function getAIResponse(
  message,
  history
) {

  const apiKey =
    process.env.OPENAI_API_KEY;


  /*
    If no API key is available,
    return a simple response so
    the application can still be tested.
  */

  if (!apiKey) {

    return `
Hello! I'm Viggo B.

I received your message:

"${message}"

Your Viggo interface and server are working correctly.

To connect Viggo to a real AI model, add your OPENAI_API_KEY and restart the server.
`;

  }


  /*
  =====================================================
  OPENAI API
  =====================================================
  */

  const messages = [

    {
      role: "system",

      content:
        "You are Viggo, a helpful, friendly AI assistant. Give clear and useful answers."
    }

  ];


  if (Array.isArray(history)) {

    history
      .slice(-12)
      .forEach(item => {

        if (
          item &&
          (
            item.role === "user" ||
            item.role === "assistant"
          )
        ) {

          messages.push({

            role: item.role,

            content:
              String(
                item.content || ""
              )

          });

        }

      });

  }


  /*
    Avoid adding the same message twice.
  */

  if (
    messages[messages.length - 1]?.content !==
    message
  ) {

    messages.push({

      role: "user",

      content: message

    });

  }


  const response =
    await fetch(
      "https://api.openai.com/v1/chat/completions",
      {

        method: "POST",

        headers: {

          "Content-Type":
            "application/json",

          "Authorization":
            `Bearer ${apiKey}`

        },

        body:
          JSON.stringify({

            model:
              "gpt-4o-mini",

            messages,

            temperature:
              0.7

          })

      }
    );


  if (!response.ok) {

    const errorText =
      await response.text();

    console.error(
      "OpenAI API error:",
      errorText
    );

    throw new Error(
      "AI API request failed"
    );

  }


  const data =
    await response.json();


  return (
    data
      ?.choices?.[0]
      ?.message
      ?.content
      ||
    "I couldn't generate a response."
  );
}


/* =====================================================
   SERVER
===================================================== */

const server =
  http.createServer(
    async (req, res) => {

      /*
      ---------------------------------------------------
      CORS / OPTIONS
      ---------------------------------------------------
      */

      if (req.method === "OPTIONS") {

        res.writeHead(
          204,
          {
            "Access-Control-Allow-Origin":
              "*",

            "Access-Control-Allow-Headers":
              "Content-Type",

            "Access-Control-Allow-Methods":
              "GET, POST, OPTIONS"
          }
        );

        res.end();

        return;
      }


      /*
      ---------------------------------------------------
      HEALTH CHECK
      ---------------------------------------------------
      */

      if (
        req.method === "GET" &&
        req.url === "/api/health"
      ) {

        sendJSON(
          res,
          200,
          {
            status: "ok",
            app: "Viggo",
            message:
              "Viggo server is running"
          }
        );

        return;
      }


      /*
      ---------------------------------------------------
      CHAT API
      ---------------------------------------------------
      */

      if (
        req.method === "POST" &&
        req.url === "/api/chat"
      ) {

        try {

          const body =
            await readBody(req);


          const message =
            String(
              body.message || ""
            ).trim();


          const history =
            Array.isArray(
              body.history
            )
              ? body.history
              : [];


          if (!message) {

            sendJSON(
              res,
              400,
              {
                error:
                  "Message is required"
              }
            );

            return;
          }


          const reply =
            await getAIResponse(
              message,
              history
            );


          sendJSON(
            res,
            200,
            {
              reply
            }
          );


        } catch (error) {

          console.error(
            "Chat error:",
            error
          );


          sendJSON(
            res,
            500,
            {
              reply:
                "Sorry, Viggo couldn't process your request right now."
            }
          );

        }

        return;
      }


      /*
      ---------------------------------------------------
      STATIC FILES
      ---------------------------------------------------
      */

      let requestedPath =
        req.url.split("?")[0];


      if (
        requestedPath === "/" ||
        requestedPath === ""
      ) {

        requestedPath =
          "/index.html";

      }


      const filePath =
        path.join(
          __dirname,
          "..",
          requestedPath
        );


      /*
      Security:
      Don't allow files outside
      the project directory.
      */

      const projectRoot =
        path.resolve(
          __dirname,
          ".."
        );


      const absoluteFile =
        path.resolve(
          filePath
        );


      if (
        !absoluteFile.startsWith(
          projectRoot
        )
      ) {

        res.writeHead(403);

        res.end(
          "Forbidden"
        );

        return;
      }


      fs.readFile(
        absoluteFile,
        (error, data) => {

          if (error) {

            res.writeHead(
              404,
              {
                "Content-Type":
                  "text/plain"
              }
            );

            res.end(
              "404 - File not found"
            );

            return;
          }


          const ext =
            path.extname(
              absoluteFile
            );


          const contentType =
            mimeTypes[ext] ||
            "application/octet-stream";


          res.writeHead(
            200,
            {
              "Content-Type":
                contentType
            }
          );


          res.end(data);

        }
      );

    }
  );


/* =====================================================
   START SERVER
===================================================== */

server.listen(
  PORT,
  () => {

    console.log(
      "================================"
    );

    console.log(
      "        VIGGO AI SERVER"
    );

    console.log(
      "================================"
    );

    console.log(
      `Viggo running at: http://localhost:${PORT}`
    );

    console.log(
      `Health check: http://localhost:${PORT}/api/health`
    );

    console.log(
      "================================"
    );

  }
);


/* =====================================================
   ERROR HANDLING
===================================================== */

server.on(
  "error",
  error => {

    if (error.code === "EADDRINUSE") {

      console.error(
        `Port ${PORT} is already in use.`
      );

    } else {

      console.error(
        "Server error:",
        error
      );

    }

  }
);
