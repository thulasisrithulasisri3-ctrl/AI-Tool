const API_URL =
  "https://ai-tool-2-zpul.onrender.com/api/chat";

const input =
  document.querySelector("#messageInput") ||
  document.querySelector("#userInput") ||
  document.querySelector("textarea");

const sendButton =
  document.querySelector("#sendButton") ||
  document.querySelector("#sendBtn");

const chat =
  document.querySelector("#chat") ||
  document.querySelector("#chatContainer") ||
  document.querySelector(".chat-container");

function addMessage(text, type) {
  if (!chat) {
    console.log(type, text);
    return;
  }

  const div = document.createElement("div");

  div.className =
    type === "user"
      ? "message user-message"
      : "message ai-message";

  div.textContent = text;

  chat.appendChild(div);

  chat.scrollTop = chat.scrollHeight;
}

async function askAI(message) {
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

  console.log("Backend:", text);

  let data;

  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new Error(
      "Backend JSON response கிடைக்கவில்லை"
    );
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
      data.details ||
      "AI request failed"
    );
  }

  return data.reply;
}

async function sendMessage() {
  if (!input) {
    console.error(
      "Input element not found"
    );
    return;
  }

  const message = input.value.trim();

  if (!message) {
    return;
  }

  addMessage(message, "user");

  input.value = "";

  addMessage("Thinking...", "ai");

  try {
    const reply = await askAI(message);

    if (chat) {
      const aiMessages =
        chat.querySelectorAll(".ai-message");

      const last =
        aiMessages[aiMessages.length - 1];

      if (
        last &&
        last.textContent === "Thinking..."
      ) {
        last.remove();
      }
    }

    addMessage(reply, "ai");

  } catch (error) {
    console.error("AI Error:", error);

    if (chat) {
      const aiMessages =
        chat.querySelectorAll(".ai-message");

      const last =
        aiMessages[aiMessages.length - 1];

      if (
        last &&
        last.textContent === "Thinking..."
      ) {
        last.remove();
      }
    }

    addMessage(
      "❌ " + error.message,
      "ai"
    );
  }
}

if (sendButton) {
  sendButton.addEventListener(
    "click",
    sendMessage
  );
}

if (input) {
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
}

console.log(
  "AI frontend connected:",
  API_URL
);
