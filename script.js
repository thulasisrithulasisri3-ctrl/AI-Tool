"use strict";

/* =========================================================
   VIGGO AI - FULL SCRIPT
========================================================= */

/* =========================================================
   API
========================================================= */

const API_BASE = "https://ai-tool-1-fgmc.onrender.com";
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

let selectedChats = new Set();
let selectionMode = false;

let selectedVoice = "female";

/* =========================================================
   DOM HELPER
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

    loadSharedChat();

    updateVoiceButton();

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

        if (data.voice) {
            selectedVoice = data.voice;
        }

    } catch (error) {

        console.error("Settings error:", error);

    }

}

function saveSettings() {

    localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
            language: currentLanguage,
            voice: selectedVoice
        })
    );

}

/* =========================================================
   STORAGE
========================================================= */

function getChats() {

    try {

        const data = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]"
        );

        return Array.isArray(data) ? data : [];

    } catch {

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
                .slice(2, 8),

        title: "New Chat",

        messages: [],

        pinned: false,

        createdAt: Date.now(),

        updatedAt: Date.now()

    };

}

/* =========================================================
   INITIALIZE CHAT
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

    messages = chats[0].messages || [];

    renderMessages();

    updateTitle();

    renderHistory();

}

/* =========================================================
   NEW CHAT
========================================================= */

function newChat() {

    selectionMode = false;

    selectedChats.clear();

    updateSelectionUI();

    const chat = createChat();

    const chats = getChats();

    chats.unshift(chat);

    saveChats(chats);

    currentChatId = chat.id;

    messages = [];

    renderMessages();

    updateTitle();

    renderHistory();

    closeMore();

    showToast("New chat created");

}

/* =========================================================
   OPEN CHAT
========================================================= */

function openChat(id) {

    const chats = getChats();

    const chat = chats.find(
        item => item.id === id
    );

    if (!chat) return;

    currentChatId = chat.id;

    messages = chat.messages || [];

    renderMessages();

    updateTitle();

    renderHistory();

}

/* =========================================================
   UPDATE CURRENT CHAT
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

        chat.title =
            firstUser.content
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 40);

    }

    saveChats(chats);

    updateTitle();

    renderHistory();

}

/* =========================================================
   UPDATE TITLE
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

        if (
            chat.id === currentChatId
        ) {

            row.classList.add("active");

        }

        if (
            selectedChats.has(chat.id)
        ) {

            row.classList.add(
                "selected"
            );

        }

        /* Selection checkbox */

        if (selectionMode) {

            const checkbox =
                document.createElement("input");

            checkbox.type = "checkbox";

            checkbox.className =
                "chat-select-checkbox";

            checkbox.checked =
                selectedChats.has(chat.id);

            checkbox.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    toggleChatSelection(
                        chat.id
                    );

                }
            );

            row.appendChild(
                checkbox
            );

        }

        /* Title */

        const titleEl =
            document.createElement("div");

        titleEl.className =
            "history-title";

        titleEl.textContent =
            chat.title || "New Chat";

        /* Actions */

        const actions =
            document.createElement("div");

        actions.className =
            "history-actions";

        /* Pin */

        const pin =
            document.createElement("button");

        pin.type = "button";

        pin.className =
            "history-action";

        pin.title =
            chat.pinned
                ? "Unpin"
                : "Pin";

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

        /* Delete */

        const del =
            document.createElement("button");

        del.type = "button";

        del.className =
            "history-action delete";

        del.title =
            "Delete chat";

        del.textContent =
            "🗑";

        del.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                deleteChat(chat.id);

            }
        );

        actions.appendChild(pin);

        actions.appendChild(del);

        row.appendChild(titleEl);

        row.appendChild(actions);

        row.addEventListener(
            "click",
            () => {

                if (selectionMode) {

                    toggleChatSelection(
                        chat.id
                    );

                } else {

                    openChat(
                        chat.id
                    );

                }

            }
        );

        list.appendChild(row);

    });

}

/* =========================================================
   SELECT CHAT
========================================================= */

function toggleChatSelection(id) {

    if (selectedChats.has(id)) {

        selectedChats.delete(id);

    } else {

        selectedChats.add(id);

    }

    renderHistory();

    updateSelectionUI();

}

/* =========================================================
   SELECT ALL
========================================================= */

function selectAllChats() {

    const chats = getChats();

    if (
        selectedChats.size === chats.length
    ) {

        selectedChats.clear();

    } else {

        chats.forEach(
            chat => {
                selectedChats.add(
                    chat.id
                );
            }
        );

    }

    renderHistory();

    updateSelectionUI();

}

/* =========================================================
   SELECTION MODE
========================================================= */

function toggleSelectionMode() {

    selectionMode =
        !selectionMode;

    if (!selectionMode) {

        selectedChats.clear();

    }

    updateSelectionUI();

    renderHistory();

}

/* =========================================================
   SELECTION UI
========================================================= */

function updateSelectionUI() {

    const selectBtn =
        $("selectChatsBtn");

    const deleteBtn =
        $("deleteSelectedBtn");

    if (selectBtn) {

        selectBtn.textContent =
            selectionMode
                ? "☑ Done Selecting"
                : "☑ Select Chats";

    }

    if (deleteBtn) {

        deleteBtn.style.display =
            selectionMode &&
            selectedChats.size > 0
                ? "block"
                : "none";

    }

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

    const ok =
        confirm(
            `Delete ${count} selected chat${count > 1 ? "s" : ""}?`
        );

    if (!ok) return;

    let chats = getChats();

    chats =
        chats.filter(
            chat =>
                !selectedChats.has(
                    chat.id
                )
        );

    if (!chats.length) {

        chats = [
            createChat()
        ];

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

    selectionMode = false;

    updateSelectionUI();

    renderHistory();

    showToast(
        `${count} chat${count > 1 ? "s" : ""} deleted`
    );

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

    chat.pinned =
        !chat.pinned;

    chat.updatedAt =
        Date.now();

    saveChats(chats);

    renderHistory();

    showToast(
        chat.pinned
            ? "Chat pinned"
            : "Chat unpinned"
    );

}

/* =========================================================
   DELETE CHAT
========================================================= */

function deleteChat(id) {

    const ok =
        confirm(
            "Delete this chat?"
        );

    if (!ok) return;

    let chats = getChats();

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

        updateTitle();

    }

    renderHistory();

    showToast(
        "Chat deleted"
    );

}

/* =========================================================
   SAVE
========================================================= */

function saveCurrentChat() {

    updateChat();

    saveChats(
        getChats()
    );

    closeMore();

    showToast(
        "✓ Chat saved"
    );

}

/* =========================================================
   CLEAR HISTORY
========================================================= */

function clearHistory() {

    const ok =
        confirm(
            "Delete all chat history?"
        );

    if (!ok) return;

    const chat =
        createChat();

    saveChats([chat]);

    currentChatId =
        chat.id;

    messages = [];

    selectedChats.clear();

    selectionMode = false;

    renderMessages();

    updateTitle();

    renderHistory();

    updateSelectionUI();

    closeMore();

    showToast(
        "History cleared"
    );

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
        item => {

            addMessage(
                item.role,
                item.content
            );

        }
    );

    scrollBottom();

}

/* =========================================================
   ADD MESSAGE
========================================================= */

function addMessage(
    role,
    text
) {

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

        /* Copy */

        const copy =
            document.createElement("button");

        copy.type = "button";

        copy.className =
            "message-action";

        copy.title = "Copy";

        copy.textContent =
            "📋";

        copy.addEventListener(
            "click",
            () => copyText(text)
        );

        /* Voice */

        const voice =
            document.createElement("button");

        voice.type = "button";

        voice.className =
            "message-action";

        voice.title =
            "Read aloud";

        voice.textContent =
            "🔊";

        voice.addEventListener(
            "click",
            () => speakText(text)
        );

        /* Stop */

        const stop =
            document.createElement("button");

        stop.type = "button";

        stop.className =
            "message-action";

        stop.title =
            "Stop voice";

        stop.textContent =
            "⏹";

        stop.addEventListener(
            "click",
            stopSpeaking
        );

        actions.appendChild(copy);

        actions.appendChild(voice);

        actions.appendChild(stop);

        wrapper.appendChild(
            actions
        );

    }

    area.appendChild(
        wrapper
    );

}

/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage() {

    if (isSending) return;

    const input =
        $("messageInput");

    if (!input) return;

    const text =
        input.value.trim();

    if (!text) return;

    isSending = true;

    const sendBtn =
        $("sendBtn");

    if (sendBtn) {

        sendBtn.disabled = true;

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

        console.error(error);

        messages.push({

            role: "assistant",

            content:
                "⚠️ " +
                error.message,

            timestamp: Date.now()

        });

        renderMessages();

        updateChat();

    }

    isSending = false;

    if (sendBtn) {

        sendBtn.disabled = false;

    }

}

/* =========================================================
   GEMINI API
========================================================= */

async function askViggo(text) {

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
                                    .slice(-15)
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

    } catch {

        throw new Error(
            "Render server-க்கு connect ஆகவில்லை."
        );

    }

    const raw =
        await response.text();

    let data;

    try {

        data =
            JSON.parse(raw);

    } catch {

        throw new Error(
            "Server invalid response கொடுத்தது."
        );

    }

    if (!response.ok) {

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

    return data.reply;

}

/* =========================================================
   TYPING
========================================================= */

function showTyping() {

    const area =
        $("messages");

    if (!area) return;

    const div =
        document.createElement("div");

    div.id =
        "viggoTyping";

    div.className =
        "message assistant-message";

    div.innerHTML = `

        <div class="message-bubble">
            ● ● ●
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

/* =========================================================
   VOICE OUTPUT
========================================================= */

function getVoiceList() {

    if (!window.speechSynthesis) {

        return [];

    }

    return speechSynthesis.getVoices();

}

function findVoice() {

    const voices =
        getVoiceList();

    const languageMap = {

        en: ["en-IN", "en-US", "en-GB"],

        ta: ["ta-IN"],

        hi: ["hi-IN"],

        ml: ["ml-IN"],

        te: ["te-IN"],

        kn: ["kn-IN"]

    };

    const preferred =
        languageMap[
            currentLanguage
        ] || ["en-IN"];

    let candidates =
        voices.filter(
            voice =>
                preferred.some(
                    lang =>
                        voice.lang
                            .toLowerCase()
                            .startsWith(
                                lang
                                    .toLowerCase()
                                    .split("-")[0]
                            )
                )
        );

    if (!candidates.length) {

        candidates = voices;

    }

    if (!candidates.length) {

        return null;

    }

    if (
        selectedVoice === "male"
    ) {

        const male =
            candidates.find(
                voice =>
                    /male|man|david|mark|daniel|ravi|alex/i
                        .test(
                            voice.name
                        )
            );

        return male || candidates[0];

    }

    const female =
        candidates.find(
            voice =>
                /female|woman|zira|samantha|karen|heera|veena/i
                    .test(
                        voice.name
                    )
        );

    return female || candidates[0];

}

function speakText(text) {

    if (!window.speechSynthesis) {

        showToast(
            "Voice not supported"
        );

        return;

    }

    speechSynthesis.cancel();

    const speech =
        new SpeechSynthesisUtterance(
            text
        );

    const languageMap = {

        en: "en-IN",

        ta: "ta-IN",

        hi: "hi-IN",

        ml: "ml-IN",

        te: "te-IN",

        kn: "kn-IN"

    };

    speech.lang =
        languageMap[
            currentLanguage
        ] || "en-IN";

    const voice =
        findVoice();

    if (voice) {

        speech.voice = voice;

    }

    speech.rate = 1;

    speech.pitch =
        selectedVoice === "female"
            ? 1.05
            : 0.85;

    speech.volume = 1;

    speechSynthesis.speak(
        speech
    );

    showToast(
        selectedVoice === "female"
            ? "Female voice"
            : "Male voice"
    );

}

function stopSpeaking() {

    if (
        window.speechSynthesis
    ) {

        speechSynthesis.cancel();

        showToast(
            "Voice stopped"
        );

    }

}

/* =========================================================
   VOICE SETTINGS MENU
========================================================= */

function setVoice(type) {

    if (
        type !== "male" &&
        type !== "female"
    ) {

        return;

    }

    selectedVoice = type;

    saveSettings();

    showToast(
        type === "male"
            ? "Male voice selected"
            : "Female voice selected"
    );

}

/* =========================================================
   VOICE INPUT
========================================================= */

function setupVoice() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

        return;

    }

    recognition =
        new SpeechRecognition();

    recognition.continuous = false;

    recognition.interimResults = false;

    recognition.maxAlternatives = 1;

    recognition.onstart = () => {

        isListening = true;

        const btn =
            $("voiceBtn");

        if (btn) {

            btn.classList.add(
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

                input.value = text;

                input.focus();

            }

        };

    recognition.onerror =
        event => {

            console.error(
                "Voice input:",
                event.error
            );

            showToast(
                "Voice error: " +
                event.error
            );

        };

    recognition.onend = () => {

        isListening = false;

        const btn =
            $("voiceBtn");

        if (btn) {

            btn.classList.remove(
                "active"
            );

        }

    };

}

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
        languageMap[
            currentLanguage
        ] || "en-IN";

    try {

        recognition.start();

    } catch (error) {

        console.error(error);

    }

}

/* =========================================================
   UPDATE VOICE BUTTON
========================================================= */

function updateVoiceButton() {

    const btn =
        $("voiceBtn");

    if (!btn) return;

    btn.title =
        isListening
            ? "Stop listening"
            : "Voice input";

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
        !validLanguages.includes(
            language
        )
    ) {

        return;

    }

    currentLanguage =
        language;

    saveSettings();

    const languageNames = {

        en: "English",

        ta: "தமிழ்",

        hi: "हिन्दी",

        ml: "മലയാളം",

        te: "తెలుగు",

        kn: "ಕನ್ನಡ"

    };

    showToast(
        "Language: " +
        languageNames[language]
    );

    closeMore();

}

/* =========================================================
   SHARE CHAT
========================================================= */

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

    /*
       NOTE:
       Browser-only share links containing the entire
       conversation will still be long.
       This version creates the shortest possible
       encoded client-side link without changing
       your backend.
    */

    const shareData = {

        t: chat.title || "Viggo Chat",

        m: chat.messages || []

    };

    let encoded;

    try {

        encoded =
            btoa(
                encodeURIComponent(
                    JSON.stringify(
                        shareData
                    )
                )
            );

    } catch {

        showToast(
            "Could not create share link"
        );

        return;

    }

    const link =
        window.location.origin +
        window.location.pathname +
        "?c=" +
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
                "Short share link copied"
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

/* =========================================================
   LOAD SHARED CHAT
========================================================= */

function loadSharedChat() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const encoded =
        params.get("c") ||
        params.get("chat");

    if (!encoded) return;

    try {

        const decoded =
            decodeURIComponent(
                atob(encoded)
            );

        const data =
            JSON.parse(decoded);

        let chat;

        if (
            data &&
            Array.isArray(
                data.m
            )
        ) {

            chat = {

                title:
                    data.t ||
                    "Shared Chat",

                messages:
                    data.m

            };

        } else {

            chat = data;

        }

        if (
            !chat ||
            !Array.isArray(
                chat.messages
            )
        ) {

            throw new Error(
                "Invalid chat"
            );

        }

        messages =
            chat.messages;

        currentChatId =
            "shared_" +
            Date.now();

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

        console.error(error);

        showToast(
            "Invalid share link"
        );

    }

}

/* =========================================================
   MORE MENU
========================================================= */

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

/* =========================================================
   MOBILE SIDEBAR
========================================================= */

function toggleMobileSidebar() {

    const sidebar =
        $("sidebar");

    if (!sidebar) return;

    sidebar.classList.toggle(
        "open"
    );

}

/* =========================================================
   TOAST
========================================================= */

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

        toast.className =
            "toast";

        document.body.appendChild(
            toast
        );

    }

    toast.textContent =
        message;

    toast.style.display =
        "block";

    clearTimeout(
        toast._timer
    );

    toast._timer =
        setTimeout(
            () => {

                toast.style.display =
                    "none";

            },
            2500
        );

}

/* =========================================================
   SCROLL
========================================================= */

function scrollBottom() {

    const area =
        $("messages");

    if (!area) return;

    requestAnimationFrame(
        () => {

            area.scrollTop =
                area.scrollHeight;

        }
    );

}

/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

    /* New Chat */

    $("newChatBtn")
        ?.addEventListener(
            "click",
            newChat
        );

    /* Send */

    $("sendBtn")
        ?.addEventListener(
            "click",
            sendMessage
        );

    /* Share */

    $("shareBtn")
        ?.addEventListener(
            "click",
            shareChat
        );

    /* Voice Input */

    $("voiceBtn")
        ?.addEventListener(
            "click",
            toggleVoice
        );

    /* More */

    $("moreBtn")
        ?.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                toggleMore();

            }
        );

    /* Save */

    $("saveBtn")
        ?.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                saveCurrentChat();

            }
        );

    /* Select */

    $("selectChatsBtn")
        ?.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                toggleSelectionMode();

            }
        );

    /* Delete Selected */

    $("deleteSelectedBtn")
        ?.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                deleteSelectedChats();

            }
        );

    /* Clear */

    $("clearHistoryBtn")
        ?.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                clearHistory();

            }
        );

    /* Mobile */

    $("mobileMenuBtn")
        ?.addEventListener(
            "click",
            toggleMobileSidebar
        );

    /* Enter */

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

    /* Language */

    document
        .querySelectorAll(
            "[data-language]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        event.stopPropagation();

                        setLanguage(
                            button.dataset.language
                        );

                    }
                );

            }
        );

    /* Close More */

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

    /* Voice list refresh */

    if (
        window.speechSynthesis
    ) {

        speechSynthesis.onvoiceschanged =
            () => {

                getVoiceList();

            };

    }

}

/* =========================================================
   GLOBAL VOICE FUNCTIONS
   Useful if you add buttons later
========================================================= */

window.setVoice = setVoice;
window.stopSpeaking = stopSpeaking;
window.speakText = speakText;
window.toggleVoice = toggleVoice;
window.setLanguage = setLanguage;
window.newChat = newChat;
window.saveCurrentChat = saveCurrentChat;
window.deleteSelectedChats =
    deleteSelectedChats;
window.toggleSelectionMode =
    toggleSelectionMode;
