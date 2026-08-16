"use strict";

/* =====================================================
   VIGGO AI - SCRIPT.JS
===================================================== */

const API_BASE =
  "https://ai-tool-1-fgmc.onrender.com";

const CHAT_API =
  API_BASE + "/chat";

const STORAGE_KEY =
  "viggo_chat_history";

const SETTINGS_KEY =
  "viggo_settings";


/* =====================================================
   STATE
===================================================== */

let currentChatId = null;

let messages = [];

let currentLanguage = "en";

let isSending = false;

let recognition = null;

let isListening = false;


/* =====================================================
   LANGUAGES
===================================================== */

const LANGUAGES = {
  en: "English",
  ta: "Tamil",
  hi: "Hindi",
  ml: "Malayalam",
  te: "Telugu",
  kn: "Kannada"
};


/* =====================================================
   HELPER
===================================================== */

function $(id) {
  return document.getElementById(id);
}


/* =====================================================
   INITIALIZE
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

  console.log("Viggo script loaded");

  loadSettings();

  loadChat();

  setupEvents();

  setupVoice();

  loadSharedChat();

  renderHistory();

});


/* =====================================================
   STORAGE
===================================================== */

function getChats() {

  try {

    const saved =
      localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const chats =
      JSON.parse(saved);

    return Array.isArray(chats)
      ? chats
      : [];

  } catch (error) {

    console.error(
      "Storage error:",
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
   SETTINGS
===================================================== */

function loadSettings() {

  try {

    const saved =
      localStorage.getItem(
        SETTINGS_KEY
      );

    if (!saved) {
      return;
    }

    const settings =
      JSON.parse(saved);

    if (
      settings.language &&
      LANGUAGES[settings.language]
    ) {

      currentLanguage =
        settings.language;

    }

  } catch (error) {

    console.error(
      "Settings error:",
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

    title:
      "New Chat",

    messages: [],

    pinned: false,

    createdAt:
      Date.now(),

    updatedAt:
      Date.now()

  };

}


/* =====================================================
   LOAD CHAT
===================================================== */

function loadChat() {

  const chats =
    getChats();

  if (!chats.length) {

    const chat =
      createChat();

    chats.push(chat);

    saveChats(chats);

    currentChatId =
      chat.id;

    messages = [];

    renderMessages();

    updateChatTitle();

    return;
  }


  chats.sort(
    (a, b) =>
      b.updatedAt -
      a.updatedAt
  );


  const chat =
    chats[0];


  currentChatId =
    chat.id;


  messages =
    Array.isArray(chat.messages)
      ? chat.messages
      : [];


  renderMessages();

  updateChatTitle();

}


/* =====================================================
   NEW CHAT
===================================================== */

function newChat() {

  const chat =
    createChat();

  const chats =
    getChats();

  chats.unshift(chat);

  saveChats(chats);

  currentChatId =
    chat.id;

  messages = [];

  renderMessages();

  updateChatTitle();

  renderHistory();

  closeMore();

  const input =
    $("messageInput");

  if (input) {
    input.focus();
  }

}


/* =====================================================
   OPEN CHAT
===================================================== */

function openChat(id) {

  const chats =
    getChats();

  const chat =
    chats.find(
      item =>
        item.id === id
    );

  if (!chat) {
    return;
  }


  currentChatId =
    chat.id;


  messages =
    Array.isArray(chat.messages)
      ? chat.messages
      : [];


  renderMessages();

  updateChatTitle();

  renderHistory();

  closeMore();

}


/* =====================================================
   UPDATE CHAT
===================================================== */

function updateChat() {

  const chats =
    getChats();

  const chat =
    chats.find(
      item =>
        item.id === currentChatId
    );

  if (!chat) {
    return;
  }


  chat.messages =
    messages;


  chat.updatedAt =
    Date.now();


  const firstUserMessage =
    messages.find(
      item =>
        item.role === "user"
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

  const title =
    $("chatTitle");

  if (!title) {
    return;
  }


  const chats =
    getChats();

  const chat =
    chats.find(
      item =>
        item.id === currentChatId
    );


  title.textContent =
    chat?.title ||
    "New Chat";

}


/* =====================================================
   HISTORY
===================================================== */

function renderHistory() {

  const list =
    $("historyList");

  if (!list) {
    return;
  }


  const chats =
    getChats();


  list.innerHTML = "";


  const pinned =
    chats.filter(
      chat =>
        chat.pinned === true
    );


  const recent =
    chats.filter(
      chat =>
        chat.pinned !== true
    );


  createHistorySection(
    list,
    "Pinned",
    pinned
  );


  createHistorySection(
    list,
    "Recent",
    recent
  );

}


/* =====================================================
   HISTORY SECTION
===================================================== */

function createHistorySection(
  list,
  title,
  chats
) {

  if (!chats.length) {
    return;
  }


  const heading =
    document.createElement("div");

  heading.className =
    "history-section-title";

  heading.textContent =
    title;

  list.appendChild(
    heading
  );


  chats.forEach(
    chat => {

      const row =
        document.createElement("div");

      row.className =
        "history-item";


      if (
        chat.id ===
        currentChatId
      ) {

        row.classList.add(
          "active"
        );

      }


      row.dataset.chatId =
        chat.id;


      const chatTitle =
        document.createElement("div");

      chatTitle.className =
        "history-title";

      chatTitle.textContent =
        chat.title ||
        "New Chat";


      const actions =
        document.createElement("div");

      actions.className =
        "history-actions";


      /* PIN */

      const pinBtn =
        document.createElement("button");

      pinBtn.className =
        "history-action";

      pinBtn.textContent =
        chat.pinned
          ? "📌"
          : "📍";

      pinBtn.title =
        "Pin / Unpin";


      pinBtn.onclick =
        event => {

          event.stopPropagation();

          togglePin(
            chat.id
          );

        };


      /* DELETE */

      const deleteBtn =
        document.createElement("button");

      deleteBtn.className =
        "history-action delete";

      deleteBtn.textContent =
        "🗑";

      deleteBtn.title =
        "Delete Chat";


      deleteBtn.onclick =
        event => {

          event.stopPropagation();

          deleteChat(
            chat.id
          );

        };


      actions.appendChild(
        pinBtn
      );

      actions.appendChild(
        deleteBtn
      );


      row.appendChild(
        chatTitle
      );

      row.appendChild(
        actions
      );


      row.onclick =
        () => {

          openChat(
            chat.id
          );

        };


      list.appendChild(
        row
      );

    }
  );

}


/* =====================================================
   PIN CHAT
===================================================== */

function togglePin(id) {

  const chats =
    getChats();

  const chat =
    chats.find(
      item =>
        item.id === id
    );

  if (!chat) {
    return;
  }


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

  const confirmed =
    confirm(
      "Delete this chat?"
    );

  if (!confirmed) {
    return;
  }


  let chats =
    getChats();


  chats =
    chats.filter(
      chat =>
        chat.id !== id
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
   SAVE CHAT
===================================================== */

function saveCurrentChat() {

  updateChat();

  closeMore();

  showToast(
    "✓ Chat saved"
  );

}


/* =====================================================
   CLEAR HISTORY
===================================================== */

function clearHistory() {

  const confirmed =
    confirm(
      "Delete all chat history?"
    );

  if (!confirmed) {
    return;
  }


  const chat =
    createChat();


  saveChats([
    chat
  ]);


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

  if (!area) {
    return;
  }


  area.innerHTML = "";


  if (!messages.length) {

    area.innerHTML = `

      <div class="welcome">

        <div class="big-logo">
          V
        </div>

        <h1>
          Welcome to Viggo
        </h1>

        <p>
          Your AI friend is ready.
        </p>

      </div>

    `;

    return;

  }


  messages.forEach(
    message => {

      createMessageElement(
        message.role,
        message.content
      );

    }
  );


  scrollBottom();

}


/* =====================================================
   CREATE MESSAGE
===================================================== */

function createMessageElement(
  role,
  text
) {

  const area =
    $("messages");

  if (!area) {
    return;
  }


  const wrapper =
    document.createElement("div");

  wrapper.className =
    "message " +
    (
      role === "user"
        ? "user-message"
        : "assistant-message"
    );


  const bubble =
    document.createElement("div");

  bubble.className =
    "message-bubble";

  bubble.textContent =
    text;


  wrapper.appendChild(
    bubble
  );


  /* ASSISTANT ACTIONS */

  if (
    role === "assistant"
  ) {

    const actions =
      document.createElement("div");

    actions.className =
      "message-actions";


    /* COPY */

    const copy =
      createMessageButton(
        "📋",
        "Copy",
        () => {

          copyText(
            text
          );

        }
      );


    /* LIKE */

    const like =
      createMessageButton(
        "👍",
        "Like",
        button => {

          button.classList.toggle(
            "active"
          );

        }
      );


    /* SPEAKER */

    const speaker =
      createMessageButton(
        "🔊",
        "Speak",
        () => {

          speakText(
            text
          );

        }
      );


    actions.appendChild(
      copy
    );

    actions.appendChild(
      like
    );

    actions.appendChild(
      speaker
    );


    wrapper.appendChild(
      actions
    );

  }


  area.appendChild(
    wrapper
  );

}


/* =====================================================
   MESSAGE BUTTON
===================================================== */

function createMessageButton(
  icon,
  title,
  callback
) {

  const button =
    document.createElement("button");

  button.className =
    "message-action";

  button.type =
    "button";

  button.textContent =
    icon;

  button.title =
    title;


  button.addEventListener(
    "click",
    () => {

      callback(button);

    }
  );


  return button;

}


/* =====================================================
   SEND MESSAGE
===================================================== */

async function sendMessage() {

  if (isSending) {
    return;
  }


  const input =
    $("messageInput");

  if (!input) {
    return;
  }


  const text =
    input.value.trim();


  if (!text) {
    return;
  }


  isSending =
    true;


  const sendButton =
    $("sendBtn");

  if (sendButton) {
    sendButton.disabled =
      true;
  }


  /* USER MESSAGE */

  messages.push({

    role:
      "user",

    content:
      text,

    timestamp:
      Date.now()

  });


  input.value =
    "";


  renderMessages();

  updateChat();

  showTyping();


  try {

    console.log(
      "Sending message to:",
      CHAT_API
    );


    const reply =
      await callViggo(
        text
      );


    removeTyping();


    messages.push({

      role:
        "assistant",

      content:
        reply,

      timestamp:
        Date.now()

    });


    renderMessages();

    updateChat();


  } catch (error) {

    removeTyping();


    console.error(
      "Viggo Error:",
      error
    );


    const errorMessage =
      "⚠️ " +
      error.message;


    messages.push({

      role:
        "assistant",

      content:
        errorMessage,

      timestamp:
        Date.now()

    });


    renderMessages();

    updateChat();


  } finally {

    isSending =
      false;


    if (sendButton) {
      sendButton.disabled =
        false;
    }

  }

}


/* =====================================================
   CALL VIGGO SERVER
===================================================== */

async function callViggo(
  text
) {

  console.log(
    "Calling Viggo:",
    CHAT_API
  );


  let response;


  try {

    response =
      await fetch(
        CHAT_API,
        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json",

            "Accept":
              "application/json"

          },

          body:
            JSON.stringify({

              message:
                text,

              language:
                currentLanguage,

              history:
                messages
                  .slice(-20)
                  .map(
                    item => ({

                      role:
                        item.role,

                      content:
                        item.content

                    })
                  )

            })

        }
      );

  } catch (error) {

    console.error(
      "FETCH ERROR:",
      error
    );


    throw new Error(
      "Render server connect ஆகவில்லை. Internet / Render URL check பண்ணு."
    );

  }


  const raw =
    await response.text();


  console.log(
    "HTTP STATUS:",
    response.status
  );

  console.log(
    "RAW SERVER RESPONSE:",
    raw
  );


  let data;


  try {

    data =
      JSON.parse(
        raw
      );

  } catch (error) {

    throw new Error(
      "Server JSON response கொடுக்கவில்லை. Response: " +
      raw.substring(0, 300)
    );

  }


  if (!response.ok) {

    throw new Error(

      data.details ||
      data.error ||
      (
        "Server Error " +
        response.status
      )

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
    typeof data.reply !==
    "string" ||
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

  if (!area) {
    return;
  }


  const typing =
    document.createElement("div");

  typing.id =
    "viggoTyping";

  typing.className =
    "message assistant-message";


  typing.innerHTML = `

    <div class="message-bubble">

      <div class="typing">

        <span></span>
        <span></span>
        <span></span>

      </div>

    </div>

  `;


  area.appendChild(
    typing
  );


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

    textarea.value =
      text;

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
   SPEAKER
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


  const languageCodes = {

    en:
      "en-IN",

    ta:
      "ta-IN",

    hi:
      "hi-IN",

    ml:
      "ml-IN",

    te:
      "te-IN",

    kn:
      "kn-IN"

  };


  const utterance =
    new SpeechSynthesisUtterance(
      text
    );


  utterance.lang =
    languageCodes[
      currentLanguage
    ] ||
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
      "SpeechRecognition unavailable"
    );

    return;

  }


  recognition =
    new SpeechRecognition();


  recognition.continuous =
    false;

  recognition.interimResults =
    false;


  recognition.onstart =
    () => {

      isListening =
        true;

      const button =
        $("voiceBtn");

      if (button) {

        button.classList.add(
          "active"
        );

      }

      showToast(
        "Listening..."
      );

    };


  recognition.onresult =
    event => {

      const text =
        event
          .results[0][0]
          .transcript;


      const input =
        $("messageInput");

      if (input) {

        input.value =
          text;

        input.focus();

      }

    };


  recognition.onerror =
    event => {

      console.error(
        "Speech error:",
        event.error
      );

      showToast(
        "Voice error: " +
        event.error
      );

    };


  recognition.onend =
    () => {

      isListening =
        false;

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
      "Voice input இந்த browser-ல் support இல்லை."
    );

    return;

  }


  if (isListening) {

    recognition.stop();

    return;

  }


  const languageCodes = {

    en:
      "en-IN",

    ta:
      "ta-IN",

    hi:
      "hi-IN",

    ml:
      "ml-IN",

    te:
      "te-IN",

    kn:
      "kn-IN"

  };


  recognition.lang =
    languageCodes[
      currentLanguage
    ] ||
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
      "No chat to share"
    );

    return;

  }


  try {

    const encoded =
      btoa(
        encodeURIComponent(
          JSON.stringify(
            chat
          )
        )
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


  if (!encoded) {
    return;
  }


  try {

    const chat =
      JSON.parse(
        decodeURIComponent(
          atob(encoded)
        )
      );


    if (
      !chat ||
      !Array.isArray(
        chat.messages
      )
    ) {

      throw new Error(
        "Invalid shared chat"
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

  if (!LANGUAGES[language]) {
    return;
  }


  currentLanguage =
    language;


  saveSettings();


  closeMore();


  showToast(
    "Language: " +
    LANGUAGES[language]
  );

}


/* =====================================================
   MORE MENU
===================================================== */

function toggleMore() {

  const menu =
    $("moreMenu");

  if (!menu) {
    return;
  }


  menu.classList.toggle(
    "show"
  );

}


function closeMore() {

  const menu =
    $("moreMenu");

  if (!menu) {
    return;
  }


  menu.classList.remove(
    "show"
  );

}


/* =====================================================
   MOBILE SIDEBAR
===================================================== */

function toggleSidebar() {

  const sidebar =
    $("sidebar");

  if (!sidebar) {
    return;
  }


  sidebar.classList.toggle(
    "open"
  );

}


/* =====================================================
   EVENTS
===================================================== */

function setupEvents() {

  const newChatBtn =
    $("newChatBtn");

  if (newChatBtn) {

    newChatBtn.addEventListener(
      "click",
      newChat
    );

  }


  const sendBtn =
    $("sendBtn");

  if (sendBtn) {

    sendBtn.addEventListener(
      "click",
      sendMessage
    );

  }


  const shareBtn =
    $("shareBtn");

  if (shareBtn) {

    shareBtn.addEventListener(
      "click",
      shareChat
    );

  }


  const voiceBtn =
    $("voiceBtn");

  if (voiceBtn) {

    voiceBtn.addEventListener(
      "click",
      toggleVoice
    );

  }


  const moreBtn =
    $("moreBtn");

  if (moreBtn) {

    moreBtn.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        toggleMore();

      }
    );

  }


  const saveBtn =
    $("saveBtn");

  if (saveBtn) {

    saveBtn.addEventListener(
      "click",
      saveCurrentChat
    );

  }


  const deleteBtn =
    $("deleteSelectedBtn");

  if (deleteBtn) {

    deleteBtn.addEventListener(
      "click",
      () => {

        if (!currentChatId) {

          showToast(
            "No chat selected"
          );

          return;

        }


        deleteChat(
          currentChatId
        );

        closeMore();

      }
    );

  }


  const clearBtn =
    $("clearHistoryBtn");

  if (clearBtn) {

    clearBtn.addEventListener(
      "click",
      clearHistory
    );

  }


  const input =
    $("messageInput");

  if (input) {

    input.addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
            "Enter" &&
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
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            setLanguage(
              button.dataset.language
            );

          }
        );

      }
    );


  const mobileMenu =
    $("mobileMenuBtn");

  if (mobileMenu) {

    mobileMenu.addEventListener(
      "click",
      toggleSidebar
    );

  }


  const closeSidebar =
    $("closeSidebarBtn");

  if (closeSidebar) {

    closeSidebar.addEventListener(
      "click",
      toggleSidebar
    );

  }


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
   SCROLL
===================================================== */

function scrollBottom() {

  const area =
    $("messages");

  if (!area) {
    return;
  }


  area.scrollTop =
    area.scrollHeight;

}


/* =====================================================
   TOAST
===================================================== */

function showToast(
  message
) {

  const toast =
    $("viggoToast");

  if (!toast) {
    return;
  }


  toast.textContent =
    message;


  toast.classList.add(
    "show"
  );


  clearTimeout(
    toast._timer
  );


  toast._timer =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      2500
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

window.setLanguage =
  setLanguage;

window.toggleVoice =
  toggleVoice;
