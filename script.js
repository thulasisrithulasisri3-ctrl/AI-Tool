"use strict";

/* =========================================
   VIGGO AI BACKEND SERVER
   (Fixed: uses gemini-flash-latest instead of
   the retired gemini-2.5-flash)
========================================= */

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

/* =========================================
   CONFIG
========================================= */

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Use the "latest" alias so this never breaks again
// when Google retires a dated model version.
const MODEL_NAME = "gemini-flash-latest";

const GEMINI_URL =
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

/* =========================================
   MIDDLEWARE
========================================= */

app.use(cors());
app.use(express.json());

/* =========================================
   HEALTH CHECK
========================================= */

app.get("/", function (req, res) {
    res.json({
        status: "ok",
        message: "Viggo AI backend is running",
        model: MODEL_NAME
    });
});

/* =========================================
   CHAT ENDPOINT
========================================= */

app.post("/chat", async function (req, res) {

    try {

        const { message, language, history } = req.body;

        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                success: false,
                error: "Message is required"
            });
        }

        if (!GEMINI_API_KEY) {
            return res.status(500).json({
                success: false,
                error: "Server misconfigured: missing GEMINI_API_KEY"
            });
        }

        // Build conversation contents for Gemini
        const contents = [];

        if (Array.isArray(history)) {
            history.forEach(function (item) {
                if (!item || !item.content) return;
                contents.push({
                    role: item.role === "assistant" ? "model" : "user",
                    parts: [{ text: String(item.content) }]
                });
            });
        }

        const languageInstruction = language && language !== "en"
            ? `Reply in ${language} language mixed naturally with English where helpful. `
            : "";

        contents.push({
            role: "user",
            parts: [{
                text: languageInstruction +
                    "You are Viggo, a friendly AI companion. Reply warmly and helpfully. User: " +
                    message
            }]
        });

        const geminiResponse = await fetch(GEMINI_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: contents
            })
        });

        const raw = await geminiResponse.text();

        let data;
        try {
            data = JSON.parse(raw);
        } catch (parseError) {
            console.error("Gemini returned non-JSON:", raw);
            return res.status(502).json({
                success: false,
                error: "Invalid response from Gemini API"
            });
        }

        if (!geminiResponse.ok) {
            console.error("Gemini API error:", data);
            return res.status(geminiResponse.status).json({
                success: false,
                error: (data.error && data.error.message) || "Gemini API error",
                details: (data.error && data.error.message) || null
            });
        }

        const reply =
            data.candidates &&
            data.candidates[0] &&
            data.candidates[0].content &&
            data.candidates[0].content.parts &&
            data.candidates[0].content.parts[0] &&
            data.candidates[0].content.parts[0].text;

        if (!reply || !reply.trim()) {
            return res.status(502).json({
                success: false,
                error: "Empty response from Gemini"
            });
        }

        return res.json({
            success: true,
            reply: reply.trim()
        });

    } catch (error) {
        console.error("Chat endpoint error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
            details: error.message
        });
    }

});

/* =========================================
   START SERVER
========================================= */

app.listen(PORT, function () {
    console.log("Viggo AI backend running on port " + PORT);
    console.log("Using Gemini model: " + MODEL_NAME);
});
