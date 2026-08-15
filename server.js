const API_URL = "https://ai-tool-2-zpul.onrender.com/api/chat";

let messages = [];

// ---------- DOM ----------
const input =
  document.querySelector("#messageInput") ||
  document.querySelector("#userInput") ||
  document.querySelector("textarea");

const sendButton =
  document.querySelector("#sendButton") ||
  document.querySelector("#sendBtn") ||
  document.querySelector("button[type='submit']");

const chatContainer =
  document.querySelector("#chat") ||
  document.querySelector("#chatContainer") ||
  document.querySelector(".chat-container") ||
  document.querySelector(".messages");

// ---------- Add message ----------
function addMessage(text, type) {
  if (!chatContainer) {
    console.log(type + ":", text);
    return;
  }

  const message = document.createElement("div");

  message.className =
    type === "user"
      ? "message user-message"
      : "message ai-message";

  message.textContent = text;

  chatContainer.appendChild(message);

  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ---------- AI request ----------
async function askAI(userMessage) {
  const response = await fetch(API_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      message: userMessage
    })
  });

  // Read text first so HTML errors don't cause
  // "Unexpected token <" JSON errors.
  const rawText = await response.text();

  let data;

  try {
    data = JSON.parse(rawText);
  } catch (error) {
    console.error("Server returned:", rawText);

    throw new Error(
      "Server JSON response கிடைக்கவில்லை. Backend URL அல்லது endpoint check பண்ணுங்க."
    );
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
      data.details ||
      "AI request failed"
    );
  }

  if (!data.reply) {
    throw new Error("AI response empty");
  }

  return data.reply;
}

// ---------- Send message ----------
async function sendMessage() {
  if (!input) {
    console.error(
      "Message input not found. Check your HTML input ID."
    );
    return;
  }

  const userMessage = input.value.trim();

  if (!userMessage) {
    return;
  }

  // Disable button while waiting
  if (sendButton) {
    sendButton.disabled = true;
  }

  // Show user message
  addMessage(userMessage, "user");

  // Clear input
  input.value = "";

  // Store history
  messages.push({
    role: "user",
    content: userMessage
  });

  try {
    // Show loading
    addMessage("Thinking...", "ai");

    const reply = await askAI(userMessage);

    // Remove last "Thinking..." message
    if (chatContainer) {
      const aiMessages =
        chatContainer.querySelectorAll(".ai-message");

      const lastMessage =
        aiMessages[aiMessages.length - 1];

      if (
        lastMessage &&
        lastMessage.textContent === "Thinking..."
      ) {
        lastMessage.remove();
      }
    }

    // Show AI reply
    addMessage(reply, "ai");

    // Store history
    messages.push({
      role: "assistant",
      content: reply
    });

    saveHistory();

  } catch (error) {
    console.error("AI Error:", error);

    // Remove Thinking message
    if (chatContainer) {
      const aiMessages =
        chatContainer.querySelectorAll(".ai-message");

      const lastMessage =
        aiMessages[aiMessages.length - 1];

      if (
        lastMessage &&
        lastMessage.textContent === "Thinking..."
      ) {
        lastMessage.remove();
      }
    }

    addMessage(
      "❌ " + error.message,
      "ai"
    );

  } finally {
    if (sendButton) {
      sendButton.disabled = false;
    }

    input.focus();
  }
}

// ---------- Button ----------
if (sendButton) {
  sendButton.addEventListener("click", function (event) {
    event.preventDefault();
    sendMessage();
  });
}

// ---------- Enter key ----------
if (input) {
  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });
}

// ---------- Local history ----------
function saveHistory() {
  localStorage.setItem(
    "ai_chat_history",
    JSON.stringify(messages)
  );
}

function loadHistory() {
  try {
    const saved =
      localStorage.getItem("ai_chat_history");

    if (!saved) {
      return;
    }

    messages = JSON.parse(saved);

    messages.forEach((message) => {
      addMessage(
        message.content,
        message.role === "user"
          ? "user"
          : "ai"
      );
    });

  } catch (error) {
    console.error(
      "History loading error:",
      error
    );
  }
}

// ---------- Start ----------
loadHistory();

console.log(
  "AI frontend connected to:",
  API_URL
);
