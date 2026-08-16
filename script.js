"use strict";

/* =========================================================
   VIGGO AI - FULL SCRIPT.JS
========================================================= */

/* =========================================================
   API
========================================================= */

const API_BASE = "https://ai-tool-2-zpul.onrender.com";
const CHAT_API = API_BASE + "/chat";

/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEY = "viggo_chats";
const SETTINGS_KEY = "viggo_settings";

/* =========================================================
   STATE
========================================================= */

let currentChatId = null;
let messages = [];
let currentLanguage = "en";

let isSending = false;

let recognition = null;
let isListening = false;

let selectMode = false;
let selectedChats = new Set();

/* =========================================================
   DOM
========================================================= */

function $(id) {
    return document.getElementById(id);
}

/* =========================================================
   START
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    loadSettings();

    initializeChat();

    setupEvents();

    setupVoice();

});

/* =========================================================
   SETTINGS
========================================================= */

function loadSettings() {

    try {

        const data = JSON.parse(
            localStorage.getItem(SETTINGS_KEY) || "{}"
        );

        if (data.language) {
            currentLanguage = data.language;
        }

    } catch (error) {

        console.error("Settings error:", error);

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

/* =========================================================
   CHAT STORAGE
========================================================= */

function getChats() {

    try {

        const data = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]"
        );

        return Array.isArray(data) ? data : [];

    } catch (error) {

        console.error("Storage error:", error);

        return [];

    }

}

function saveChats(chats) {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(chats)
    );

}

/* =========================================================
   CREATE CHAT
========================================================= */

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

/* =========================================================
   INITIALIZE
========================================================= */

function initializeChat() {

    let chats = getChats();

    if (!chats.length) {

        const chat = createChat();

        chats = [chat];

        saveChats(chats);

    }

    chats.sort(
        (a, b) =>
            (b.updatedAt || 0) -
            (a.updatedAt || 0)
    );

    currentChatId = chats[0].id;

    messages =
        Array.isArray(chats[0].messages)
            ? chats[0].messages
            : [];

    renderMessages();

    updateTitle();

    renderHistory();

}

/* =========================================================
   NEW CHAT
========================================================= */

function newChat() {

    const chat = createChat();

    const chats = getChats();

    chats.unshift(chat);

    saveChats(chats);

    currentChatId = chat.id;

    messages = [];

    selectMode = false;

    selectedChats.clear();

    renderMessages();

    updateTitle();

    renderHistory();

    updateSelectionUI();

    closeMore();

    $("messageInput")?.focus();

}

/* =========================================================
   OPEN CHAT
========================================================= */

function openChat(id) {

    if (selectMode) {

        toggleSelectedChat(id);

        return;

    }

    const chats = getChats();

    const chat = chats.find(
        item => item.id === id
    );

    if (!chat) return;

    currentChatId = chat.id;

    messages =
        Array.isArray(chat.messages)
            ? chat.messages
            : [];

    renderMessages();

    updateTitle();

    renderHistory();

    $("sidebar")?.classList.remove("open");

}

/* =========================================================
   UPDATE CHAT
========================================================= */

function updateChat() {

    const chats = getChats();

    const chat = chats.find(
        item => item.id === currentChatId
    );

    if (!chat) return;

    chat.messages = messages;

    chat.updatedAt = Date.now();

    const firstUser = messages.find(
        item => item.role === "user"
    );

    if (
        firstUser &&
        chat.title === "New Chat"
    ) {

        const title =
            String(firstUser.content || "")
                .replace(/\s+/g, " ")
                .trim();

        if (title) {

            chat.title =
                title.substring(0, 40);

        }

    }

    saveChats(chats);

    updateTitle();

    renderHistory();

}

/* =========================================================
   TITLE
========================================================= */

function updateTitle() {

    const element = $("chatTitle");

    if (!element) return;

    const chats = getChats();

    const chat = chats.find(
        item => item.id === currentChatId
    );

    element.textContent =
        chat?.title || "New Chat";

}

/* =========================================================
   HISTORY
========================================================= */

function renderHistory() {

    const list = $("historyList");

    if (!list) return;

    const chats = getChats();

    list.innerHTML = "";

    const pinned = chats.filter(
        chat => chat.pinned
    );

    const recent = chats.filter(
        chat => !chat.pinned
    );

    addHistory(
        list,
        "Pinned",
        pinned
    );

    addHistory(
        list,
        "Recent",
        recent
    );

    updateSelectionUI();

}

/* =========================================================
   ADD HISTORY
========================================================= */

function addHistory(
    list,
    sectionTitle,
    chats
) {

    if (!chats.length) return;

    const heading =
        document.createElement("div");

    heading.className =
        "history-section-title";

    heading.textContent =
        sectionTitle;

    list.appendChild(heading);

    chats.forEach(chat => {

        const row =
            document.createElement("div");

        row.className =
            "history-item";

        if (chat.id === currentChatId) {

            row.classList.add("active");

        }

        if (selectMode) {

            row.classList.add("select-mode");

        }

        /* CHECKBOX */

        if (selectMode) {

            const checkbox =
                document.createElement("input");

            checkbox.type = "checkbox";

            checkbox.className =
                "chat-checkbox";

            checkbox.checked =
                selectedChats.has(chat.id);

            checkbox.addEventListener(
                "click",
                event => {
                    event.stopPropagation();
                }
            );

            checkbox.addEventListener(
                "change",
                () => {
                    toggleSelectedChat(chat.id);
                }
            );

            row.appendChild(checkbox);

        }

        /* TITLE */

        const title =
            document.createElement("div");

        title.className =
            "history-title";

        title.textContent =
            chat.title || "New Chat";

        row.appendChild(title);

        /* ACTIONS */

        if (!selectMode) {

            const actions =
                document.createElement("div");

            actions.className =
                "history-actions";

            /* PIN */

            const pin =
                document.createElement("button");

            pin.type = "button";

            pin.className =
                "history-action";

            pin.title =
                chat.pinned
                    ? "Unpin chat"
                    : "Pin chat";

            pin.textContent =
                chat.pinned
                    ? "📌"
                    : "📍";

            pin.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    togglePin(chat.id);

                }
            );

            /* DELETE */

            const del =
                document.createElement("button");

            del.type = "button";

            del.className =
                "history-action delete";

            del.title = "Delete chat";

            del.textContent = "🗑";

            del.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    deleteChat(chat.id);

                }
            );

            actions.appendChild(pin);

            actions.appendChild(del);

            row.appendChild(actions);

        }

        row.addEventListener(
            "click",
            () => {

                if (selectMode) {

                    toggleSelectedChat(chat.id);

                } else {

                    openChat(chat.id);

                }

            }
        );

        list.appendChild(row);

    });

}

/* =========================================================
   PIN
========================================================= */

function togglePin(id) {

    const chats = getChats();

    const chat = chats.find(
        item => item.id === id
    );

    if (!chat) return;

    chat.pinned = !chat.pinned;

    chat.updatedAt = Date.now();

    saveChats(chats);

    renderHistory();

    showToast(
        chat.pinned
            ? "📌 Chat pinned"
            : "Chat unpinned"
    );

}

/* =========================================================
   DELETE CHAT
========================================================= */

function deleteChat(id) {

    const chats = getChats();

    const chat = chats.find(
        item => item.id === id
    );

    if (!chat) return;

    const confirmed = confirm(
        `Delete "${chat.title || "New Chat"}"?`
    );

    if (!confirmed) return;

    let updated = chats.filter(
        item => item.id !== id
    );

    if (!updated.length) {

        updated = [createChat()];

    }

    saveChats(updated);

    if (currentChatId === id) {

        currentChatId =
            updated[0].id;

        messages =
            updated[0].messages || [];

        renderMessages();

        updateTitle();

    }

    selectedChats.delete(id);

    renderHistory();

    showToast("🗑 Chat deleted");

}

/* =========================================================
   SELECT MODE
========================================================= */

function toggleSelectMode() {

    selectMode = !selectMode;

    selectedChats.clear();

    renderHistory();

    updateSelectionUI();

    showToast(
        selectMode
            ? "Select chats to delete"
            : "Selection cancelled"
    );

}

/* =========================================================
   SELECT CHAT
========================================================= */

function toggleSelectedChat(id) {

    if (selectedChats.has(id)) {

        selectedChats.delete(id);

    } else {

        selectedChats.add(id);

    }

    renderHistory();

    updateSelectionUI();

}

/* =========================================================
   DELETE SELECTED
========================================================= */

function deleteSelectedChats() {

    if (!selectedChats.size) {

        showToast(
            "Select at least one chat"
        );

        return;

    }

    const count =
        selectedChats.size;

    const confirmed = confirm(
        `Delete ${count} selected chat${count > 1 ? "s" : ""}?`
    );

    if (!confirmed) return;

    let chats = getChats();

    chats = chats.filter(
        chat =>
            !selectedChats.has(chat.id)
    );

    if (!chats.length) {

        chats = [createChat()];

    }

    saveChats(chats);

    if (
        !chats.some(
            chat =>
                chat.id === currentChatId
        )
    ) {

        currentChatId =
            chats[0].id;

        messages =
            chats[0].messages || [];

        renderMessages();

        updateTitle();

    }

    selectedChats.clear();

    selectMode = false;

    renderHistory();

    updateSelectionUI();

    showToast(
        `🗑 ${count} chat${count > 1 ? "s" : ""} deleted`
    );

}

/* =========================================================
   SELECTION UI
========================================================= */

function updateSelectionUI() {

    const deleteButton =
        $("deleteSelectedBtn");

    if (deleteButton) {

        if (selectMode) {

            deleteButton.style.display =
                "flex";

            deleteButton.textContent =
                selectedChats.size
                    ? `🗑 Delete Selected (${selectedChats.size})`
                    : "🗑 Delete Selected";

        } else {

            deleteButton.style.display =
                "none";

        }

    }

    const selectButton =
        $("selectChatsBtn");

    if (selectButton) {

        selectButton.textContent =
            selectMode
                ? "✕ Cancel Selection"
                : "☑ Select Chats";

    }

}

/* =========================================================
   SAVE
========================================================= */

function saveCurrentChat() {

    updateChat();

    showToast("✓ Chat saved");

    closeMore();

}

/* =========================================================
   CLEAR HISTORY
========================================================= */

function clearHistory() {

    const confirmed = confirm(
        "Delete all chat history?"
    );

    if (!confirmed) return;

    const chat = createChat();

    saveChats([chat]);

    currentChatId = chat.id;

    messages = [];

    selectedChats.clear();

    selectMode = false;

    renderMessages();

    updateTitle();

    renderHistory();

    updateSelectionUI();

    closeMore();

    showToast("🗑 History cleared");

}

/* =========================================================
   RENDER MESSAGES
========================================================= */

function renderMessages() {

    const area = $("messages");

    if (!area) return;

    area.innerHTML = "";

    if (!messages.length) {

        area.innerHTML = `
            <div class="welcome">
                <div class="big-logo">V</div>
                <h1>Viggo</h1>
                <p>Your AI friend is ready.</p>
            </div>
        `;

        return;

    }

    messages.forEach(item => {

        addMessage(
            item.role,
            item.content
        );

    });

    scrollBottom();

}

/* =========================================================
   ADD MESSAGE
========================================================= */

function addMessage(role, text) {

    const area = $("messages");

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

    wrapper.appendChild(bubble);

    /* ASSISTANT ACTIONS */

    if (role === "assistant") {

        const actions =
            document.createElement("div");

        actions.className =
            "message-actions";

        /* COPY */

        const copy =
            document.createElement("button");

        copy.type = "button";

        copy.className =
            "message-action";

        copy.title = "Copy";

        copy.textContent = "📋";

        copy.addEventListener(
            "click",
            () => {

                copyText(text);

            }
        );

        /* VOICE */

        const voice =
            document.createElement("button");

        voice.type = "button";

        voice.className =
            "message-action";

        voice.title = "Read aloud";

        voice.textContent = "🔊";

        voice.addEventListener(
            "click",
            () => {

                speakText(text);

            }
        );

        actions.appendChild(copy);

        actions.appendChild(voice);

        wrapper.appendChild(actions);

    }

    area.appendChild(wrapper);

}

/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage() {

    if (isSending) return;

    const input = $("messageInput");

    const sendButton = $("sendBtn");

    if (!input) return;

    const text =
        input.value.trim();

    if (!text) return;

    isSending = true;

    if (sendButton) {

        sendButton.disabled = true;

    }

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
            await askViggo(text);

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
            "Viggo error:",
            error
        );

        messages.push({

            role: "assistant",

            content:
                "⚠️ " +
                (
                    error.message ||
                    "Viggo AI error"
                ),

            timestamp: Date.now()

        });

        renderMessages();

        updateChat();

    } finally {

        isSending = false;

        if (sendButton) {

            sendButton.disabled = false;

        }

        input.focus();

    }

}

/* =========================================================
   API
========================================================= */

async function askViggo(text) {

    let response;

    try {

        response = await fetch(
            CHAT_API,
            {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    "Accept":
                        "application/json"
                },

                body: JSON.stringify({

                    message: text,

                    language:
                        currentLanguage,

                    history:
                        messages
                            .slice(-15)
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

        throw new Error(
            "Render server-க்கு connect ஆகவில்லை."
        );

    }

    const raw =
        await response.text();

    let data;

    try {

        data = JSON.parse(raw);

    } catch {

        throw new Error(
            "Server invalid response கொடுத்தது."
        );

    }

    if (!response.ok) {

        if (response.status === 429) {

            throw new Error(
                "Viggo AI is temporarily busy. சில seconds கழித்து மீண்டும் try பண்ணுங்க."
            );

        }

        throw new Error(
            data.details ||
            data.error ||
            "Server error"
        );

    }

    if (!data.success) {

        throw new Error(
            data.details ||
            data.error ||
            "Viggo AI error"
        );

    }

    if (!data.reply) {

        throw new Error(
            "Viggo empty response கொடுத்தது."
        );

    }

    return String(data.reply);

}

/* =========================================================
   TYPING
========================================================= */

function showTyping() {

    const area = $("messages");

    if (!area) return;

    removeTyping();

    const div =
        document.createElement("div");

    div.id = "viggoTyping";

    div.className =
        "message assistant-message";

    div.innerHTML = `
        <div class="message-bubble typing-bubble">
            <span>●</span>
            <span>●</span>
            <span>●</span>
        </div>
    `;

    area.appendChild(div);

    scrollBottom();

}

function removeTyping() {

    const element =
        $("viggoTyping");

    if (element) {

        element.remove();

    }

}

/* =========================================================
   COPY
========================================================= */

async function copyText(text) {

    try {

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {

            await navigator.clipboard.writeText(
                text
            );

        } else {

            const textarea =
                document.createElement("textarea");

            textarea.value = text;

            textarea.style.position =
                "fixed";

            textarea.style.opacity = "0";

            document.body.appendChild(
                textarea
            );

            textarea.focus();

            textarea.select();

            document.execCommand("copy");

            textarea.remove();

        }

        showToast("✓ Copied");

    } catch (error) {

        console.error(
            "Copy error:",
            error
        );

        showToast(
            "Copy failed"
        );

    }

}

/* =========================================================
   SPEAK
========================================================= */

function speakText(text) {

    if (!window.speechSynthesis) {

        showToast(
            "Voice not supported"
        );

        return;

    }

    speechSynthesis.cancel();

    const languageMap = {

        en: "en-IN",
        ta: "ta-IN",
        hi: "hi-IN",
        ml: "ml-IN",
        te: "te-IN",
        kn: "kn-IN"

    };

    const speech =
        new SpeechSynthesisUtterance(text);

    speech.lang =
        languageMap[currentLanguage]
        || "en-IN";

    speech.rate = 1;

    speech.pitch = 1;

    speechSynthesis.speak(speech);

}

/* =========================================================
   VOICE INPUT
========================================================= */

function setupVoice() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

        recognition = null;

        return;

    }

    recognition =
        new SpeechRecognition();

    recognition.continuous = false;

    recognition.interimResults = false;

    recognition.maxAlternatives = 1;

    recognition.onstart = () => {

        isListening = true;

        $("voiceBtn")
            ?.classList
            .add("active");

        showToast("🎤 Listening...");

    };

    recognition.onresult = event => {

        const result =
            event.results?.[0]?.[0];

        if (!result) return;

        const input =
            $("messageInput");

        if (input) {

            input.value =
                result.transcript;

            input.focus();

        }

    };

    recognition.onerror = event => {

        console.error(
            "Voice error:",
            event.error
        );

        if (
            event.error === "not-allowed"
        ) {

            showToast(
                "Microphone permission denied"
            );

        } else {

            showToast(
                "Voice error: " +
                event.error
            );

        }

    };

    recognition.onend = () => {

        isListening = false;

        $("voiceBtn")
            ?.classList
            .remove("active");

    };

}

/* =========================================================
   TOGGLE VOICE
========================================================= */

function toggleVoice() {

    if (!recognition) {

        showToast(
            "Voice input is not supported in this browser."
        );

        return;

    }

    if (isListening) {

        recognition.stop();

        return;

    }

    const languageMap = {

        en: "en-IN",
        ta: "ta-IN",
        hi: "hi-IN",
        ml: "ml-IN",
        te: "te-IN",
        kn: "kn-IN"

    };

    recognition.lang =
        languageMap[currentLanguage]
        || "en-IN";

    try {

        recognition.start();

    } catch (error) {

        console.error(error);

    }

}

/* =========================================================
   SHARE CHAT
========================================================= */

async function shareChat() {

    const chats = getChats();

    const chat = chats.find(
        item =>
            item.id === currentChatId
    );

    if (!chat) {

        showToast(
            "No chat to share"
        );

        return;

    }

    const json =
        JSON.stringify({

            title:
                chat.title || "Viggo AI Chat",

            messages:
                chat.messages || []

        });

    let encoded;

    try {

        encoded =
            btoa(
                unescape(
                    encodeURIComponent(json)
                )
            )
                .replace(/\+/g, "-")
                .replace(/\//g, "_")
                .replace(/=+$/, "");

    } catch (error) {

        console.error(
            "Share encode error:",
            error
        );

        showToast(
            "Could not create share link"
        );

        return;

    }

    /*
      Shorter than the full JSON,
      but the URL can still become long
      if the conversation is very large.
    */

    const link =
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
                    chat.title ||
                    "Viggo AI Chat",

                text:
                    "Viggo AI Chat",

                url:
                    link

            });

        } else {

            await copyText(link);

            showToast(
                "🔗 Share link copied"
            );

        }

    } catch (error) {

        if (
            error?.name !==
            "AbortError"
        ) {

            console.error(
                "Share error:",
                error
            );

        }

    }

}

/* =========================================================
   LOAD SHARED CHAT
========================================================= */

function loadSharedChat() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const encoded =
        params.get("chat");

    if (!encoded) return;

    try {

        let fixed =
            encoded
                .replace(/-/g, "+")
                .replace(/_/g, "/");

        while (
            fixed.length % 4
        ) {

            fixed += "=";

        }

        const json =
            decodeURIComponent(
                escape(
                    atob(fixed)
                )
            );

        const chat =
            JSON.parse(json);

        if (
            !chat ||
            !Array.isArray(chat.messages)
        ) {

            throw new Error(
                "Invalid shared chat"
            );

        }

        messages =
            chat.messages;

        currentChatId =
            "shared_" + Date.now();

        renderMessages();

        const title =
            $("chatTitle");

        if (title) {

            title.textContent =
                chat.title ||
                "Shared Chat";

        }

        showToast(
            "🔗 Shared chat opened"
        );

    } catch (error) {

        console.error(
            "Share load error:",
            error
        );

        showToast(
            "Invalid share link"
        );

    }

}

/* =========================================================
   MORE MENU
========================================================= */

function toggleMore() {

    const menu = $("moreMenu");

    if (!menu) return;

    menu.classList.toggle("show");

}

function closeMore() {

    $("moreMenu")
        ?.classList
        .remove("show");

}

/* =========================================================
   LANGUAGE
========================================================= */

function setLanguage(language) {

    const validLanguages = [
        "en",
        "ta",
        "hi",
        "ml",
        "te",
        "kn"
    ];

    if (
        !validLanguages.includes(language)
    ) {

        return;

    }

    currentLanguage = language;

    saveSettings();

    const names = {

        en: "English",
        ta: "தமிழ்",
        hi: "हिन्दी",
        ml: "മലയാളം",
        te: "తెలుగు",
        kn: "ಕನ್ನಡ"

    };

    showToast(
        "🌐 Language: " +
        names[language]
    );

    closeMore();

}

/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

    let toast = $("viggoToast");

    if (!toast) {

        toast =
            document.createElement("div");

        toast.id = "viggoToast";

        toast.className = "toast";

        document.body.appendChild(toast);

    }

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(toast.timer);

    toast.timer =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 2500);

}

/* =========================================================
   SCROLL
========================================================= */

function scrollBottom() {

    const area = $("messages");

    if (!area) return;

    requestAnimationFrame(() => {

        area.scrollTop =
            area.scrollHeight;

    });

}

/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

    /* NEW CHAT */

    $("newChatBtn")
        ?.addEventListener(
            "click",
            newChat
        );

    /* SEND */

    $("sendBtn")
        ?.addEventListener(
            "click",
            sendMessage
        );

    /* SHARE */

    $("shareBtn")
        ?.addEventListener(
            "click",
            shareChat
        );

    /* VOICE */

    $("voiceBtn")
        ?.addEventListener(
            "click",
            toggleVoice
        );

    /* MORE */

    $("moreBtn")
        ?.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                toggleMore();

            }
        );

    /* SAVE */

    $("saveBtn")
        ?.addEventListener(
            "click",
            saveCurrentChat
        );

    /* SELECT */

    $("selectChatsBtn")
        ?.addEventListener(
            "click",
            toggleSelectMode
        );

    /* DELETE SELECTED */

    $("deleteSelectedBtn")
        ?.addEventListener(
            "click",
            deleteSelectedChats
        );

    /* CLEAR HISTORY */

    $("clearHistoryBtn")
        ?.addEventListener(
            "click",
            clearHistory
        );

    /* MOBILE MENU */

    $("mobileMenuBtn")
        ?.addEventListener(
            "click",
            () => {

                $("sidebar")
                    ?.classList
                    .toggle("open");

            }
        );

    /* ENTER */

    $("messageInput")
        ?.addEventListener(
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

    /* LANGUAGE */

    document
        .querySelectorAll(
            "[data-language]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    setLanguage(
                        button.dataset.language
                    );

                }
            );

        });

    /* OUTSIDE CLICK */

    document.addEventListener(
        "click",
        event => {

            if (
                !event.target.closest(
                    ".sidebar-more"
                )
            ) {

                closeMore();

            }

        }
    );

    /* LOAD SHARED CHAT */

    loadSharedChat();

}

/* =========================================================
   PREVENT FORM SUBMIT
========================================================= */

document.addEventListener(
    "submit",
    event => {

        event.preventDefault();

    }
);
