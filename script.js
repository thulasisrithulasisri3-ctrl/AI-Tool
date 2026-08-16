"use strict";

/* =========================================
   CONFIG
========================================= */

const API_BASE =
  "https://ai-tool-1-fgmc.onrender.com";

const CHAT_API =
  API_BASE + "/chat";

const STORAGE_KEY =
  "viggo_chat_history";

const SETTINGS_KEY =
  "viggo_settings";


/* =========================================
   STATE
========================================= */

let currentChatId = null;

let messages = [];

let currentLanguage = "en";

let isSending = false;

let recognition = null;

let isListening = false;


/* =========================================
   LANGUAGE
========================================= */

const LANGUAGES = {

  en: "English",

  ta: "Tamil",

  hi: "Hindi",

  ml: "Malayalam",

  te: "Telugu",

  kn: "Kannada"

};


/* =========================================
   HELPERS
========================================= */

function $(id) {

  return document.getElementById(id);

}


/* =========================================
   STORAGE
========================================= */

function getChats() {

  try {

    const data =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!data) {
      return [];
    }

    const chats =
      JSON.parse(data);

    return Array.isArray(chats)
      ? chats
      : [];

  } catch (error) {

    console.error(error);

    return [];
  }
}


function saveChats(chats) {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(chats)
  );

}


/* =========================================
   CREATE CHAT
========================================= */

function createChat() {

  return {

    id:
      "chat_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 8),

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


/* =========================================
   INIT
========================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadSettings();

    loadChat();

    setupEvents();

    setupVoice();

    loadSharedChat();

    renderHistory();

  }
);


/* =========================================
   SETTINGS
========================================= */

function loadSettings() {

  try {

    const data =
      localStorage.getItem(
        SETTINGS_KEY
      );

    if (!data) {
      return;
    }

    const settings =
      JSON.parse(data);

    if (
      settings.language &&
      LANGUAGES[
        settings.language
      ]
    ) {

      currentLanguage =
        settings.language;

    }

  } catch {}

}


function saveSettings() {

  localStorage.setItem(

    SETTINGS_KEY,

    JSON.stringify({

      language:
        currentLanguage

    })

  );

}


function setLanguage(language) {

  if (!LANGUAGES[language]) {
    return;
  }

  currentLanguage =
    language;

  saveSettings();

  showToast(
    "Language: " +
    LANGUAGES[language]
  );

}


/* =========================================
   LOAD CHAT
========================================= */

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
    Array.isArray(
      chat.messages
    )
      ? chat.messages
      : [];

  renderMessages();

}


/* =========================================
   NEW CHAT
========================================= */

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

  $("messageInput")?.focus();

  closeMore();

}


/* =========================================
   LOAD SPECIFIC CHAT
========================================= */

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
    chat.messages || [];

  renderMessages();

  updateChatTitle();

  renderHistory();

  closeMore();

}


/* =========================================
   UPDATE CHAT
========================================= */

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


  const firstUser =
    messages.find(
      item =>
        item.role ===
        "user"
    );


  if (
    firstUser &&
    chat.title ===
      "New Chat"
  ) {

    chat.title =
      firstUser.content
        .replace(/\s+/g, " ")
        .slice(0, 35);

  }


  saveChats(chats);

  updateChatTitle();

  renderHistory();

}


/* =========================================
   TITLE
========================================= */

function updateChatTitle() {

  const chats =
    getChats();

  const chat =
    chats.find(
      item =>
        item.id ===
        currentChatId
    );

  $("chatTitle").textContent =
    chat?.title ||
    "New Chat";

}


/* =========================================
   HISTORY
========================================= */

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
        chat.pinned
    );


  const recent =
    chats.filter(
      chat =>
        !chat.pinned
    );


  function section(
    title,
    items
  ) {

    if (!items.length) {
      return;
    }

    const heading =
      document.createElement(
        "div"
      );

    heading.className =
      "history-section-title";

    heading.textContent =
      title;

    list.appendChild(
      heading
    );


    items.forEach(
      chat => {

        const row =
          document.createElement(
            "div"
          );

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


        const titleElement =
          document.createElement(
            "div"
          );

        titleElement.className =
          "history-title";

        titleElement.textContent =
          chat.title ||
          "New Chat";


        const actions =
          document.createElement(
            "div"
          );

        actions.className =
          "history-actions";


        const pin =
          document.createElement(
            "button"
          );

        pin.className =
          "history-action";

        pin.textContent =
          chat.pinned
            ? "📌"
            : "📍";

        pin.title =
          "Pin / Unpin";


        pin.onclick =
          event => {

            event.stopPropagation();

            togglePin(
              chat.id
            );

          };


        const del =
          document.createElement(
            "button"
          );

        del.className =
          "history-action delete";

        del.textContent =
          "🗑";

        del.title =
          "Delete";


        del.onclick =
          event => {

            event.stopPropagation();

            deleteChat(
              chat.id
            );

          };


        actions.appendChild(
          pin
        );

        actions.appendChild(
          del
        );


        row.appendChild(
          titleElement
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


  section(
    "Pinned",
    pinned
  );

  section(
    "Recent",
    recent
  );

}


/* =========================================
   PIN
========================================= */

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


/* =========================================
   DELETE CHAT
========================================= */

function deleteChat(id) {

  const ok =
    confirm(
      "Delete this chat?"
    );

  if (!ok) {
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

    const chat =
      createChat();

    chats.push(chat);

  }


  saveChats(chats);


  if (
    currentChatId ===
    id
  ) {

    currentChatId =
      chats[0].id;

    messages =
      chats[0].messages || [];

    renderMessages();

    updateChatTitle();

  }


  renderHistory();

}


/* =========================================
   SAVE
========================================= */

function saveCurrentChat() {

  updateChat();

  showToast(
    "✓ Chat saved"
  );

}


/* =========================================
   CLEAR HISTORY
========================================= */

function clearHistory() {

  const ok =
    confirm(
      "Delete all chat history?"
    );

  if (!ok) {
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


/* =========================================
   RENDER MESSAGES
========================================= */

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


/* =========================================
   CREATE MESSAGE
========================================= */

function createMessageElement(
  role,
  text
) {

  const area =
    $("messages");

  const wrapper =
    document.createElement(
      "div"
    );

  wrapper.className =
    "message " +
    (
      role === "user"
        ? "user-message"
        : "assistant-message"
    );


  const bubble =
    document.createElement(
      "div"
    );

  bubble.className =
    "message-bubble";

  bubble.textContent =
    text;


  wrapper.appendChild(
    bubble
  );


  if (
    role ===
    "assistant"
  ) {

    const actions =
      document.createElement(
        "div"
      );

    actions.className =
      "message-actions";


    const copy =
      createAction(
        "📋",
        "Copy",
        () =>
          copyText(text)
      );


    const like =
      createAction(
        "👍",
        "Like",
        button =>
          button.classList.toggle(
            "active"
          )
      );


    const speaker =
      createAction(
        "🔊",
        "Speak",
        () =>
          speak(text)
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


function createAction(
  icon,
  title,
  callback
) {

  const button =
    document.createElement(
      "button"
    );

  button.className =
    "message-action";

  button.type =
    "button";

  button.textContent =
    icon;

  button.title =
    title;


  button.onclick =
    () =>
      callback(button);


  return button;

}


/* =========================================
   SEND
========================================= */

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


  if (!currentChatId) {

    const chat =
      createChat();

    const chats =
      getChats();

    chats.unshift(chat);

    saveChats(chats);

    currentChatId =
      chat.id;

  }


  messages.push({

    role:
      "user",

    content:
      text,

    timestamp:
      Date.now()

  });


  renderMessages();

  updateChat();

  input.value =
    "";


  isSending =
    true;

  $("sendBtn").disabled =
    true;


  showTyping();


  try {

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
      "Viggo error:",
      error
    );


    messages.push({

      role:
        "assistant",

      content:
        "⚠️ " +
        error.message,

      timestamp:
        Date.now()

    });


    renderMessages();

  } finally {

    isSending =
      false;

    $("sendBtn").disabled =
      false;

  }

}


/* =========================================
   CALL SERVER
========================================= */

async function callViggo(
  text
) {

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

    throw new Error(
      "Cannot connect to Viggo server. Check your Render server."
    );

  }


  const raw =
    await response.text();


  let data;


  try {

    data =
      JSON.parse(
        raw
      );

  } catch {

    throw new Error(
      "Server returned invalid JSON."
    );

  }


  if (!response.ok) {

    throw new Error(

      data.details ||
      data.error ||
      "Server error " +
        response.status

    );

  }


  if (!data.success) {

    throw new Error(

      data.details ||
      data.error ||
      "Viggo AI request failed."

    );

  }


  if (!data.reply) {

    throw new Error(
      "Viggo AI returned an empty reply."
    );

  }


  return data.reply;

}


/* =========================================
   TYPING
========================================= */

function showTyping() {

  const area =
    $("messages");

  const typing =
    document.createElement(
      "div"
    );

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

  $("viggoTyping")?.remove();

}


/* =========================================
   COPY
========================================= */

async function copyText(
  text
) {

  try {

    await navigator.clipboard.writeText(
      text
    );

  } catch {

    const area =
      document.createElement(
        "textarea"
      );

    area.value =
      text;

    document.body.appendChild(
      area
    );

    area.select();

    document.execCommand(
      "copy"
    );

    area.remove();

  }


  showToast(
    "Copied"
  );

}


/* =========================================
   SPEAK
========================================= */

function speak(text) {

  if (
    !window.speechSynthesis
  ) {

    showToast(
      "Voice not supported"
    );

    return;

  }


  speechSynthesis.cancel();


  const lang = {

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
    lang[currentLanguage] ||
    "en-IN";


  speechSynthesis.speak(
    utterance
  );

}


/* =========================================
   VOICE INPUT
========================================= */

function setupVoice() {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


  if (!SpeechRecognition) {
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

      $("voiceBtn")
        .classList.add(
          "active"
        );

    };


  recognition.onresult =
    event => {

      const text =
        event.results[0][0]
          .transcript;

      $("messageInput").value =
        text;

    };


  recognition.onend =
    () => {

      isListening =
        false;

      $("voiceBtn")
        .classList.remove(
          "active"
        );

    };


  recognition.onerror =
    error => {

      console.error(
        "Voice:",
        error
      );

      isListening =
        false;

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


  const lang = {

    en: "en-IN",

    ta: "ta-IN",

    hi: "hi-IN",

    ml: "ml-IN",

    te: "te-IN",

    kn: "kn-IN"

  };


  recognition.lang =
    lang[currentLanguage] ||
    "en-IN";


  recognition.start();

}


/* =========================================
   SHARE FULL CHAT
========================================= */

async function shareChat() {

  const chats =
    getChats();

  const chat =
    chats.find(
      item =>
        item.id ===
        currentChatId
    );


  if (!chat) {

    showToast(
      "Nothing to share"
    );

    return;

  }


  const encoded =
    btoa(
      encodeURIComponent(
        JSON.stringify(
          chat
        )
      )
    );


  const url =
    window.location.origin +
    window.location.pathname +
    "?chat=" +
    encoded;


  try {

    if (
      navigator.share
    ) {

      await navigator.share({

        title:
          chat.title,

        text:
          "Viggo AI Chat",

        url:
          url

      });

    } else {

      await copyText(
        url
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

      console.error(error);

    }

  }

}


/* =========================================
   LOAD SHARED CHAT
========================================= */

function loadSharedChat() {

  const params =
    new URLSearchParams(
      window.location.search
    );

  const data =
    params.get("chat");


  if (!data) {
    return;
  }


  try {

    const chat =
      JSON.parse(
        decodeURIComponent(
          atob(data)
        )
      );


    if (
      !chat ||
      !Array.isArray(
        chat.messages
      )
    ) {

      return;

    }


    currentChatId =
      chat.id ||
      "shared_" +
      Date.now();


    messages =
      chat.messages;


    renderMessages();

    updateChatTitle();

    showToast(
      "Shared chat opened"
    );

  } catch (error) {

    console.error(
      "Shared chat error:",
      error
    );

  }

}


/* =========================================
   MORE MENU
========================================= */

function toggleMore() {

  $("moreMenu")
    .classList.toggle(
      "show"
    );

}


function closeMore() {

  $("moreMenu")
    .classList.remove(
      "show"
    );

}


/* =========================================
   MOBILE SIDEBAR
========================================= */

function toggleSidebar() {

  $("sidebar")
    .classList.toggle(
      "open"
    );

}


/* =========================================
   EVENTS
========================================= */

function setupEvents() {

  $("newChatBtn")
    .addEventListener(
      "click",
      newChat
    );


  $("sendBtn")
    .addEventListener(
      "click",
      sendMessage
    );


  $("shareBtn")
    .addEventListener(
      "click",
      shareChat
    );


  $("moreBtn")
    .addEventListener(
      "click",
      event => {

        event.stopPropagation();

        toggleMore();

      }
    );


  $("saveBtn")
    .addEventListener(
      "click",
      saveCurrentChat
    );


  $("deleteSelectedBtn")
    .addEventListener(
      "click",
      () => {

        const selected =
          document.querySelector(
            ".history-item.active"
          );

        if (!selected) {

          showToast(
            "Open a chat first"
          );

          return;

        }

        const id =
          selected.dataset.chatId;

        if (id) {

          deleteChat(id);

        }

      }
    );


  $("clearHistoryBtn")
    .addEventListener(
      "click",
      clearHistory
    );


  $("voiceBtn")
    .addEventListener(
      "click",
      toggleVoice
    );


  $("mobileMenuBtn")
    .addEventListener(
      "click",
      toggleSidebar
    );


  $("closeSidebarBtn")
    .addEventListener(
      "click",
      toggleSidebar
    );


  $("messageInput")
    .addEventListener(
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


/* =========================================
   SCROLL
========================================= */

function scrollBottom() {

  const area =
    $("messages");

  if (!area) {
    return;
  }

  area.scrollTop =
    area.scrollHeight;

}


/* =========================================
   TOAST
========================================= */

function showToast(
  message
) {

  const toast =
    $("viggoToast");

  toast.textContent =
    message;

  toast.classList.add(
    "show"
  );


  clearTimeout(
    toast.timer
  );


  toast.timer =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      2000
    );

}


/* =========================================
   GLOBAL
========================================= */

window.newChat =
  newChat;

window.sendMessage =
  sendMessage;

window.shareChat =
  shareChat;

window.setLanguage =
  setLanguage;

window.deleteChat =
  deleteChat;

window.togglePin =
  togglePin;

window.saveCurrentChat =
  saveCurrentChat;

window.clearHistory =
  clearHistory;
