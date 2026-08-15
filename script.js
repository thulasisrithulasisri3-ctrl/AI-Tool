"use strict";

const API_URL =
  "https://ai-tool-2-zpul.onrender.com/api/chat";

const chat = document.getElementById("chat");
const messageInput = document.getElementById("message");
const sendButton = document.getElementById("send");
const saveButton = document.getElementById("saveButton");
const micButton = document.getElementById("mic");
const voiceToggle = document.getElementById("voiceToggle");
const historyButton = document.getElementById("historyButton");
const historyPanel = document.getElementById("historyPanel");
const closeHistory = document.getElementById("closeHistory");
const historyList = document.getElementById("historyList");

let history = [];
let currentUserMessage = "";
let currentAIMessage = "";


/* =====================================
   LOAD HISTORY
===================================== */

function loadHistory() {
  try {
    const saved = localStorage.getItem("viggoHistory");

    if (saved) {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        history = parsed;
      } else {
        history = [];
      }
    } else {
      history = [];
    }

  } catch (error) {
    console.error("History load error:", error);
    history = [];
  }
}


/* =====================================
   SAVE HISTORY TO BROWSER
===================================== */

function saveHistoryToStorage() {
  try {
    localStorage.setItem(
      "viggoHistory",
      JSON.stringify(history)
    );

    console.log(
      "✅ History saved:",
      history.length
    );

  } catch (error) {
    console.error(
      "❌ History save error:",
      error
    );
  }
}


/* Load when page starts */
loadHistory();


/* =====================================
   VOICE ON / OFF
===================================== */

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
      window.speechSynthesis.cancel();
    }
  }
}


updateVoiceButton();


voiceToggle.addEventListener(
  "click",
  function () {

    voiceEnabled = !voiceEnabled;

    localStorage.setItem(
      "viggoVoice",
      voiceEnabled
    );

    updateVoiceButton();

  }
);


/* =====================================
   SPEAK
===================================== */

function speak(text) {

  if (!voiceEnabled) return;

  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const speech =
    new SpeechSynthesisUtterance(text);

  speech.lang = "en-IN";
  speech.rate = 0.95;

  window.speechSynthesis.speak(speech);
}


/* =====================================
   ADD MESSAGE
===================================== */

function addMessage(text, type) {

  const div =
    document.createElement("div");

  div.className =
    "message " + type;

  div.textContent =
    text;

  chat.appendChild(div);

  chat.scrollTop =
    chat.scrollHeight;
}


/* =====================================
   AUTOMATIC HISTORY SAVE
===================================== */

function saveCurrentChat() {

  if (
    !currentUserMessage ||
    !currentAIMessage
  ) {
    return;
  }


  const chatItem = {

    id: Date.now(),

    user: currentUserMessage,

    ai: currentAIMessage,

    pinned: false,

    time: new Date().toLocaleString()

  };


  history.push(chatItem);

  saveHistoryToStorage();


  console.log(
    "✅ Chat automatically saved to history"
  );
}


/* =====================================
   SEND MESSAGE
===================================== */

async function sendMessage() {

  const text =
    messageInput.value.trim();


  if (!text) {
    return;
  }


  addMessage(
    text,
    "user"
  );


  currentUserMessage =
    text;

  currentAIMessage =
    "";


  messageInput.value =
    "";


  sendButton.disabled =
    true;

  sendButton.textContent =
    "...";


  try {

    console.log(
      "📤 Sending:",
      text
    );


    const response =
      await fetch(
        API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            message: text
          })
        }
      );


    const contentType =
      response.headers.get(
        "content-type"
      ) || "";


    if (
      !contentType
        .toLowerCase()
        .includes("application/json")
    ) {

      const raw =
        await response.text();

      console.error(
        "Server returned:",
        raw
      );

      throw new Error(
        "Server returned HTML instead of JSON."
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


    currentAIMessage =
      reply;


    addMessage(
      reply,
      "ai"
    );


    /* AUTOMATIC HISTORY SAVE */
    saveCurrentChat();


    /* VOICE */
    speak(reply);


  } catch (error) {

    console.error(
      "❌ Viggo error:",
      error
    );


    addMessage(
      "❌ " + error.message,
      "ai"
    );

  }


  sendButton.disabled =
    false;

  sendButton.textContent =
    "Send";

  messageInput.focus();
}


/* =====================================
   SEND BUTTON
===================================== */

sendButton.addEventListener(
  "click",
  sendMessage
);


/* =====================================
   ENTER TO SEND
===================================== */

messageInput.addEventListener(
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


/* =====================================
   SAVE BUTTON
===================================== */

saveButton.addEventListener(
  "click",
  function () {

    if (
      !currentUserMessage ||
      !currentAIMessage
    ) {

      alert(
        "Send a message first."
      );

      return;
    }


    /*
      Manual extra save.
      Automatic save already happens
      after every successful AI reply.
    */

    saveCurrentChat();


    saveButton.textContent =
      "✅ Saved";


    setTimeout(
      function () {

        saveButton.textContent =
          "💾 Save";

      },
      1500
    );

  }
);


/* =====================================
   SHOW HISTORY
===================================== */

function showHistory() {

  historyList.innerHTML =
    "";


  if (
    history.length === 0
  ) {

    historyList.innerHTML =
      '<div class="empty">No saved chats yet.</div>';

    return;
  }


  const sorted =
    [...history].sort(
      function (a, b) {

        if (
          a.pinned &&
          !b.pinned
        ) {
          return -1;
        }


        if (
          !a.pinned &&
          b.pinned
        ) {
          return 1;
        }


        return b.id - a.id;

      }
    );


  sorted.forEach(
    function (item) {

      const box =
        document.createElement(
          "div"
        );


      box.className =
        "history-item";


      if (item.pinned) {

        box.classList.add(
          "pinned"
        );
      }


      const title =
        document.createElement(
          "strong"
        );

      title.textContent =
        item.pinned
          ? "📌 Pinned Chat"
          : "💾 Saved Chat";


      const user =
        document.createElement(
          "div"
        );

      user.className =
        "history-user";

      user.textContent =
        "You: " + item.user;


      const ai =
        document.createElement(
          "div"
        );

      ai.className =
        "history-ai";

      ai.textContent =
        "Viggo: " + item.ai;


      const time =
        document.createElement(
          "div"
        );

      time.className =
        "history-time";

      time.textContent =
        item.time;


      const actions =
        document.createElement(
          "div"
        );

      actions.className =
        "history-actions";


      /* PIN */

      const pin =
        document.createElement(
          "button"
        );

      pin.type =
        "button";

      pin.className =
        "pin-btn";

      pin.textContent =
        item.pinned
          ? "📌 Unpin"
          : "📌 Pin";


      pin.addEventListener(
        "click",
        function () {

          const found =
            history.find(
              function (h) {

                return h.id === item.id;

              }
            );


          if (!found) {
            return;
          }


          found.pinned =
            !found.pinned;


          saveHistoryToStorage();

          showHistory();

        }
      );


      /* DELETE */

      const del =
        document.createElement(
          "button"
        );

      del.type =
        "button";

      del.className =
        "delete-btn";

      del.textContent =
        "🗑️ Delete";


      del.addEventListener(
        "click",
        function () {

          const answer =
            confirm(
              "Delete this chat?"
            );


          if (!answer) {
            return;
          }


          history =
            history.filter(
              function (h) {

                return h.id !== item.id;

              }
            );


          saveHistoryToStorage();

          showHistory();

        }
      );


      actions.appendChild(
        pin
      );

      actions.appendChild(
        del
      );


      box.appendChild(
        title
      );

      box.appendChild(
        user
      );

      box.appendChild(
        ai
      );

      box.appendChild(
        time
      );

      box.appendChild(
        actions
      );


      historyList.appendChild(
        box
      );

    }
  );
}


/* =====================================
   OPEN HISTORY
===================================== */

historyButton.addEventListener(
  "click",
  function () {

    showHistory();

    historyPanel.style.display =
      "block";

  }
);


/* =====================================
   CLOSE HISTORY
===================================== */

closeHistory.addEventListener(
  "click",
  function () {

    historyPanel.style.display =
      "none";

  }
);


/* =====================================
   CLOSE OUTSIDE
===================================== */

historyPanel.addEventListener(
  "click",
  function (event) {

    if (
      event.target === historyPanel
    ) {

      historyPanel.style.display =
        "none";

    }

  }
);


/* =====================================
   MICROPHONE
===================================== */

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


  recognition.onstart =
    function () {

      micButton.classList.add(
        "listening"
      );

      micButton.textContent =
        "🔴";
    };


  recognition.onend =
    function () {

      micButton.classList.remove(
        "listening"
      );

      micButton.textContent =
        "🎤";
    };


  recognition.onerror =
    function (event) {

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


  recognition.onresult =
    function (event) {

      const text =
        event.results[0][0]
          .transcript;


      messageInput.value =
        text;


      messageInput.focus();

    };


  micButton.addEventListener(
    "click",
    function () {

      try {

        recognition.start();

      } catch (error) {

        console.log(
          "Microphone already active"
        );

      }

    }
  );


} else {

  micButton.addEventListener(
    "click",
    function () {

      alert(
        "Microphone is not supported. Please use Chrome."
      );

    }
  );
}


/* =====================================
   DEBUG
===================================== */

console.log(
  "✅ Viggo script loaded"
);

console.log(
  "📜 Existing history:",
  history.length
);
