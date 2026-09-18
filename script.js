```javascript
"use strict";

/* =========================================================
   VIGGO AI - CLEAN FULL SCRIPT.JS
   Text + Camera + Photo + Video + File
   API: Render /chat
========================================================= */

(() => {
  console.log("VIGGO AI SCRIPT STARTING...");

  /* =======================================================
     API
  ======================================================= */

  const API_URL =
    "https://ai-tool-2-zpul.onrender.com/chat";

  /* =======================================================
     GET ELEMENT
  ======================================================= */

  const $ = (id) => document.getElementById(id);

  const sidebar = $("sidebar");
  const openSidebar = $("openSidebar");
  const closeSidebar = $("closeSidebar");

  const newChat = $("newChat");
  const searchChat = $("searchChat");
  const chatHistory = $("chatHistory");

  const moreBtn = $("moreBtn");
  const moreMenu = $("moreMenu");

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
  const startVoice = $("startVoice");
  const voiceGender = $("voiceGender");

  const languageModal = $("languageModal");
  const closeLanguage = $("closeLanguage");
  const languageSelect = $("languageSelect");
  const saveLanguage = $("saveLanguage");

  /* =======================================================
     STATE
  ======================================================= */

  let chats = [];
  let currentChatId = null;

  let selectedChats = new Set();
  let selectMode = false;

  let selectedLanguage =
    localStorage.getItem("viggoLanguage") || "en-IN";

  let selectedVoice =
    localStorage.getItem("viggoVoice") || "female";

  let attachedFile = null;

  let recognition = null;
  let listening = false;

  /* =======================================================
     VIEWPORT
  ======================================================= */

  function updateViewport() {
    const height =
      window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;

    document.documentElement.style.setProperty(
      "--app-height",
      `${height}px`
    );
  }

  updateViewport();

  window.addEventListener("resize", updateViewport);
  window.addEventListener("orientationchange", updateViewport);

  if (window.visualViewport) {
    window.visualViewport.addEventListener(
      "resize",
      updateViewport
    );
  }

  /* =======================================================
     STORAGE
  ======================================================= */

  function loadChats() {
    try {
      const saved =
        localStorage.getItem("viggoChats");

      if (!saved) {
        chats = [];
        return;
      }

      const parsed = JSON.parse(saved);

      chats =
        Array.isArray(parsed)
          ? parsed
          : [];
    } catch (error) {
      console.error(
        "Chat loading error:",
        error
      );

      chats = [];
    }
  }

  function saveChats() {
    try {
      localStorage.setItem(
        "viggoChats",
        JSON.stringify(chats)
      );
    } catch (error) {
      console.error(
        "Chat saving error:",
        error
      );
    }
  }

  /* =======================================================
     ID
  ======================================================= */

  function createId() {
    return (
      Date.now().toString(36) +
      Math.random()
        .toString(36)
        .substring(2, 9)
    );
  }

  /* =======================================================
     CHAT
  ======================================================= */

  function createChat() {
    return {
      id: createId(),
      title: "New Chat",
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: []
    };
  }

  function ensureChat() {
    if (!chats.length) {
      const chat = createChat();

      chats.push(chat);

      currentChatId = chat.id;

      saveChats();

      return chat;
    }

    if (!currentChatId) {
      currentChatId = chats[0].id;
    }

    return getCurrentChat();
  }

  function getCurrentChat() {
    return chats.find(
      (chat) => chat.id === currentChatId
    );
  }

  function newChatNow() {
    const chat = createChat();

    chats.unshift(chat);

    currentChatId = chat.id;

    attachedFile = null;

    if (messageInput) {
      messageInput.value = "";
      messageInput.placeholder =
        "Message Viggo AI...";
    }

    saveChats();

    renderHistory();
    renderConversation();

    closeSidebarMobile();

    messageInput?.focus();
  }

  /* =======================================================
     SIDEBAR
  ======================================================= */

  function closeSidebarMobile() {
    if (sidebar) {
      sidebar.classList.remove("open");
    }
  }

  if (openSidebar) {
    openSidebar.addEventListener(
      "click",
      () => {
        sidebar?.classList.add("open");
      }
    );
  }

  if (closeSidebar) {
    closeSidebar.addEventListener(
      "click",
      closeSidebarMobile
    );
  }

  if (newChat) {
    newChat.addEventListener(
      "click",
      newChatNow
    );
  }

  /* =======================================================
     MORE MENU
  ======================================================= */

  function closeMoreMenu() {
    moreMenu?.classList.remove("show");
    moreMenu?.classList.remove("active");
  }

  if (moreBtn) {
    moreBtn.addEventListener(
      "click",
      (event) => {
        event.stopPropagation();

        if (!moreMenu) return;

        moreMenu.classList.toggle("show");
        moreMenu.classList.toggle("active");
      }
    );
  }

  /* =======================================================
     PLUS MENU
  ======================================================= */

  function closePlusMenu() {
    plusMenu?.classList.remove("show");
    plusMenu?.classList.remove("active");
  }

  if (plusBtn) {
    plusBtn.addEventListener(
      "click",
      (event) => {
        event.stopPropagation();

        if (!plusMenu) return;

        plusMenu.classList.toggle("show");
        plusMenu.classList.toggle("active");
      }
    );
  }

  document.addEventListener(
    "click",
    (event) => {
      if (
        moreMenu &&
        !moreMenu.contains(event.target) &&
        event.target !== moreBtn
      ) {
        closeMoreMenu();
      }

      if (
        plusMenu &&
        !plusMenu.contains(event.target) &&
        event.target !== plusBtn
      ) {
        closePlusMenu();
      }
    }
  );

  /* =======================================================
     CAMERA
  ======================================================= */

  if (cameraBtn) {
    cameraBtn.addEventListener(
      "click",
      () => {
        closePlusMenu();

        if (!cameraInput) {
          alert("Camera input not found.");
          return;
        }

        cameraInput.click();
      }
    );
  }

  /* =======================================================
     PHOTO
  ======================================================= */

  if (photoBtn) {
    photoBtn.addEventListener(
      "click",
      () => {
        closePlusMenu();

        if (!photoInput) {
          alert("Photo input not found.");
          return;
        }

        photoInput.click();
      }
    );
  }

  /* =======================================================
     VIDEO
  ======================================================= */

  if (videoBtn) {
    videoBtn.addEventListener(
      "click",
      () => {
        closePlusMenu();

        if (!videoInput) {
          alert("Video input not found.");
          return;
        }

        videoInput.click();
      }
    );
  }

  /* =======================================================
     FILE
  ======================================================= */

  if (fileBtn) {
    fileBtn.addEventListener(
      "click",
      () => {
        closePlusMenu();

        if (!fileInput) {
          alert("File input not found.");
          return;
        }

        fileInput.click();
      }
    );
  }

  /* =======================================================
     FILE SELECTED
  ======================================================= */

  function handleFile(file) {
    if (!file) return;

    attachedFile = file;

    console.log(
      "File selected:",
      file.name,
      file.type,
      file.size
    );

    if (messageInput) {
      messageInput.placeholder =
        `Attached: ${file.name}`;
    }

    messageInput?.focus();
  }

  if (cameraInput) {
    cameraInput.addEventListener(
      "change",
      () => {
        const file =
          cameraInput.files &&
          cameraInput.files[0];

        handleFile(file);

        cameraInput.value = "";
      }
    );
  }

  if (photoInput) {
    photoInput.addEventListener(
      "change",
      () => {
        const file =
          photoInput.files &&
          photoInput.files[0];

        handleFile(file);

        photoInput.value = "";
      }
    );
  }

  if (videoInput) {
    videoInput.addEventListener(
      "change",
      () => {
        const file =
          videoInput.files &&
          videoInput.files[0];

        handleFile(file);

        videoInput.value = "";
      }
    );
  }

  if (fileInput) {
    fileInput.addEventListener(
      "change",
      () => {
        const file =
          fileInput.files &&
          fileInput.files[0];

        handleFile(file);

        fileInput.value = "";
      }
    );
  }

  /* =======================================================
     FILE -> DATA URL
  ======================================================= */

  function fileToDataURL(file) {
    return new Promise(
      (resolve, reject) => {
        const reader =
          new FileReader();

        reader.onload = () =>
          resolve(reader.result);

        reader.onerror = () =>
          reject(reader.error);

        reader.readAsDataURL(file);
      }
    );
  }

  /* =======================================================
     ESCAPE
  ======================================================= */

  function escapeHTML(text) {
    return String(text ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  /* =======================================================
     FORMAT TEXT
  ======================================================= */

  function formatText(text) {
    if (!text) return "";

    let output =
      escapeHTML(text);

    output =
      output.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
      );

    output =
      output.replace(
        /\n/g,
        "<br>"
      );

    return output;
  }

  /* =======================================================
     MESSAGE UI
  ======================================================= */

  function addMessageToUI(
    role,
    text,
    media = null
  ) {
    if (!conversation) return;

    const wrapper =
      document.createElement("div");

    wrapper.className =
      role === "user"
        ? "message user"
        : "message ai";

    const content =
      document.createElement("div");

    content.className =
      "message-content";

    const bubble =
      document.createElement("div");

    bubble.className =
      "message-bubble";

    /* IMAGE */

    if (
      media &&
      media.type &&
      media.type.startsWith("image/")
    ) {
      const img =
        document.createElement("img");

      img.src = media.data;

      img.alt =
        media.name ||
        "Uploaded image";

      img.style.maxWidth =
        "100%";

      img.style.maxHeight =
        "320px";

      img.style.objectFit =
        "contain";

      img.style.borderRadius =
        "12px";

      bubble.appendChild(img);
    }

    /* VIDEO */

    if (
      media &&
      media.type &&
      media.type.startsWith("video/")
    ) {
      const video =
        document.createElement("video");

      video.src = media.data;

      video.controls = true;

      video.style.maxWidth =
        "100%";

      video.style.maxHeight =
        "320px";

      video.style.borderRadius =
        "12px";

      bubble.appendChild(video);
    }

    /* FILE */

    if (
      media &&
      media.type &&
      !media.type.startsWith("image/") &&
      !media.type.startsWith("video/")
    ) {
      const fileBox =
        document.createElement("div");

      fileBox.textContent =
        `📎 ${media.name || "Attached file"}`;

      bubble.appendChild(fileBox);
    }

    /* TEXT */

    if (text) {
      const textBox =
        document.createElement("div");

      textBox.innerHTML =
        formatText(text);

      if (
        media &&
        media.data
      ) {
        textBox.style.marginTop =
          "8px";
      }

      bubble.appendChild(
        textBox
      );
    }

    content.appendChild(bubble);

    /* =====================================================
       AI ACTIONS
    ===================================================== */

    if (role === "assistant") {
      const actions =
        document.createElement("div");

      actions.className =
        "message-actions";

      const copyBtn =
        document.createElement("button");

      copyBtn.type = "button";
      copyBtn.textContent = "Copy";

      copyBtn.addEventListener(
        "click",
        () => copyText(text)
      );

      const saveBtn =
        document.createElement("button");

      saveBtn.type = "button";
      saveBtn.textContent = "Save";

      saveBtn.addEventListener(
        "click",
        () => saveMessage(text)
      );

      const likeBtn =
        document.createElement("button");

      likeBtn.type = "button";
      likeBtn.textContent = "Like";

      likeBtn.addEventListener(
        "click",
        () => {
          const chat =
            getCurrentChat();

          if (!chat) return;

          const msg =
            chat.messages.find(
              (m) =>
                m.role ===
                  "assistant" &&
                m.text === text
            );

          if (msg) {
            msg.liked =
              !msg.liked;

            saveChats();
          }
        }
      );

      const speakerBtn =
        document.createElement("button");

      speakerBtn.type = "button";
      speakerBtn.textContent =
        "🔊";

      speakerBtn.addEventListener(
        "click",
        () => speakText(text)
      );

      actions.appendChild(copyBtn);
      actions.appendChild(saveBtn);
      actions.appendChild(likeBtn);
      actions.appendChild(speakerBtn);

      content.appendChild(actions);
    }

    wrapper.appendChild(content);

    conversation.appendChild(wrapper);
  }

  /* =======================================================
     RENDER CONVERSATION
  ======================================================= */

  function renderConversation() {
    if (!conversation) return;

    conversation.innerHTML = "";

    const chat =
      getCurrentChat();

    if (!chat) return;

    if (!Array.isArray(chat.messages)) {
      chat.messages = [];
    }

    chat.messages.forEach(
      (msg) => {
        addMessageToUI(
          msg.role,
          msg.text || "",
          msg.media || null
        );
      }
    );

    scrollBottom();
  }

  /* =======================================================
     SCROLL
  ======================================================= */

  function scrollBottom() {
    if (!conversation) return;

    requestAnimationFrame(() => {
      conversation.scrollTop =
        conversation.scrollHeight;
    });
  }

  /* =======================================================
     HISTORY
  ======================================================= */

  function renderHistory() {
    if (!chatHistory) return;

    chatHistory.innerHTML = "";

    let list =
      chats.slice();

    const search =
      searchChat?.value
        ?.trim()
        .toLowerCase() || "";

    if (search) {
      list =
        list.filter(
          (chat) =>
            (
              chat.title ||
              "New Chat"
            )
              .toLowerCase()
              .includes(search)
        );
    }

    list.sort(
      (a, b) => {
        if (
          a.pinned &&
          !b.pinned
        ) {
          return -1;
        }

        if (
          !a.pinned &&
          b.pinned
        ) {
          return 1;
        }

        return (
          (b.updatedAt ||
            b.createdAt ||
            0) -
          (a.updatedAt ||
            a.createdAt ||
            0)
        );
      }
    );

    if (!list.length) {
      const empty =
        document.createElement("div");

      empty.textContent =
        "No chats";

      empty.style.padding =
        "15px";

      chatHistory.appendChild(
        empty
      );

      return;
    }

    list.forEach(
      (chat) => {
        const item =
          document.createElement("div");

        item.className =
          "history-item";

        if (
          chat.id ===
          currentChatId
        ) {
          item.classList.add(
            "active"
          );
        }

        if (selectMode) {
          item.classList.add(
            "selectable"
          );
        }

        /* CHECKBOX */

        if (selectMode) {
          const checkbox =
            document.createElement(
              "input"
            );

          checkbox.type =
            "checkbox";

          checkbox.checked =
            selectedChats.has(
              chat.id
            );

          checkbox.className =
            "select-checkbox";

          checkbox.addEventListener(
            "click",
            (event) =>
              event.stopPropagation()
          );

          checkbox.addEventListener(
            "change",
            () =>
              toggleSelectedChat(
                chat.id
              )
          );

          item.appendChild(
            checkbox
          );
        }

        /* TITLE */

        const title =
          document.createElement(
            "div"
          );

        title.className =
          "history-chat-title";

        title.textContent =
          chat.pinned
            ? `📌 ${chat.title || "New Chat"}`
            : chat.title ||
              "New Chat";

        /* ACTIONS */

        const actions =
          document.createElement(
            "div"
          );

        actions.className =
          "history-actions";

        /* PIN */

        const pin =
          document.createElement(
            "button"
          );

        pin.type = "button";

        pin.textContent =
          chat.pinned
            ? "📌"
            : "📍";

        pin.title =
          chat.pinned
            ? "Unpin"
            : "Pin";

        pin.addEventListener(
          "click",
          (event) => {
            event.stopPropagation();

            chat.pinned =
              !chat.pinned;

            chat.updatedAt =
              Date.now();

            saveChats();
            renderHistory();
          }
        );

        /* DELETE */

        const del =
          document.createElement(
            "button"
          );

        del.type = "button";

        del.textContent =
          "🗑️";

        del.title =
          "Delete";

        del.addEventListener(
          "click",
          (event) => {
            event.stopPropagation();

            deleteChat(
              chat.id
            );
          }
        );

        actions.appendChild(pin);
        actions.appendChild(del);

        item.appendChild(title);
        item.appendChild(actions);

        /* OPEN */

        item.addEventListener(
          "click",
          () => {
            if (selectMode) {
              toggleSelectedChat(
                chat.id
              );

              return;
            }

            currentChatId =
              chat.id;

            saveChats();

            renderHistory();
            renderConversation();

            closeSidebarMobile();
          }
        );

        chatHistory.appendChild(
          item
        );
      }
    );
  }

  /* =======================================================
     DELETE CHAT
  ======================================================= */

  function deleteChat(id) {
    chats =
      chats.filter(
        (chat) =>
          chat.id !== id
      );

    selectedChats.delete(id);

    if (
      currentChatId === id
    ) {
      currentChatId =
        chats.length
          ? chats[0].id
          : null;
    }

    if (!chats.length) {
      const chat =
        createChat();

      chats.push(chat);

      currentChatId =
        chat.id;
    }

    saveChats();

    renderHistory();
    renderConversation();
  }

  /* =======================================================
     SELECT CHAT
  ======================================================= */

  function toggleSelectedChat(id) {
    if (
      selectedChats.has(id)
    ) {
      selectedChats.delete(id);
    } else {
      selectedChats.add(id);
    }

    renderHistory();
  }

  if (selectChatsBtn) {
    selectChatsBtn.addEventListener(
      "click",
      () => {
        selectMode =
          !selectMode;

        selectedChats.clear();

        renderHistory();
      }
    );
  }

  /* =======================================================
     DELETE SELECTED
  ======================================================= */

  if (deleteSelectedBtn) {
    deleteSelectedBtn.addEventListener(
      "click",
      () => {
        if (!selectedChats.size) {
          alert(
            "Please select a chat."
          );

          return;
        }

        chats =
          chats.filter(
            (chat) =>
              !selectedChats.has(
                chat.id
              )
          );

        selectedChats.clear();

        if (!chats.length) {
          const chat =
            createChat();

          chats.push(chat);

          currentChatId =
            chat.id;
        } else if (
          !chats.some(
            (chat) =>
              chat.id ===
              currentChatId
          )
        ) {
          currentChatId =
            chats[0].id;
        }

        saveChats();

        renderHistory();
        renderConversation();
      }
    );
  }

  /* =======================================================
     CLEAR CHAT
  ======================================================= */

  if (clearChatBtn) {
    clearChatBtn.addEventListener(
      "click",
      () => {
        const chat =
          getCurrentChat();

        if (!chat) return;

        chat.messages = [];
        chat.title =
          "New Chat";

        chat.updatedAt =
          Date.now();

        saveChats();

        renderHistory();
        renderConversation();

        closeMoreMenu();
      }
    );
  }

  /* =======================================================
     SEARCH
  ======================================================= */

  if (searchChat) {
    searchChat.addEventListener(
      "input",
      renderHistory
    );
  }

  /* =======================================================
     COPY
  ======================================================= */

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(
        text || ""
      );

      console.log(
        "Text copied"
      );
    } catch (error) {
      const textarea =
        document.createElement(
          "textarea"
        );

      textarea.value =
        text || "";

      document.body.appendChild(
        textarea
      );

      textarea.select();

      document.execCommand(
        "copy"
      );

      textarea.remove();
    }
  }

  /* =======================================================
     SAVE MESSAGE
  ======================================================= */

  function saveMessage(text) {
    try {
      const saved =
        JSON.parse(
          localStorage.getItem(
            "viggoSavedMessages"
          ) || "[]"
        );

      saved.push({
        text:
          text || "",
        savedAt:
          Date.now()
      });

      localStorage.setItem(
        "viggoSavedMessages",
        JSON.stringify(saved)
      );

      console.log(
        "Message saved"
      );
    } catch (error) {
      console.error(
        "Save message error:",
        error
      );
    }
  }

  /* =======================================================
     API REPLY
  ======================================================= */

  function extractReply(data) {
    if (!data) return "";

    if (
      typeof data ===
      "string"
    ) {
      return data;
    }

    const fields = [
      "reply",
      "response",
      "message",
      "text",
      "answer",
      "output",
      "content"
    ];

    for (
      const field of fields
    ) {
      if (
        typeof data[field] ===
          "string" &&
        data[field].trim()
      ) {
        return data[field];
      }
    }

    /* Gemini style */

    if (
      Array.isArray(
        data.candidates
      )
    ) {
      for (
        const candidate of
          data.candidates
      ) {
        const parts =
          candidate
            ?.content
            ?.parts;

        if (
          Array.isArray(parts)
        ) {
          const text =
            parts
              .map(
                (part) =>
                  part?.text || ""
              )
              .join("");

          if (text.trim()) {
            return text;
          }
        }
      }
    }

    return "";
  }

  /* =======================================================
     SEND MESSAGE
  ======================================================= */

  async function sendMessage() {
    if (!messageInput) return;

    const text =
      messageInput.value.trim();

    if (
      !text &&
      !attachedFile
    ) {
      return;
    }

    const chat =
      ensureChat();

    let filePayload = null;

    /* =====================================================
       FILE
    ===================================================== */

    if (attachedFile) {
      try {
        const data =
          await fileToDataURL(
            attachedFile
          );

        filePayload = {
          name:
            attachedFile.name,
          type:
            attachedFile.type ||
            "application/octet-stream",
          data
        };
      } catch (error) {
        console.error(
          "File read error:",
          error
        );

        alert(
          "Could not read the selected file."
        );

        return;
      }
    }

    /* =====================================================
       USER MESSAGE
    ===================================================== */

    chat.messages.push({
      role: "user",

      text:
        text ||
        (
          filePayload
            ? `Attached: ${filePayload.name}`
            : ""
        ),

      media:
        filePayload &&
        filePayload.type.startsWith(
          "image/"
        )
          ? filePayload
          : filePayload &&
            filePayload.type.startsWith(
              "video/"
            )
          ? filePayload
          : null,

      createdAt:
        Date.now()
    });

    if (
      chat.title ===
        "New Chat" &&
      text
    ) {
      chat.title =
        text.length > 40
          ? text.substring(0, 40) +
            "..."
          : text;
    }

    chat.updatedAt =
      Date.now();

    saveChats();

    renderHistory();
    renderConversation();

    /* =====================================================
       CLEAR INPUT
    ===================================================== */

    messageInput.value = "";

    messageInput.placeholder =
      "Message Viggo AI...";

    attachedFile = null;

    /* =====================================================
       AI LOADING
    ===================================================== */

    const loadingMessage = {
      role: "assistant",
      text: "Thinking...",
      media: null,
      createdAt: Date.now(),
      loading: true
    };

    chat.messages.push(
      loadingMessage
    );

    renderConversation();

    scrollBottom();

    /* =====================================================
       HISTORY FOR API
    ===================================================== */

    const history =
      chat.messages
        .filter(
          (msg) =>
            !msg.loading
        )
        .slice(-30)
        .map(
          (msg) => ({
            role:
              msg.role ===
              "assistant"
                ? "model"
                : "user",

            content:
              msg.text || ""
          })
        );

    /* =====================================================
       PAYLOAD
    ===================================================== */

    const payload = {
      message: text,

      originalMessage:
        text,

      conversationHistory:
        history,

      language:
        selectedLanguage,

      browserTimezone:
        Intl.DateTimeFormat()
          .resolvedOptions()
          .timeZone ||
        "Asia/Kolkata",

      currentDateTime:
        new Date().toISOString()
    };

    /* =====================================================
       IMPORTANT:
       SEND FILE TO BACKEND
    ===================================================== */

    if (filePayload) {
      payload.file =
        filePayload;
    }

    console.log(
      "Sending to Viggo:",
      {
        message: text,
        hasFile:
          !!filePayload,
        fileName:
          filePayload?.name,
        fileType:
          filePayload?.type
      }
    );

    /* =====================================================
       API CALL
    ===================================================== */

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
              JSON.stringify(
                payload
              )
          }
        );

      console.log(
        "Server status:",
        response.status
      );

      const raw =
        await response.text();

      console.log(
        "Server raw response:",
        raw
      );

      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}: ${raw}`
        );
      }

      let data;

      try {
        data =
          JSON.parse(raw);
      } catch {
        data = raw;
      }

      const reply =
        extractReply(data);

      if (!reply) {
        throw new Error(
          "Server returned no AI reply."
        );
      }

      /* ===================================================
         REMOVE LOADING
      =================================================== */

      const index =
        chat.messages.indexOf(
          loadingMessage
        );

      if (index !== -1) {
        chat.messages.splice(
          index,
          1
        );
      }

      /* ===================================================
         AI MESSAGE
      =================================================== */

      chat.messages.push({
        role: "assistant",

        text: reply,

        media: null,

        createdAt:
          Date.now()
      });

      chat.updatedAt =
        Date.now();

      saveChats();

      renderHistory();
      renderConversation();

      scrollBottom();

      /* ===================================================
         AUTO SPEAKER
      =================================================== */

      if (
        localStorage.getItem(
          "viggoSpeakerEnabled"
        ) !== "false"
      ) {
        /* Do not automatically speak every reply.
           Speaker button can be used manually. */
      }
    } catch (error) {
      console.error(
        "VIGGO API ERROR:",
        error
      );

      const index =
        chat.messages.indexOf(
          loadingMessage
        );

      if (index !== -1) {
        chat.messages.splice(
          index,
          1
        );
      }

      chat.messages.push({
        role: "assistant",

        text:
          "Sorry, Viggo AI could not connect to the server. Please try again.",

        media: null,

        createdAt:
          Date.now()
      });

      saveChats();

      renderConversation();

      scrollBottom();
    }
  }

  /* =======================================================
     SEND BUTTON
  ======================================================= */

  if (sendBtn) {
    sendBtn.addEventListener(
      "click",
      sendMessage
    );
  }

  /* =======================================================
     ENTER
  ======================================================= */

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

  /* =======================================================
     MICROPHONE
  ======================================================= */

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (SpeechRecognition) {
    recognition =
      new SpeechRecognition();

    recognition.continuous =
      false;

    recognition.interimResults =
      false;

    recognition.lang =
      selectedLanguage;

    recognition.onstart = () => {
      listening = true;

      micBtn?.classList.add(
        "active"
      );
    };

    recognition.onend = () => {
      listening = false;

      micBtn?.classList.remove(
        "active"
      );
    };

    recognition.onerror =
      (error) => {
        console.error(
          "Mic error:",
          error
        );

        listening = false;

        micBtn?.classList.remove(
          "active"
        );
      };

    recognition.onresult =
      (event) => {
        const result =
          event.results?.[0]?.[0]
            ?.transcript;

        if (!result) return;

        if (messageInput) {
          messageInput.value =
            messageInput.value
              ? messageInput.value +
                " " +
                result
              : result;
        }
      };
  }

  if (micBtn) {
    micBtn.addEventListener(
      "click",
      () => {
        if (!recognition) {
          alert(
            "Voice input is not supported in this browser."
          );

          return;
        }

        recognition.lang =
          selectedLanguage;

        if (listening) {
          recognition.stop();
        } else {
          try {
            recognition.start();
          } catch (error) {
            console.error(
              error
            );
          }
        }
      }
    );
  }

  /* =======================================================
     SPEAKER
  ======================================================= */

  function speakText(text) {
    if (
      !("speechSynthesis" in
        window)
    ) {
      alert(
        "Speaker is not supported in this browser."
      );

      return;
    }

    if (!text) return;

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(
        text
      );

    utterance.lang =
      selectedLanguage;

    utterance.rate =
      0.95;

    utterance.pitch =
      1;

    const voices =
      window.speechSynthesis.getVoices();

    let voice = null;

    if (
      selectedVoice ===
      "male"
    ) {
      voice =
        voices.find(
          (v) =>
            /male|man|david|ravi|hemant/i.test(
              v.name
            )
        );
    } else {
      voice =
        voices.find(
          (v) =>
            /female|woman|zira|samantha|veena/i.test(
              v.name
            )
        );
    }

    if (!voice) {
      voice =
        voices.find(
          (v) =>
            v.lang?.toLowerCase() ===
            selectedLanguage.toLowerCase()
        );
    }

    if (voice) {
      utterance.voice =
        voice;
    }

    window.speechSynthesis.speak(
      utterance
    );
  }

  /* =======================================================
     VOICE MODAL
  ======================================================= */

  if (voiceMenuBtn) {
    voiceMenuBtn.addEventListener(
      "click",
      () => {
        closeMoreMenu();

        voiceModal?.classList.add(
          "show"
        );
      }
    );
  }

  if (closeVoice) {
    closeVoice.addEventListener(
      "click",
      () => {
        voiceModal?.classList.remove(
          "show"
        );
      }
    );
  }

  if (startVoice) {
    startVoice.addEventListener(
      "click",
      () => {
        if (voiceGender?.value) {
          selectedVoice =
            voiceGender.value;

          localStorage.setItem(
            "viggoVoice",
            selectedVoice
          );
        }

        voiceModal?.classList.remove(
          "show"
        );
      }
    );
  }

  /* =======================================================
     LANGUAGE
  ======================================================= */

  if (languageBtn) {
    languageBtn.addEventListener(
      "click",
      () => {
        closeMoreMenu();

        if (languageSelect) {
          languageSelect.value =
            selectedLanguage;
        }

        languageModal?.classList.add(
          "show"
        );
      }
    );
  }

  if (closeLanguage) {
    closeLanguage.addEventListener(
      "click",
      () => {
        languageModal?.classList.remove(
          "show"
        );
      }
    );
  }

  if (saveLanguage) {
    saveLanguage.addEventListener(
      "click",
      () => {
        if (languageSelect?.value) {
          selectedLanguage =
            languageSelect.value;

          localStorage.setItem(
            "viggoLanguage",
            selectedLanguage
          );
        }

        languageModal?.classList.remove(
          "show"
        );
      }
    );
  }

  /* =======================================================
     SHARE
  ======================================================= */

  async function shareChat() {
    const chat =
      getCurrentChat();

    if (!chat) {
      alert(
        "No chat available."
      );

      return;
    }

    try {
      const json =
        JSON.stringify(chat);

      const encoded =
        btoa(
          unescape(
            encodeURIComponent(
              json
            )
          )
        );

      const url =
        window.location.origin +
        window.location.pathname +
        "#shared=" +
        encodeURIComponent(
          encoded
        );

      if (
        navigator.share
      ) {
        try {
          await navigator.share(
            {
              title:
                "Viggo AI Chat",
              text:
                "Shared Viggo AI chat",
              url
            }
          );
        } catch {
          /* user cancelled share */
        }
      } else {
        await copyText(url);

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
      shareChat
    );
  }

  /* =======================================================
     SHARED CHAT
  ======================================================= */

  function loadSharedChat() {
    const hash =
      window.location.hash;

    if (
      !hash.startsWith(
        "#shared="
      )
    ) {
      return false;
    }

    try {
      const encoded =
        decodeURIComponent(
          hash.substring(8)
        );

      const json =
        decodeURIComponent(
          escape(
            atob(encoded)
          )
        );

      const shared =
        JSON.parse(json);

      if (
        !shared ||
        !Array.isArray(
          shared.messages
        )
      ) {
        return false;
      }

      const imported = {
        ...shared,

        id: createId(),

        title:
          shared.title ||
          "Shared Chat",

        pinned: false,

        createdAt:
          Date.now(),

        updatedAt:
          Date.now()
      };

      chats.unshift(
        imported
      );

      currentChatId =
        imported.id;

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

  /* =======================================================
     INITIALIZE
  ======================================================= */

  function init() {
    loadChats();

    const shared =
      loadSharedChat();

    if (!shared) {
      ensureChat();
    }

    renderHistory();
    renderConversation();

    if (languageSelect) {
      languageSelect.value =
        selectedLanguage;
    }

    if (voiceGender) {
      voiceGender.value =
        selectedVoice;
    }

    console.log(
      "================================="
    );

    console.log(
      "VIGGO AI SCRIPT READY"
    );

    console.log(
      "API:",
      API_URL
    );

    console.log(
      "================================="
    );
  }

  init();

})();
```
