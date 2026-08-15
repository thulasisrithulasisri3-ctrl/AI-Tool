const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AI Tool backend is running"
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy"
  });
});

app.post("/api/chat", (req, res) => {
  const message = req.body?.message;

  if (!message) {
    return res.status(400).json({
      success: false,
      error: "Message is required"
    });
  }

  console.log("User:", message);

  res.json({
    success: true,
    reply: "You said: " + message
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found"
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`AI Tool running on port ${PORT}`);
});
