"use strict";

/* =========================================
   API
========================================= */

const API_BASE = "https://ai-tool-2-zpul.onrender.com";
const CHAT_API = `${API_BASE}/chat`;

console.log("Viggo API:", CHAT_API);


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
const moreBtn = document.getElementById("moreBtn");
const moreMenu = document.getElementById("moreMenu");
const shareBtn = document.getElementById("shareBtn");


/* =========================================
   MODALS
========================================= */

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

let chats = JSON.parse(
  localStorage.getItem("viggo_chats") || "[]"
);

let currentChat = null;

let selectedLanguage =
  localStorage.getItem("viggo_language") || "English";

let selectedVoice = "female";

let speakingButton = null;


/* =========================================
   SAVE CHATS
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

  const chat = chats.find(
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

  const filteredChats = chats
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

    item.className = "history-item";

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
        title="Pin"
      >
        ${chat.pinned ? "📌" : "📍"}
      </button>

      <button
        class="delete-history-btn"
        title="Delete"
      >
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
  ====================================== */

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

      await navigator.clipboard
        .writeText(text);

      copy.innerHTML =
        "✓ Copied";

      setTimeout(
        () => {
          copy.innerHTML =
            "📋 Copy";
        },
        1200
      );

    } catch (error) {

      console.error(
        "Copy error:",
        error
      );

    }
  };


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
  ====================================== */

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

  button.classList.add("active");

  button.innerHTML =
    "⏹";

  speakingButton = button;

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


  /* CREATE CHAT */

  if (!currentChat) {
    createNewChat();
  }


  /* SAVE USER MESSAGE */

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
  ====================================== */

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
  ====================================== */

  try {

    console.log(
      "================================="
    );

    console.log(
      "VIGGO AI REQUEST"
    );

    console.log(
      "API:",
      CHAT_API
    );

    console.log(
      "Message:",
      text
    );

    console.log(
      "Chat ID:",
      currentChat.id
    );

    console.log(
      "Language:",
      selectedLanguage
    );


    let response =
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


    /* =====================================
       404 FALLBACK
  ====================================== */

    if (response.status === 404) {

      console.warn(
        "POST /chat returned 404."
      );

      console.warn(
        "Trying base URL..."
      );

      response =
        await fetch(
          API_BASE,
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
    }


    /* =====================================
       CHECK HTTP STATUS
  ====================================== */

    if (!response.ok) {

      const errorText =
        await response.text();

      console.error(
        "================================="
      );

      console.error(
        "SERVER HTTP ERROR"
      );

      console.error(
        "Status:",
        response.status
      );

      console.error(
        "Response:",
        errorText
      );

      console.error(
        "================================="
      );

      throw new Error(
        `Server returned HTTP ${response.status}: ${errorText}`
      );
    }


    /* =====================================
       READ JSON
  ====================================== */

    const data =
      await response.json();

    console.log(
      "================================="
    );

    console.log(
      "AI RESPONSE"
    );

    console.log(
      data
    );

    console.log(
      "================================="
    );


    loading.remove();


    /* =====================================
       GET REPLY
  ====================================== */

    const reply =
      data.reply ||
      data.response ||
      data.text ||
      data.message;


    if (!reply) {

      throw new Error(
        "Server returned an empty AI response."
      );
    }


    /* =====================================
       DISPLAY AI RESPONSE
  ====================================== */

    addMessage(
      "assistant",
      reply,
      true
    );

  } catch (error) {

    console.error(
      "================================="
    );

    console.error(
      "VIGGO AI ERROR"
    );

    console.error(
      error
    );

    console.error(
      "================================="
    );


    loading.remove();


    addMessage(
      "assistant",
      `Viggo AI Error: ${error.message}`,
      true
    );
  }
}


/* =========================================
   EVENT LISTENERS
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


sendButton.onclick =
  sendMessage;


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
   CREATE SHAREABLE LINK
========================================= */

shareBtn.onclick = async () => {

  if (
    !currentChat ||
    !currentChat.messages ||
    currentChat.messages.length === 0
  ) {

    alert(
      "There is no chat to share."
    );

    return;
  }


  try {

    shareBtn.disabled = true;

    shareBtn.innerText =
      "🔗 Creating...";


    /* =====================================
       SEND CHAT TO SERVER
    ====================================== */

    const response =
      await fetch(
        `${API_BASE}/share`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            chat: currentChat
          })
        }
      );


    if (!response.ok) {

      const errorText =
        await response.text();

      throw new Error(
        `Share server error: ${response.status} ${errorText}`
      );
    }


    const data =
      await response.json();


    if (
      !data.success ||
      !data.url
    ) {

      throw new Error(
        data.error ||
        "Share link could not be created."
      );
    }


    /* =====================================
       GET SHARE URL
    ====================================== */

    const shareURL =
      data.url;


    console.log(
      "Share URL:",
      shareURL
    );


    /* =====================================
       CREATE 3-4 LINE PREVIEW
    ====================================== */

    const preview =
      currentChat.messages
        .slice(0, 4)
        .map(item => {

          const name =
            item.role === "user"
              ? "You"
              : "Viggo AI";

          return `${name}: ${item.text}`;

        })
        .join("\n");


    const shareText =
      `Viggo AI Chat\n\n${preview}\n\nOpen Chat:\n${shareURL}`;


    /* =====================================
       NATIVE SHARE
    ====================================== */

    if (navigator.share) {

      try {

        await navigator.share({

          title:
            currentChat.title ||
            "Viggo AI Chat",

          text:
            shareText,

          url:
            shareURL

        });

        return;

      } catch (error) {

        if (
          error &&
          error.name === "AbortError"
        ) {

          console.log(
            "Share cancelled."
          );

          return;
        }

        console.log(
          "Native share failed:",
          error
        );
      }
    }


    /* =====================================
       COPY LINK
    ====================================== */

    try {

      await navigator.clipboard.writeText(
        shareURL
      );

      alert(
        "Share link copied!\n\n" +
        "You can now paste it in WhatsApp."
      );

    } catch (error) {

      console.error(
        "Clipboard error:",
        error
      );

      prompt(
        "Copy this share link:",
        shareURL
      );
    }

  } catch (error) {

    console.error(
      "================================="
    );

    console.error(
      "SHARE ERROR"
    );

    console.error(
      error
    );

    console.error(
      "================================="
    );

    alert(
      "Could not create share link.\n\n" +
      error.message
    );

  } finally {

    shareBtn.disabled = false;

    shareBtn.innerText =
      "🔗 Share";
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

  showHistoryBtn.onclick =
    () => {

      sidebar.classList.add(
        "open"
      );

    };
}


/* =========================================
   DELETE ALL CHATS
========================================= */

const deleteSelectedBtn =
  document.getElementById(
    "deleteSelectedBtn"
  );


if (deleteSelectedBtn) {

  deleteSelectedBtn.onclick =
    () => {

      if (
        !confirm(
          "Delete all chat history?"
        )
      ) {
        return;
      }

      chats = [];

      currentChat = null;

      conversation.innerHTML =
        "";

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

  selectChatsBtn.onclick =
    () => {

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

  savedChatsBtn.onclick =
    () => {

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
    .replace(/\n/g, "<br>");
}


/* =========================================
   LOAD SHARED CHAT FROM URL
========================================= */

async function loadSharedChat() {

  const params =
    new URLSearchParams(
      window.location.search
    );

  const shareId =
    params.get("share");

  if (!shareId) {
    return false;
  }


  try {

    console.log(
      "Loading shared chat:",
      shareId
    );


    /* =====================================
       GET SHARED CHAT
    ====================================== */

    const response =
      await fetch(
        `${API_BASE}/share/${encodeURIComponent(
          shareId
        )}`
      );


    if (!response.ok) {

      const errorText =
        await response.text();

      throw new Error(
        `Shared chat server returned ${response.status}: ${errorText}`
      );
    }


    const data =
      await response.json();


    if (
      !data.success ||
      !data.chat
    ) {

      throw new Error(
        data.error ||
        "Invalid shared chat."
      );
    }


    const sharedChat =
      data.chat;


    /* =====================================
       CREATE LOCAL CHAT
    ====================================== */

    const localChat = {

      id:
        `shared-${Date.now()}`,

      title:
        sharedChat.title ||
        "Shared Chat",

      messages:
        Array.isArray(
          sharedChat.messages
        )
          ? sharedChat.messages
          : [],

      pinned: false,

      saved: false
    };


    /* =====================================
       DISPLAY SHARED CHAT
    ====================================== */

    currentChat =
      localChat;

    conversation.innerHTML =
      "";


    localChat.messages.forEach(
      item => {

        addMessage(
          item.role,
          item.text,
          false
        );

      }
    );


    /* =====================================
       SAVE TO LOCAL HISTORY
    ====================================== */

    const alreadyExists =
      chats.some(
        chat =>
          chat.title ===
            localChat.title &&
          JSON.stringify(
            chat.messages
          ) ===
            JSON.stringify(
              localChat.messages
            )
      );


    if (!alreadyExists) {

      chats.unshift(
        localChat
      );

      saveChats();

    }


    renderHistory();


    /* =====================================
       REMOVE SHARE QUERY FROM URL
    ===================================== */

    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );


    console.log(
      "Shared chat loaded successfully."
    );

    return true;

  } catch (error) {

    console.error(
      "Shared chat loading error:",
      error
    );

    alert(
      "This shared chat could not be loaded.\n\n" +
      error.message
    );

    return false;
  }
}


/* =========================================
   INITIAL LOAD
========================================= */

languageSelect.value =
  selectedLanguage;

renderHistory();


/* =========================================
   CHECK SHARED CHAT FIRST
========================================= */

(async () => {

  const loadedSharedChat =
    await loadSharedChat();

  /*
    If URL does not contain ?share=...
    then load the normal local history.
  */

  if (
    !loadedSharedChat &&
    !new URLSearchParams(
      window.location.search
    ).has("share")
  ) {

    if (chats.length > 0) {

      loadChat(
        chats[0].id
      );

    }

  }

})();
