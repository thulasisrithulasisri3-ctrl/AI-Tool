```javascript
"use strict";

/* =========================================
   VIGGO
========================================= */

const API_URL =
  "https://ai-tool-2-zpul.onrender.com/api/chat";

const CHATS_KEY =
  "viggoChats";

const VOICE_KEY =
  "viggoVoice";

/* =========================================
   ELEMENTS
========================================= */

const sidebar =
  document.getElementById("sidebar");

const mobileMenu =
  document.getElementById("mobileMenu");

const newChatButton =
  document.getElementById("newChat");

const pinnedList =
  document.getElementById("pinnedList");

const recentList =
  document.getElementById("recentList");

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

const clearHistory =
  document.getElementById("clearHistory");

const conversation =
  document.getElementById("conversation");

const messageInput =
  document.getElementById("message");

const micButton =
  document.getElementById("mic");

const sendButton =
  document.getElementById("send");

const voiceToggle =
  document.getElementById("voiceToggle");

/* =========================================
   STATE
========================================= */

let chats = [];

let activeChatId = null;

let voiceEnabled =
  localStorage.getItem(VOICE_KEY) !== "false";

/* =========================================
   ID
========================================= */

function createId() {

  return (
    Date.now().toString(36) +
    "-" +
    Math.random()
      .toString(36)
      .substring(2, 10)
  );
}

/* =========================================
   STORAGE
========================================= */

function loadChats() {

  try {

    const saved =
      localStorage.getItem(
        CHATS_KEY
      );

    if (!saved) {

      chats = [];

      return;
    }

    const data =
      JSON.parse(saved);

    chats =
      Array.isArray(data)
        ? data
        : [];

    normalizeChats();

  } catch (error) {

    console.error(
      "History load error:",
      error
    );

    chats = [];
  }
}

function saveChats() {

  try {

    localStorage.setItem(
      CHATS_KEY,
      JSON.stringify(chats)
    );

  } catch (error) {

    console.error(
      "History save error:",
      error
    );
  }
}

/* =========================================
   NORMALIZE
========================================= */

function normalizeChats() {

  chats =
    chats.map(chat => {

      return {

        id:
          chat.id ||
          createId(),

        title:
          chat.title ||
          "New Chat",

        pinned:
          chat.pinned === true,

        createdAt:
          chat.createdAt ||
          Date.now(),

        updatedAt:
          chat.updatedAt ||
          Date.now(),

        messages:
          Array.isArray(
            chat.messages
          )
            ? chat.messages
            : [],

        referenceFrom:
          chat.referenceFrom ||
          null

      };

    });
}

/* =========================================
   CREATE CHAT
========================================= */

function createChat(
  title = "New Chat"
) {

  const chat = {

    id:
      createId(),

    title:
      title,

    pinned:
      false,

    createdAt:
      Date.now(),

    updatedAt:
      Date.now(),

    messages: [],

    referenceFrom:
      null

  };

  chats.unshift(chat);

  activeChatId =
    chat.id;

  saveChats();

  renderAll();

  return chat;
}

/* =========================================
   NEW CHAT
========================================= */

function newChat() {

  createChat(
    "New Chat"
  );

  closeSidebar();

  messageInput.focus();
}

newChatButton.addEventListener(
  "click",
  newChat
);

/* =========================================
   ACTIVE CHAT
========================================= */

function getActiveChat() {

  return chats.find(
    chat =>
      chat.id ===
      activeChatId
  );
}

/* =========================================
   OPEN CHAT
========================================= */

function openChat(
  chatId
) {

  const chat =
    chats.find(
      item =>
        item.id ===
        chatId
    );

  if (!chat) {
    return;
  }

  activeChatId =
    chat.id;

  renderAll();

  closeSidebar();

  messageInput.focus();
}

/* =========================================
   TITLE
========================================= */

function makeTitle(text) {

  let title =
    String(text || "")
      .replace(/\s+/g, " ")
      .trim();

  if (!title) {
    return "New Chat";
  }

  if (title.length > 40) {

    title =
      title.substring(0, 40) +
      "...";
  }

  return title;
}

/* =========================================
   MESSAGE
========================================= */

function addMessage(
  chat,
  role,
  text
) {

  chat.messages.push({

    id:
      createId(),

    role:
      role,

    text:
      String(text),

    time:
      Date.now()

  });

  chat.updatedAt =
    Date.now();

  if (
    role === "user" &&
    chat.title === "New Chat"
  ) {

    chat.title =
      makeTitle(text);
  }

  saveChats();
}

/* =========================================
   SEND
========================================= */

async function sendMessage() {

  const text =
    messageInput.value.trim();

  if (!text) {
    return;
  }

  let chat =
    getActiveChat();

  if (!chat) {

    chat =
      createChat(
        "New Chat"
      );
  }

  addMessage(
    chat,
    "user",
    text
  );

  messageInput.value = "";

  renderAll();

  sendButton.disabled =
    true;

  sendButton.textContent =
    "...";

  try {

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

    const type =
      response.headers.get(
        "content-type"
      ) || "";

    if (
      !type.includes(
        "application/json"
      )
    ) {

      const raw =
        await response.text();

      console.error(
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

    /*
      IMPORTANT:
      Get the same chat again.
      Reference chats remain separate.
    */

    const active =
      getActiveChat();

    if (active) {

      addMessage(
        active,
        "assistant",
        reply
      );
    }

    renderAll();

    speak(reply);

  } catch (error) {

    console.error(
      "Viggo error:",
      error
    );

    const active =
      getActiveChat();

    if (active) {

      addMessage(
        active,
        "assistant",
        "❌ " +
        error.message
      );
    }

    renderAll();

  } finally {

    sendButton.disabled =
      false;

    sendButton.textContent =
      "➤";

    messageInput.focus();
  }
}

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
   REFERENCE
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

    console.error(
      "Reference source not found"
    );

    return;
  }

  /*
    NEW CHAT
    NEW ID
    COPY MESSAGES
    ORIGINAL UNCHANGED
  */

  const copiedMessages =
    source.messages.map(
      message => {

        return {

          id:
            createId(),

          role:
            message.role,

          text:
            message.text,

          time:
            Date.now()

        };

      }
    );

  const newChatObject = {

    id:
      createId(),

    title:
      "Reference: " +
      source.title,

    pinned:
      false,

    createdAt:
      Date.now(),

    updatedAt:
      Date.now(),

    messages:
      copiedMessages,

    referenceFrom:
      source.id

  };

  /*
    Put NEW CHAT at top.
  */

  chats.unshift(
    newChatObject
  );

  /*
    THIS IS THE IMPORTANT PART:
    Immediately switch to NEW CHAT.
  */

  activeChatId =
    newChatObject.id;

  /*
    Save before rendering.
  */

  saveChats();

  /*
    Render the new chat immediately.
  */

  renderAll();

  closeHistoryModal();

  closeSidebar();

  /*
    Focus input so user can continue.
  */

  setTimeout(
    () => {
      messageInput.focus();
    },
    100
  );

  console.log(
    "✅ Reference created:",
    newChatObject.id
  );
}

/* =========================================
   SIDEBAR
========================================= */

function renderSidebar() {

  pinnedList.innerHTML =
    "";

  recentList.innerHTML =
    "";

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

  if (!pinned.length) {

    pinnedList.innerHTML =
      `<div class="empty-sidebar">
        No pinned chats
      </div>`;

  } else {

    pinned.forEach(
      chat =>
        renderSidebarChat(
          chat,
          pinnedList
        )
    );
  }

  if (!recent.length) {

    recentList.innerHTML =
      `<div class="empty-sidebar">
        No recent chats
      </div>`;

  } else {

    recent.forEach(
      chat =>
        renderSidebarChat(
          chat,
          recentList
        )
    );
  }
}

/* =========================================
   SIDEBAR CHAT
========================================= */

function renderSidebarChat(
  chat,
  container
) {

  const button =
    document.createElement(
      "button"
    );

  button.type =
    "button";

  button.className =
    "chat-item";

  if (
    chat.id ===
    activeChatId
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
    chat.title;

  button.appendChild(
    title
  );

  if (chat.pinned) {

    const pin =
      document.createElement(
        "span"
      );

    pin.className =
      "pin-icon";

    pin.textContent =
      "📌";

    button.appendChild(
      pin
    );
  }

  button.onclick =
    () => {

      openChat(
        chat.id
      );
    };

  container.appendChild(
    button
  );
}

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

    chat.pinned =
      true;

    chat.updatedAt =
      Date.now();

    saveChats();

    renderAll();

    saveButton.textContent =
      "✅ Saved";

    setTimeout(
      () => {

        saveButton.textContent =
          "💾 Save";

      },
      1200
    );
  }
);

/* =========================================
   PIN
========================================= */

function togglePin(
  chatId
) {

  const chat =
    chats.find(
      item =>
        item.id ===
        chatId
    );

  if (!chat) {
    return;
  }

  chat.pinned =
    !chat.pinned;

  chat.updatedAt =
    Date.now();

  saveChats();

  renderAll();

  showHistory();
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
        item.id ===
        chatId
    );

  if (!chat) {
    return;
  }

  if (
    !confirm(
      `Delete "${chat.title}"?`
    )
  ) {
    return;
  }

  chats =
    chats.filter(
      item =>
        item.id !==
        chatId
    );

  if (
    activeChatId ===
    chatId
  ) {

    activeChatId =
      null;

    if (chats.length) {

      const latest =
        [...chats].sort(
          (a, b) =>
            b.updatedAt -
            a.updatedAt
        )[0];

      activeChatId =
        latest.id;

    }
  }

  saveChats();

  renderAll();

  showHistory();
}

/* =========================================
   HISTORY
========================================= */

function showHistory() {

  historyList.innerHTML =
    "";

  if (!chats.length) {

    historyList.innerHTML =
      `<div class="empty-sidebar">
        No chats yet.
      </div>`;

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
        new Date(
          chat.updatedAt
        ).toLocaleString(
          "en-IN"
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

      reference.textContent =
        "🔗 Reference";

      reference.onclick =
        () => {

          /*
            This now directly creates
            AND opens the new chat.
          */

          createReferenceChat(
            chat.id
          );
        };

      /* PIN */

      const pin =
        document.createElement(
          "button"
        );

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

      del.className =
        "delete-button";

      del.textContent =
        "🗑️ Delete";

      del.onclick =
        () => {

          deleteChat(
            chat.id
          );
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

historyButton.addEventListener(
  "click",
  showHistory
);

/* =========================================
   CLOSE HISTORY
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

clearHistory.addEventListener(
  "click",
  () => {

    if (!chats.length) {
      return;
    }

    if (
      !confirm(
        "Delete all chat history?"
      )
    ) {
      return;
    }

    chats = [];

    activeChatId =
      null;

    saveChats();

    renderAll();
  }
);

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
    !chat.messages.length
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

  scrollBottom();
}

/* =========================================
   WELCOME
========================================= */

function createWelcome() {

  const div =
    document.createElement(
      "div"
    );

  div.className =
    "welcome";

  div.innerHTML = `
    <div class="welcome-box">

      <div class="welcome-icon">
        🤖
      </div>

      <h1>
        Welcome to Viggo
      </h1>

      <p>
        Your AI assistant.
        Start a new conversation.
      </p>

    </div>
  `;

  return div;
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
    message.text;

  content.appendChild(
    name
  );

  content.appendChild(
    text
  );

  wrapper.appendChild(
    avatar
  );

  wrapper.appendChild(
    content
  );

  return wrapper;
}

/* =========================================
   VOICE
========================================= */

function updateVoiceButton() {

  if (voiceEnabled) {

    voiceToggle.textContent =
      "🔊 Voice ON";

  } else {

    voiceToggle.textContent =
      "🔇 Voice OFF";

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
      VOICE_KEY,
      voiceEnabled
    );

    updateVoiceButton();
  }
);

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
    event => {

      messageInput.value =
        event.results[0][0]
          .transcript;

      messageInput.focus();
    };

  micButton.addEventListener(
    "click",
    () => {

      try {

        recognition.start();

      } catch {

        console.log(
          "Microphone already running."
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
   MOBILE
========================================= */

mobileMenu.addEventListener(
  "click",
  () => {

    sidebar.classList.toggle(
      "open"
    );
  }
);

function closeSidebar() {

  sidebar.classList.remove(
    "open"
  );
}

/* =========================================
   SCROLL
========================================= */

function scrollBottom() {

  setTimeout(
    () => {

      const area =
        document.getElementById(
          "chatArea"
        );

      area.scrollTop =
        area.scrollHeight;

    },
    50
  );
}

/* =========================================
   RENDER ALL
========================================= */

function renderAll() {

  renderSidebar();

  renderConversation();

  updateTitle();
}

/* =========================================
   TITLE
========================================= */

function updateTitle() {

  const chat =
    getActiveChat();

  currentTitle.textContent =
    chat
      ? chat.title
      : "New Chat";
}

/* =========================================
   START
========================================= */

loadChats();

if (chats.length) {

  const latest =
    [...chats].sort(
      (a, b) =>
        b.updatedAt -
        a.updatedAt
    )[0];

  activeChatId =
    latest.id;
}

renderAll();

console.log(
  "✅ Viggo loaded"
);

console.log(
  "💬 Chats:",
  chats.length
);
```
