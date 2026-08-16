"use strict";

/* =========================================
   VIGGO AI - FRONTEND
========================================= */

const API_BASE = "https://ai-tool-1-fgmc.onrender.com";
const CHAT_API = API_BASE + "/chat";

const STORAGE_KEY = "viggo_chats";
const SETTINGS_KEY = "viggo_settings";

let currentChatId = null;
let messages = [];
let currentLanguage = "en";

let isSending = false;
let recognition = null;
let isListening = false;

let selectMode = false;
let selectedChats = new Set();


/* =========================================
   DOM HELPER
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

    let chats = getChats();

    if (!chats.length) {

        const chat = createChat();

        chats = [chat];

        saveChats(chats);

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

    renderMessages();

    updateTitle();

    renderHistory();

    closeMore();

    showToast("New chat created");

}


/* =========================================
   OPEN CHAT
========================================= */

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

    closeMobileSidebar();

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
   UPDATE TITLE
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

    addHistory(list, "Pinned", pinned);

    addHistory(list, "Recent", recent);

}


/* =========================================
   HISTORY ITEM
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

        row.className = "history-item";


        if (chat.id === currentChatId) {

            row.classList.add("active");

        }


        if (selectMode) {

            row.classList.add("select-mode");

        }


        /* =====================================
           SELECT CHECKBOX
        ===================================== */

        if (selectMode) {

            const checkbox =
                document.createElement("input");

            checkbox.type = "checkbox";

            checkbox.className =
                "chat-checkbox";

            checkbox.checked =
                selectedChats.has(chat.id);

            checkbox.onclick = event => {

                event.stopPropagation();

                toggleChatSelection(
                    chat.id,
                    checkbox.checked
                );

            };

            row.appendChild(checkbox);

        }


        const titleEl =
            document.createElement("div");

        titleEl.className =
            "history-title";

        titleEl.textContent =
            chat.title || "New Chat";


        const actions =
            document.createElement("div");

        actions.className =
            "history-actions";


        /* =====================================
           PIN BUTTON
        ===================================== */

        const pin =
            document.createElement("button");

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


        pin.onclick = event => {

            event.stopPropagation();

            togglePin(chat.id);

        };


        /* =====================================
           DELETE BUTTON
        ===================================== */

        if (!selectMode) {

            const del =
                document.createElement("button");

            del.className =
                "history-action delete";

            del.title =
                "Delete Chat";

            del.textContent =
                "🗑";


            del.onclick = event => {

                event.stopPropagation();

                deleteChat(chat.id);

            };


            actions.appendChild(del);

        }


        actions.appendChild(pin);


        row.appendChild(titleEl);

        row.appendChild(actions);


        row.onclick = () => {

            if (selectMode) {

                const newValue =
                    !selectedChats.has(chat.id);

                toggleChatSelection(
                    chat.id,
                    newValue
                );

                renderHistory();

                return;

            }

            openChat(chat.id);

        };


        list.appendChild(row);

    });

}


/* =========================================
   SELECT CHAT
========================================= */

function toggleChatSelection(id, checked) {

    if (checked) {

        selectedChats.add(id);

    } else {

        selectedChats.delete(id);

    }

    updateDeleteSelectedButton();

}


/* =========================================
   SELECT MODE
========================================= */

function toggleSelectMode() {

    selectMode = !selectMode;

    selectedChats.clear();

    const button = $("selectChatsBtn");

    if (button) {

        button.textContent =
            selectMode
                ? "✓ Done Selecting"
                : "☑ Select Chats";

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
   DELETE SELECTED CHATS
========================================= */

function deleteSelectedChats() {

    if (!selectedChats.size) {

        showToast("Select chats first");

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
        chat => !selectedChats.has(chat.id)
    );


    if (!chats.length) {

        const newChat = createChat();

        chats.push(newChat);

    }


    saveChats(chats);


    if (
        selectedChats.has(currentChatId)
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


    const button =
        $("selectChatsBtn");

    if (button) {

        button.textContent =
            "☑ Select Chats";

    }


    renderHistory();

    updateDeleteSelectedButton();

    closeMore();


    showToast(
        `${count} chat${count > 1 ? "s" : ""} deleted`
    );

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

    chat.updatedAt = Date.now();

    saveChats(chats);

    renderHistory();

    showToast(
        chat.pinned
            ? "Chat pinned"
            : "Chat unpinned"
    );

}


/* =========================================
   DELETE SINGLE CHAT
========================================= */

function deleteChat(id) {

    const confirmed =
        confirm("Delete this chat?");

    if (!confirmed) return;


    let chats = getChats();

    chats = chats.filter(
        chat => chat.id !== id
    );


    if (!chats.length) {

        chats.push(
            createChat()
        );

    }


    saveChats(chats);


    if (currentChatId === id) {

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


    renderHistory();

    showToast("Chat deleted");

}


/* =========================================
   SAVE
========================================= */

function saveCurrentChat() {

    updateChat();

    showToast("✓ Chat saved");

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


    const chat =
        createChat();


    saveChats([chat]);


    currentChatId =
        chat.id;

    messages = [];

    selectMode = false;

    selectedChats.clear();


    renderMessages();

    updateTitle();

    renderHistory();

    updateDeleteSelectedButton();

    closeMore();


    showToast("History cleared");

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


    bubble.textContent = text;


    wrapper.appendChild(bubble);


    if (role === "assistant") {

        const actions =
            document.createElement("div");

        actions.className =
            "message-actions";


        const copy =
            document.createElement("button");

        copy.className =
            "message-action";

        copy.title =
            "Copy";

        copy.textContent =
            "📋";


        copy.onclick = () =>
            copyText(text);


        const voice =
            document.createElement("button");

        voice.className =
            "message-action";

        voice.title =
            "Read aloud";

        voice.textContent =
            "🔊";


        voice.onclick = () =>
            speakText(text);


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


    } catch (error) {

        removeTyping();


        console.error(
            "Viggo API error:",
            error
        );


        messages.push({

            role: "assistant",

            content:
                "⚠️ " +
                (error.message ||
                    "Unable to connect to Viggo AI."),

            timestamp: Date.now()

        });


        renderMessages();

        updateChat();

    }


    isSending = false;


    if (sendButton) {

        sendButton.disabled = false;

    }


    input.focus();

}


/* =========================================
   API CALL
========================================= */

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

                body:
                    JSON.stringify({

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

        data =
            JSON.parse(raw);

    } catch (error) {

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


    return (
        data.reply ||
        "Sorry, I couldn't generate a response."
    );

}


/* =========================================
   TYPING
========================================= */

function showTyping() {

    const area =
        $("messages");

    if (!area) return;


    removeTyping();


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


/* =========================================
   COPY
========================================= */

async function copyText(text) {

    try {

        await navigator.clipboard.writeText(
            text
        );

    } catch (error) {

        const textarea =
            document.createElement("textarea");

        textarea.value = text;

        textarea.style.position =
            "fixed";

        textarea.style.opacity = "0";

        document.body.appendChild(
            textarea
        );

        textarea.select();

        document.execCommand("copy");

        textarea.remove();

    }


    showToast("Copied");

}


/* =========================================
   VOICE OUTPUT
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


    speech.rate = 1;

    speech.pitch = 1;


    speechSynthesis.speak(
        speech
    );

}


/* =========================================
   VOICE INPUT
========================================= */

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


    recognition.onstart = () => {

        isListening = true;

        $("voiceBtn")
            ?.classList
            .add("active");

        showToast("Listening...");

    };


    recognition.onresult = event => {

        const text =
            event.results[0][0]
                .transcript;


        const input =
            $("messageInput");


        if (input) {

            input.value = text;

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
            ?.classList
            .remove("active");

    };

}


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
   SHORT SHARE LINK
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


    /*
       NOTE:
       This creates a shorter Base64 URL
       than the previous double-encoded version.
    */

    const json =
        JSON.stringify({

            title:
                chat.title,

            messages:
                chat.messages

        });


    const encoded =
        btoa(
            encodeURIComponent(json)
        );


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

            console.error(
                "Share error:",
                error
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
        params.get("c") ||
        params.get("chat");


    if (!encoded) return;


    try {

        const json =
            decodeURIComponent(
                atob(encoded)
            );


        const chat =
            JSON.parse(json);


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

        console.error(
            "Shared chat error:",
            error
        );

        showToast(
            "Invalid share link"
        );

    }

}


/* =========================================
   MORE MENU
========================================= */

function toggleMore() {

    const menu =
        $("moreMenu");

    if (!menu) return;

    menu.classList.toggle("show");

}


function closeMore() {

    const menu =
        $("moreMenu");

    if (!menu) return;

    menu.classList.remove("show");

}


/* =========================================
   LANGUAGE
========================================= */

function setLanguage(language) {

    currentLanguage =
        language;


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


        toast.style.position =
            "fixed";

        toast.style.bottom =
            "25px";

        toast.style.left =
            "50%";

        toast.style.transform =
            "translateX(-50%)";

        toast.style.background =
            "#222";

        toast.style.color =
            "#fff";

        toast.style.padding =
            "11px 17px";

        toast.style.borderRadius =
            "10px";

        toast.style.zIndex =
            "99999";

        toast.style.fontSize =
            "14px";

        toast.style.boxShadow =
            "0 5px 20px rgba(0,0,0,.25)";

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
        setTimeout(() => {

            toast.style.display =
                "none";

        }, 2500);

}


/* =========================================
   SCROLL
========================================= */

function scrollBottom() {

    const area =
        $("messages");


    if (area) {

        requestAnimationFrame(() => {

            area.scrollTop =
                area.scrollHeight;

        });

    }

}


/* =========================================
   MOBILE SIDEBAR
========================================= */

function closeMobileSidebar() {

    $("sidebar")
        ?.classList
        .remove("open");

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


    /* ENTER TO SEND */

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


    /* CLOSE MORE */

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


    /* ESC */

    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {

                closeMore();

            }

        }
    );


    /* SHARED CHAT */

    loadSharedChat();

}
