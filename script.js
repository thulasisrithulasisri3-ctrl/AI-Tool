"use strict";

/* =========================================
   API
========================================= */

const API_BASE = "https://ai-tool-1-fgmc.onrender.com";

const CHAT_API = API_BASE + "/chat";

const SHARE_API = API_BASE + "/api/share";


/* =========================================
   STORAGE
========================================= */

const STORAGE_KEY = "viggo_chats";

const SETTINGS_KEY = "viggo_settings";


/* =========================================
   STATE
========================================= */

let currentChatId = null;

let messages = [];

let currentLanguage = "en";

let isSending = false;

let recognition = null;

let isListening = false;

let selectMode = false;

let selectedChats = new Set();


/* =========================================
   DOM
========================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================
   START
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    loadSettings();

    initializeChat();

    setupEvents();

    setupVoice();

});


/* =========================================
   SETTINGS
========================================= */

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


/* =========================================
   CHAT STORAGE
========================================= */

function getChats() {

    try {

        const data = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]"
        );

        return Array.isArray(data) ? data : [];

    } catch (error) {

        console.error("Chat storage error:", error);

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

        title: "New Chat",

        messages: [],

        pinned: false,

        createdAt: Date.now(),

        updatedAt: Date.now()

    };

}


/* =========================================
   INITIALIZE
========================================= */

function initializeChat() {

    const chats = getChats();

    if (!chats.length) {

        const chat = createChat();

        saveChats([chat]);

        currentChatId = chat.id;

        messages = [];

    } else {

        chats.sort(
            (a, b) =>
                (b.updatedAt || 0) -
                (a.updatedAt || 0)
        );

        currentChatId = chats[0].id;

        messages = chats[0].messages || [];

    }

    renderMessages();

    updateTitle();

    renderHistory();

}


/* =========================================
   NEW CHAT
========================================= */

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

    closeMore();

}


/* =========================================
   OPEN CHAT
========================================= */

function openChat(id) {

    if (selectMode) {

        toggleChatSelection(id);

        return;

    }

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


/* =========================================
   UPDATE CHAT
========================================= */

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

        chat.title = firstUser.content
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 40);

    }

    saveChats(chats);

    updateTitle();

    renderHistory();

}


/* =========================================
   TITLE
========================================= */

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


/* =========================================
   HISTORY
========================================= */

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


/* =========================================
   ADD HISTORY
========================================= */

function addHistory(list, title, chats) {

    if (!chats.length) return;

    const heading =
        document.createElement("div");

    heading.className =
        "history-section-title";

    heading.textContent = title;

    list.appendChild(heading);


    chats.forEach(chat => {

        const row =
            document.createElement("div");

        row.className =
            "history-item";


        if (chat.id === currentChatId) {

            row.classList.add("active");

        }


        if (selectedChats.has(chat.id)) {

            row.classList.add("selected");

        }


        /* Selection */

        if (selectMode) {

            const checkbox =
                document.createElement("span");

            checkbox.className =
                "history-select";

            checkbox.textContent =
                selectedChats.has(chat.id)
                    ? "✓"
                    : "○";

            row.appendChild(checkbox);

        }


        /* Title */

        const titleEl =
            document.createElement("div");

        titleEl.className =
            "history-title";

        titleEl.textContent =
            chat.title || "New Chat";

        row.appendChild(titleEl);


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

        pin.textContent =
            chat.pinned ? "📌" : "📍";

        pin.title =
            chat.pinned
                ? "Unpin"
                : "Pin";


        pin.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                togglePin(chat.id);

            }
        );


        actions.appendChild(pin);


        row.appendChild(actions);


        /* Row click */

        row.addEventListener(
            "click",
            () => {

                if (selectMode) {

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


/* =========================================
   PIN
========================================= */

function togglePin(id) {

    const chats = getChats();

    const chat = chats.find(
        item => item.id === id
    );

    if (!chat) return;

    chat.pinned = !chat.pinned;

    saveChats(chats);

    renderHistory();

    showToast(
        chat.pinned
            ? "📌 Chat pinned"
            : "Chat unpinned"
    );

}


/* =========================================
   SELECT MODE
========================================= */

function toggleSelectMode() {

    selectMode = !selectMode;

    selectedChats.clear();

    renderHistory();

    updateDeleteSelectedButton();

    closeMore();

    showToast(
        selectMode
            ? "Select chats to delete"
            : "Selection cancelled"
    );

}


/* =========================================
   SELECT CHAT
========================================= */

function toggleChatSelection(id) {

    if (selectedChats.has(id)) {

        selectedChats.delete(id);

    } else {

        selectedChats.add(id);

    }

    renderHistory();

    updateDeleteSelectedButton();

}


/* =========================================
   DELETE SELECTED BUTTON
========================================= */

function updateDeleteSelectedButton() {

    const button =
        $("deleteSelectedBtn");

    if (!button) return;

    if (
        selectMode &&
        selectedChats.size > 0
    ) {

        button.style.display = "block";

        button.textContent =
            `🗑 Delete Selected (${selectedChats.size})`;

    } else {

        button.style.display = "none";

    }

}


/* =========================================
   DELETE SELECTED
========================================= */

function deleteSelectedChats() {

    if (!selectedChats.size) {

        showToast(
            "No chats selected"
        );

        return;

    }


    const count =
        selectedChats.size;


    const confirmed =
        confirm(
            `Delete ${count} selected chat${count > 1 ? "s" : ""}?`
        );


    if (!confirmed) return;


    let chats = getChats();


    chats = chats.filter(
        chat =>
            !selectedChats.has(chat.id)
    );


    if (!chats.length) {

        chats.push(
            createChat()
        );

    }


    saveChats(chats);


    if (
        !chats.some(
            chat =>
                chat.id === currentChatId
        )
    ) {

        chats.sort(
            (a, b) =>
                (b.updatedAt || 0) -
                (a.updatedAt || 0)
        );

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

    updateDeleteSelectedButton();

    closeMore();


    showToast(
        `🗑 ${count} chat${count > 1 ? "s" : ""} deleted`
    );

}


/* =========================================
   SAVE
========================================= */

function saveCurrentChat() {

    updateChat();

    showToast(
        "✓ Chat saved"
    );

    closeMore();

}


/* =========================================
   CLEAR HISTORY
========================================= */

function clearHistory() {

    const confirmed =
        confirm(
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

    updateDeleteSelectedButton();

    closeMore();

    showToast(
        "History cleared"
    );

}


/* =========================================
   RENDER MESSAGES
========================================= */

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


    messages.forEach(item => {

        addMessage(
            item.role,
            item.content
        );

    });


    scrollBottom();

}


/* =========================================
   ADD MESSAGE
========================================= */

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

        copy.textContent = "📋";

        copy.title = "Copy";

        copy.addEventListener(
            "click",
            () => copyText(text)
        );


        /* VOICE */

        const voice =
            document.createElement("button");

        voice.type = "button";

        voice.className =
            "message-action";

        voice.textContent = "🔊";

        voice.title = "Read aloud";

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


/* =========================================
   SEND MESSAGE
========================================= */

async function sendMessage() {

    if (isSending) return;


    const input =
        $("messageInput");

    if (!input) return;


    const text =
        input.value.trim();


    if (!text) return;


    isSending = true;


    const sendButton =
        $("sendBtn");


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
            "Viggo API error:",
            error
        );


        messages.push({

            role: "assistant",

            content:
                "Sorry friend, " +
                error.message,

            timestamp: Date.now()

        });


        renderMessages();

        updateChat();

    }


    isSending = false;


    if (sendButton) {

        sendButton.disabled = false;

    }

}


/* =========================================
   ASK VIGGO
========================================= */

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

    } catch (error) {

        throw new Error(
            "I couldn't connect to Viggo AI right now."
        );

    }


    const raw =
        await response.text();


    let data;


    try {

        data = JSON.parse(raw);

    } catch (error) {

        throw new Error(
            "Server returned an invalid response."
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


    if (
        typeof data.reply !== "string" ||
        !data.reply.trim()
    ) {

        throw new Error(
            "Viggo returned an empty response."
        );

    }


    return data.reply;

}


/* =========================================
   TYPING
========================================= */

function showTyping() {

    const area = $("messages");

    if (!area) return;


    const div =
        document.createElement("div");


    div.id = "viggoTyping";

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


/* =========================================
   COPY
========================================= */

async function copyText(text) {

    try {

        await navigator.clipboard.writeText(
            text
        );

    } catch {

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


    showToast("Copied");

}


/* =========================================
   SPEAK
========================================= */

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
        languageMap[currentLanguage] ||
        "en-IN";


    speechSynthesis.speak(speech);

}


/* =========================================
   VOICE INPUT
========================================= */

function setupVoice() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) return;


    recognition =
        new SpeechRecognition();


    recognition.continuous = false;

    recognition.interimResults = false;


    recognition.onstart = () => {

        isListening = true;

        $("voiceBtn")
            ?.classList
            .add("active");

    };


    recognition.onresult = event => {

        const text =
            event.results[0][0]
                .transcript;


        const input =
            $("messageInput");


        if (input) {

            input.value = text;

        }

    };


    recognition.onerror = event => {

        showToast(
            "Voice error: " +
            event.error
        );

    };


    recognition.onend = () => {

        isListening = false;

        $("voiceBtn")
            ?.classList
            .remove("active");

    };

}


/* =========================================
   TOGGLE VOICE
========================================= */

function toggleVoice() {

    if (!recognition) {

        showToast(
            "Voice input is not supported."
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

    } catch (error) {

        console.error(error);

    }

}


/* =========================================
   SHORT SHARE
========================================= */

async function shareChat() {

    const chats = getChats();


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


    if (
        !chat.messages ||
        !chat.messages.length
    ) {

        showToast(
            "Start chatting before sharing"
        );

        return;

    }


    showToast(
        "Creating share link..."
    );


    try {

        /*
         * Send chat to Render.
         * server.js should create a short ID.
         */

        const response =
            await fetch(
                SHARE_API,
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

                            chat: chat

                        })

                }
            );


        const raw =
            await response.text();


        let data;


        try {

            data =
                JSON.parse(raw);

        } catch {

            throw new Error(
                "Share server returned invalid data."
            );

        }


        if (!response.ok) {

            throw new Error(
                data.error ||
                data.details ||
                "Unable to create share link."
            );

        }


        if (
            !data.success ||
            !data.id
        ) {

            throw new Error(
                data.error ||
                "Short share ID was not created."
            );

        }


        const shortLink =
            API_BASE +
            "/s/" +
            encodeURIComponent(
                data.id
            );


        if (
            navigator.share
        ) {

            try {

                await navigator.share({

                    title:
                        chat.title ||
                        "Viggo AI Chat",

                    text:
                        "Viggo AI Chat",

                    url:
                        shortLink

                });

                return;

            } catch (error) {

                if (
                    error.name ===
                    "AbortError"
                ) {

                    return;

                }

            }

        }


        await copyText(shortLink);


        showToast(
            "🔗 Short share link copied"
        );


    } catch (error) {

        console.error(
            "Share error:",
            error
        );


        /*
         * Fallback:
         * If short-link endpoint is not ready,
         * keep the old full-chat share working.
         */

        try {

            const encoded =
                btoa(
                    encodeURIComponent(
                        JSON.stringify(chat)
                    )
                );


            const fallbackLink =
                window.location.origin +
                window.location.pathname +
                "?chat=" +
                encoded;


            await copyText(
                fallbackLink
            );


            showToast(
                "Share server unavailable. Full link copied."
            );


        } catch {

            showToast(
                "Unable to create share link."
            );

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


    const encoded =
        params.get("chat");


    if (!encoded) return;


    try {

        const chat =
            JSON.parse(
                decodeURIComponent(
                    atob(encoded)
                )
            );


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


/* =========================================
   MORE MENU
========================================= */

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


/* =========================================
   LANGUAGE MENU
========================================= */

function toggleLanguageMenu() {

    const submenu =
        $("languageSubmenu");

    if (!submenu) return;

    submenu.classList.toggle("show");

}


/* =========================================
   CLOSE LANGUAGE
========================================= */

function closeLanguageMenu() {

    $("languageSubmenu")
        ?.classList
        .remove("show");

}


/* =========================================
   LANGUAGE
========================================= */

function setLanguage(language) {

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
        "Language: " +
        (names[language] || language)
    );


    closeLanguageMenu();

    closeMore();

}


/* =========================================
   TOAST
========================================= */

function showToast(message) {

    let toast =
        $("viggoToast");


    if (!toast) {

        toast =
            document.createElement("div");


        toast.id =
            "viggoToast";


        Object.assign(
            toast.style,
            {

                position: "fixed",

                bottom: "25px",

                left: "50%",

                transform:
                    "translateX(-50%)",

                background: "#222",

                color: "#fff",

                padding:
                    "11px 17px",

                borderRadius:
                    "10px",

                zIndex: "99999",

                fontSize: "14px",

                maxWidth: "90%",

                textAlign: "center",

                boxShadow:
                    "0 4px 15px rgba(0,0,0,.2)"

            }
        );


        document.body.appendChild(
            toast
        );

    }


    toast.textContent =
        message;


    toast.style.display =
        "block";


    clearTimeout(
        toast.timer
    );


    toast.timer =
        setTimeout(
            () => {

                toast.style.display =
                    "none";

            },
            2500
        );

}


/* =========================================
   SCROLL
========================================= */

function scrollBottom() {

    const area =
        $("messages");


    if (area) {

        area.scrollTop =
            area.scrollHeight;

    }

}


/* =========================================
   EVENTS
========================================= */

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


    /* SELECT CHATS */

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


    /* MESSAGE INPUT */

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


    /* LANGUAGE BUTTON */

    $("languageBtn")
        ?.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                toggleLanguageMenu();

            }
        );


    /* LANGUAGE OPTIONS */

    document
        .querySelectorAll(
            "[data-language]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();

                        setLanguage(
                            button.dataset.language
                        );

                    }
                );

            }
        );


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

                closeLanguageMenu();

            }

        }
    );


    /* LOAD SHARED CHAT */

    loadSharedChat();

}
