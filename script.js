
"use strict";

/* =====================================================
   VIGGO AI FRONTEND
   Backend:
   https://ai-tool-1-fgmc.onrender.com
===================================================== */

const API_BASE = "https://ai-tool-1-fgmc.onrender.com";
const CHAT_API = API_BASE + "/chat";

const STORAGE_KEY = "viggo_chats";
const SETTINGS_KEY = "viggo_settings";

let currentChatId = null;
let messages = [];
let currentLanguage = "en";
let isSending = false;
let recognition = null;
let isListening = false;


/* =====================================================
   HELPER
===================================================== */

function $(id) {
  return document.getElementById(id);
}


/* =====================================================
   INITIAL LOAD
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

  console.log("Viggo AI script loaded");

  loadSettings();

  initializeChat();

  setupEvents();

  setupVoice();

  renderHistory();

  loadSharedChat();

});


/* =====================================================
   SETTINGS
===================================================== */

function loadSettings() {

  try {

    const saved =
      localStorage.getItem(SETTINGS_KEY);

    if (!saved) return;

    const data = JSON.parse(saved);

    if (data.language) {
      currentLanguage = data.language;
    }

  } catch (error) {

    console.error(
      "Settings load error:",
      error
    );

  }

}


function saveSettings() {

  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({
      language: currentLanguage
    })
  );

}


/* =====================================================
   CHAT STORAGE
===================================================== */

function getChats() {

  try {

    const saved =
      localStorage.getItem(STORAGE_KEY);

    if (!saved) return [];

    const chats =
      JSON.parse(saved);

    return Array.isArray(chats)
      ? chats
      : [];

  } catch (error) {

    console.error(
      "Chat storage error:",
      error
    );

    return [];

  }

}


function saveChats(chats) {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(chats)
  );

}


/* =====================================================
   CREATE CHAT
===================================================== */

function createChat() {

  return {

    id:
      "chat_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .substring(2, 8),

    title: "New Chat",

    messages: [],

    pinned: false,

    createdAt: Date.now(),

    updatedAt: Date.now()

  };

}


/* =====================================================
   INITIALIZE CHAT
===================================================== */

function initializeChat() {

  const chats = getChats();

  if (!chats.length) {

    const chat = createChat();

    saveChats([chat]);

    currentChatId = chat.id;

    messages = [];

  } else {

    chats.sort(
      (a, b) =>
        (b.updatedAt || 0) -
        (a.updatedAt || 0)
    );

    currentChatId =
      chats[0].id;

    messages =
      Array.isArray(chats[0].messages)
        ? chats[0].messages
        : [];

  }

  renderMessages();

  updateChatTitle();

}


/* =====================================================
   NEW CHAT
===================================================== */

function newChat() {

  const chat = createChat();

  const chats = getChats();

  chats.unshift(chat);

  saveChats(chats);

  currentChatId = chat.id;

  messages = [];

  renderMessages();

  updateChatTitle();

  renderHistory();

  closeMore();

  const input = $("messageInput");

  if (input) {
    input.focus();
  }

}


/* =====================================================
   OPEN CHAT
===================================================== */

function openChat(id) {

  const chats = getChats();

  const chat =
    chats.find(
      item => item.id === id
    );

  if (!chat) return;

  currentChatId = chat.id;

  messages =
    Array.isArray(chat.messages)
      ? chat.messages
      : [];

  renderMessages();

  updateChatTitle();

  renderHistory();

}


/* =====================================================
   UPDATE CURRENT CHAT
===================================================== */

function updateChat() {

  const chats = getChats();

  const chat =
    chats.find(
      item =>
        item.id === currentChatId
    );

  if (!chat) return;

  chat.messages = messages;

  chat.updatedAt = Date.now();


  const firstUserMessage =
    messages.find(
      item => item.role === "user"
    );


  if (
    firstUserMessage &&
    chat.title === "New Chat"
  ) {

    chat.title =
      firstUserMessage.content
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 40);

  }


  saveChats(chats);

  updateChatTitle();

  renderHistory();

}


/* =====================================================
   UPDATE TITLE
===================================================== */

function updateChatTitle() {

  const title = $("chatTitle");

  if (!title) return;

  const chats = getChats();

  const chat =
    chats.find(
      item =>
        item.id === currentChatId
    );

  title.textContent =
    chat?.title || "New Chat";

}


/* =====================================================
   HISTORY
===================================================== */

function renderHistory() {

  const list =
    $("historyList");

  if (!list) return;

  const chats = getChats();

  list.innerHTML = "";


  const pinned =
    chats.filter(
      chat => chat.pinned
    );


  const recent =
    chats.filter(
      chat => !chat.pinned
    );


  addHistorySection(
    list,
    "Pinned",
    pinned
  );


  addHistorySection(
    list,
    "Recent",
    recent
  );

}


/* =====================================================
   HISTORY SECTION
===================================================== */

function addHistorySection(
  list,
  title,
  chats
) {

  if (!chats.length) return;


  const heading =
    document.createElement("div");

  heading.className =
    "history-section-title";

  heading.textContent =
    title;

  list.appendChild(heading);


  chats.forEach(chat => {

    const row =
      document.createElement("div");

    row.className =
      "history-item";


    if (
      chat.id === currentChatId
    ) {

      row.classList.add("active");

    }


    const titleElement =
      document.createElement("div");

    titleElement.className =
      "history-title";

    titleElement.textContent =
      chat.title || "New Chat";


    const actions =
      document.createElement("div");

    actions.className =
      "history-actions";


    /* PIN */

    const pinButton =
      document.createElement("button");

    pinButton.type = "button";

    pinButton.className =
      "history-action";

    pinButton.textContent =
      chat.pinned ? "📌" : "📍";

    pinButton.title =
      "Pin / Unpin";


    pinButton.onclick =
      event => {

        event.stopPropagation();

        togglePin(chat.id);

      };


    /* DELETE */

    const deleteButton =
      document.createElement("button");

    deleteButton.type = "button";

    deleteButton.className =
      "history-action delete";

    deleteButton.textContent =
      "🗑";

    deleteButton.title =
      "Delete";


    deleteButton.onclick =
      event => {

        event.stopPropagation();

        deleteChat(chat.id);

      };


    actions.appendChild(pinButton);

    actions.appendChild(deleteButton);


    row.appendChild(titleElement);

    row.appendChild(actions);


    row.onclick = () => {

      openChat(chat.id);

    };


    list.appendChild(row);

  });

}


/* =====================================================
   PIN
===================================================== */

function togglePin(id) {

  const chats = getChats();

  const chat =
    chats.find(
      item => item.id === id
    );

  if (!chat) return;

  chat.pinned =
    !chat.pinned;

  chat.updatedAt =
    Date.now();

  saveChats(chats);

  renderHistory();

}


/* =====================================================
   DELETE CHAT
===================================================== */

function deleteChat(id) {

  if (
    !confirm(
      "Delete this chat?"
    )
  ) {

    return;

  }


  let chats = getChats();


  chats =
    chats.filter(
      chat => chat.id !== id
    );


  if (!chats.length) {

    chats.push(
      createChat()
    );

  }


  saveChats(chats);


  if (
    currentChatId === id
  ) {

    currentChatId =
      chats[0].id;

    messages =
      chats[0].messages || [];

    renderMessages();

    updateChatTitle();

  }


  renderHistory();

  showToast(
    "Chat deleted"
  );

}


/* =====================================================
   SAVE BUTTON
===================================================== */

function saveCurrentChat() {

  updateChat();

  showToast(
    "✓ Chat saved"
  );

  closeMore();

}


/* =====================================================
   CLEAR HISTORY
===================================================== */

function clearHistory() {

  if (
    !confirm(
      "Delete all chat history?"
    )
  ) {

    return;

  }


  const chat =
    createChat();


  saveChats([chat]);

  currentChatId =
    chat.id;

  messages = [];

  renderMessages();

  updateChatTitle();

  renderHistory();

  closeMore();

  showToast(
    "History cleared"
  );

}


/* =====================================================
   RENDER MESSAGES
===================================================== */

function renderMessages() {

  const area =
    $("messages");

  if (!area) return;


  area.innerHTML = "";


  if (!messages.length) {

    area.innerHTML = `

      <div class="welcome">

        <div class="big-logo">
          V
        </div>

        <h1>Viggo</h1>

        <p>
          Your AI friend is ready.
        </p>

      </div>

    `;

    return;

  }


  messages.forEach(
    message => {

      addMessageToDOM(
        message.role,
        message.content
      );

    }
  );


  scrollBottom();

}


/* =====================================================
   MESSAGE DOM
===================================================== */

function addMessageToDOM(
  role,
  text
) {

  const area =
    $("messages");

  if (!area) return;


  const wrapper =
    document.createElement("div");

  wrapper.className =
    role === "user"
      ? "message user-message"
      : "message assistant-message";


  const bubble =
    document.createElement("div");

  bubble.className =
    "message-bubble";

  bubble.textContent =
    text;


  wrapper.appendChild(
    bubble
  );


  if (
    role === "assistant"
  ) {

    const actions =
      document.createElement("div");

    actions.className =
      "message-actions";


    const copy =
      createActionButton(
        "📋",
        "Copy",
        () => copyText(text)
      );


    const like =
      createActionButton(
        "👍",
        "Like",
        button => {

          button.classList.toggle(
            "active"
          );

        }
      );


    const speaker =
      createActionButton(
        "🔊",
        "Speak",
        () => speakText(text)
      );


    actions.appendChild(copy);

    actions.appendChild(like);

    actions.appendChild(speaker);

    wrapper.appendChild(actions);

  }


  area.appendChild(wrapper);

}


/* =====================================================
   MESSAGE ACTION
===================================================== */

function createActionButton(
  icon,
  title,
  callback
) {

  const button =
    document.createElement("button");

  button.type = "button";

  button.className =
    "message-action";

  button.textContent =
    icon;

  button.title =
    title;


  button.onclick =
    () => callback(button);


  return button;

}


/* =====================================================
   SEND MESSAGE
===================================================== */

async function sendMessage() {

  if (isSending) return;


  const input =
    $("messageInput");

  if (!input) {

    console.error(
      "messageInput not found"
    );

    return;

  }


  const text =
    input.value.trim();


  if (!text) return;


  isSending = true;


  const sendButton =
    $("sendBtn");

  if (sendButton) {
    sendButton.disabled = true;
  }


  /* USER MESSAGE */

  messages.push({

    role: "user",

    content: text,

    timestamp: Date.now()

  });


  input.value = "";


  renderMessages();

  updateChat();

  showTyping();


  try {

    const reply =
      await callViggo(text);


    removeTyping();


    messages.push({

      role: "assistant",

      content: reply,

      timestamp: Date.now()

    });


    renderMessages();

    updateChat();


  } catch (error) {

    removeTyping();


    console.error(
      "VIGGO ERROR:",
      error
    );


    /*
      IMPORTANT:
      Show actual backend error.
      No fake "Sorry friend..." message.
    */

    const errorText =
      "⚠️ Viggo Error\n\n" +
      error.message;


    messages.push({

      role: "assistant",

      content: errorText,

      timestamp: Date.now()

    });


    renderMessages();

    updateChat();


  } finally {

    isSending = false;

    if (sendButton) {
      sendButton.disabled = false;
    }

  }

}


/* =====================================================
   CALL BACKEND
===================================================== */

async function callViggo(
  text
) {

  console.log(
    "Calling:",
    CHAT_API
  );


  let response;


  try {

    response =
      await fetch(
        CHAT_API,
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            "Accept":
              "application/json"

          },

          body:
            JSON.stringify({

              message: text,

              language:
                currentLanguage,

              history:
                messages
                  .slice(-20)
                  .map(item => ({

                    role:
                      item.role,

                    content:
                      item.content

                  }))

            })

        }
      );

  } catch (error) {

    console.error(
      "NETWORK ERROR:",
      error
    );


    throw new Error(
      "Render server-க்கு connect ஆகவில்லை. Internet அல்லது Render server check பண்ணு."
    );

  }


  const raw =
    await response.text();


  console.log(
    "STATUS:",
    response.status
  );


  console.log(
    "SERVER RESPONSE:",
    raw
  );


  let data;


  try {

    data =
      JSON.parse(raw);

  } catch {

    throw new Error(
      "Server JSON response கொடுக்கவில்லை.\n\n" +
      raw.substring(0, 500)
    );

  }


  if (!response.ok) {

    throw new Error(

      data.details ||
      data.error ||
      `Server Error: ${response.status}`

    );

  }


  if (
    data.success !== true
  ) {

    throw new Error(

      data.details ||
      data.error ||
      "Viggo request failed."

    );

  }


  if (
    typeof data.reply !== "string" ||
    !data.reply.trim()
  ) {

    throw new Error(
      "Viggo AI empty reply கொடுத்தது."
    );

  }


  return data.reply.trim();

}


/* =====================================================
   TYPING
===================================================== */

function showTyping() {

  const area =
    $("messages");

  if (!area) return;


  const typing =
    document.createElement("div");

  typing.id =
    "viggoTyping";

  typing.className =
    "message assistant-message";


  typing.innerHTML = `

    <div class="message-bubble">

      <span>●</span>
      <span>●</span>
      <span>●</span>

    </div>

  `;


  area.appendChild(typing);

  scrollBottom();

}


function removeTyping() {

  const typing =
    $("viggoTyping");

  if (typing) {
    typing.remove();
  }

}


/* =====================================================
   COPY
===================================================== */

async function copyText(text) {

  try {

    await navigator.clipboard.writeText(
      text
    );

  } catch {

    const textarea =
      document.createElement(
        "textarea"
      );

    textarea.value = text;

    document.body.appendChild(
      textarea
    );

    textarea.select();

    document.execCommand(
      "copy"
    );

    textarea.remove();

  }


  showToast(
    "Copied"
  );

}


/* =====================================================
   SPEECH OUTPUT
===================================================== */

function speakText(text) {

  if (
    !window.speechSynthesis
  ) {

    showToast(
      "Voice not supported"
    );

    return;

  }


  speechSynthesis.cancel();


  const languages = {

    en: "en-IN",

    ta: "ta-IN",

    hi: "hi-IN",

    ml: "ml-IN",

    te: "te-IN",

    kn: "kn-IN"

  };


  const utterance =
    new SpeechSynthesisUtterance(
      text
    );


  utterance.lang =
    languages[currentLanguage] ||
    "en-IN";


  speechSynthesis.speak(
    utterance
  );

}


/* =====================================================
   VOICE INPUT
===================================================== */

function setupVoice() {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


  if (!SpeechRecognition) {

    console.warn(
      "Speech recognition unavailable"
    );

    return;

  }


  recognition =
    new SpeechRecognition();


  recognition.continuous = false;

  recognition.interimResults = false;


  recognition.onstart = () => {

    isListening = true;

    const button =
      $("voiceBtn");

    if (button) {
      button.classList.add(
        "active"
      );
    }

  };


  recognition.onresult =
    event => {

      const text =
        event.results[0][0]
          .transcript;


      const input =
        $("messageInput");

      if (input) {

        input.value = text;

        input.focus();

      }

    };


  recognition.onerror =
    event => {

      console.error(
        "Voice error:",
        event.error
      );

      showToast(
        "Voice error: " +
        event.error
      );

    };


  recognition.onend = () => {

    isListening = false;

    const button =
      $("voiceBtn");

    if (button) {

      button.classList.remove(
        "active"
      );

    }

  };

}


function toggleVoice() {

  if (!recognition) {

    showToast(
      "Voice input not supported"
    );

    return;

  }


  if (isListening) {

    recognition.stop();

    return;

  }


  const languages = {

    en: "en-IN",

    ta: "ta-IN",

    hi: "hi-IN",

    ml: "ml-IN",

    te: "te-IN",

    kn: "kn-IN"

  };


  recognition.lang =
    languages[currentLanguage] ||
    "en-IN";


  recognition.start();

}


/* =====================================================
   SHARE FULL CHAT
===================================================== */

async function shareChat() {

  const chats =
    getChats();


  const chat =
    chats.find(
      item =>
        item.id === currentChatId
    );


  if (!chat) {

    showToast(
      "No chat available"
    );

    return;

  }


  try {

    const json =
      JSON.stringify(chat);


    const encoded =
      btoa(
        encodeURIComponent(json)
      );


    const shareURL =
      window.location.origin +
      window.location.pathname +
      "?chat=" +
      encoded;


    if (
      navigator.share
    ) {

      await navigator.share({

        title:
          chat.title,

        text:
          "Viggo AI Chat",

        url:
          shareURL

      });

    } else {

      await copyText(
        shareURL
      );

      showToast(
        "Share link copied"
      );

    }

  } catch (error) {

    if (
      error.name !==
      "AbortError"
    ) {

      console.error(
        "Share error:",
        error
      );

    }

  }

}


/* =====================================================
   LOAD SHARED CHAT
===================================================== */

function loadSharedChat() {

  const params =
    new URLSearchParams(
      window.location.search
    );


  const encoded =
    params.get("chat");


  if (!encoded) return;


  try {

    const chat =
      JSON.parse(
        decodeURIComponent(
          atob(encoded)
        )
      );


    if (
      !chat ||
      !Array.isArray(chat.messages)
    ) {

      throw new Error(
        "Invalid chat"
      );

    }


    currentChatId =
      "shared_" +
      Date.now();


    messages =
      chat.messages;


    renderMessages();


    const title =
      $("chatTitle");

    if (title) {

      title.textContent =
        chat.title ||
        "Shared Chat";

    }


    showToast(
      "Shared chat opened"
    );


  } catch (error) {

    console.error(
      "Shared chat error:",
      error
    );

    showToast(
      "Invalid share link"
    );

  }

}


/* =====================================================
   LANGUAGE
===================================================== */

function setLanguage(
  language
) {

  currentLanguage =
    language;

  saveSettings();

  showToast(
    "Language changed"
  );

}


/* =====================================================
   MORE MENU
===================================================== */

function toggleMore() {

  const menu =
    $("moreMenu");

  if (!menu) return;

  menu.classList.toggle(
    "show"
  );

}


function closeMore() {

  const menu =
    $("moreMenu");

  if (!menu) return;

  menu.classList.remove(
    "show"
  );

}


/* =====================================================
   TOAST
===================================================== */

function showToast(message) {

  let toast =
    $("viggoToast");


  if (!toast) {

    toast =
      document.createElement(
        "div"
      );

    toast.id =
      "viggoToast";

    toast.style.position =
      "fixed";

    toast.style.bottom =
      "25px";

    toast.style.left =
      "50%";

    toast.style.transform =
      "translateX(-50%)";

    toast.style.zIndex =
      "99999";

    toast.style.padding =
      "10px 16px";

    toast.style.borderRadius =
      "10px";

    toast.style.background =
      "#222";

    toast.style.color =
      "#fff";

    toast.style.fontSize =
      "14px";

    document.body.appendChild(
      toast
    );

  }


  toast.textContent =
    message;


  toast.style.display =
    "block";


  clearTimeout(
    toast.timer
  );


  toast.timer =
    setTimeout(
      () => {

        toast.style.display =
          "none";

      },
      3000
    );

}


/* =====================================================
   SCROLL
===================================================== */

function scrollBottom() {

  const area =
    $("messages");

  if (!area) return;

  area.scrollTop =
    area.scrollHeight;

}


/* =====================================================
   EVENTS
===================================================== */

function setupEvents() {

  const newChatBtn =
    $("newChatBtn");

  if (newChatBtn) {

    newChatBtn.onclick =
      newChat;

  }


  const sendBtn =
    $("sendBtn");

  if (sendBtn) {

    sendBtn.onclick =
      sendMessage;

  }


  const shareBtn =
    $("shareBtn");

  if (shareBtn) {

    shareBtn.onclick =
      shareChat;

  }


  const voiceBtn =
    $("voiceBtn");

  if (voiceBtn) {

    voiceBtn.onclick =
      toggleVoice;

  }


  const moreBtn =
    $("moreBtn");

  if (moreBtn) {

    moreBtn.onclick =
      event => {

        event.stopPropagation();

        toggleMore();

      };

  }


  const saveBtn =
    $("saveBtn");

  if (saveBtn) {

    saveBtn.onclick =
      saveCurrentChat;

  }


  const clearBtn =
    $("clearHistoryBtn");

  if (clearBtn) {

    clearBtn.onclick =
      clearHistory;

  }


  const input =
    $("messageInput");

  if (input) {

    input.addEventListener(
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

  }


  document
    .querySelectorAll(
      "[data-language]"
    )
    .forEach(button => {

      button.onclick =
        () => {

          setLanguage(
            button.dataset.language
          );

        };

    });


  document.addEventListener(
    "click",
    event => {

      if (
        !event.target.closest(
          "#moreMenu"
        ) &&
        !event.target.closest(
          "#moreBtn"
        )
      ) {

        closeMore();

      }

    }
  );

}


/* =====================================================
   GLOBAL FUNCTIONS
===================================================== */

window.newChat =
  newChat;

window.sendMessage =
  sendMessage;

window.shareChat =
  shareChat;

window.saveCurrentChat =
  saveCurrentChat;

window.deleteChat =
  deleteChat;

window.togglePin =
  togglePin;

window.clearHistory =
  clearHistory;

window.toggleVoice =
  toggleVoice;

window.setLanguage =
  setLanguage;
