/* =====================================================
   VIGGO AI - COMPLETE SCRIPT
   Connected to Render Backend
===================================================== */

const API_URL =
  "https://ai-tool-1-fgmc.onrender.com/api/chat";


/* =====================================================
   ELEMENTS
===================================================== */

const messageInput =
  document.getElementById("message");

const sendButton =
  document.getElementById("send");

const micButton =
  document.getElementById("mic");

const conversation =
  document.getElementById("conversation");

const newChatButton =
  document.getElementById("newChat");

const historyButton =
  document.getElementById("historyButton");

const saveButton =
  document.getElementById("saveButton");

const voiceToggle =
  document.getElementById("voiceToggle");

const clearHistoryButton =
  document.getElementById("clearHistory");

const historyModal =
  document.getElementById("historyModal");

const historyList =
  document.getElementById("historyList");

const closeHistory =
  document.getElementById("closeHistory");

const currentTitle =
  document.getElementById("currentTitle");

const pinnedList =
  document.getElementById("pinnedList");

const recentList =
  document.getElementById("recentList");

const mobileMenu =
  document.getElementById("mobileMenu");

const sidebar =
  document.getElementById("sidebar");

const chatArea =
  document.getElementById("chatArea");


/* =====================================================
   STATE
===================================================== */

let currentMessages = [];

let savedChats =
  JSON.parse(
    localStorage.getItem("viggoChats") || "[]"
  );

let voiceEnabled = true;

let recognition = null;


/* =====================================================
   START
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    renderSidebar();

    setupSuggestions();

    setupVoice();

    messageInput.focus();

  }
);


/* =====================================================
   SEND MESSAGE
===================================================== */

async function sendMessage() {

  const text =
    messageInput.value.trim();


  if (!text) {
    return;
  }


  /* USER MESSAGE */

  addMessage(
    "user",
    text
  );


  currentMessages.push({

    role: "user",

    content: text

  });


  messageInput.value = "";

  autoResize();

  updateTitle(text);

  scrollToBottom();


  /* DISABLE SEND */

  sendButton.disabled = true;


  /* TYPING */

  const typingId =
    addTypingMessage();


  try {

    const response =
      await fetch(
        API_URL,
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body:
            JSON.stringify({

              message: text,

              history:
                currentMessages

            })

        }
      );


    if (!response.ok) {

      throw new Error(
        "Server returned " +
        response.status
      );

    }


    const data =
      await response.json();


    removeMessage(
      typingId
    );


    const reply =
      data.reply ||
      "Sorry, I couldn't generate a response.";


    /* AI MESSAGE */

    addMessage(
      "ai",
      reply
    );


    currentMessages.push({

      role: "assistant",

      content: reply

    });


    /* VOICE */

    if (voiceEnabled) {

      speak(reply);

    }


    /* SAVE */

    saveCurrentChat();


  } catch (error) {

    console.error(
      "Viggo API Error:",
      error
    );


    removeMessage(
      typingId
    );


    addMessage(
      "ai",
      "Viggo server is not connected. Please check the Render server and try again."
    );

  }


  sendButton.disabled = false;

  messageInput.focus();

}


/* =====================================================
   SEND BUTTON
===================================================== */

sendButton.addEventListener(
  "click",
  sendMessage
);


/* =====================================================
   ENTER = SEND
   SHIFT + ENTER = NEW LINE
===================================================== */

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


/* =====================================================
   TEXTAREA RESIZE
===================================================== */

messageInput.addEventListener(
  "input",
  autoResize
);


function autoResize() {

  messageInput.style.height =
    "auto";


  messageInput.style.height =
    Math.min(
      messageInput.scrollHeight,
      150
    ) + "px";

}


/* =====================================================
   ADD MESSAGE
===================================================== */

function addMessage(
  type,
  text
) {

  const wrapper =
    document.createElement("div");


  wrapper.className =
    `message ${type}`;


  /* AVATAR */

  const avatar =
    document.createElement("div");


  avatar.className =
    "message-avatar";


  avatar.textContent =
    type === "user"
      ? "U"
      : "B";


  /* CONTENT */

  const content =
    document.createElement("div");


  /* NAME */

  const name =
    document.createElement("div");


  name.className =
    "message-name";


  name.textContent =
    type === "user"
      ? "You"
      : "Viggo";


  /* TEXT */

  const textElement =
    document.createElement("div");


  textElement.className =
    "message-text";


  textElement.textContent =
    text;


  content.appendChild(
    name
  );


  content.appendChild(
    textElement
  );


  wrapper.appendChild(
    avatar
  );


  wrapper.appendChild(
    content
  );


  conversation.appendChild(
    wrapper
  );


  scrollToBottom();


  return wrapper;

}


/* =====================================================
   TYPING MESSAGE
===================================================== */

function addTypingMessage() {

  const id =
    "typing-" +
    Date.now();


  const wrapper =
    document.createElement("div");


  wrapper.className =
    "message ai";


  wrapper.id =
    id;


  wrapper.innerHTML = `

    <div class="message-avatar">
      B
    </div>

    <div>

      <div class="message-name">
        Viggo
      </div>

      <div class="message-text">
        Thinking...
      </div>

    </div>

  `;


  conversation.appendChild(
    wrapper
  );


  scrollToBottom();


  return id;

}


/* =====================================================
   REMOVE MESSAGE
===================================================== */

function removeMessage(id) {

  const element =
    document.getElementById(
      id
    );


  if (element) {

    element.remove();

  }

}


/* =====================================================
   SCROLL
===================================================== */

function scrollToBottom() {

  setTimeout(
    () => {

      chatArea.scrollTop =
        chatArea.scrollHeight;

    },
    50
  );

}


/* =====================================================
   UPDATE TITLE
===================================================== */

function updateTitle(text) {

  let title =
    text.substring(
      0,
      35
    );


  if (text.length > 35) {

    title += "...";

  }


  currentTitle.textContent =
    title;

}


/* =====================================================
   NEW CHAT
===================================================== */

newChatButton.addEventListener(
  "click",
  () => {

    saveCurrentChat();


    currentMessages = [];


    conversation.innerHTML = `

      <div class="welcome">

        <div class="welcome-box">

          <div class="ai-logo">
            B
          </div>

          <h1>
            What can I help you with?
          </h1>

          <p>
            Meet Viggo — your smart AI assistant
            for learning, coding, ideas and everyday tasks.
          </p>

          <div class="suggestions">

            <button
              class="suggestion"
              data-text="Explain this concept in simple words">

              <strong>
                🧠 Explain
              </strong>

              <span>
                Understand difficult topics easily
              </span>

            </button>


            <button
              class="suggestion"
              data-text="Help me write a program">

              <strong>
                💻 Code
              </strong>

              <span>
                Build and debug your projects
              </span>

            </button>


            <button
              class="suggestion"
              data-text="Give me creative ideas">

              <strong>
                💡 Create
              </strong>

              <span>
                Generate fresh ideas
              </span>

            </button>


            <button
              class="suggestion"
              data-text="Teach me something interesting">

              <strong>
                🚀 Learn
              </strong>

              <span>
                Learn something new
              </span>

            </button>

          </div>

        </div>

      </div>

    `;


    currentTitle.textContent =
      "New Chat";


    setupSuggestions();


    closeSidebar();


    messageInput.focus();

  }
);


/* =====================================================
   SUGGESTIONS
===================================================== */

function setupSuggestions() {

  document
    .querySelectorAll(
      ".suggestion"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            messageInput.value =
              button.dataset.text;


            autoResize();


            messageInput.focus();

          }
        );

      }
    );

}


/* =====================================================
   SAVE CHAT
===================================================== */

function saveCurrentChat() {

  if (
    currentMessages.length === 0
  ) {

    return;

  }


  const firstUser =
    currentMessages.find(
      item =>
        item.role === "user"
    );


  if (!firstUser) {

    return;

  }


  /*
     Avoid saving the exact
     same conversation repeatedly.
  */

  const existing =
    savedChats.find(
      chat =>
        chat.messages?.length ===
        currentMessages.length &&
        chat.messages?.[0]?.content ===
        currentMessages[0]?.content
    );


  if (existing) {

    existing.messages =
      [...currentMessages];

    existing.time =
      new Date().toLocaleString();


  } else {

    const chat = {

      id: Date.now(),

      title:
        firstUser.content.substring(
          0,
          45
        ),

      messages:
        [...currentMessages],

      pinned:
        false,

      time:
        new Date().toLocaleString()

    };


    savedChats.unshift(
      chat
    );

  }


  if (
    savedChats.length > 30
  ) {

    savedChats =
      savedChats.slice(
        0,
        30
      );

  }


  localStorage.setItem(
    "viggoChats",
    JSON.stringify(
      savedChats
    )
  );


  renderSidebar();

}


/* =====================================================
   SIDEBAR
===================================================== */

function renderSidebar() {

  pinnedList.innerHTML =
    "";

  recentList.innerHTML =
    "";


  const pinned =
    savedChats.filter(
      chat =>
        chat.pinned
    );


  const recent =
    savedChats.filter(
      chat =>
        !chat.pinned
    );


  if (
    pinned.length === 0
  ) {

    pinnedList.innerHTML = `
      <div class="empty-sidebar">
        No pinned chats
      </div>
    `;

  } else {

    pinned.forEach(
      chat =>
        addSidebarChat(
          pinnedList,
          chat
        )
    );

  }


  if (
    recent.length === 0
  ) {

    recentList.innerHTML = `
      <div class="empty-sidebar">
        No recent chats
      </div>
    `;

  } else {

    recent
      .slice(0, 12)
      .forEach(
        chat =>
          addSidebarChat(
            recentList,
            chat
          )
      );

  }

}


/* =====================================================
   SIDEBAR CHAT
===================================================== */

function addSidebarChat(
  container,
  chat
) {

  const button =
    document.createElement(
      "button"
    );


  button.className =
    "chat-item";


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


    pin.textContent =
      "📌";


    button.appendChild(
      pin
    );

  }


  button.addEventListener(
    "click",
    () => {

      loadChat(
        chat.id
      );

    }
  );


  container.appendChild(
    button
  );

}


/* =====================================================
   LOAD CHAT
===================================================== */

function loadChat(id) {

  const chat =
    savedChats.find(
      item =>
        item.id === id
    );


  if (!chat) {

    return;

  }


  currentMessages =
    [...chat.messages];


  conversation.innerHTML =
    "";


  currentMessages.forEach(
    message => {

      addMessage(

        message.role === "user"
          ? "user"
          : "ai",

        message.content

      );

    }
  );


  currentTitle.textContent =
    chat.title;


  closeSidebar();

}


/* =====================================================
   HISTORY BUTTON
===================================================== */

historyButton.addEventListener(
  "click",
  () => {

    renderHistory();


    historyModal.style.display =
      "block";

  }
);


/* =====================================================
   CLOSE HISTORY
===================================================== */

closeHistory.addEventListener(
  "click",
  () => {

    historyModal.style.display =
      "none";

  }
);


historyModal.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      historyModal
    ) {

      historyModal.style.display =
        "none";

    }

  }
);


/* =====================================================
   RENDER HISTORY
===================================================== */

function renderHistory() {

  historyList.innerHTML =
    "";


  if (
    savedChats.length === 0
  ) {

    historyList.innerHTML = `
      <div class="empty-sidebar">
        No chat history yet.
      </div>
    `;

    return;

  }


  savedChats.forEach(
    chat => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "history-card";


      card.innerHTML = `

        <div class="history-card-title">
          ${escapeHTML(chat.title)}
        </div>

        <div class="history-card-time">
          ${escapeHTML(chat.time)}
        </div>

        <div class="history-card-actions">

          <button data-load="${chat.id}">
            Open
          </button>

          <button data-pin="${chat.id}">
            ${
              chat.pinned
                ? "Unpin"
                : "Pin"
            }
          </button>

          <button data-delete="${chat.id}">
            Delete
          </button>

        </div>

      `;


      historyList.appendChild(
        card
      );

    }
  );


  /* OPEN */

  historyList
    .querySelectorAll(
      "[data-load]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            loadChat(
              Number(
                button.dataset.load
              )
            );


            historyModal.style.display =
              "none";

          }
        );

      }
    );


  /* PIN */

  historyList
    .querySelectorAll(
      "[data-pin]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const id =
              Number(
                button.dataset.pin
              );


            const chat =
              savedChats.find(
                item =>
                  item.id === id
              );


            if (chat) {

              chat.pinned =
                !chat.pinned;

            }


            localStorage.setItem(
              "viggoChats",
              JSON.stringify(
                savedChats
              )
            );


            renderHistory();

            renderSidebar();

          }
        );

      }
    );


  /* DELETE */

  historyList
    .querySelectorAll(
      "[data-delete]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const id =
              Number(
                button.dataset.delete
              );


            savedChats =
              savedChats.filter(
                item =>
                  item.id !== id
              );


            localStorage.setItem(
              "viggoChats",
              JSON.stringify(
                savedChats
              )
            );


            renderHistory();

            renderSidebar();

          }
        );

      }
    );

}


/* =====================================================
   SAVE BUTTON
===================================================== */

saveButton.addEventListener(
  "click",
  () => {

    if (
      currentMessages.length === 0
    ) {

      alert(
        "Start a chat first."
      );

      return;

    }


    saveCurrentChat();


    alert(
      "Chat saved successfully."
    );

  }
);


/* =====================================================
   CLEAR HISTORY
===================================================== */

clearHistoryButton.addEventListener(
  "click",
  () => {

    const confirmDelete =
      confirm(
        "Delete all Viggo chat history?"
      );


    if (!confirmDelete) {

      return;

    }


    savedChats = [];


    localStorage.removeItem(
      "viggoChats"
    );


    renderSidebar();


    historyList.innerHTML =
      `<div class="empty-sidebar">
        No chat history yet.
      </div>`;

  }
);


/* =====================================================
   VOICE TOGGLE
===================================================== */

voiceToggle.addEventListener(
  "click",
  () => {

    voiceEnabled =
      !voiceEnabled;


    voiceToggle.textContent =
      voiceEnabled
        ? "🔊  Voice ON"
        : "🔇  Voice OFF";


  }
);


/* =====================================================
   TEXT TO SPEECH
===================================================== */

function speak(text) {

  if (
    !voiceEnabled ||
    !("speechSynthesis" in window)
  ) {

    return;

  }


  speechSynthesis.cancel();


  const speech =
    new SpeechSynthesisUtterance(
      text
    );


  speech.rate =
    1;


  speech.pitch =
    1;


  speechSynthesis.speak(
    speech
  );

}


/* =====================================================
   MICROPHONE
===================================================== */

function setupVoice() {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


  if (
    !SpeechRecognition
  ) {

    micButton.title =
      "Voice input is not supported in this browser";

    return;

  }


  recognition =
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


  recognition.onresult =
    event => {

      const transcript =
        event
          .results[0][0]
          .transcript;


      messageInput.value +=
        transcript;


      autoResize();

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
    error => {

      console.error(
        "Microphone error:",
        error
      );


      micButton.classList.remove(
        "listening"
      );


      micButton.textContent =
        "🎤";

    };


  micButton.addEventListener(
    "click",
    () => {

      try {

        recognition.start();

      } catch (error) {

        console.log(
          "Voice recognition already running."
        );

      }

    }
  );

}


/* =====================================================
   MOBILE MENU
===================================================== */

if (mobileMenu) {

  mobileMenu.addEventListener(
    "click",
    () => {

      sidebar.classList.toggle(
        "open"
      );

    }
  );

}


function closeSidebar() {

  sidebar.classList.remove(
    "open"
  );

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(text) {

  const div =
    document.createElement(
      "div"
    );


  div.textContent =
    text;


  return div.innerHTML;

}


/* =====================================================
   GLOBAL ERROR
===================================================== */

window.addEventListener(
  "error",
  event => {

    console.error(
      "Viggo error:",
      event.error
    );

  }
);
