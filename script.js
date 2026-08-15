"use strict";

console.log("Viggo script.js loaded");


/* =================================
   RENDER BACKEND URL
================================= */

const API_URL =
  "https://ai-tool-2-zpul.onrender.com/api/chat";


/* =================================
   ELEMENTS
================================= */

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


/* =================================
   HISTORY
================================= */

let history = [];

try {

  history = JSON.parse(
    localStorage.getItem(
      "viggoHistory"
    ) || "[]"
  );

  if (!Array.isArray(history)) {
    history = [];
  }

} catch (error) {

  console.error(
    "History error:",
    error
  );

  history = [];

}


/* =================================
   CURRENT CHAT
================================= */

let currentUserMessage = "";
let currentAIMessage = "";


/* =================================
   VOICE
================================= */

let voiceEnabled =
  localStorage.getItem(
    "viggoVoice"
  ) !== "false";


function updateVoiceButton() {

  if (voiceEnabled) {

    voiceToggle.textContent =
      "🔊 Voice ON";

    voiceToggle.classList.remove(
      "off"
    );

  } else {

    voiceToggle.textContent =
      "🔇 Voice OFF";

    voiceToggle.classList.add(
      "off"
    );

    if (
      "speechSynthesis" in window
    ) {

      window.speechSynthesis.cancel();

    }

  }

}


updateVoiceButton();


voiceToggle.addEventListener(
  "click",
  function () {

    voiceEnabled =
      !voiceEnabled;

    localStorage.setItem(
      "viggoVoice",
      voiceEnabled
    );

    updateVoiceButton();

  }
);


/* =================================
   TEXT TO SPEECH
================================= */

function speak(text) {

  if (!voiceEnabled) {
    return;
  }

  if (
    !("speechSynthesis" in window)
  ) {
    return;
  }

  window.speechSynthesis.cancel();

  const utterance =
    new SpeechSynthesisUtterance(
      text
    );

  utterance.lang =
    "en-IN";

  utterance.rate =
    0.95;

  window.speechSynthesis.speak(
    utterance
  );

}


/* =================================
   ADD MESSAGE
================================= */

function addMessage(
  text,
  type
) {

  const div =
    document.createElement(
      "div"
    );

  div.className =
    "message " + type;

  div.textContent =
    text;

  chat.appendChild(
    div
  );

  chat.scrollTop =
    chat.scrollHeight;

}


/* =================================
   SAVE
================================= */

function saveCurrentChat() {

  if (
    !currentUserMessage ||
    !currentAIMessage
  ) {

    alert(
      "Send a message first, then press Save."
    );

    return;

  }


  const item = {

    id:
      Date.now(),

    user:
      currentUserMessage,

    ai:
      currentAIMessage,

    pinned:
      false,

    time:
      new Date().toLocaleString()

  };


  history.push(
    item
  );


  localStorage.setItem(
    "viggoHistory",
    JSON.stringify(history)
  );


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


saveButton.addEventListener(
  "click",
  saveCurrentChat
);


/* =================================
   SHOW HISTORY
================================= */

function showHistory() {

  historyList.innerHTML =
    "";


  if (
    history.length === 0
  ) {

    const empty =
      document.createElement(
        "div"
      );

    empty.className =
      "empty";

    empty.textContent =
      "No saved chats yet.";

    historyList.appendChild(
      empty
    );

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

      const container =
        document.createElement(
          "div"
        );

      container.className =
        "history-item";


      if (item.pinned) {

        container.classList.add(
          "pinned"
        );

      }


      const title =
        document.createElement(
          "div"
        );

      title.className =
        "history-title";

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
        "You: " +
        item.user;


      const ai =
        document.createElement(
          "div"
        );

      ai.className =
        "history-ai";

      ai.textContent =
        "Viggo: " +
        item.ai;


      const time =
        document.createElement(
          "small"
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

      const pinButton =
        document.createElement(
          "button"
        );

      pinButton.type =
        "button";

      pinButton.className =
        "pin-btn";

      pinButton.textContent =
        item.pinned
          ? "📌 Unpin"
          : "📌 Pin";


      pinButton.addEventListener(
        "click",
        function () {

          const found =
            history.find(
              function (h) {
                return h.id === item.id;
              }
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

        }
      );


      /* DELETE */

      const deleteButton =
        document.createElement(
          "button"
        );

      deleteButton.type =
        "button";

      deleteButton.className =
        "delete-btn";

      deleteButton.textContent =
        "🗑️ Delete";


      deleteButton.addEventListener(
        "click",
        function () {

          const ok =
            confirm(
              "Delete this chat?"
            );


          if (!ok) {
            return;
          }


          history =
            history.filter(
              function (h) {
                return h.id !== item.id;
              }
            );


          localStorage.setItem(
            "viggoHistory",
            JSON.stringify(history)
          );


          showHistory();

        }
      );


      actions.appendChild(
        pinButton
      );

      actions.appendChild(
        deleteButton
      );


      container.appendChild(
        title
      );

      container.appendChild(
        user
      );

      container.appendChild(
        ai
      );

      container.appendChild(
        time
      );

      container.appendChild(
        actions
      );


      historyList.appendChild(
        container
      );

    }
  );

}


/* =================================
   HISTORY OPEN
================================= */

historyButton.addEventListener(
  "click",
  function () {

    showHistory();

    historyPanel.style.display =
      "block";

  }
);


/* =================================
   HISTORY CLOSE
================================= */

closeHistory.addEventListener(
  "click",
  function () {

    historyPanel.style.display =
      "none";

  }
);


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


/* =================================
   SEND MESSAGE
================================= */

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


  messageInput.value =
    "";


  currentUserMessage =
    text;

  currentAIMessage =
    "";


  sendButton.disabled =
    true;

  sendButton.textContent =
    "...";


  try {

    console.log(
      "Sending request to:",
      API_URL
    );


    const response =
      await fetch(
        API_URL,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              message:
                text
            })
        }
      );


    const contentType =
      response.headers.get(
        "content-type"
      ) || "";


    console.log(
      "HTTP status:",
      response.status
    );

    console.log(
      "Content-Type:",
      contentType
    );


    /* IMPORTANT:
       Prevent HTML -> JSON error
    */

    if (
      !contentType.includes(
        "application/json"
      )
    ) {

      const raw =
        await response.text();


      console.error(
        "Server returned:",
        raw
      );


      throw new Error(
        "Server returned HTML instead of JSON. Check Render /api/chat."
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


    speak(
      reply
    );


  } catch (error) {

    console.error(
      "Viggo API error:",
      error
    );


    addMessage(
      "❌ " +
      error.message,
      "ai"
    );

  }


  sendButton.disabled =
    false;

  sendButton.textContent =
    "Send";

  messageInput.focus();

}


/* =================================
   SEND BUTTON
================================= */

sendButton.addEventListener(
  "click",
  sendMessage
);


/* =================================
   ENTER KEY
================================= */

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


/* =================================
   MICROPHONE
================================= */

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;


let recognition =
  null;


if (SpeechRecognition) {

  recognition =
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
        "Microphone error:",
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

      const transcript =
        event.results[0][0]
          .transcript;


      messageInput.value =
        transcript;

    };


  micButton.addEventListener(
    "click",
    function () {

      try {

        recognition.start();

      } catch (error) {

        console.log(
          "Microphone already running."
        );

      }

    }
  );


} else {

  micButton.addEventListener(
    "click",
    function () {

      alert(
        "Microphone is not supported in this browser. Please use Chrome."
      );

    }
  );

}


console.log(
  "Viggo AI Assistant ready."
);
