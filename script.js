
const API_URL = "https://ai-tool-2-zpul.onrender.com/api/chat";

const chat = document.getElementById("chat");
const input = document.getElementById("message");
const sendButton = document.getElementById("send");

function addMessage(text, type) {
  const message = document.createElement("div");

  message.className = "message " + type;
  message.textContent = text;

  chat.appendChild(message);
  chat.scrollTop = chat.scrollHeight;
}

async function sendMessage() {
  const message = input.value.trim();

  if (!message) {
    return;
  }

  addMessage(message, "user");

  input.value = "";
  sendButton.disabled = true;
  sendButton.textContent = "…";

  const loading = document.createElement("div");
  loading.className = "message ai";
  loading.textContent = "Thinking...";

  chat.appendChild(loading);

  try {
    const response = await fetch(API_URL, {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        message: message
      })
    });

    const text = await response.text();

    console.log("Server response:", text);

    let data;

    try {
      data = JSON.parse(text);
    } catch (error) {
      throw new Error(
        "Server JSON response கொடுக்கவில்லை: " + text
      );
    }

    if (!response.ok) {
      throw new Error(
        data.error || "Request failed"
      );
    }

    loading.remove();

    addMessage(
      data.reply || "Empty response",
      "ai"
    );

  } catch (error) {
    console.error("Connection error:", error);

    loading.remove();

    addMessage(
      "❌ " + error.message,
      "ai"
    );
  }

  sendButton.disabled = false;
  sendButton.textContent = "Send";

  input.focus();
}

sendButton.addEventListener(
  "click",
  sendMessage
);

input.addEventListener(
  "keydown",
  function (event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendMessage();
    }
  }
);
