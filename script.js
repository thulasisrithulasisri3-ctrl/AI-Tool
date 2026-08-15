"use strict";

const API_URL =
  "https://ai-tool-2-zpul.onrender.com/api/chat";


const chat =
  document.getElementById("chat");

const messageInput =
  document.getElementById("message");

const sendButton =
  document.getElementById("send");

const saveButton =
  document.getElementById("saveButton");

const micButton =
  document.getElementById("mic");

const voiceToggle =
  document.getElementById("voiceToggle");

const historyButton =
  document.getElementById("historyButton");

const historyPanel =
  document.getElementById("historyPanel");

const closeHistory =
  document.getElementById("closeHistory");

const historyList =
  document.getElementById("historyList");


/* =========================
   HISTORY
========================= */

let history = [];

try {
  history = JSON.parse(
    localStorage.getItem("viggoHistory") || "[]"
  );

  if (!Array.isArray(history)) {
    history = [];
  }

} catch {
  history = [];
}


let currentUserMessage = "";
let currentAIMessage = "";


/* =========================
   VOICE ON / OFF
========================= */

let voiceEnabled =
  localStorage.getItem("viggoVoice") !== "false";


function updateVoiceButton() {

  if (voiceEnabled) {

    voiceToggle.textContent =
      "🔊 Voice ON";

    voiceToggle.classList.remove("off");

  } else {

    voiceToggle.textContent =
      "🔇 Voice OFF";

    voiceToggle.classList.add("off");

    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
    }
  }
}


updateVoiceButton();


voiceToggle.addEventListener("click", () => {

  voiceEnabled = !voiceEnabled;

  localStorage.setItem(
    "viggoVoice",
    voiceEnabled
  );

  updateVoiceButton();

});


/* =========================
   SPEAK
========================= */

function speak(text) {

  if (!voiceEnabled) return;

  if (!("speechSynthesis" in window)) return;

  speechSynthesis.cancel();

  const speech =
    new SpeechSynthesisUtterance(text);

  speech.lang = "en-IN";
  speech.rate = 0.95;

  speechSynthesis.speak(speech);
}


/* =========================
   MESSAGE
========================= */

function addMessage(text, type) {

  const div =
    document.createElement("div");

  div.className =
    "message " + type;

  div.textContent = text;

  chat.appendChild(div);

  chat.scrollTop =
    chat.scrollHeight;
}


/* =========================
   SEND
========================= */

async function sendMessage() {

  const text =
    messageInput.value.trim();

  if (!text) return;


  addMessage(text, "user");

  currentUserMessage = text;
  currentAIMessage = "";

  messageInput.value = "";

  sendButton.disabled = true;
  sendButton.textContent = "...";


  try {

    const response =
      await fetch(API_URL, {

        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          message: text
        })

      });


    const contentType =
      response.headers.get("content-type") || "";


    if (!contentType.includes("application/json")) {

      const raw =
        await response.text();

      console.error(
        "Server returned:",
        raw
      );

      throw new Error(
        "Server returned HTML instead of JSON"
      );
    }


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "AI request failed"
      );
    }


    const reply =
      data.reply ||
      "No response received.";


    currentAIMessage = reply;

    addMessage(
      reply,
      "ai"
    );

    speak(reply);


  } catch (error) {

    console.error(
      "Viggo error:",
      error
    );

    addMessage(
      "❌ " + error.message,
      "ai"
    );

  }


  sendButton.disabled = false;
  sendButton.textContent = "Send";

  messageInput.focus();
}


sendButton.addEventListener(
  "click",
  sendMessage
);


/* ENTER */

messageInput.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      sendMessage();
    }

  }
);


/* =========================
   SAVE
========================= */

saveButton.addEventListener(
  "click",
  () => {

    if (
      !currentUserMessage ||
      !currentAIMessage
    ) {

      alert(
        "Send a message first."
      );

      return;
    }


    history.push({

      id: Date.now(),

      user:
        currentUserMessage,

      ai:
        currentAIMessage,

      pinned: false,

      time:
        new Date().toLocaleString()

    });


    localStorage.setItem(
      "viggoHistory",
      JSON.stringify(history)
    );


    saveButton.textContent =
      "✅ Saved";


    setTimeout(() => {

      saveButton.textContent =
        "💾 Save";

    }, 1500);

  }
);


/* =========================
   HISTORY
========================= */

function showHistory() {

  historyList.innerHTML = "";


  if (history.length === 0) {

    historyList.innerHTML =
      '<div class="empty">No saved chats yet.</div>';

    return;
  }


  const sorted =
    [...history].sort(
      (a, b) => {

        if (a.pinned && !b.pinned)
          return -1;

        if (!a.pinned && b.pinned)
          return 1;

        return b.id - a.id;
      }
    );


  sorted.forEach(item => {

    const box =
      document.createElement("div");

    box.className =
      "history-item";


    if (item.pinned) {
      box.classList.add("pinned");
    }


    box.innerHTML = `
      <strong>
        ${item.pinned ? "📌 Pinned Chat" : "💾 Saved Chat"}
      </strong>

      <div class="history-user">
        You: ${escapeHTML(item.user)}
      </div>

      <div class="history-ai">
        Viggo: ${escapeHTML(item.ai)}
      </div>

      <div class="history-time">
        ${escapeHTML(item.time)}
      </div>
    `;


    const actions =
      document.createElement("div");

    actions.className =
      "history-actions";


    const pin =
      document.createElement("button");

    pin.className =
      "pin-btn";

    pin.textContent =
      item.pinned
        ? "📌 Unpin"
        : "📌 Pin";


    pin.onclick = () => {

      const found =
        history.find(
          h => h.id === item.id
        );

      if (found) {

        found.pinned =
          !found.pinned;

        localStorage.setItem(
          "viggoHistory",
          JSON.stringify(history)
        );

        showHistory();
      }
    };


    const del =
      document.createElement("button");

    del.className =
      "delete-btn";

    del.textContent =
      "🗑️ Delete";


    del.onclick = () => {

      if (
        !confirm("Delete this chat?")
      ) {
        return;
      }


      history =
        history.filter(
          h => h.id !== item.id
        );


      localStorage.setItem(
        "viggoHistory",
        JSON.stringify(history)
      );


      showHistory();
    };


    actions.appendChild(pin);
    actions.appendChild(del);

    box.appendChild(actions);

    historyList.appendChild(box);

  });
}


function escapeHTML(text) {

  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* OPEN HISTORY */

historyButton.addEventListener(
  "click",
  () => {

    showHistory();

    historyPanel.style.display =
      "block";

  }
);


/* CLOSE HISTORY */

closeHistory.addEventListener(
  "click",
  () => {

    historyPanel.style.display =
      "none";

  }
);


/* =========================
   MICROPHONE
========================= */

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;


if (SpeechRecognition) {

  const recognition =
    new SpeechRecognition();


  recognition.lang =
    "en-IN";

  recognition.continuous =
    false;

  recognition.interimResults =
    false;


  recognition.onstart = () => {

    micButton.classList.add(
      "listening"
    );

    micButton.textContent =
      "🔴";
  };


  recognition.onend = () => {

    micButton.classList.remove(
      "listening"
    );

    micButton.textContent =
      "🎤";
  };


  recognition.onerror = event => {

    console.error(
      "Mic error:",
      event.error
    );

    micButton.classList.remove(
      "listening"
    );

    micButton.textContent =
      "🎤";
  };


  recognition.onresult = event => {

    messageInput.value =
      event.results[0][0].transcript;

  };


  micButton.addEventListener(
    "click",
    () => {

      try {
        recognition.start();
      } catch {
        console.log(
          "Microphone already active"
        );
      }

    }
  );


} else {

  micButton.addEventListener(
    "click",
    () => {

      alert(
        "Microphone is not supported. Use Chrome."
      );

    }
  );
}


console.log(
  "✅ Viggo script loaded"
);
