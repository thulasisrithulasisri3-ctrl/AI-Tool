"use strict";

/* =========================================
   VIGGO AI
   ========================================= */

const API_BASE =
  "https://ai-tool-1-fgmc.onrender.com";

const CHAT_API =
  `${API_BASE}/api/chat`;


/* =========================================
   ELEMENTS
   ========================================= */

const sidebar = document.getElementById("sidebar");
const openSidebar = document.getElementById("openSidebar");
const closeSidebar = document.getElementById("closeSidebar");

const newChat = document.getElementById("newChat");
const conversation = document.getElementById("conversation");

const messageInput = document.getElementById("message");
const sendButton = document.getElementById("send");
const micButton = document.getElementById("mic");

const plusBtn = document.getElementById("plusBtn");
const plusMenu = document.getElementById("plusMenu");

const chatHistory = document.getElementById("chatHistory");
const searchChat = document.getElementById("searchChat");


/* MORE */

const moreBtn = document.getElementById("moreBtn");
const moreMenu = document.getElementById("moreMenu");


/* TOP MORE */

const topMoreBtn = document.getElementById("topMoreBtn");
const topMoreMenu = document.getElementById("topMoreMenu");


/* MODALS */

const voiceModal = document.getElementById("voiceModal");
const languageModal = document.getElementById("languageModal");

const closeVoice = document.getElementById("closeVoice");
const closeLanguage = document.getElementById("closeLanguage");

const voiceSelect = document.getElementById("voiceSelect");
const voiceTest = document.getElementById("voiceTest");

const languageSelect = document.getElementById("languageSelect");
const saveLanguage = document.getElementById("saveLanguage");


/* =========================================
   DATA
   ========================================= */

let chats =
  JSON.parse(localStorage.getItem("viggo_chats") || "[]");

let currentChat = null;

let selectedVoice = "female";
let selectedLanguage = "English";

let speakingButton = null;


/* =========================================
   SAVE DATA
   ========================================= */

function saveChats() {
  localStorage.setItem(
    "viggo_chats",
    JSON.stringify(chats)
  );
}


/* =========================================
   NEW CHAT
   ========================================= */

function createNewChat() {

  const id =
    Date.now().toString();

  currentChat = {
    id: id,
    title: "New Chat",
    messages: []
  };

  chats.unshift(currentChat);

  saveChats();

  renderHistory();

  conversation.innerHTML = "";

  messageInput.focus();
}


/* =========================================
   LOAD CHAT
   ========================================= */

function loadChat(id) {

  const found =
    chats.find(chat => chat.id === id);

  if (!found) return;

  currentChat = found;

  conversation.innerHTML = "";

  found.messages.forEach(message => {

    addMessage(
      message.role,
      message.text,
      false
    );

  });
}


/* =========================================
   HISTORY
   ========================================= */

function renderHistory(filter = "") {

  chatHistory.innerHTML = "";

  const filtered =
    chats.filter(chat =>
      chat.title
        .toLowerCase()
        .includes(filter.toLowerCase())
    );

  filtered.forEach(chat => {

    const item =
      document.createElement("div");

    item.className = "history-item";

    item.innerHTML = `
      <span class="history-name">
        ${escapeHTML(chat.title)}
      </span>

      <button
        class="pin-btn"
        title="Pin"
        data-pin="${chat.id}">
        📌
      </button>

      <button
        class="delete-history-btn"
        title="Delete"
        data-delete="${chat.id}">
        🗑
      </button>
    `;

    item
      .querySelector(".history-name")
      .addEventListener("click", () => {
        loadChat(chat.id);
      });

    item
      .querySelector("[data-pin]")
      .addEventListener("click", event => {

        event.stopPropagation();

        chat.pinned =
          !chat.pinned;

        saveChats();

        renderHistory(filter);
      });

    item
      .querySelector("[data-delete]")
      .addEventListener("click", event => {

        event.stopPropagation();

        chats =
          chats.filter(
            c => c.id !== chat.id
          );

        if (
          currentChat &&
          currentChat.id === chat.id
        ) {
          currentChat = null;
          conversation.innerHTML = "";
        }

        saveChats();

        renderHistory(filter);
      });

    chatHistory.appendChild(item);

  });
}


/* =========================================
   ADD MESSAGE
   ========================================= */

function addMessage(
  role,
  text,
  save = true
) {

  const message =
    document.createElement("div");

  message.className =
    `message ${role}`;

  const bubble =
    document.createElement("div");

  bubble.className =
    "message-bubble";

  const textDiv =
    document.createElement("div");

  textDiv.className =
    "message-text";

  textDiv.innerHTML =
    formatText(text);

  bubble.appendChild(textDiv);


  /* ================================
     ACTION BUTTONS
     ================================ */

  const actions =
    document.createElement("div");

  actions.className =
    "message-actions";


  /*
     LIKE
  */

  const like =
    document.createElement("button");

  like.className =
    "message-action";

  like.innerHTML =
    "👍 Like";

  like.addEventListener(
    "click",
    () => {

      like.classList.toggle("active");

    }
  );


  /*
     DISLIKE
  */

  const dislike =
    document.createElement("button");

  dislike.className =
    "message-action";

  dislike.innerHTML =
    "👎 Dislike";

  dislike.addEventListener(
    "click",
    () => {

      dislike.classList.toggle("active");

    }
  );


  /*
     SPEAKER

     IMPORTANT:
     Speaker is placed NEXT TO LIKE/DISLIKE
     under the chat message.
  */

  const speaker =
    document.createElement("button");

  speaker.className =
    "message-action speaker";

  speaker.innerHTML =
    "🔊";

  speaker.title =
    "Speaker ON/OFF";

  speaker.addEventListener(
    "click",
    () => {

      toggleSpeaker(
        text,
        speaker
      );

    }
  );


  /*
     COPY
  */

  const copy =
    document.createElement("button");

  copy.className =
    "message-action";

  copy.innerHTML =
    "📋 Copy";

  copy.addEventListener(
    "click",
    async () => {

      try {

        await navigator.clipboard.writeText(text);

        copy.innerHTML =
          "✓ Copied";

        setTimeout(() => {

          copy.innerHTML =
            "📋 Copy";

        }, 1200);

      } catch (error) {

        console.error(error);

      }

    }
  );


  /*
     ACTION BUTTON ORDER
  */

  if (role === "assistant") {

    actions.appendChild(copy);
    actions.appendChild(like);
    actions.appendChild(dislike);

    /*
       Speaker is beside Like/Dislike
    */

    actions.appendChild(speaker);

  } else {

    actions.appendChild(like);
    actions.appendChild(dislike);
    actions.appendChild(speaker);

  }


  bubble.appendChild(actions);

  message.appendChild(bubble);

  conversation.appendChild(message);

  conversation.parentElement.scrollTop =
    conversation.parentElement.scrollHeight;


  /* =================================
     SAVE MESSAGE
     ================================= */

  if (save) {

    if (!currentChat) {

      createNewChat();

    }

    currentChat.messages.push({
      role: role,
      text: text
    });

    if (
      currentChat.title === "New Chat" &&
      role === "user"
    ) {

      currentChat.title =
        text.substring(0, 30);

    }

    saveChats();

    renderHistory();

  }
}


/* =========================================
   SPEAKER ON / OFF
   ========================================= */

function toggleSpeaker(
  text,
  button
) {

  /*
     If another message is speaking,
     stop it first.
  */

  if (
    speechSynthesis.speaking &&
    speakingButton &&
    speakingButton !== button
  ) {

    speechSynthesis.cancel();

    speakingButton.classList.remove(
      "active"
    );

    speakingButton.innerHTML =
      "🔊";
  }


  /*
     TURN OFF
  */

  if (
    speechSynthesis.speaking &&
    speakingButton === button
  ) {

    speechSynthesis.cancel();

    button.classList.remove(
      "active"
    );

    button.innerHTML =
      "🔊";

    speakingButton = null;

    return;
  }


  /*
     TURN ON
  */

  const utterance =
    new SpeechSynthesisUtterance(text);

  utterance.lang =
    getSpeechLanguage();

  const voices =
    speechSynthesis.getVoices();

  if (selectedVoice === "female") {

    const female =
      voices.find(v =>
        /female|samantha|zira|google us english/i
          .test(v.name)
      );

    if (female) {
      utterance.voice = female;
    }

  } else {

    const male =
      voices.find(v =>
        /male|david|alex/i
          .test(v.name)
      );

    if (male) {
      utterance.voice = male;
    }

  }


  button.classList.add(
    "active"
  );

  button.innerHTML =
    "⏹";

  speakingButton =
    button;


  utterance.onend =
    () => {

      button.classList.remove(
        "active"
      );

      button.innerHTML =
        "🔊";

      speakingButton = null;

    };


  speechSynthesis.speak(
    utterance
  );

}


/* =========================================
   SPEECH LANGUAGE
   ========================================= */

function getSpeechLanguage() {

  const languages = {

    English: "en-US",

    Tamil: "ta-IN",

    Hindi: "hi-IN",

    Malayalam: "ml-IN",

    Telugu: "te-IN",

    Kannada: "kn-IN"

  };

  return (
    languages[selectedLanguage] ||
    "en-US"
  );
}


/* =========================================
   SEND MESSAGE
   ========================================= */

async function sendMessage() {

  const text =
    messageInput.value.trim();

  if (!text) return;


  if (!currentChat) {

    createNewChat();

  }


  addMessage(
    "user",
    text,
    true
  );


  messageInput.value = "";

  messageInput.style.height = "auto";


  const loading =
    document.createElement("div");

  loading.className =
    "message assistant";

  loading.innerHTML = `
    <div class="message-bubble">
      <div class="message-text">
        <span>Viggo AI is thinking...</span>
      </div>
    </div>
  `;

  conversation.appendChild(
    loading
  );


  try {

    const response =
      await fetch(
        CHAT_API,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            message: text,
            chatId: currentChat.id,
            language: selectedLanguage
          })
        }
      );


    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    const data =
      await response.json();


    loading.remove();


    const reply =
      data.reply ||
      data.response ||
      data.text ||
      data.message ||
      "Sorry friend, I couldn't get a response from Viggo AI right now.";


    addMessage(
      "assistant",
      reply,
      true
    );


  } catch (error) {

    console.error(
      "Viggo API Error:",
      error
    );

    loading.remove();


    addMessage(
      "assistant",
      "Sorry friend, I couldn't connect to Viggo AI right now.",
      true
    );

  }

}


/* =========================================
   ENTER TO SEND
   ========================================= */

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


/* =========================================
   TEXTAREA AUTO HEIGHT
   ========================================= */

messageInput.addEventListener(
  "input",
  () => {

    messageInput.style.height =
      "auto";

    messageInput.style.height =
      Math.min(
        messageInput.scrollHeight,
        130
      ) + "px";

  }
);


/* =========================================
   SEND BUTTON
   ========================================= */

sendButton.addEventListener(
  "click",
  sendMessage
);


/* =========================================
   NEW CHAT
   ========================================= */

newChat.addEventListener(
  "click",
  createNewChat
);


/* =========================================
   SIDEBAR
   ========================================= */

openSidebar.addEventListener(
  "click",
  () => {

    sidebar.classList.add(
      "open"
    );

  }
);


closeSidebar.addEventListener(
  "click",
  () => {

    sidebar.classList.remove(
      "open"
    );

  }
);


/* =========================================
   MORE BUTTON
   ========================================= */

moreBtn.addEventListener(
  "click",
  event => {

    event.stopPropagation();

    moreMenu.classList.toggle(
      "show"
    );

    topMoreMenu.classList.remove(
      "show"
    );

  }
);


/* =========================================
   TOP MORE
   ========================================= */

topMoreBtn.addEventListener(
  "click",
  event => {

    event.stopPropagation();

    topMoreMenu.classList.toggle(
      "show"
    );

    moreMenu.classList.remove(
      "show"
    );

  }
);


/* =========================================
   CLOSE MENUS
   ========================================= */

document.addEventListener(
  "click",
  () => {

    moreMenu.classList.remove(
      "show"
    );

    topMoreMenu.classList.remove(
      "show"
    );

    plusMenu.classList.remove(
      "show"
    );

  }
);


moreMenu.addEventListener(
  "click",
  event => {

    event.stopPropagation();

  }
);


topMoreMenu.addEventListener(
  "click",
  event => {

    event.stopPropagation();

  }
);


/* =========================================
   PLUS BUTTON
   ========================================= */

plusBtn.addEventListener(
  "click",
  event => {

    event.stopPropagation();

    plusMenu.classList.toggle(
      "show"
    );

  }
);


plusMenu.addEventListener(
  "click",
  event => {

    event.stopPropagation();

  }
);


/* =========================================
   SEARCH CHAT
   ========================================= */

searchChat.addEventListener(
  "input",
  () => {

    renderHistory(
      searchChat.value
    );

  }
);


/* =========================================
   VOICE MODAL
   ========================================= */

function openVoiceModal() {

  voiceModal.classList.add(
    "show"
  );

  moreMenu.classList.remove(
    "show"
  );

  topMoreMenu.classList.remove(
    "show"
  );

}


function closeVoiceModal() {

  voiceModal.classList.remove(
    "show"
  );

}


document
  .getElementById("voiceMenuBtn")
  .addEventListener(
    "click",
    openVoiceModal
  );


document
  .getElementById("topVoiceBtn")
  .addEventListener(
    "click",
    openVoiceModal
  );


document
  .getElementById("plusVoiceBtn")
  .addEventListener(
    "click",
    openVoiceModal
  );


closeVoice.addEventListener(
  "click",
  closeVoiceModal
);


/* =========================================
   VOICE TEST
   ========================================= */

voiceTest.addEventListener(
  "click",
  () => {

    const utterance =
      new SpeechSynthesisUtterance(
        "Hello, I am Viggo AI."
      );

    utterance.lang =
      getSpeechLanguage();

    speechSynthesis.speak(
      utterance
    );

  }
);


/* =========================================
   LANGUAGE
   ========================================= */

function openLanguageModal() {

  languageModal.classList.add(
    "show"
  );

  moreMenu.classList.remove(
    "show"
  );

  topMoreMenu.classList.remove(
    "show"
  );

}


document
  .getElementById("languageBtn")
  .addEventListener(
    "click",
    openLanguageModal
  );


document
  .getElementById("topLanguageBtn")
  .addEventListener(
    "click",
    openLanguageModal
  );


closeLanguage.addEventListener(
  "click",
  () => {

    languageModal.classList.remove(
      "show"
    );

  }
);


saveLanguage.addEventListener(
  "click",
  () => {

    selectedLanguage =
      languageSelect.value;

    localStorage.setItem(
      "viggo_language",
      selectedLanguage
    );

    languageModal.classList.remove(
      "show"
    );

  }
);


/* =========================================
   CLEAR CHAT
   ========================================= */

function clearCurrentChat() {

  conversation.innerHTML = "";

  if (currentChat) {

    currentChat.messages = [];

    saveChats();

  }

}


document
  .getElementById("clearChatBtn")
  .addEventListener(
    "click",
    clearCurrentChat
  );


document
  .getElementById("topClearBtn")
  .addEventListener(
    "click",
    clearCurrentChat
  );


/* =========================================
   SHOW HISTORY
   ========================================= */

function showHistory() {

  sidebar.classList.add(
    "open"
  );

  moreMenu.classList.remove(
    "show"
  );

  topMoreMenu.classList.remove(
    "show"
  );

}


document
  .getElementById("showHistoryBtn")
  .addEventListener(
    "click",
    showHistory
  );


document
  .getElementById("topHistoryBtn")
  .addEventListener(
    "click",
    showHistory
  );


/* =========================================
   SAVED CHATS
   ========================================= */

function showSavedChats() {

  const saved =
    chats.filter(
      chat => chat.saved
    );

  if (!saved.length) {

    alert(
      "No saved chats."
    );

    return;

  }

  alert(
    `${saved.length} saved chat(s)`
  );

}


document
  .getElementById("savedChatsBtn")
  .addEventListener(
    "click",
    showSavedChats
  );


document
  .getElementById("topSavedBtn")
  .addEventListener(
    "click",
    showSavedChats
  );


/* =========================================
   SELECT CHATS
   ========================================= */

function selectChats() {

  alert(
    "Select Chats mode"
  );

}


document
  .getElementById("selectChatsBtn")
  .addEventListener(
    "click",
    selectChats
  );


document
  .getElementById("topSelectBtn")
  .addEventListener(
    "click",
    selectChats
  );


/* =========================================
   DELETE SELECTED
   ========================================= */

function deleteSelected() {

  const confirmed =
    confirm(
      "Delete all chat history?"
    );

  if (!confirmed) return;

  chats = [];

  currentChat = null;

  conversation.innerHTML = "";

  saveChats();

  renderHistory();

}


document
  .getElementById("deleteSelectedBtn")
  .addEventListener(
    "click",
    deleteSelected
  );


document
  .getElementById("topDeleteBtn")
  .addEventListener(
    "click",
    deleteSelected
  );


/* =========================================
   MICROPHONE
   ========================================= */

let recognition = null;

if (
  "webkitSpeechRecognition" in window ||
  "SpeechRecognition" in window
) {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  recognition =
    new SpeechRecognition();

  recognition.lang =
    getSpeechLanguage();

  recognition.continuous =
    false;

  recognition.interimResults =
    false;


  recognition.onresult =
    event => {

      const transcript =
        event.results[0][0].transcript;

      messageInput.value +=
        transcript;

    };


  recognition.onerror =
    error => {

      console.error(
        "Speech recognition error:",
        error
      );

    };

}


micButton.addEventListener(
  "click",
  () => {

    if (!recognition) {

      alert(
        "Voice input is not supported in this browser."
      );

      return;

    }

    recognition.lang =
      getSpeechLanguage();

    recognition.start();

  }
);


/* =========================================
   ESCAPE HTML
   ========================================= */

function escapeHTML(text) {

  const div =
    document.createElement("div");

  div.textContent =
    text;

  return div.innerHTML;

}


/* =========================================
   FORMAT TEXT
   ========================================= */

function formatText(text) {

  return escapeHTML(text)
    .replace(/\n/g, "<br>");

}


/* =========================================
   LOAD SETTINGS
   ========================================= */

const savedLanguage =
  localStorage.getItem(
    "viggo_language"
  );

if (savedLanguage) {

  selectedLanguage =
    savedLanguage;

  languageSelect.value =
    savedLanguage;

}


/* =========================================
   INITIAL LOAD
   ========================================= */

renderHistory();


if (chats.length > 0) {

  loadChat(
    chats[0].id
  );

}


/* =========================================
   LOAD SPEECH VOICES
   ========================================= */

if (
  "speechSynthesis" in window
) {

  speechSynthesis.onvoiceschanged =
    () => {

      speechSynthesis
        .getVoices();

    };

}
