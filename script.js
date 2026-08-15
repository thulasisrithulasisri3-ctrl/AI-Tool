"use strict";

/* =========================================
   VIGGO AI ASSISTANT
   Conversation + Recent + Pin + Delete
   Reference -> New Conversation
========================================= */

const API_URL =
  "https://ai-tool-2-zpul.onrender.com/api/chat";

/* =========================================
   ELEMENTS
========================================= */

const sidebar = document.getElementById("sidebar");
const mobileMenu = document.getElementById("mobileMenu");
const newChatButton = document.getElementById("newChat");

const pinnedList = document.getElementById("pinnedList");
const recentList = document.getElementById("recentList");
const clearHistoryButton =
  document.getElementById("clearHistory");

const currentTitle =
  document.getElementById("currentTitle");

const saveButton =
  document.getElementById("saveButton");

const historyButton =
  document.getElementById("historyButton");

const historyModal =
  document.getElementById("historyModal");

const historyList =
  document.getElementById("historyList");

const closeHistory =
  document.getElementById("closeHistory");

const conversation =
  document.getElementById("conversation");

const chatArea =
  document.getElementById("chatArea");

const messageInput =
  document.getElementById("message");

const sendButton =
  document.getElementById("send");

const micButton =
  document.getElementById("mic");

const voiceToggle =
  document.getElementById("voiceToggle");

/* =========================================
   STATE
========================================= */

let chats = [];
let activeChatId = null;

let voiceEnabled =
  localStorage.getItem("viggoVoice") !== "false";

/* =========================================
   STORAGE KEYS
========================================= */

const CHATS_KEY = "viggoChats";
const OLD_HISTORY_KEY = "viggoHistory";

/* =========================================
   LOAD CHATS
========================================= */

function loadChats() {
  try {
    const saved =
      localStorage.getItem(CHATS_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        chats = parsed;
      }
    }

    /*
      Old history migration.
      This helps if your old version stored:
      viggoHistory
    */

    if (
      chats.length === 0 &&
      localStorage.getItem(OLD_HISTORY_KEY)
    ) {
      migrateOldHistory();
    }

  } catch (error) {
    console.error(
      "❌ History load error:",
      error
    );

    chats = [];
  }

  normalizeChats();
}

/* =========================================
   NORMALIZE
========================================= */

function normalizeChats() {
  chats = chats.map(chat => {

    if (!chat.id) {
      chat.id = createChatId();
    }

    if (!chat.title) {
      chat.title = "New Chat";
    }

    if (!Array.isArray(chat.messages)) {
      chat.messages = [];
    }

    if (typeof chat.pinned !== "boolean") {
      chat.pinned = false;
    }

    if (!chat.createdAt) {
      chat.createdAt = Date.now();
    }

    if (!chat.updatedAt) {
      chat.updatedAt =
        chat.createdAt;
    }

    return chat;
  });
}

/* =========================================
   MIGRATE OLD HISTORY
========================================= */

function migrateOldHistory() {
  try {
    const old =
      JSON.parse(
        localStorage.getItem(
          OLD_HISTORY_KEY
        ) || "[]"
      );

    if (!Array.isArray(old)) {
      return;
    }

    old.forEach(item => {

      const messages = [];

      if (item.user) {
        messages.push({
          id: Date.now() + Math.random(),
          role: "user",
          text: item.user,
          time: Date.now()
        });
      }

      if (item.ai) {
        messages.push({
          id: Date.now() + Math.random(),
          role: "assistant",
          text: item.ai,
          time: Date.now()
        });
      }

      if (messages.length === 0) {
        return;
      }

      chats.push({
        id: createChatId(),
        title:
          item.user
            ? makeTitle(item.user)
            : "Saved Chat",
        pinned:
          item.pinned === true,
        createdAt:
          item.id || Date.now(),
        updatedAt:
          item.id || Date.now(),
        messages
      });
    });

    saveChats();

  } catch (error) {
    console.error(
      "❌ Old history migration failed:",
      error
    );
  }
}

/* =========================================
   SAVE CHATS
========================================= */

function saveChats() {
  try {
    localStorage.setItem(
      CHATS_KEY,
      JSON.stringify(chats)
    );

    return true;

  } catch (error) {

    console.error(
      "❌ Could not save chats:",
      error
    );

    return false;
  }
}

/* =========================================
   CREATE ID
========================================= */

function createChatId() {
  return (
    Date.now().toString(36) +
    Math.random()
      .toString(36)
      .substring(2, 10)
  );
}

/* =========================================
   GET ACTIVE CHAT
========================================= */

function getActiveChat() {
  return chats.find(
    chat =>
      chat.id === activeChatId
  );
}

/* =========================================
   CREATE CHAT
========================================= */

function createChat(
  title = "New Chat"
) {

  const chat = {
    id: createChatId(),

    title: title,

    pinned: false,

    createdAt: Date.now(),

    updatedAt: Date.now(),

    messages: [],

    referenceFrom: null
  };

  chats.unshift(chat);

  activeChatId =
    chat.id;

  saveChats();

  renderSidebar();
  renderConversation();
  updateTitle();

  return chat;
}

/* =========================================
   NEW CHAT
========================================= */

function createNewChat() {

  createChat(
    "New Chat"
  );

  closeMobileSidebar();

  messageInput.focus();
}

newChatButton.addEventListener(
  "click",
  createNewChat
);

/* =========================================
   OPEN CHAT
========================================= */

function openChat(chatId) {

  const chat =
    chats.find(
      item =>
        item.id === chatId
    );

  if (!chat) {
    return;
  }

  activeChatId =
    chat.id;

  chat.updatedAt =
    Date.now();

  saveChats();

  renderSidebar();
  renderConversation();
  updateTitle();

  closeMobileSidebar();

  messageInput.focus();
}

/* =========================================
   CHAT TITLE
========================================= */

function makeTitle(text) {

  let title =
    String(text || "")
      .replace(/\s+/g, " ")
      .trim();

  if (!title) {
    return "New Chat";
  }

  if (title.length > 42) {
    title =
      title.substring(0, 42) +
      "...";
  }

  return title;
}

/* =========================================
   UPDATE TITLE
========================================= */

function updateChatTitle(
  chat,
  firstMessage
) {

  if (!chat) {
    return;
  }

  if (
    chat.title === "New Chat" ||
    !chat.title
  ) {
    chat.title =
      makeTitle(firstMessage);
  }
}

/* =========================================
   TOP TITLE
========================================= */

function updateTitle() {

  const chat =
    getActiveChat();

  if (!chat) {
    currentTitle.textContent =
      "New Chat";

    return;
  }

  currentTitle.textContent =
    chat.title || "New Chat";
}

/* =========================================
   ADD MESSAGE
========================================= */

function addUserMessage(
  chat,
  text
) {

  chat.messages.push({

    id:
      createChatId(),

    role:
      "user",

    text:
      text,

    time:
      Date.now()

  });

  updateChatTitle(
    chat,
    text
  );

  chat.updatedAt =
    Date.now();

  saveChats();
}

/* =========================================
   ADD AI MESSAGE
========================================= */

function addAIMessage(
  chat,
  text
) {

  chat.messages.push({

    id:
      createChatId(),

    role:
      "assistant",

    text:
      text,

    time:
      Date.now()

  });

  chat.updatedAt =
    Date.now();

  saveChats();
}

/* =========================================
   RENDER SIDEBAR
========================================= */

function renderSidebar() {

  pinnedList.innerHTML = "";
  recentList.innerHTML = "";

  const sorted =
    [...chats].sort(
      (a, b) =>
        b.updatedAt -
        a.updatedAt
    );

  const pinned =
    sorted.filter(
      chat =>
        chat.pinned
    );

  const recent =
    sorted.filter(
      chat =>
        !chat.pinned
    );

  if (pinned.length === 0) {

    pinnedList.innerHTML =
      '<div class="empty-sidebar">No pinned chats</div>';

  } else {

    pinned.forEach(chat => {
      renderSidebarItem(
        chat,
        pinnedList
      );
    });
  }

  if (recent.length === 0) {

    recentList.innerHTML =
      '<div class="empty-sidebar">No recent chats</div>';

  } else {

    recent.forEach(chat => {
      renderSidebarItem(
        chat,
        recentList
      );
    });
  }
}

/* =========================================
   SIDEBAR ITEM
========================================= */

function renderSidebarItem(
  chat,
  container
) {

  const button =
    document.createElement(
      "button"
    );

  button.type = "button";

  button.className =
    "chat-item";

  if (
    chat.id === activeChatId
  ) {
    button.classList.add(
      "active"
    );
  }

  const title =
    document.createElement(
      "span"
    );

  title.className =
    "chat-item-title";

  title.textContent =
    chat.title || "New Chat";

  button.appendChild(title);

  if (chat.pinned) {

    const pin =
      document.createElement(
        "span"
      );

    pin.className =
      "pin-icon";

    pin.textContent =
      "📌";

    button.appendChild(pin);
  }

  button.addEventListener(
    "click",
    () => {
      openChat(chat.id);
    }
  );

  /*
    Right-click:
    quick reference menu
  */

  button.addEventListener(
    "contextmenu",
    event => {

      event.preventDefault();

      showChatActions(chat);
    }
  );

  container.appendChild(
    button
  );
}

/* =========================================
   CHAT ACTIONS
========================================= */

function showChatActions(chat) {

  const action =
    prompt(
      `Chat: ${chat.title}\n\n` +
      `Type:\n` +
      `1 = Open\n` +
      `2 = Reference\n` +
      `3 = Pin/Unpin\n` +
      `4 = Delete`
    );

  if (action === "1") {

    openChat(chat.id);

  } else if (action === "2") {

    createReferenceChat(
      chat.id
    );

  } else if (action === "3") {

    togglePin(chat.id);

  } else if (action === "4") {

    deleteChat(chat.id);
  }
}

/* =========================================
   REFERENCE CHAT
========================================= */

function createReferenceChat(
  sourceChatId
) {

  const source =
    chats.find(
      chat =>
        chat.id ===
        sourceChatId
    );

  if (!source) {
    return;
  }

  /*
    IMPORTANT:
    Create a NEW ID.

    Original chat remains untouched.
  */

  const referencedMessages =
    source.messages.map(
      message => ({

        id:
          createChatId(),

        role:
          message.role,

        text:
          message.text,

        time:
          Date.now()

      })
    );

  const newChat = {

    id:
      createChatId(),

    title:
      "Reference: " +
      makeTitle(
        source.title
      ),

    pinned:
      false,

    createdAt:
      Date.now(),

    updatedAt:
      Date.now(),

    messages:
      referencedMessages,

    referenceFrom:
      source.id

  };

  chats.unshift(
    newChat
  );

  activeChatId =
    newChat.id;

  saveChats();

  renderSidebar();

  renderConversation();

  updateTitle();

  closeMobileSidebar();

  messageInput.focus();
}

/* =========================================
   PIN
========================================= */

function togglePin(
  chatId
) {

  const chat =
    chats.find(
      item =>
        item.id === chatId
    );

  if (!chat) {
    return;
  }

  chat.pinned =
    !chat.pinned;

  chat.updatedAt =
    Date.now();

  saveChats();

  renderSidebar();

  if (
    historyModal.style.display ===
    "block"
  ) {
    showHistory();
  }
}

/* =========================================
   DELETE
========================================= */

function deleteChat(
  chatId
) {

  const chat =
    chats.find(
      item =>
        item.id === chatId
    );

  if (!chat) {
    return;
  }

  const confirmed =
    confirm(
      `Delete "${chat.title}"?`
    );

  if (!confirmed) {
    return;
  }

  chats =
    chats.filter(
      item =>
        item.id !== chatId
    );

  if (
    activeChatId ===
    chatId
  ) {

    activeChatId =
      null;

    conversation.innerHTML =
      "";

    conversation.appendChild(
      createWelcome()
    );

    updateTitle();
  }

  saveChats();

  renderSidebar();
}

/* =========================================
   RENDER CONVERSATION
========================================= */

function renderConversation() {

  conversation.innerHTML =
    "";

  const chat =
    getActiveChat();

  if (
    !chat ||
    !Array.isArray(
      chat.messages
    ) ||
    chat.messages.length === 0
  ) {

    conversation.appendChild(
      createWelcome()
    );

    return;
  }

  chat.messages.forEach(
    message => {

      conversation.appendChild(
        createMessageElement(
          message
        )
      );

    }
  );

  scrollToBottom();
}

/* =========================================
   WELCOME
========================================= */

function createWelcome() {

  const wrapper =
    document.createElement(
      "div"
    );

  wrapper.className =
    "welcome";

  wrapper.innerHTML = `
    <div class="welcome-box">

      <div class="welcome-icon">
        🤖
      </div>

      <h1>
        Welcome to Viggo
      </h1>

      <p>
        Your AI assistant. Start a new conversation.
      </p>

    </div>
  `;

  return wrapper;
}

/* =========================================
   MESSAGE ELEMENT
========================================= */

function createMessageElement(
  message
) {

  const wrapper =
    document.createElement(
      "div"
    );

  wrapper.className =
    "message " +
    (
      message.role === "user"
        ? "user"
        : "ai"
    );

  const avatar =
    document.createElement(
      "div"
    );

  avatar.className =
    "message-avatar";

  avatar.textContent =
    message.role === "user"
      ? "👤"
      : "V";

  const content =
    document.createElement(
      "div"
    );

  content.className =
    "message-content";

  const name =
    document.createElement(
      "div"
    );

  name.className =
    "message-name";

  name.textContent =
    message.role === "user"
      ? "You"
      : "Viggo";

  const text =
    document.createElement(
      "div"
    );

  text.className =
    "message-text";

  text.textContent =
    message.text || "";

  content.appendChild(name);
  content.appendChild(text);

  wrapper.appendChild(avatar);
  wrapper.appendChild(content);

  return wrapper;
}

/* =========================================
   SCROLL
========================================= */

function scrollToBottom() {

  setTimeout(
    () => {

      if (chatArea) {

        chatArea.scrollTop =
          chatArea.scrollHeight;
      }

    },
    50
  );
}

/* =========================================
   SEND MESSAGE
========================================= */

async function sendMessage() {

  const text =
    messageInput.value.trim();

  if (!text) {
    return;
  }

  const chat =
    getActiveChat() ||
    createChat(
      "New Chat"
    );

  addUserMessage(
    chat,
    text
  );

  renderConversation();
  renderSidebar();
  updateTitle();

  messageInput.value = "";

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

    if (
      !contentType
        .toLowerCase()
        .includes(
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

    addAIMessage(
      chat,
      reply
    );

    renderConversation();
    renderSidebar();

    speak(reply);

  } catch (error) {

    console.error(
      "❌ Viggo error:",
      error
    );

    addAIMessage(
      chat,
      "❌ " +
      error.message
    );

    renderConversation();

  } finally {

    sendButton.disabled =
      false;

    sendButton.textContent =
      "➤";

    messageInput.focus();
  }
}

/* =========================================
   SEND BUTTON
========================================= */

sendButton.addEventListener(
  "click",
  sendMessage
);

/* =========================================
   ENTER
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
   SAVE / PIN
========================================= */

saveButton.addEventListener(
  "click",
  () => {

    const chat =
      getActiveChat();

    if (!chat) {

      alert(
        "Start a conversation first."
      );

      return;
    }

    chat.pinned = true;

    chat.updatedAt =
      Date.now();

    saveChats();

    renderSidebar();

    saveButton.textContent =
      "📌";

    setTimeout(
      () => {

        saveButton.textContent =
          "💾";

      },
      1000
    );
  }
);

/* =========================================
   HISTORY
========================================= */

function showHistory() {

  historyList.innerHTML =
    "";

  if (
    chats.length === 0
  ) {

    historyList.innerHTML =
      '<div class="empty-sidebar">No chats yet.</div>';

    historyModal.style.display =
      "block";

    return;
  }

  const sorted =
    [...chats].sort(
      (a, b) =>
        b.updatedAt -
        a.updatedAt
    );

  sorted.forEach(
    chat => {

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "history-card";

      if (chat.pinned) {

        card.classList.add(
          "pinned"
        );
      }

      const title =
        document.createElement(
          "div"
        );

      title.className =
        "history-card-title";

      title.textContent =
        (
          chat.pinned
            ? "📌 "
            : ""
        ) +
        chat.title;

      const time =
        document.createElement(
          "div"
        );

      time.className =
        "history-card-time";

      time.textContent =
        formatDate(
          chat.updatedAt
        );

      const actions =
        document.createElement(
          "div"
        );

      actions.className =
        "history-card-actions";

      /* OPEN */

      const open =
        document.createElement(
          "button"
        );

      open.type =
        "button";

      open.textContent =
        "💬 Open";

      open.onclick =
        () => {

          openChat(
            chat.id
          );

          closeHistoryModal();
        };

      /* REFERENCE */

      const reference =
        document.createElement(
          "button"
        );

      reference.type =
        "button";

      reference.textContent =
        "🔗 Reference";

      reference.onclick =
        () => {

          createReferenceChat(
            chat.id
          );

          closeHistoryModal();
        };

      /* PIN */

      const pin =
        document.createElement(
          "button"
        );

      pin.type =
        "button";

      pin.className =
        "pin-button";

      pin.textContent =
        chat.pinned
          ? "📌 Unpin"
          : "📌 Pin";

      pin.onclick =
        () => {

          togglePin(
            chat.id
          );
        };

      /* DELETE */

      const del =
        document.createElement(
          "button"
        );

      del.type =
        "button";

      del.className =
        "delete-button";

      del.textContent =
        "🗑️ Delete";

      del.onclick =
        () => {

          deleteChat(
            chat.id
          );

          showHistory();
        };

      actions.appendChild(
        open
      );

      actions.appendChild(
        reference
      );

      actions.appendChild(
        pin
      );

      actions.appendChild(
        del
      );

      card.appendChild(
        title
      );

      card.appendChild(
        time
      );

      card.appendChild(
        actions
      );

      historyList.appendChild(
        card
      );

    }
  );

  historyModal.style.display =
    "block";
}

/* =========================================
   HISTORY OPEN
========================================= */

historyButton.addEventListener(
  "click",
  showHistory
);

/* =========================================
   HISTORY CLOSE
========================================= */

function closeHistoryModal() {

  historyModal.style.display =
    "none";
}

closeHistory.addEventListener(
  "click",
  closeHistoryModal
);

historyModal.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      historyModal
    ) {

      closeHistoryModal();
    }

  }
);

/* =========================================
   CLEAR HISTORY
========================================= */

clearHistoryButton.addEventListener(
  "click",
  () => {

    if (
      chats.length === 0
    ) {
      return;
    }

    const confirmed =
      confirm(
        "Delete all chat history?"
      );

    if (!confirmed) {
      return;
    }

    chats = [];

    activeChatId =
      null;

    saveChats();

    renderSidebar();

    conversation.innerHTML =
      "";

    conversation.appendChild(
      createWelcome()
    );

    updateTitle();
  }
);

/* =========================================
   VOICE ON / OFF
========================================= */

function updateVoiceButton() {

  if (voiceEnabled) {

    voiceToggle.textContent =
      "🔊 Voice ON";

    voiceToggle.classList.add(
      "on"
    );

    voiceToggle.classList.remove(
      "off"
    );

  } else {

    voiceToggle.textContent =
      "🔇 Voice OFF";

    voiceToggle.classList.add(
      "off"
    );

    voiceToggle.classList.remove(
      "on"
    );

    if (
      "speechSynthesis" in
      window
    ) {

      speechSynthesis.cancel();
    }
  }
}

updateVoiceButton();

voiceToggle.addEventListener(
  "click",
  () => {

    voiceEnabled =
      !voiceEnabled;

    localStorage.setItem(
      "viggoVoice",
      voiceEnabled
    );

    updateVoiceButton();
  }
);

/* =========================================
   SPEAK
========================================= */

function speak(text) {

  if (!voiceEnabled) {
    return;
  }

  if (
    !("speechSynthesis" in window)
  ) {
    return;
  }

  speechSynthesis.cancel();

  const speech =
    new SpeechSynthesisUtterance(
      text
    );

  speech.lang =
    "en-IN";

  speech.rate =
    0.95;

  speech.pitch =
    1;

  speechSynthesis.speak(
    speech
  );
}

/* =========================================
   MICROPHONE
========================================= */

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
    () => {

      micButton.classList.add(
        "listening"
      );

      micButton.textContent =
        "🔴";
    };

  recognition.onend =
    () => {

      micButton.classList.remove(
        "listening"
      );

      micButton.textContent =
        "🎤";
    };

  recognition.onerror =
    event => {

      console.error(
        "❌ Mic error:",
        event.error
      );

      micButton.classList.remove(
        "listening"
      );

      micButton.textContent =
        "🎤";
    };

  recognition.onresult =
    event => {

      const transcript =
        event.results[0][0]
          .transcript;

      messageInput.value =
        transcript;

      messageInput.focus();
    };

  micButton.addEventListener(
    "click",
    () => {

      try {

        recognition.start();

      } catch (error) {

        console.log(
          "Microphone already active."
        );
      }
    }
  );

} else {

  micButton.addEventListener(
    "click",
    () => {

      alert(
        "Microphone is not supported. Please use Chrome."
      );
    }
  );
}

/* =========================================
   MOBILE MENU
========================================= */

mobileMenu.addEventListener(
  "click",
  () => {

    sidebar.classList.toggle(
      "open"
    );
  }
);

function closeMobileSidebar() {

  sidebar.classList.remove(
    "open"
  );
}

/* =========================================
   DATE
========================================= */

function formatDate(
  timestamp
) {

  if (!timestamp) {
    return "";
  }

  return new Date(
    timestamp
  ).toLocaleString(
    "en-IN"
  );
}

/* =========================================
   START
========================================= */

loadChats();

if (chats.length > 0) {

  const latest =
    [...chats].sort(
      (a, b) =>
        b.updatedAt -
        a.updatedAt
    )[0];

  activeChatId =
    latest.id;

  renderSidebar();

  renderConversation();

  updateTitle();

} else {

  renderSidebar();

  conversation.innerHTML =
    "";

  conversation.appendChild(
    createWelcome()
  );

  updateTitle();
}

console.log(
  "✅ Viggo script loaded"
);

console.log(
  "💬 Conversations:",
  chats.length
);
