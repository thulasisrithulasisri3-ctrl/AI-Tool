const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 10000;

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

/* =========================
   HEALTH CHECK
========================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    status: "online",
    service: "Viggo AI Server"
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "online",
    service: "Viggo AI Server"
  });
});

/* =========================
   CHAT API
========================= */

app.post("/chat", async (req, res) => {

  try {

    const message =
      typeof req.body.message === "string"
        ? req.body.message.trim()
        : "";

    const history =
      Array.isArray(req.body.history)
        ? req.body.history
        : [];

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Message is required"
      });
    }

    /*
      IMPORTANT:
      If you have a real AI API,
      connect it here.

      For now this server gives a
      working response instead of
      returning connection error.
    */

    let reply = "";

    const lower = message.toLowerCase();

    if (
      lower === "hi" ||
      lower === "hello" ||
      lower === "hey"
    ) {

      reply =
        "Hi friend! 👋 I'm Viggo AI. How can I help you?";

    }

    else if (
      lower.includes("who are you") ||
      lower.includes("your name")
    ) {

      reply =
        "I'm Viggo AI, your AI friend. 🤖";

    }

    else if (
      lower.includes("how are you")
    ) {

      reply =
        "I'm doing great, friend! 😊 What would you like to do?";

    }

    else if (
      lower.includes("thank")
    ) {

      reply =
        "You're welcome, friend! ❤️";

    }

    else {

      reply =
        `I received your message: "${message}"\n\nI'm Viggo AI. Your server is connected successfully.`;

    }

    return res.json({
      success: true,
      reply: reply,
      message: reply,
      historyLength: history.length
    });

  }

  catch (error) {

    console.error("CHAT ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });

  }

});

/* =========================
   404
========================= */

app.use((req, res) => {

  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.path
  });

});

/* =========================
   START SERVER
========================= */

app.listen(PORT, "0.0.0.0", () => {

  console.log(
    `Viggo AI Server running on port ${PORT}`
  );

});
