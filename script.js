"use strict";


/* =========================================
   API
   ========================================= */

const API_BASE =
  "https://ai-tool-1-fgmc.onrender.com";

const CHAT_API =
  `${API_BASE}/chat`;


/* =========================================
   ELEMENTS
   ========================================= */

const sidebar =
  document.getElementById("sidebar");

const openSidebar =
  document.getElementById("openSidebar");

const closeSidebar =
  document.getElementById("closeSidebar");

const newChat =
  document.getElementById("newChat");

const conversation =
  document.getElementById("conversation");

const messageInput =
  document.getElementById("message");

const sendButton =
  document.getElementById("send");

const micButton =
  document.getElementById("mic");

const plusBtn =
  document.getElementById("plusBtn");

const plusMenu =
  document.getElementById("plusMenu");

const chatHistory =
  document.getElementById("chatHistory");

const searchChat =
  document.getElementById("searchChat");

const moreBtn =
  document.getElementById("moreBtn");

const moreMenu =
  document.getElementById("moreMenu");

const shareBtn =
  document.getElementById("shareBtn");


/* =========================================
   MODALS
   ========================================= */

const voiceModal =
  document.getElementById("voiceModal");

const languageModal =
  document.getElementById("languageModal");

const closeVoice =
  document.getElementById("closeVoice");

const closeLanguage =
  document.getElementById("closeLanguage");

const voiceSelect =
  document.getElementById("voiceSelect");

const voiceTest =
  document.getElementById("voiceTest");

const languageSelect =
  document.getElementById("languageSelect");

const saveLanguage =
  document.getElementById("saveLanguage");


/* =========================================
   DATA
   ========================================= */

let chats =
  JSON.parse(
    localStorage.getItem("viggo_chats") || "[]"
  );

let currentChat = null;

let selectedLanguage =
  localStorage.getItem("viggo_language") ||
  "English";

let selectedVoice = "female";

let speakingButton = null;


/* =========================================
   SAVE
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

  const chat = {

    id: Date.now().toString(),

    title: "New Chat",

    messages: [],

    pinned: false,

    saved: false

  };

  currentChat = chat;

  chats.unshift(chat);

  saveChats();

  renderHistory();

  conversation.innerHTML = "";

  messageInput.focus();

}


/* =========================================
   LOAD CHAT
   ========================================= */

function loadChat(id) {

  const chat =
    chats.find(
      item => item.id === id
    );

  if (!chat) return;

  currentChat = chat;

  conversation.innerHTML = "";

  chat.messages.forEach(item => {

    addMessage(
      item.role,
      item.text,
      false
    );

  });

}


/* =========================================
   HISTORY
   ========================================= */

function renderHistory(filter = "") {

  chatHistory.innerHTML = "";

  const filteredChats =
    chats
      .filter(chat =>
        chat.title
          .toLowerCase()
          .includes(filter.toLowerCase())
      )
      .sort(
        (a, b) =>
          Number(b.pinned) -
          Number(a.pinned)
      );


  filteredChats.forEach(chat => {

    const item =
      document.createElement("div");

    item.className =
      "history-item";


    if (
      currentChat &&
      currentChat.id === chat.id
    ) {

      item.classList.add("active");

    }


    item.innerHTML = `

      <span class="history-name">
        ${escapeHTML(chat.title)}
      </span>

      <button
        class="pin-btn"
        title="Pin">
        ${chat.pinned ? "📌" : "📍"}
      </button>

      <button
        class="delete-history-btn"
        title="Delete">
        🗑
      </button>

    `;


    item
      .querySelector(".history-name")
      .addEventListener(
        "click",
        () => {

          loadChat(chat.id);

          renderHistory(
            searchChat.value
          );

        }
      );


    item
      .querySelector(".pin-btn")
      .addEventListener(
        "click",
        event => {

          event.stopPropagation();

          chat.pinned =
            !chat.pinned;

          saveChats();

          renderHistory(
            searchChat.value
          );

        }
      );


    item
      .querySelector(".delete-history-btn")
      .addEventListener(
        "click",
        event => {

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

          renderHistory(
            searchChat.value
          );

        }
      );


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


  /* =====================================
     ACTIONS
     ===================================== */

  const actions =
    document.createElement("div");

  actions.className =
    "message-actions";


  /* LIKE */

  const like =
    document.createElement("button");

  like.className =
    "message-action";

  like.innerHTML =
    "👍 Like";

  like.onclick = () => {

    like.classList.toggle(
      "active"
    );

  };


  /* DISLIKE */

  const dislike =
    document.createElement("button");

  dislike.className =
    "message-action";

  dislike.innerHTML =
    "👎 Dislike";

  dislike.onclick = () => {

    dislike.classList.toggle(
      "active"
    );

  };


  /* SPEAKER */

  const speaker =
    document.createElement("button");

  speaker.className =
    "message-action speaker";

  speaker.innerHTML =
    "🔊";

  speaker.title =
    "Speaker ON/OFF";

  speaker.onclick = () => {

    toggleSpeaker(
      text,
      speaker
    );

  };


  /* COPY */

  const copy =
    document.createElement("button");

  copy.className =
    "message-action";

  copy.innerHTML =
    "📋 Copy";

  copy.onclick = async () => {

    try {

      await navigator.clipboard.writeText(
        text
      );

      copy.innerHTML =
        "✓ Copied";

      setTimeout(() => {

        copy.innerHTML =
          "📋 Copy";

      }, 1200);

    } catch (error) {

      console.error(
        "Copy error:",
        error
      );

    }

  };


  /*
     BUTTON ORDER

     Copy
     Like
     Dislike
     Speaker
  */

  actions.appendChild(copy);

  actions.appendChild(like);

  actions.appendChild(dislike);

  actions.appendChild(speaker);


  bubble.appendChild(actions);

  message.appendChild(bubble);

  conversation.appendChild(message);


  conversation.parentElement.scrollTop =
    conversation.parentElement.scrollHeight;


  /* =====================================
     SAVE MESSAGE
     ===================================== */

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
   SPEAKER
   ========================================= */

function toggleSpeaker(
  text,
  button
) {

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


  const utterance =
    new SpeechSynthesisUtterance(text);

  utterance.lang =
    getSpeechLanguage();


  button.classList.add(
    "active"
  );

  button.innerHTML =
    "⏹";

  speakingButton =
    button;


  utterance.onend = () => {

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
   LANGUAGE
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


  /* =====================================
     CREATE CHAT
     ===================================== */

  if (!currentChat) {

    createNewChat();

  }


  /* =====================================
     USER MESSAGE
     ===================================== */

  addMessage(
    "user",
    text,
    true
  );


  messageInput.value = "";

  messageInput.style.height =
    "auto";


  /* =====================================
     LOADING
     ===================================== */

  const loading =
    document.createElement("div");

  loading.className =
    "message assistant";


  loading.innerHTML = `

    <div class="message-bubble">

      <div class="message-text">

        Viggo AI is thinking...

      </div>

    </div>

  `;


  conversation.appendChild(
    loading
  );


  conversation.parentElement.scrollTop =
    conversation.parentElement.scrollHeight;


  /* =====================================
     API REQUEST
     ===================================== */

  try {

    console.log(
      "Sending request to:",
      CHAT_API
    );


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

            chatId:
              currentChat.id,

            language:
              selectedLanguage

          })

        }
      );


    console.log(
      "Server status:",
      response.status
    );


    if (!response.ok) {

      const errorText =
        await response.text();

      console.error(
        "Server error:",
        errorText
      );


      throw new Error(
        `HTTP ${response.status}`
      );

    }


    const data =
      await response.json();


    console.log(
      "AI response:",
      data
    );


    loading.remove();


    const reply =
      data.reply ||
      data.response ||
      data.text ||
      data.message ||
      "Sorry friend, I couldn't get a response right now.";


    addMessage(
      "assistant",
      reply,
      true
    );


  } catch (error) {

    console.error(
      "Viggo AI Error:",
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
   ENTER KEY
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
   SEND BUTTON
   ========================================= */

sendButton.onclick =
  sendMessage;


/* =========================================
   NEW CHAT
   ========================================= */

newChat.onclick =
  createNewChat;


/* =========================================
   SIDEBAR
   ========================================= */

openSidebar.onclick = () => {

  sidebar.classList.add(
    "open"
  );

};


closeSidebar.onclick = () => {

  sidebar.classList.remove(
    "open"
  );

};


/* =========================================
   MORE MENU
   ========================================= */

moreBtn.onclick = event => {

  event.stopPropagation();

  moreMenu.classList.toggle(
    "show"
  );

};


document.addEventListener(
  "click",
  () => {

    moreMenu.classList.remove(
      "show"
    );

    plusMenu.classList.remove(
      "show"
    );

  }
);


moreMenu.onclick =
  event => event.stopPropagation();


/* =========================================
   PLUS MENU
   ========================================= */

plusBtn.onclick = event => {

  event.stopPropagation();

  plusMenu.classList.toggle(
    "show"
  );

};


plusMenu.onclick =
  event => event.stopPropagation();


/* =========================================
   SEARCH
   ========================================= */

searchChat.oninput = () => {

  renderHistory(
    searchChat.value
  );

};


/* =========================================
   SHARE
   ========================================= */

shareBtn.onclick =
  async () => {

    let shareText =
      "Viggo AI Chat";


    if (
      currentChat &&
      currentChat.messages.length
    ) {

      shareText =
        currentChat.messages
          .map(item =>
            `${item.role === "user"
              ? "You"
              : "Viggo AI"}: ${item.text}`
          )
          .join("\n\n");

    }


    /* Native Share */

    if (
      navigator.share
    ) {

      try {

        await navigator.share({

          title: "Viggo AI",

          text: shareText

        });

      } catch (error) {

        console.log(
          "Share cancelled"
        );

      }

      return;

    }


    /* Fallback */

    try {

      await navigator.clipboard.writeText(
        shareText
      );

      alert(
        "Chat copied to clipboard."
      );

    } catch (error) {

      alert(
        "Sharing is not supported on this device."
      );

    }

  };


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

}


const voiceMenuBtn =
  document.getElementById(
    "voiceMenuBtn"
  );

if (voiceMenuBtn) {

  voiceMenuBtn.onclick =
    openVoiceModal;

}


const plusVoiceBtn =
  document.getElementById(
    "plusVoiceBtn"
  );

if (plusVoiceBtn) {

  plusVoiceBtn.onclick =
    openVoiceModal;

}


closeVoice.onclick = () => {

  voiceModal.classList.remove(
    "show"
  );

};


/* =========================================
   VOICE TEST
   ========================================= */

voiceTest.onclick = () => {

  const speech =
    new SpeechSynthesisUtterance(
      "Hello, I am Viggo AI."
    );

  speech.lang =
    getSpeechLanguage();

  speechSynthesis.speak(
    speech
  );

};


/* =========================================
   LANGUAGE MODAL
   ========================================= */

const languageBtn =
  document.getElementById(
    "languageBtn"
  );


if (languageBtn) {

  languageBtn.onclick = () => {

    languageModal.classList.add(
      "show"
    );

    moreMenu.classList.remove(
      "show"
    );

  };

}


closeLanguage.onclick = () => {

  languageModal.classList.remove(
    "show"
  );

};


/* =========================================
   SAVE LANGUAGE
   ========================================= */

saveLanguage.onclick = () => {

  selectedLanguage =
    languageSelect.value;


  localStorage.setItem(
    "viggo_language",
    selectedLanguage
  );


  languageModal.classList.remove(
    "show"
  );

};


/* =========================================
   CLEAR CHAT
   ========================================= */

function clearChat() {

  conversation.innerHTML = "";


  if (currentChat) {

    currentChat.messages = [];

    saveChats();

  }

}


const clearChatBtn =
  document.getElementById(
    "clearChatBtn"
  );


if (clearChatBtn) {

  clearChatBtn.onclick =
    clearChat;

}


/* =========================================
   SHOW HISTORY
   ========================================= */

const showHistoryBtn =
  document.getElementById(
    "showHistoryBtn"
  );


if (showHistoryBtn) {

  showHistoryBtn.onclick = () => {

    sidebar.classList.add(
      "open"
    );

  };

}


/* =========================================
   DELETE ALL
   ========================================= */

const deleteSelectedBtn =
  document.getElementById(
    "deleteSelectedBtn"
  );


if (deleteSelectedBtn) {

  deleteSelectedBtn.onclick = () => {

    if (
      !confirm(
        "Delete all chat history?"
      )
    ) return;


    chats = [];

    currentChat = null;

    conversation.innerHTML = "";

    saveChats();

    renderHistory();

  };

}


/* =========================================
   SELECT CHATS
   ========================================= */

const selectChatsBtn =
  document.getElementById(
    "selectChatsBtn"
  );


if (selectChatsBtn) {

  selectChatsBtn.onclick = () => {

    alert(
      "Select Chats mode"
    );

  };

}


/* =========================================
   SAVED CHATS
   ========================================= */

const savedChatsBtn =
  document.getElementById(
    "savedChatsBtn"
  );


if (savedChatsBtn) {

  savedChatsBtn.onclick = () => {

    const saved =
      chats.filter(
        chat => chat.saved
      );


    alert(
      saved.length
        ? `${saved.length} saved chat(s)`
        : "No saved chats."
    );

  };

}


/* =========================================
   MICROPHONE
   ========================================= */

let recognition = null;


if (
  "SpeechRecognition" in window ||
  "webkitSpeechRecognition" in window
) {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


  recognition =
    new SpeechRecognition();


  recognition.continuous =
    false;


  recognition.interimResults =
    false;


  recognition.onresult =
    event => {

      messageInput.value +=
        event.results[0][0]
          .transcript;


      messageInput.dispatchEvent(
        new Event("input")
      );

    };


  recognition.onerror =
    error => {

      console.error(
        "Speech recognition error:",
        error
      );

    };

}


micButton.onclick = () => {

  if (!recognition) {

    alert(
      "Voice input is not supported in this browser."
    );

    return;

  }


  recognition.lang =
    getSpeechLanguage();


  try {

    recognition.start();

  } catch (error) {

    console.log(
      "Voice recognition already running."
    );

  }

};


/* =========================================
   TEXTAREA HEIGHT
   ========================================= */

messageInput.oninput = () => {

  messageInput.style.height =
    "auto";


  messageInput.style.height =
    Math.min(
      messageInput.scrollHeight,
      130
    ) + "px";

};


/* =========================================
   HELPERS
   ========================================= */

function escapeHTML(text) {

  const div =
    document.createElement("div");


  div.textContent =
    text;


  return div.innerHTML;

}


function formatText(text) {

  return escapeHTML(text)
    .replace(
      /\n/g,
      "<br>"
    );

}


/* =========================================
   LANGUAGE LOAD
   ========================================= */

languageSelect.value =
  selectedLanguage;


/* =========================================
   INITIAL LOAD
   ========================================= */

renderHistory();


if (chats.length > 0) {

  loadChat(
    chats[0].id
  );

}
