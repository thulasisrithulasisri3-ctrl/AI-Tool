"use strict";

/* =========================================
   VIGGO AI ASSISTANT
   ChatGPT-style conversation system
========================================= */

const API_URL =
  "https://ai-tool-2-zpul.onrender.com/api/chat";


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

const historyPanel =
  document.getElementById("historyPanel");

const closeHistory =
  document.getElementById("closeHistory");

const historyList =
  document.getElementById("historyList");

const conversation =
  document.getElementById("conversation");

const welcome =
  document.getElementById("welcome");

const messageInput =
  document.getElementById("message");

const sendButton =
  document.getElementById("send");

const micButton =
  document.getElementById("mic");

const voiceToggle =
  document.getElementById("voiceToggle");


/* =========================================
   DATA
========================================= */

let chats = [];

let activeChatId = null;

let voiceEnabled =
  localStorage.getItem("viggoVoice") !== "false";


/* =========================================
   LOAD CHATS
========================================= */

function loadChats() {

  try {

    const saved =
      localStorage.getItem(
        "viggoChats"
      );


    if (!saved) {

      chats = [];

      return;
    }


    const parsed =
      JSON.parse(saved);


    if (Array.isArray(parsed)) {

      chats = parsed;

    } else {

      chats = [];

    }

  } catch (error) {

    console.error(
      "❌ Chat history load error:",
      error
    );

    chats = [];
  }
}


/* =========================================
   SAVE CHATS
========================================= */

function saveChats() {

  try {

    localStorage.setItem(
      "viggoChats",
      JSON.stringify(chats)
    );


    console.log(
      "✅ Chats saved:",
      chats.length
    );

  } catch (error) {

    console.error(
      "❌ Chat history save error:",
      error
    );
  }
}


/* =========================================
   CREATE CHAT ID
========================================= */

function createChatId() {

  return (
    Date.now().toString() +
    Math.random()
      .toString(36)
      .substring(2, 8)
  );
}


/* =========================================
   CREATE NEW CHAT
========================================= */

function createNewChat() {

  const chat = {

    id:
      createChatId(),

    title:
      "New Chat",

    pinned:
      false,

    createdAt:
      Date.now(),

    updatedAt:
      Date.now(),

    messages:
      []

  };


  chats.unshift(chat);

  activeChatId =
    chat.id;


  saveChats();

  renderSidebar();

  renderConversation();

  updateTitle();

  closeMobileSidebar();

  messageInput.focus();
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
   ENSURE CHAT EXISTS
========================================= */

function ensureActiveChat() {

  let chat =
    getActiveChat();


  if (chat) {

    return chat;
  }


  chat = {

    id:
      createChatId(),

    title:
      "New Chat",

    pinned:
      false,

    createdAt:
      Date.now(),

    updatedAt:
      Date.now(),

    messages:
      []

  };


  chats.unshift(chat);

  activeChatId =
    chat.id;


  saveChats();

  return chat;
}


/* =========================================
   UPDATE CHAT TITLE
========================================= */

function updateChatTitle(
  chat,
  firstMessage
) {

  if (!chat) {
    return;
  }


  if (
    !chat.title ||
    chat.title === "New Chat"
  ) {

    let title =
      String(firstMessage)
        .replace(/\s+/g, " ")
        .trim();


    if (title.length > 40) {

      title =
        title.substring(
          0,
          40
        ) + "...";

    }


    chat.title =
      title || "New Chat";
  }
}


/* =========================================
   UPDATE TOP TITLE
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
   ADD USER MESSAGE TO CHAT
========================================= */

function addUserMessage(
  chat,
  text
) {

  chat.messages.push({

    id:
      Date.now(),

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
   ADD AI MESSAGE TO CHAT
========================================= */

function addAIMessage(
  chat,
  text
) {

  chat.messages.push({

    id:
      Date.now(),

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

  pinnedList.innerHTML =
    "";

  recentList.innerHTML =
    "";


  const pinnedChats =
    chats
      .filter(
        chat =>
          chat.pinned
      )
      .sort(
        (a, b) =>
          b.updatedAt -
          a.updatedAt
      );


  const recentChats =
    chats
      .filter(
        chat =>
          !chat.pinned
      )
      .sort(
        (a, b) =>
          b.updatedAt -
          a.updatedAt
      );


  if (
    pinnedChats.length === 0
  ) {

    pinnedList.innerHTML =
      '<div class="empty-sidebar">No pinned chats</div>';

  } else {

    pinnedChats.forEach(
      chat =>
        renderSidebarItem(
          chat,
          pinnedList
        )
    );
  }


  if (
    recentChats.length === 0
  ) {

    recentList.innerHTML =
      '<div class="empty-sidebar">No recent chats</div>';

  } else {

    recentChats.forEach(
      chat =>
        renderSidebarItem(
          chat,
          recentList
        )
    );
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
    chat.title ||
    "New Chat";


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


  button.addEventListener(
    "click",
    () => {

      openChat(
        chat.id
      );

    }
  );


  container.appendChild(
    button
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
    chatId;


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
   RENDER CONVERSATION
========================================= */

function renderConversation() {

  conversation.innerHTML =
    "";


  const chat =
    getActiveChat();


  if (
    !chat ||
    !chat.messages ||
    chat.messages.length === 0
  ) {

    conversation.appendChild(
      createWelcome()
    );

    return;
  }


  chat.messages.forEach(
    message => {

      const element =
        createMessageElement(
          message
        );


      conversation.appendChild(
        element
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
   CREATE MESSAGE ELEMENT
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
      message.role ===
      "user"
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
    message.role ===
    "user"
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
    message.role ===
    "user"
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
   SCROLL
========================================= */

function scrollToBottom() {

  const chatArea =
    document.getElementById(
      "chatArea"
    );


  setTimeout(
    () => {

      chatArea.scrollTop =
        chatArea.scrollHeight;

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
    ensureActiveChat();


  addUserMessage(
    chat,
    text
  );


  renderConversation();

  renderSidebar();

  updateTitle();


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

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body:
            JSON.stringify({
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
        .includes(
          "application/json"
        )
    ) {

      const raw =
        await response.text();


      console.error(
        "Server response:",
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

    updateTitle();


    speak(
      reply
    );


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

  }


  sendButton.disabled =
    false;


  sendButton.textContent =
    "➤";


  messageInput.focus();
}


/* =========================================
   NEW CHAT
========================================= */

newChatButton.addEventListener(
  "click",
  () => {

    createNewChat();

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
   ENTER SEND
========================================= */

messageInput.addEventListener(
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


/* =========================================
   SAVE BUTTON
========================================= */

saveButton.addEventListener(
  "click",
  () => {

    const chat =
      getActiveChat();


    if (!chat) {

      alert(
        "Start a chat first."
      );

      return;
    }


    chat.pinned =
      true;


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
   VOICE
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

      window.speechSynthesis.cancel();

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

function speak(
  text
) {

  if (!voiceEnabled) {
    return;
  }


  if (
    !("speechSynthesis" in window)
  ) {
    return;
  }


  window.speechSynthesis.cancel();


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


  window.speechSynthesis.speak(
    speech
  );
}


/* =========================================
   HISTORY BUTTON
========================================= */

historyButton.addEventListener(
  "click",
  () => {

    showHistoryModal();

  }
);


/* =========================================
   SHOW HISTORY
========================================= */

function showHistoryModal() {

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
        (
          chat.title ||
          "New Chat"
        );


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


      const open =
        document.createElement(
          "button"
        );


      open.type =
        "button";


      open.textContent =
        "💬 Open";


      open.addEventListener(
        "click",
        () => {

          openChat(
            chat.id
          );


          closeHistoryModal();

        }
      );


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


      pin.addEventListener(
        "click",
        () => {

          chat.pinned =
            !chat.pinned;


          chat.updatedAt =
            Date.now();


          saveChats();

          renderSidebar();

          showHistoryModal();

        }
      );


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


      del.addEventListener(
        "click",
        () => {

          const confirmed =
            confirm(
              "Delete this chat?"
            );


          if (!confirmed) {
            return;
          }


          chats =
            chats.filter(
              item =>
                item.id !==
                chat.id
            );


          if (
            activeChatId ===
            chat.id
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

          showHistoryModal();

        }
      );


      actions.appendChild(
        open
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
   MOBILE SIDEBAR
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
        "❌ Microphone error:",
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
        "Microphone is not supported in this browser. Please use Chrome."
      );

    }
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
   START APP
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
  "📜 Conversations:",
  chats.length
);
