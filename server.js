const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

/* =========================
   MIDDLEWARE
========================= */

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
}));

app.use(express.json({ limit: "2mb" }));

/* =========================
   FRONTEND
========================= */

app.use(express.static(path.join(__dirname, "public")));

/* =========================
   SERVER STATUS
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
   CHAT
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

        console.log("USER:", message);
        console.log("HISTORY:", history.length);

        /*
        ==========================================
        VIGGO RESPONSE
        ==========================================

        Replace this section later with your
        Gemini/OpenAI/etc. API call.

        The important part now is that the
        frontend receives a valid JSON reply.
        */

        let reply;

        const text = message.toLowerCase();

        if (
            text === "hi" ||
            text === "hello" ||
            text === "hey"
        ) {

            reply =
                "Hi friend! 👋 I'm Viggo AI. How can I help you?";

        } else if (
            text.includes("who are you")
        ) {

            reply =
                "I'm Viggo AI 🤖, your AI friend.";

        } else if (
            text.includes("your name")
        ) {

            reply =
                "My name is Viggo AI. 🤖";

        } else if (
            text.includes("how are you")
        ) {

            reply =
                "I'm doing great, friend! 😊";

        } else if (
            text.includes("thank")
        ) {

            reply =
                "You're welcome, friend! ❤️";

        } else {

            reply =
                "Viggo received your message:\n\n" +
                message +
                "\n\nYour Viggo server is connected successfully. 🤖";

        }

        return res.status(200).json({
            success: true,
            reply: reply,
            response: reply,
            answer: reply,
            message: reply
        });

    } catch (error) {

        console.error("CHAT ERROR:", error);

        return res.status(500).json({
            success: false,
            error: "Internal server error",
            reply: "Sorry, something went wrong."
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
   START
========================= */

app.listen(PORT, "0.0.0.0", () => {

    console.log(
        `Viggo AI Server running on port ${PORT}`
    );

});
