```javascript
"use strict";

/* =========================================================
   VIGGO AI - FULL SCRIPT
   Chat + History + Recent + Pin + Delete + Selection
   Share + More Menu + Language + Voice
   API Reply + Sidebar Close + Enter Send
========================================================= */


/* =========================================================
   API
========================================================= */

const API_BASE =
    "https://ai-tool-1-fgmc.onrender.com";

const CHAT_API =
    API_BASE + "/chat";


/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEY =
    "viggo_chats";

const SETTINGS_KEY =
    "viggo_settings";


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
   DOM HELPER
========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadSettings();

        initializeChat();

        setupEvents();

        setupVoice();

    }
);


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

        return Array.isArray(data)
            ? data
            : [];

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
                .slice(2, 8),

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

    closeSidebar();

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

    const chat =
        chats.find(item => item.id === id);

    if (!chat) return;

    currentChatId = chat.id;

    messages =
        Array.isArray(chat.messages)
            ? chat.messages
            : [];

    renderMessages();

    updateTitle();

    renderHistory();

    closeSidebar();

}


/* =========================================================
   UPDATE CHAT
========================================================= */

function updateChat() {

    const chats = getChats();

    const chat =
        chats.find(
            item => item.id === currentChatId
        );

    if (!chat) return;

    chat.messages = messages;

    chat.updatedAt = Date.now();

    const firstUser =
        messages.find(
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
                title.slice(0, 40);

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

    const chat =
        chats.find(
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

    const pinned =
        chats.filter(chat => chat.pinned);

    const recent =
        chats.filter(chat => !chat.pinned);

    addHistory(list, "Pinned", pinned);

    addHistory(list, "Recent", recent);

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

        const titleEl =
            document.createElement("div");

        titleEl.className =
            "history-title";

        titleEl.textContent =
            chat.title || "New Chat";

        row.appendChild(titleEl);


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


        /* CLICK */

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

    const chat =
        chats.find(item => item.id === id);

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

    const chat =
        chats.find(item => item.id === id);

    if (!chat) return;

    const confirmed =
        confirm(
            `Delete "${chat.title || "New Chat"}"?`
        );

    if (!confirmed) return;

    let updated =
        chats.filter(item => item.id !== id);

    if (!updated.length) {

        updated = [createChat()];

    }

    saveChats(updated);

    if (currentChatId === id) {

        currentChatId = updated[0].id;

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

}


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

        showToast("Select at least one chat");

        return;

    }

    const count = selectedChats.size;

    const confirmed =
        confirm(
            `Delete ${count} selected chat${count > 1 ? "s" : ""}?`
        );

    if (!confirmed) return;

    let chats = getChats();

    chats =
        chats.filter(
            chat => !selectedChats.has(chat.id)
        );

    if (!chats.length) {

        chats = [createChat()];

    }

    saveChats(chats);

    if (
        !chats.some(
            chat => chat.id === currentChatId
        )
    ) {

        currentChatId = chats[0].id;

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

    const button =
        $("deleteSelectedBtn");

    if (button) {

        if (selectMode) {

            button.style.display = "flex";

            button.textContent =
                selectedChats.size
                    ? `🗑 Delete Selected (${selectedChats.size})`
                    : "🗑 Delete Selected";

        } else {

            button.style.display = "none";

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

    const confirmed =
        confirm("Delete all chat history?");

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

    bubble.textContent = text;

    wrapper.appendChild(bubble);


    /* ASSISTANT ACTIONS */

    if (role === "assistant") {

        const actions =
            document.createElement("div");

        actions.className =
            "message-actions";


        const copy =
            document.createElement("button");

        copy.type = "button";

        copy.className =
            "message-action";

        copy.title = "Copy";

        copy.textContent = "📋";

        copy.addEventListener(
            "click",
            () => copyText(text)
        );


        const voice =
            document.createElement("button");

        voice.type = "button";

        voice.className =
            "message-action";

        voice.title = "Read aloud";

        voice.textContent = "🔊";

        voice.addEventListener(
            "click",
            () => speakText(text)
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

    const input =
        $("messageInput");

    const sendButton =
        $("sendBtn");

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

    }

    catch (error) {

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

    }

    finally {

        isSending = false;

        if (sendButton) {

            sendButton.disabled = false;

        }

        input.focus();

    }

}


/* =========================================================
   API CALL
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

    }

    catch (error) {

        throw new Error(
            "Render server-க்கு connect ஆகவில்லை."
        );

    }

    const raw =
        await response.text();

    let data;

    try {

        data = JSON.parse(raw);

    }

    catch {

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

        if (navigator.clipboard) {

            await navigator.clipboard.writeText(text);

        } else {

            throw new Error("Clipboard unavailable");

        }

    }

    catch {

        const textarea =
            document.createElement("textarea");

        textarea.value = text;

        textarea.style.position = "fixed";

        textarea.style.opacity = "0";

        document.body.appendChild(textarea);

        textarea.focus();

        textarea.select();

        document.execCommand("copy");

        textarea.remove();

    }

    showToast("✓ Copied");

}


/* =========================================================
   VOICE OUTPUT
========================================================= */

function speakText(text) {

    if (!window.speechSynthesis) {

        showToast("Voice not supported");

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
        languageMap[currentLanguage] ||
        "en-IN";

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
            ?.classList.add("active");

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

        showToast(
            "Voice error: " +
            event.error
        );

    };

    recognition.onend = () => {

        isListening = false;

        $("voiceBtn")
            ?.classList.remove("active");

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
        languageMap[currentLanguage] ||
        "en-IN";

    try {

        recognition.start();

    }

    catch (error) {

        console.error(error);

    }

}


/* =========================================================
   SHARE
========================================================= */

async function shareChat() {

    const chats = getChats();

    const chat =
        chats.find(
            item => item.id === currentChatId
        );

    if (!chat) {

        showToast("No chat to share");

        return;

    }

    const json =
        JSON.stringify({

            title: chat.title,

            messages: chat.messages

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

    }

    catch {

        showToast(
            "Could not create share link"
        );

        return;

    }

    const link =
        window.location.origin +
        window.location.pathname +
        "?chat=" +
        encoded;

    try {

        if (navigator.share) {

            await navigator.share({

                title:
                    chat.title ||
                    "Viggo AI Chat",

                text:
                    "Viggo AI Chat",

                url: link

            });

        } else {

            await copyText(link);

            showToast(
                "🔗 Share link copied"
            );

        }

    }

    catch (error) {

        if (
            error?.name !== "AbortError"
        ) {

            console.error(error);

        }

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
        ?.classList.remove("show");

}


/* =========================================================
   SIDEBAR
========================================================= */

function closeSidebar() {

    const sidebar = $("sidebar");

    if (sidebar) {

        sidebar.classList.remove("open");

    }

}


function toggleSidebar() {

    const sidebar = $("sidebar");

    if (sidebar) {

        sidebar.classList.toggle("open");

    }

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

    if (!validLanguages.includes(language)) {
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
        setTimeout(
            () => {

                toast.classList.remove("show");

            },
            2500
        );

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


    /* SEND BUTTON */

    $("sendBtn")
        ?.addEventListener(
            "click",
            sendMessage
        );


    /* VOICE */

    $("voiceBtn")
        ?.addEventListener(
            "click",
            toggleVoice
        );


    /* SHARE */

    $("shareBtn")
        ?.addEventListener(
            "click",
            shareChat
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


    /* MOBILE SIDEBAR */

    $("mobileMenuBtn")
        ?.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                toggleSidebar();

            }
        );


    /* SIDEBAR X CLOSE */

    $("closeSidebarBtn")
        ?.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                closeSidebar();

            }
        );


    /* =====================================================
       ENTER KEY FIX
       Enter = Send
       Shift + Enter = New Line
    ===================================================== */

    const messageInput =
        $("messageInput");

    if (messageInput) {

        messageInput.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.isComposing
                ) {

                    event.preventDefault();

                    if (!isSending) {

                        sendMessage();

                    }

                }

            }
        );

    }


    /* LANGUAGE */

    document
        .querySelectorAll("[data-language]")
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
```
