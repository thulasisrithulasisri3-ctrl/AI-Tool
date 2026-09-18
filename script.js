/* =========================================================
   VIGGO AI - FULL SCRIPT.JS
   ========================================================= */

(() => {
  "use strict";

  /* =========================================================
     CONFIG
     ========================================================= */

  const API_URL = "https://ai-tool-2-zpul.onrender.com/chat";

  const STORAGE_KEY = "viggoChats";
  const LANGUAGE_KEY = "viggoLanguage";
  const VOICE_KEY = "viggoVoice";

  /* =========================================================
     ELEMENTS
     ========================================================= */

  const $ = (id) => document.getElementById(id);

  const sidebar = $("sidebar");
  const closeSidebar = $("closeSidebar");
  const openSidebar = $("openSidebar");

  const newChatBtn = $("newChat");
  const searchChatBtn = $("searchChat");
  const chatHistory = $("chatHistory");

  const moreMenu = $("moreMenu");
  const moreBtn = $("moreBtn");

  const voiceMenuBtn = $("voiceMenuBtn");
  const languageBtn = $("languageBtn");
  const selectChatsBtn = $("selectChatsBtn");
  const deleteSelectedBtn = $("deleteSelectedBtn");
  const clearChatBtn = $("clearChatBtn");

  const shareBtn = $("shareBtn");

  const conversation = $("conversation");

  const plusBtn = $("plusBtn");
  const plusMenu = $("plusMenu");

  const cameraBtn = $("cameraBtn");
  const photoBtn = $("photoBtn");
  const videoBtn = $("videoBtn");
  const fileBtn = $("fileBtn");

  const cameraInput = $("cameraInput");
  const photoInput = $("photoInput");
  const videoInput = $("videoInput");
  const fileInput = $("fileInput");

  const messageInput = $("message");
  const micBtn = $("mic");
  const sendBtn = $("send");

  const voiceModal = $("voiceModal");
  const closeVoice = $("closeVoice");
  const voiceSelect = $("voiceSelect");
  const voiceGender = $("voiceGender");
  const startVoice = $("startVoice");

  const languageModal = $("languageModal");
  const closeLanguage = $("closeLanguage");
  const languageSelect = $("languageSelect");
  const saveLanguage = $("saveLanguage");

  /* =========================================================
     STATE
     ========================================================= */

  let chats = loadChats();
  let currentChatId = null;

  let selectedLanguage =
    localStorage.getItem(LANGUAGE_KEY) || "en-IN";

  let selectedVoice =
    localStorage.getItem(VOICE_KEY) || "female";

  let selectedChats = new Set();

  let attachedFile = null;

  let recognition = null;
  let speaking = false;

  /* =========================================================
     STORAGE
     ========================================================= */

  function loadChats() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) return [];

      const parsed = JSON.parse(saved);

      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Chat storage error:", error);
      return [];
    }
  }

  function saveChats() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    } catch (error) {
      console.error("Could not save chats:", error);
    }
  }

  /* =========================================================
     ID
     ========================================================= */

  function createId() {
    return (
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 8)
    );
  }

  /* =========================================================
     CHAT HELPERS
     ========================================================= */

  function createChat() {
    const chat = {
      id: createId(),
      title: "New Chat",
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: []
    };

    chats.unshift(chat);
    currentChatId = chat.id;

    saveChats();
    renderHistory();
    renderConversation();

    return chat;
  }

  function getCurrentChat() {
    return chats.find((chat) => chat.id === currentChatId);
  }

  function ensureCurrentChat() {
    let chat = getCurrentChat();

    if (!chat) {
      chat = createChat();
    }

    return chat;
  }

  function updateChatTime(chat) {
    chat.updatedAt = Date.now();
  }

  /* =========================================================
     NEW CHAT
     ========================================================= */

  function startNewChat() {
    createChat();

    if (messageInput) {
      messageInput.value = "";
      messageInput.focus();
    }

    attachedFile = null;
  }

  if (newChatBtn) {
    newChatBtn.addEventListener("click", () => {
      startNewChat();
      closeMoreMenu();
    });
  }

  /* =========================================================
     SIDEBAR
     ========================================================= */

  if (openSidebar) {
    openSidebar.addEventListener("click", () => {
      sidebar?.classList.add("open");
    });
  }

  if (closeSidebar) {
    closeSidebar.addEventListener("click", () => {
      sidebar?.classList.remove("open");
    });
  }

  /* =========================================================
     MORE MENU
     ========================================================= */

  function closeMoreMenu() {
    if (moreMenu) {
      moreMenu.classList.remove("show");
    }
  }

  if (moreBtn) {
    moreBtn.addEventListener("click", (event) => {
      event.stopPropagation();

      if (!moreMenu) return;

      moreMenu.classList.toggle("show");
    });
  }

  document.addEventListener("click", (event) => {
    if (
      moreMenu &&
      !moreMenu.contains(event.target) &&
      event.target !== moreBtn
    ) {
      closeMoreMenu();
    }
  });

  /* =========================================================
     PLUS MENU
     ========================================================= */

  function closePlusMenu() {
    if (plusMenu) {
      plusMenu.classList.remove("show");
    }
  }

  if (plusBtn) {
    plusBtn.addEventListener("click", (event) => {
      event.stopPropagation();

      if (!plusMenu) return;

      plusMenu.classList.toggle("show");
    });
  }

  document.addEventListener("click", (event) => {
    if (
      plusMenu &&
      !plusMenu.contains(event.target) &&
      event.target !== plusBtn
    ) {
      closePlusMenu();
    }
  });

  /* =========================================================
     CAMERA
     ========================================================= */

  if (cameraBtn) {
    cameraBtn.addEventListener("click", () => {
      closePlusMenu();

      if (cameraInput) {
        cameraInput.click();
      }
    });
  }

  /* =========================================================
     PHOTO
     ========================================================= */

  if (photoBtn) {
    photoBtn.addEventListener("click", () => {
      closePlusMenu();

      if (photoInput) {
        photoInput.click();
      }
    });
  }

  /* =========================================================
     VIDEO
     ========================================================= */

  if (videoBtn) {
    videoBtn.addEventListener("click", () => {
      closePlusMenu();

      if (videoInput) {
        videoInput.click();
      }
    });
  }

  /* =========================================================
     FILE
     ========================================================= */

  if (fileBtn) {
    fileBtn.addEventListener("click", () => {
      closePlusMenu();

      if (fileInput) {
        fileInput.click();
      }
    });
  }

  /* =========================================================
     FILE READER
     ========================================================= */

  async function processFile(file) {
    if (!file) return;

    attachedFile = file;

    console.log("Selected file:", file.name);

    if (messageInput) {
      messageInput.placeholder = `Attached: ${file.name}`;
      messageInput.focus();
    }
  }

  if (cameraInput) {
    cameraInput.addEventListener("change", async () => {
      const file = cameraInput.files?.[0];

      if (file) {
        await processFile(file);
      }
    });
  }

  if (photoInput) {
    photoInput.addEventListener("change", async () => {
      const file = photoInput.files?.[0];

      if (file) {
        await processFile(file);
      }
    });
  }

  if (videoInput) {
    videoInput.addEventListener("change", async () => {
      const file = videoInput.files?.[0];

      if (file) {
        await processFile(file);
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files?.[0];

      if (file) {
        await processFile(file);
      }
    });
  }

  /* =========================================================
     FILE TO DATA URL
     ========================================================= */

  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;

      reader.readAsDataURL(file);
    });
  }

  /* =========================================================
     ESCAPE HTML
     ========================================================= */

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* =========================================================
     FORMAT AI TEXT
     ========================================================= */

  function formatAIText(text) {
    if (!text) return "";

    let safe = escapeHTML(text);

    safe = safe.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    safe = safe.replace(
      /\n/g,
      "<br>"
    );

    return safe;
  }

  /* =========================================================
     RENDER HISTORY
     ========================================================= */

  function renderHistory() {
    if (!chatHistory) return;

    chatHistory.innerHTML = "";

    const sortedChats = [...chats].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });

    if (sortedChats.length === 0) {
      const empty = document.createElement("div");

      empty.className = "empty-history";
      empty.textContent = "No chats yet";

      chatHistory.appendChild(empty);

      return;
    }

    sortedChats.forEach((chat) => {
      const row = document.createElement("div");

      row.className = "chat-history-row";

      if (chat.id === currentChatId) {
        row.classList.add("active");
      }

      const title = document.createElement("div");

      title.className = "chat-history-title";
      title.textContent =
        chat.title || "New Chat";

      title.addEventListener("click", () => {
        currentChatId = chat.id;
        renderHistory();
        renderConversation();

        sidebar?.classList.remove("open");
      });

      const pinButton = document.createElement("button");

      pinButton.className = "chat-pin-btn";
      pinButton.textContent = chat.pinned ? "📌" : "📍";

      pinButton.title = chat.pinned
        ? "Unpin"
        : "Pin";

      pinButton.addEventListener("click", (event) => {
        event.stopPropagation();

        chat.pinned = !chat.pinned;

        updateChatTime(chat);
        saveChats();
        renderHistory();
      });

      const deleteButton = document.createElement("button");

      deleteButton.className = "chat-delete-btn";
      deleteButton.textContent = "🗑";

      deleteButton.title = "Delete";

      deleteButton.addEventListener("click", (event) => {
        event.stopPropagation();

        deleteChat(chat.id);
      });

      row.appendChild(title);
      row.appendChild(pinButton);
      row.appendChild(deleteButton);

      chatHistory.appendChild(row);
    });
  }

  /* =========================================================
     DELETE CHAT
     ========================================================= */

  function deleteChat(id) {
    chats = chats.filter((chat) => chat.id !== id);

    if (currentChatId === id) {
      currentChatId = chats[0]?.id || null;
    }

    saveChats();
    renderHistory();
    renderConversation();

    if (chats.length === 0) {
      createChat();
    }
  }

  /* =========================================================
     SELECT CHATS
     ========================================================= */

  if (selectChatsBtn) {
    selectChatsBtn.addEventListener("click", () => {
      if (!chatHistory) return;

      chatHistory.classList.toggle("select-mode");

      if (!chatHistory.classList.contains("select-mode")) {
        selectedChats.clear();
      }

      renderHistory();
    });
  }

  /* =========================================================
     DELETE SELECTED
     ========================================================= */

  if (deleteSelectedBtn) {
    deleteSelectedBtn.addEventListener("click", () => {
      if (selectedChats.size === 0) return;

      chats = chats.filter(
        (chat) => !selectedChats.has(chat.id)
      );

      selectedChats.clear();

      if (!chats.some((chat) => chat.id === currentChatId)) {
        currentChatId = chats[0]?.id || null;
      }

      saveChats();
      renderHistory();
      renderConversation();

      if (chats.length === 0) {
        createChat();
      }
    });
  }

  /* =========================================================
     SEARCH CHAT
     ========================================================= */

  if (searchChatBtn) {
    searchChatBtn.addEventListener("click", () => {
      const query = prompt("Search chats:");

      if (query === null) return;

      const search = query.trim().toLowerCase();

      if (!search) {
        renderHistory();
        return;
      }

      if (!chatHistory) return;

      chatHistory.innerHTML = "";

      const results = chats.filter((chat) => {
        const title = chat.title || "";

        const content = (chat.messages || [])
          .map((msg) => msg.content || "")
          .join(" ");

        return (
          title.toLowerCase().includes(search) ||
          content.toLowerCase().includes(search)
        );
      });

      if (results.length === 0) {
        const empty = document.createElement("div");

        empty.className = "empty-history";
        empty.textContent = "No matching chats";

        chatHistory.appendChild(empty);

        return;
      }

      results.forEach((chat) => {
        const row = document.createElement("div");

        row.className = "chat-history-row";

        const title = document.createElement("div");

        title.className = "chat-history-title";
        title.textContent = chat.title || "New Chat";

        title.addEventListener("click", () => {
          currentChatId = chat.id;

          renderHistory();
          renderConversation();
        });

        row.appendChild(title);

        chatHistory.appendChild(row);
      });
    });
  }

  /* =========================================================
     CLEAR CHAT
     ========================================================= */

  if (clearChatBtn) {
    clearChatBtn.addEventListener("click", () => {
      const chat = getCurrentChat();

      if (!chat) return;

      chat.messages = [];
      chat.title = "New Chat";

      updateChatTime(chat);
      saveChats();

      renderHistory();
      renderConversation();

      closeMoreMenu();
    });
  }

  /* =========================================================
     RENDER CONVERSATION
     ========================================================= */

  function renderConversation() {
    if (!conversation) return;

    conversation.innerHTML = "";

    const chat = getCurrentChat();

    if (!chat || !chat.messages?.length) {
      return;
    }

    chat.messages.forEach((msg) => {
      renderMessage(msg);
    });

    scrollToBottom();
  }

  /* =========================================================
     RENDER MESSAGE
     ========================================================= */

  function renderMessage(msg) {
    if (!conversation) return;

    const wrapper = document.createElement("div");

    wrapper.className =
      msg.role === "user"
        ? "message user-message"
        : "message ai-message";

    const bubble = document.createElement("div");

    bubble.className = "message-bubble";

    if (msg.role === "user") {
      bubble.innerHTML = formatAIText(msg.content);
    } else {
      bubble.innerHTML = formatAIText(msg.content);
    }

    wrapper.appendChild(bubble);

    if (msg.role === "assistant") {
      const actions = document.createElement("div");

      actions.className = "message-actions";

      const copy = createActionButton(
        "Copy",
        () => copyText(msg.content)
      );

      const save = createActionButton(
        "Save",
        () => saveMessage(msg.content)
      );

      const like = createActionButton(
        "Like",
        () => toggleLike(msg)
      );

      const speaker = createActionButton(
        "🔊",
        () => speakText(msg.content)
      );

      actions.appendChild(copy);
      actions.appendChild(save);
      actions.appendChild(like);
      actions.appendChild(speaker);

      wrapper.appendChild(actions);
    }

    conversation.appendChild(wrapper);
  }

  /* =========================================================
     ACTION BUTTON
     ========================================================= */

  function createActionButton(label, callback) {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = label;

    button.addEventListener("click", callback);

    return button;
  }

  /* =========================================================
     COPY
     ========================================================= */

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);

      console.log("Copied");
    } catch (error) {
      const textarea = document.createElement("textarea");

      textarea.value = text;

      document.body.appendChild(textarea);

      textarea.select();

      document.execCommand("copy");

      textarea.remove();
    }
  }

  /* =========================================================
     SAVE MESSAGE
     ========================================================= */

  function saveMessage(text) {
    const saved = JSON.parse(
      localStorage.getItem("viggoSavedMessages") || "[]"
    );

    saved.push({
      text,
      savedAt: Date.now()
    });

    localStorage.setItem(
      "viggoSavedMessages",
      JSON.stringify(saved)
    );
  }

  /* =========================================================
     LIKE
     ========================================================= */

  function toggleLike(msg) {
    msg.liked = !msg.liked;

    saveChats();
  }

  /* =========================================================
     SPEAKER
     ========================================================= */

  function speakText(text) {
    if (!("speechSynthesis" in window)) {
      alert("Voice is not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel();

    if (!text) return;

    const utterance =
      new SpeechSynthesisUtterance(text);

    const voices =
      window.speechSynthesis.getVoices();

    let languageCode = selectedLanguage || "en-IN";

    if (languageCode === "ta-IN") {
      utterance.lang = "ta-IN";
    } else if (languageCode === "hi-IN") {
      utterance.lang = "hi-IN";
    } else {
      utterance.lang = "en-IN";
    }

    let matchingVoice = null;

    if (selectedVoice === "male") {
      matchingVoice = voices.find((voice) =>
        /male|man|david|ravi|hemant/i.test(
          voice.name
        )
      );
    } else {
      matchingVoice = voices.find((voice) =>
        /female|woman|zira|samantha|veena/i.test(
          voice.name
        )
      );
    }

    if (!matchingVoice) {
      matchingVoice = voices.find(
        (voice) =>
          voice.lang?.toLowerCase() ===
          languageCode.toLowerCase()
      );
    }

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.rate = 0.95;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  }

  /* =========================================================
     VOICE MODAL
     ========================================================= */

  if (voiceMenuBtn) {
    voiceMenuBtn.addEventListener("click", () => {
      closeMoreMenu();

      if (voiceModal) {
        voiceModal.classList.add("show");
      }
    });
  }

  if (closeVoice) {
    closeVoice.addEventListener("click", () => {
      voiceModal?.classList.remove("show");
    });
  }

  if (startVoice) {
    startVoice.addEventListener("click", () => {
      if (voiceGender?.value) {
        selectedVoice = voiceGender.value;

        localStorage.setItem(
          VOICE_KEY,
          selectedVoice
        );
      }

      voiceModal?.classList.remove("show");
    });
  }

  /* =========================================================
     LANGUAGE MODAL
     ========================================================= */

  if (languageBtn) {
    languageBtn.addEventListener("click", () => {
      closeMoreMenu();

      if (languageModal) {
        languageModal.classList.add("show");
      }

      if (languageSelect) {
        languageSelect.value =
          selectedLanguage;
      }
    });
  }

  if (closeLanguage) {
    closeLanguage.addEventListener("click", () => {
      languageModal?.classList.remove("show");
    });
  }

  if (saveLanguage) {
    saveLanguage.addEventListener("click", () => {
      if (languageSelect?.value) {
        selectedLanguage =
          languageSelect.value;

        localStorage.setItem(
          LANGUAGE_KEY,
          selectedLanguage
        );
      }

      languageModal?.classList.remove("show");
    });
  }

  /* =========================================================
     MODAL OUTSIDE CLICK
     ========================================================= */

  document.addEventListener("click", (event) => {
    if (
      voiceModal &&
      event.target === voiceModal
    ) {
      voiceModal.classList.remove("show");
    }

    if (
      languageModal &&
      event.target === languageModal
    ) {
      languageModal.classList.remove("show");
    }
  });

  /* =========================================================
     SPEECH RECOGNITION
     ========================================================= */

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.lang = selectedLanguage;

    recognition.onstart = () => {
      speaking = true;

      micBtn?.classList.add("active");
    };

    recognition.onend = () => {
      speaking = false;

      micBtn?.classList.remove("active");
    };

    recognition.onerror = (event) => {
      console.error(
        "Speech recognition error:",
        event.error
      );

      speaking = false;

      micBtn?.classList.remove("active");
    };

    recognition.onresult = (event) => {
      const transcript =
        event.results[0][0].transcript;

      if (messageInput) {
        messageInput.value =
          messageInput.value
            ? messageInput.value + " " + transcript
            : transcript;
      }
    };
  }

  if (micBtn) {
    micBtn.addEventListener("click", () => {
      if (!recognition) {
        alert(
          "Voice input is not supported in this browser."
        );

        return;
      }

      recognition.lang = selectedLanguage;

      if (speaking) {
        recognition.stop();
      } else {
        recognition.start();
      }
    });
  }

  /* =========================================================
     API RESPONSE EXTRACTION
     ========================================================= */

  function extractReply(data) {
    if (!data) {
      return "";
    }

    if (typeof data === "string") {
      return data;
    }

    const directFields = [
      "reply",
      "response",
      "message",
      "text",
      "answer",
      "output",
      "content"
    ];

    for (const field of directFields) {
      if (
        typeof data[field] === "string" &&
        data[field].trim()
      ) {
        return data[field];
      }
    }

    if (
      Array.isArray(data.candidates) &&
      data.candidates.length
    ) {
      const candidate =
        data.candidates[0];

      const parts =
        candidate?.content?.parts;

      if (Array.isArray(parts)) {
        const text = parts
          .map((part) => part?.text || "")
          .join("");

        if (text.trim()) {
          return text;
        }
      }
    }

    return "";
  }

  /* =========================================================
     SEND MESSAGE
     ========================================================= */

  async function sendMessage() {
    if (!messageInput) return;

    const text = messageInput.value.trim();

    if (!text && !attachedFile) {
      return;
    }

    const chat = ensureCurrentChat();

    let fileData = null;

    if (attachedFile) {
      try {
        fileData =
          await fileToDataURL(attachedFile);
      } catch (error) {
        console.error(
          "File conversion error:",
          error
        );
      }
    }

    const userText =
      text ||
      `[Attached file: ${attachedFile?.name || "file"}]`;

    chat.messages.push({
      role: "user",
      content: userText,
      timestamp: Date.now()
    });

    if (
      chat.title === "New Chat" &&
      text
    ) {
      chat.title =
        text.length > 40
          ? text.slice(0, 40) + "..."
          : text;
    }

    updateChatTime(chat);

    saveChats();
    renderConversation();
    renderHistory();

    messageInput.value = "";

    messageInput.placeholder =
      "Message Viggo AI...";

    const oldFile = attachedFile;

    attachedFile = null;

    const thinkingMessage = {
      role: "assistant",
      content: "Thinking...",
      timestamp: Date.now(),
      temporary: true
    };

    chat.messages.push(thinkingMessage);

    renderConversation();
    scrollToBottom();

    try {
      const history = chat.messages
        .filter((msg) => !msg.temporary)
        .slice(-30)
        .map((msg) => ({
          role:
            msg.role === "assistant"
              ? "model"
              : "user",
          content: msg.content
        }));

      const payload = {
        message: text,
        originalMessage: text,
        conversationHistory: history,
        language: selectedLanguage,
        browserTimezone:
          Intl.DateTimeFormat().resolvedOptions()
            .timeZone || "Asia/Kolkata",
        currentDateTime:
          new Date().toISOString()
      };

      if (fileData) {
        payload.file = {
          name: oldFile?.name || "file",
          type:
            oldFile?.type ||
            "application/octet-stream",
          data: fileData
        };
      }

      const response = await fetch(API_URL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(
          `Server error: ${response.status}`
        );
      }

      const data = await response.json();

      console.log(
        "Viggo API response:",
        data
      );

      const reply = extractReply(data);

      if (!reply) {
        throw new Error(
          "No reply received from server."
        );
      }

      thinkingMessage.content = reply;
      delete thinkingMessage.temporary;

      updateChatTime(chat);

      saveChats();

      renderConversation();
      renderHistory();

      scrollToBottom();
    } catch (error) {
      console.error(
        "Viggo AI error:",
        error
      );

      thinkingMessage.content =
        "Sorry, I couldn't connect to Viggo AI right now. Please try again.";

      delete thinkingMessage.temporary;

      saveChats();
      renderConversation();

      scrollToBottom();
    }
  }

  /* =========================================================
     SEND BUTTON
     ========================================================= */

  if (sendBtn) {
    sendBtn.addEventListener(
      "click",
      sendMessage
    );
  }

  /* =========================================================
     ENTER KEY
     ========================================================= */

  if (messageInput) {
    messageInput.addEventListener(
      "keydown",
      (event) => {
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

  /* =========================================================
     SHARE CHAT
     ========================================================= */

  function shareCurrentChat() {
    const chat = getCurrentChat();

    if (!chat) {
      alert("No chat to share.");
      return;
    }

    try {
      const encoded = btoa(
        unescape(
          encodeURIComponent(
            JSON.stringify(chat)
          )
        )
      );

      const url =
        window.location.origin +
        window.location.pathname +
        "#shared=" +
        encodeURIComponent(encoded);

      if (navigator.share) {
        navigator
          .share({
            title: "Viggo AI Chat",
            text: "Shared Viggo AI chat",
            url
          })
          .catch(() => {});
      } else {
        copyText(url);

        alert(
          "Chat link copied!"
        );
      }
    } catch (error) {
      console.error(
        "Share error:",
        error
      );
    }
  }

  if (shareBtn) {
    shareBtn.addEventListener(
      "click",
      shareCurrentChat
    );
  }

  /* =========================================================
     LOAD SHARED CHAT
     ========================================================= */

  function loadSharedChat() {
    const hash = window.location.hash;

    if (!hash.startsWith("#shared=")) {
      return false;
    }

    try {
      const encoded =
        decodeURIComponent(
          hash.substring(8)
        );

      const json = decodeURIComponent(
        escape(
          atob(encoded)
        )
      );

      const sharedChat =
        JSON.parse(json);

      if (
        !sharedChat ||
        !Array.isArray(
          sharedChat.messages
        )
      ) {
        return false;
      }

      const imported = {
        ...sharedChat,
        id: createId(),
        title:
          sharedChat.title ||
          "Shared Chat",
        pinned: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      chats.unshift(imported);

      currentChatId = imported.id;

      saveChats();

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname +
          window.location.search
      );

      return true;
    } catch (error) {
      console.error(
        "Shared chat error:",
        error
      );

      return false;
    }
  }

  /* =========================================================
     SCROLL
     ========================================================= */

  function scrollToBottom() {
    if (!conversation) return;

    requestAnimationFrame(() => {
      conversation.scrollTop =
        conversation.scrollHeight;
    });
  }

  /* =========================================================
     MOBILE HEIGHT
     ========================================================= */

  function updateAppHeight() {
    document.documentElement.style.setProperty(
      "--app-height",
      `${window.innerHeight}px`
    );
  }

  window.addEventListener(
    "resize",
    updateAppHeight
  );

  window.addEventListener(
    "orientationchange",
    updateAppHeight
  );

  updateAppHeight();

  /* =========================================================
     INIT
     ========================================================= */

  function init() {
    const sharedLoaded =
      loadSharedChat();

    if (!sharedLoaded) {
      if (chats.length === 0) {
        createChat();
      } else {
        currentChatId =
          chats[0].id;

        renderHistory();
        renderConversation();
      }
    } else {
      renderHistory();
      renderConversation();
    }

    if (languageSelect) {
      languageSelect.value =
        selectedLanguage;
    }

    if (voiceGender) {
      voiceGender.value =
        selectedVoice;
    }

    console.log(
      "VIGGO AI SCRIPT READY"
    );
  }

  init();

})();
