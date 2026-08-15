const API_URL = "/api/chat";

const chat = document.getElementById("chat");
const input = document.getElementById("message");
const sendButton = document.getElementById("send");

function addMessage(text, type) {
  const div = document.createElement("div");

  div.className = "message " + type;
  div.textContent = text;

  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

async function sendMessage() {
  const message = input.value.trim();

  if (!message) return;

  addMessage(message, "user");

  input.value = "";
  sendButton.disabled = true;
  sendButton.textContent = "...";

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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "AI request failed");
    }

    addMessage(data.reply, "ai");

  } catch (error) {
    console.error(error);

    addMessage(
      "❌ " + error.message,
      "ai"
    );
  }

  sendButton.disabled = false;
  sendButton.textContent = "Send";
  input.focus();
}

sendButton.addEventListener("click", sendMessage);

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});
