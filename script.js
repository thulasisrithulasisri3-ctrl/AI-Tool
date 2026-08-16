"use strict";

/* =========================================
   VIGGO AI CONFIG
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


/* =========================================
   DOM HELPER
========================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================
   START APP
========================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("Viggo AI starting...");

    loadSettings();

    setupEvents();

    setupVoice();

    initializeChat();

    loadSharedChat();

    console.log("Viggo AI ready.");

});


/* =========================================
   SETTINGS
========================================= */

function loadSettings() {

    try {

        const saved =
            localStorage.getItem(SETTINGS_KEY);

        if (!saved) return;

        const data =
            JSON.parse(saved);

        if (data.language) {
            currentLanguage =
                data.language;
        }

    } catch (error) {

        console.error(
            "Settings error:",
            error
        );

    }

}


function saveSettings() {

    try {

        localStorage.setItem(
            SETTINGS_KEY,
            JSON.stringify({
                language: currentLanguage
            })
        );

    } catch (error) {

        console.error(
            "Save settings error:",
            error
        );

    }

}


/* =========================================
   CHAT STORAGE
========================================= */

function getChats() {

    try {

        const saved =
            localStorage.getItem(
                STORAGE_KEY
            );

        if (!saved) {
            return [];
        }

        const chats =
            JSON.parse(saved);

        return Array.isArray(chats)
            ? chats
            : [];

    } catch (error) {

        console.error(
            "Get chats error:",
            error
        );

        return [];

    }

}


function saveChats(chats) {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(chats)
        );

        return true;

    } catch (error) {

        console.error(
            "Save chats error:",
            error
        );

        showToast(
            "Could not save chat"
        );

        return false;

    }

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
                .substring(2, 8),

        title:
            "New Chat",

        messages: [],

        pinned:
            false,

        createdAt:
            Date.now(),

        updatedAt:
            Date.now()

    };

}


/* =========================================
   INITIALIZE CHAT
========================================= */

function initializeChat() {

    let chats =
        getChats();

    if (!chats.length) {

        const chat =
            createChat();

        chats = [chat];

        saveChats(chats);

        currentChatId =
            chat.id;

        messages = [];

    } else {

        chats.sort(function (a, b) {

            return (
                (b.updatedAt || 0) -
                (a.updatedAt || 0)
            );

        });

        currentChatId =
            chats[0].id;

        messages =
            Array.isArray(
                chats[0].messages
            )
                ? chats[0].messages
                : [];

    }

    renderMessages();

    updateTitle();

    renderHistory();

}


/* =========================================
   NEW CHAT
========================================= */

function newChat() {

    console.log("New Chat clicked");

    const chats =
        getChats();

    const chat =
        createChat();

    chats.unshift(chat);

    saveChats(chats);

    currentChatId =
        chat.id;

    messages = [];

    renderMessages();

    updateTitle();

    renderHistory();

    closeMore();

    showToast(
        "New chat created"
    );

}


/* =========================================
   OPEN CHAT
========================================= */

function openChat(id) {

    const chats =
        getChats();

    const chat =
        chats.find(function (item) {

            return item.id === id;

        });

    if (!chat) {

        showToast(
            "Chat not found"
        );

        return;

    }

    currentChatId =
        chat.id;

    messages =
        Array.isArray(chat.messages)
            ? chat.messages
            : [];

    renderMessages();

    updateTitle();

    renderHistory();

}


/* =========================================
   UPDATE CURRENT CHAT
========================================= */

function updateChat() {

    if (!currentChatId) {
        return;
    }

    const chats =
        getChats();

    const chat =
        chats.find(function (item) {

            return item.id === currentChatId;

        });

    if (!chat) {
        return;
    }

    chat.messages =
        Array.isArray(messages)
            ? messages
            : [];

    chat.updatedAt =
        Date.now();

    const firstUser =
        messages.find(function (item) {

            return (
                item &&
                item.role === "user"
            );

        });

    if (
        firstUser &&
        chat.title === "New Chat"
    ) {

        chat.title =
            String(firstUser.content || "")
                .replace(/\s+/g, " ")
                .trim()
                .substring(0, 40);

        if (!chat.title) {
            chat.title =
                "New Chat";
        }

    }

    saveChats(chats);

    updateTitle();

    renderHistory();

}


/* =========================================
   UPDATE TITLE
========================================= */

function updateTitle() {

    const title =
        $("chatTitle");

    if (!title) return;

    const chats =
        getChats();

    const chat =
        chats.find(function (item) {

            return item.id === currentChatId;

        });

    title.textContent =
        chat && chat.title
            ? chat.title
            : "New Chat";

}


/* =========================================
   HISTORY
========================================= */

function renderHistory() {

    const list =
        $("historyList");

    if (!list) return;

    const chats =
        getChats();

    list.innerHTML = "";

    const pinned =
        chats.filter(function (chat) {

            return chat.pinned === true;

        });

    const recent =
        chats.filter(function (chat) {

            return chat.pinned !== true;

        });

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
   ADD HISTORY SECTION
========================================= */

function addHistory(
    list,
    title,
    chats
) {

    if (!chats.length) {
        return;
    }

    const heading =
        document.createElement("div");

    heading.className =
        "history-section-title";

    heading.textContent =
        title;

    list.appendChild(
        heading
    );


    chats.forEach(function (chat) {

        const row =
            document.createElement("div");

        row.className =
            "history-item";

        if (
            chat.id === currentChatId
        ) {

            row.classList.add(
                "active"
            );

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


        /* PIN */

        const pin =
            document.createElement("button");

        pin.type =
            "button";

        pin.className =
            "history-action";

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
            function (event) {

                event.stopPropagation();

                togglePin(chat.id);

            }
        );


        /* DELETE */

        const del =
            document.createElement("button");

        del.type =
            "button";

        del.className =
            "history-action delete";

        del.textContent =
            "🗑";

        del.title =
            "Delete chat";


        del.addEventListener(
            "click",
            function (event) {

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
            function () {

                openChat(chat.id);

            }
        );


        list.appendChild(row);

    });

}


/* =========================================
   PIN CHAT
========================================= */

function togglePin(id) {

    const chats =
        getChats();

    const chat =
        chats.find(function (item) {

            return item.id === id;

        });

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


/* =========================================
   DELETE CHAT
========================================= */

function deleteChat(id) {

    const confirmed =
        window.confirm(
            "Delete this chat?"
        );

    if (!confirmed) {
        return;
    }

    let chats =
        getChats();

    chats =
        chats.filter(function (chat) {

            return chat.id !== id;

        });


    if (!chats.length) {

        const newChat =
            createChat();

        chats.push(newChat);

    }


    saveChats(chats);


    if (
        currentChatId === id
    ) {

        currentChatId =
            chats[0].id;

        messages =
            Array.isArray(
                chats[0].messages
            )
                ? chats[0].messages
                : [];

        renderMessages();

        updateTitle();

    }


    renderHistory();

    showToast(
        "Chat deleted"
    );

}


/* =========================================
   SAVE CHAT
========================================= */

function saveCurrentChat() {

    console.log(
        "Save clicked"
    );

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
        window.confirm(
            "Delete all chat history?"
        );

    if (!confirmed) {
        return;
    }

    const chat =
        createChat();

    saveChats([chat]);

    currentChatId =
        chat.id;

    messages = [];

    renderMessages();

    updateTitle();

    renderHistory();

    closeMore();

    showToast(
        "History cleared"
    );

}


/* =========================================
   RENDER MESSAGES
========================================= */

function renderMessages() {

    const area =
        $("messages");

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


    messages.forEach(function (item) {

        if (
            !item ||
            typeof item.content !== "string"
        ) {
            return;
        }

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

function addMessage(
    role,
    text
) {

    const area =
        $("messages");

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


        /* COPY */

        const copy =
            document.createElement("button");

        copy.type =
            "button";

        copy.className =
            "message-action";

        copy.textContent =
            "📋";

        copy.title =
            "Copy";


        copy.addEventListener(
            "click",
            function () {

                copyText(text);

            }
        );


        /* SPEAK */

        const voice =
            document.createElement("button");

        voice.type =
            "button";

        voice.className =
            "message-action";

        voice.textContent =
            "🔊";

        voice.title =
            "Read aloud";


        voice.addEventListener(
            "click",
            function () {

                speakText(text);

            }
        );


        actions.appendChild(copy);

        actions.appendChild(voice);

        wrapper.appendChild(actions);

    }


    area.appendChild(
        wrapper
    );

}


/* =========================================
   SEND MESSAGE
========================================= */

async function sendMessage() {

    if (isSending) {
        return;
    }

    const input =
        $("messageInput");

    const sendButton =
        $("sendBtn");

    if (!input) {
        return;
    }

    const text =
        input.value.trim();

    if (!text) {
        return;
    }


    isSending =
        true;


    if (sendButton) {
        sendButton.disabled =
            true;
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
                "Sorry friend, " +
                error.message,

            timestamp: Date.now()

        });


        renderMessages();

        updateChat();

    }


    isSending =
        false;


    if (sendButton) {
        sendButton.disabled =
            false;
    }

}


/* =========================================
   API REQUEST
========================================= */

async function askViggo(text) {

    console.log(
        "Connecting to:",
        CHAT_API
    );


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

                            message:
                                text,

                            language:
                                currentLanguage,

                            history:
                                messages
                                    .slice(-15)
                                    .map(
                                        function (item) {

                                            return {

                                                role:
                                                    item.role,

                                                content:
                                                    item.content

                                            };

                                        }
                                    )

                        })

                }
            );

    } catch (error) {

        console.error(
            "Fetch error:",
            error
        );

        throw new Error(
            "Render server-க்கு connect ஆகவில்லை."
        );

    }


    const raw =
        await response.text();


    console.log(
        "Server status:",
        response.status
    );


    let data;


    try {

        data =
            JSON.parse(raw);

    } catch (error) {

        console.error(
            "Invalid server response:",
            raw
        );

        throw new Error(
            "Server invalid response கொடுத்தது."
        );

    }


    if (!response.ok) {

        throw new Error(

            data.details ||
            data.error ||
            "Server error " +
            response.status

        );

    }


    if (
        !data.success
    ) {

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
            "Viggo empty response கொடுத்தது."
        );

    }


    return data.reply.trim();

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


    area.appendChild(
        div
    );

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

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {

            await navigator.clipboard.writeText(
                text
            );

        } else {

            const textarea =
                document.createElement(
                    "textarea"
                );

            textarea.value =
                text;

            textarea.style.position =
                "fixed";

            textarea.style.left =
                "-9999px";

            document.body.appendChild(
                textarea
            );

            textarea.focus();

            textarea.select();

            document.execCommand(
                "copy"
            );

            textarea.remove();

        }


        showToast(
            "Copied"
        );


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


/* =========================================
   TEXT TO SPEECH
========================================= */

function speakText(text) {

    if (
        !("speechSynthesis" in window)
    ) {

        showToast(
            "Voice not supported"
        );

        return;

    }


    window.speechSynthesis.cancel();


    const languageMap = {

        en: "en-IN",

        ta: "ta-IN",

        hi: "hi-IN",

        ml: "ml-IN",

        te: "te-IN",

        kn: "kn-IN"

    };


    const speech =
        new SpeechSynthesisUtterance(
            text
        );


    speech.lang =
        languageMap[
            currentLanguage
        ] || "en-IN";


    window.speechSynthesis.speak(
        speech
    );

}


/* =========================================
   VOICE INPUT SETUP
========================================= */

function setupVoice() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        recognition =
            null;

        return;

    }


    recognition =
        new SpeechRecognition();


    recognition.continuous =
        false;

    recognition.interimResults =
        false;


    recognition.onstart =
        function () {

            isListening =
                true;

            const button =
                $("voiceBtn");

            if (button) {

                button.classList.add(
                    "active"
                );

            }

            showToast(
                "Listening..."
            );

        };


    recognition.onresult =
        function (event) {

            try {

                const text =
                    event.results[0][0]
                        .transcript;

                const input =
                    $("messageInput");

                if (input) {

                    input.value =
                        text;

                    input.focus();

                }

            } catch (error) {

                console.error(
                    "Voice result error:",
                    error
                );

            }

        };


    recognition.onerror =
        function (event) {

            console.error(
                "Voice error:",
                event.error
            );

            showToast(
                "Voice error: " +
                event.error
            );

        };


    recognition.onend =
        function () {

            isListening =
                false;

            const button =
                $("voiceBtn");

            if (button) {

                button.classList.remove(
                    "active"
                );

            }

        };

}


/* =========================================
   VOICE BUTTON
========================================= */

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

        console.error(
            "Voice start error:",
            error
        );

    }

}


/* =========================================
   SHARE FULL CHAT
========================================= */

async function shareChat() {

    console.log(
        "Share clicked"
    );


    const chats =
        getChats();

    const chat =
        chats.find(function (item) {

            return item.id === currentChatId;

        });


    if (!chat) {

        showToast(
            "No chat to share"
        );

        return;

    }


    if (
        !Array.isArray(chat.messages) ||
        chat.messages.length === 0
    ) {

        showToast(
            "Add a message before sharing"
        );

        return;

    }


    let encoded = "";

    try {

        encoded =
            btoa(
                encodeURIComponent(
                    JSON.stringify(chat)
                )
            );

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


    const link =
        window.location.origin +
        window.location.pathname +
        "?chat=" +
        encodeURIComponent(
            encoded
        );


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

            await copyText(
                link
            );

            showToast(
                "Share link copied"
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

            showToast(
                "Share failed"
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


    if (!encoded) {
        return;
    }


    try {

        const decoded =
            decodeURIComponent(
                encoded
            );


        const chat =
            JSON.parse(
                atob(decoded)
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


/* =========================================
   LANGUAGE
========================================= */

function setLanguage(
    language
) {

    currentLanguage =
        language;

    saveSettings();

    closeMore();

    showToast(
        "Language changed"
    );

}


/* =========================================
   TOAST
========================================= */

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
            "10px 16px";

        toast.style.borderRadius =
            "10px";

        toast.style.zIndex =
            "999999";

        toast.style.fontSize =
            "14px";

        toast.style.boxShadow =
            "0 5px 20px rgba(0,0,0,.3)";

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
            function () {

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

    if (!area) return;

    requestAnimationFrame(
        function () {

            area.scrollTop =
                area.scrollHeight;

        }
    );

}


/* =========================================
   EVENTS
========================================= */

function setupEvents() {

    const newChatButton =
        $("newChatBtn");

    if (newChatButton) {

        newChatButton.addEventListener(
            "click",
            function () {

                newChat();

            }
        );

    }


    const sendButton =
        $("sendBtn");

    if (sendButton) {

        sendButton.addEventListener(
            "click",
            function () {

                sendMessage();

            }
        );

    }


    const shareButton =
        $("shareBtn");

    if (shareButton) {

        shareButton.addEventListener(
            "click",
            function () {

                shareChat();

            }
        );

    }


    const voiceButton =
        $("voiceBtn");

    if (voiceButton) {

        voiceButton.addEventListener(
            "click",
            function () {

                toggleVoice();

            }
        );

    }


    const moreButton =
        $("moreBtn");

    if (moreButton) {

        moreButton.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                toggleMore();

            }
        );

    }


    const saveButton =
        $("saveBtn");

    if (saveButton) {

        saveButton.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                saveCurrentChat();

            }
        );

    }


    const clearButton =
        $("clearHistoryBtn");

    if (clearButton) {

        clearButton.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                clearHistory();

            }
        );

    }


    const mobileButton =
        $("mobileMenuBtn");

    if (mobileButton) {

        mobileButton.addEventListener(
            "click",
            function () {

                const sidebar =
                    $("sidebar");

                if (sidebar) {

                    sidebar.classList.toggle(
                        "open"
                    );

                }

            }
        );

    }


    const input =
        $("messageInput");

    if (input) {

        input.addEventListener(
            "keydown",
            function (event) {

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


    document
        .querySelectorAll(
            "[data-language]"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        setLanguage(
                            button.dataset.language
                        );

                    }
                );

            }
        );


    document.addEventListener(
        "click",
        function (event) {

            const menuArea =
                event.target.closest(
                    ".sidebar-more"
                );

            if (!menuArea) {

                closeMore();

            }

        }
    );

}
