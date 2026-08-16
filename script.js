```javascript
"use strict";


/* =========================================
   API
========================================= */

const API_BASE =
    "https://ai-tool-1-fgmc.onrender.com";

const CHAT_API =
    API_BASE + "/chat";


/* =========================================
   STORAGE
========================================= */

const STORAGE_KEY =
    "viggo_chats";

const SETTINGS_KEY =
    "viggo_settings";


let currentChatId = null;

let messages = [];

let currentLanguage = "en";

let isSending = false;

let recognition = null;

let isListening = false;


/* =========================================
   DOM
========================================= */

function $(id) {

    return document.getElementById(id);

}


/* =========================================
   START
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadSettings();

        initializeChat();

        setupEvents();

        setupVoice();

    }
);


/* =========================================
   SETTINGS
========================================= */

function loadSettings() {

    try {

        const data =
            JSON.parse(
                localStorage.getItem(
                    SETTINGS_KEY
                ) || "{}"
            );


        if (data.language) {

            currentLanguage =
                data.language;

        }

    } catch (error) {

        console.error(error);

    }

}


function saveSettings() {

    localStorage.setItem(

        SETTINGS_KEY,

        JSON.stringify({

            language:
                currentLanguage

        })

    );

}


/* =========================================
   CHAT STORAGE
========================================= */

function getChats() {

    try {

        const data =
            JSON.parse(
                localStorage.getItem(
                    STORAGE_KEY
                ) || "[]"
            );


        return Array.isArray(data)
            ? data
            : [];

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
   INITIALIZE
========================================= */

function initializeChat() {

    const chats =
        getChats();


    if (!chats.length) {

        const chat =
            createChat();


        saveChats([chat]);


        currentChatId =
            chat.id;


        messages = [];

    } else {

        chats.sort(
            (a, b) =>
                (b.updatedAt || 0) -
                (a.updatedAt || 0)
        );


        currentChatId =
            chats[0].id;


        messages =
            chats[0].messages || [];

    }


    renderMessages();

    updateTitle();

    renderHistory();

}


/* =========================================
   NEW CHAT
========================================= */

function newChat() {

    const chat =
        createChat();


    const chats =
        getChats();


    chats.unshift(chat);


    saveChats(chats);


    currentChatId =
        chat.id;


    messages = [];


    renderMessages();

    updateTitle();

    renderHistory();

}


/* =========================================
   OPEN CHAT
========================================= */

function openChat(id) {

    const chats =
        getChats();


    const chat =
        chats.find(
            item =>
                item.id === id
        );


    if (!chat) return;


    currentChatId =
        chat.id;


    messages =
        chat.messages || [];


    renderMessages();

    updateTitle();

    renderHistory();

}


/* =========================================
   UPDATE CHAT
========================================= */

function updateChat() {

    const chats =
        getChats();


    const chat =
        chats.find(
            item =>
                item.id === currentChatId
        );


    if (!chat) return;


    chat.messages =
        messages;


    chat.updatedAt =
        Date.now();


    const firstUser =
        messages.find(
            item =>
                item.role === "user"
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


/* =========================================
   TITLE
========================================= */

function updateTitle() {

    const element =
        $("chatTitle");


    if (!element) return;


    const chats =
        getChats();


    const chat =
        chats.find(
            item =>
                item.id === currentChatId
        );


    element.textContent =
        chat?.title ||
        "New Chat";

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
        chats.filter(
            chat =>
                chat.pinned
        );


    const recent =
        chats.filter(
            chat =>
                !chat.pinned
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


function addHistory(
    list,
    title,
    chats
) {

    if (!chats.length)
        return;


    const heading =
        document.createElement(
            "div"
        );


    heading.className =
        "history-section-title";


    heading.textContent =
        title;


    list.appendChild(
        heading
    );


    chats.forEach(chat => {

        const row =
            document.createElement(
                "div"
            );


        row.className =
            "history-item";


        if (
            chat.id ===
            currentChatId
        ) {

            row.classList.add(
                "active"
            );

        }


        const titleEl =
            document.createElement(
                "div"
            );


        titleEl.className =
            "history-title";


        titleEl.textContent =
            chat.title ||
            "New Chat";


        const actions =
            document.createElement(
                "div"
            );


        actions.className =
            "history-actions";


        const pin =
            document.createElement(
                "button"
            );


        pin.className =
            "history-action";


        pin.textContent =
            chat.pinned
                ? "📌"
                : "📍";


        pin.onclick =
            event => {

                event.stopPropagation();

                togglePin(chat.id);

            };


        const del =
            document.createElement(
                "button"
            );


        del.className =
            "history-action delete";


        del.textContent =
            "🗑";


        del.onclick =
            event => {

                event.stopPropagation();

                deleteChat(chat.id);

            };


        actions.appendChild(pin);

        actions.appendChild(del);


        row.appendChild(titleEl);

        row.appendChild(actions);


        row.onclick =
            () => {

                openChat(
                    chat.id
                );

            };


        list.appendChild(row);

    });

}


/* =========================================
   PIN
========================================= */

function togglePin(id) {

    const chats =
        getChats();


    const chat =
        chats.find(
            item =>
                item.id === id
        );


    if (!chat) return;


    chat.pinned =
        !chat.pinned;


    saveChats(chats);

    renderHistory();

}


/* =========================================
   DELETE
========================================= */

function deleteChat(id) {

    if (
        !confirm(
            "Delete this chat?"
        )
    ) {

        return;

    }


    let chats =
        getChats();


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
   CLEAR
========================================= */

function clearHistory() {

    if (
        !confirm(
            "Delete all chat history?"
        )
    ) {

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


    showToast(
        "History cleared"
    );

}


/* =========================================
   RENDER
========================================= */

function renderMessages() {

    const area =
        $("messages");


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


/* =========================================
   MESSAGE
========================================= */

function addMessage(
    role,
    text
) {

    const area =
        $("messages");


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        role === "user"
            ? "message user-message"
            : "message assistant-message";


    const bubble =
        document.createElement(
            "div"
        );


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
            document.createElement(
                "div"
            );


        actions.className =
            "message-actions";


        const copy =
            document.createElement(
                "button"
            );


        copy.className =
            "message-action";


        copy.textContent =
            "📋";


        copy.onclick =
            () =>
                copyText(text);


        const voice =
            document.createElement(
                "button"
            );


        voice.className =
            "message-action";


        voice.textContent =
            "🔊";


        voice.onclick =
            () =>
                speakText(text);


        actions.appendChild(copy);

        actions.appendChild(voice);


        wrapper.appendChild(
            actions
        );

    }


    area.appendChild(
        wrapper
    );

}


/* =========================================
   SEND
========================================= */

async function sendMessage() {

    if (isSending)
        return;


    const input =
        $("messageInput");


    if (!input)
        return;


    const text =
        input.value.trim();


    if (!text)
        return;


    isSending =
        true;


    $("sendBtn").disabled =
        true;


    messages.push({

        role:
            "user",

        content:
            text,

        timestamp:
            Date.now()

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

            role:
                "assistant",

            content:
                reply,

            timestamp:
                Date.now()

        });


        renderMessages();

        updateChat();


    } catch (error) {

        removeTyping();


        console.error(
            error
        );


        messages.push({

            role:
                "assistant",

            content:
                "⚠️ " +
                error.message,

            timestamp:
                Date.now()

        });


        renderMessages();

        updateChat();

    }


    isSending =
        false;


    $("sendBtn").disabled =
        false;

}


/* =========================================
   API CALL
========================================= */

async function askViggo(
    text
) {

    let response;


    try {

        response =
            await fetch(
                CHAT_API,
                {

                    method:
                        "POST",

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


    if (
        !data.success
    ) {

        throw new Error(

            data.details ||
            data.error ||
            "Viggo AI error"

        );

    }


    return data.reply;

}


/* =========================================
   TYPING
========================================= */

function showTyping() {

    const area =
        $("messages");


    const div =
        document.createElement(
            "div"
        );


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


    if (element)
        element.remove();

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
            document.createElement(
                "textarea"
            );


        textarea.value =
            text;


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


/* =========================================
   VOICE OUTPUT
========================================= */

function speakText(text) {

    if (
        !window.speechSynthesis
    ) {

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
        new SpeechSynthesisUtterance(
            text
        );


    speech.lang =
        languageMap[
            currentLanguage
        ] || "en-IN";


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


    if (!SpeechRecognition)
        return;


    recognition =
        new SpeechRecognition();


    recognition.continuous =
        false;


    recognition.interimResults =
        false;


    recognition.onstart =
        () => {

            isListening =
                true;


            $("voiceBtn")
                ?.classList
                .add("active");

        };


    recognition.onresult =
        event => {

            const text =
                event.results[0][0]
                    .transcript;


            $("messageInput").value =
                text;

        };


    recognition.onerror =
        event => {

            showToast(
                "Voice error: " +
                event.error
            );

        };


    recognition.onend =
        () => {

            isListening =
                false;


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
        languageMap[
            currentLanguage
        ] || "en-IN";


    recognition.start();

}


/* =========================================
   SHARE FULL CHAT
========================================= */

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


    const encoded =
        btoa(
            encodeURIComponent(
                JSON.stringify(chat)
            )
        );


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
                    chat.title,

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
        params.get("chat");


    if (!encoded)
        return;


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


        $("chatTitle").textContent =
            chat.title ||
            "Shared Chat";


        showToast(
            "Shared chat opened"
        );

    } catch {

        showToast(
            "Invalid share link"
        );

    }

}


/* =========================================
   MORE MENU
========================================= */

function toggleMore() {

    $("moreMenu")
        ?.classList
        .toggle("show");

}


function closeMore() {

    $("moreMenu")
        ?.classList
        .remove("show");

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
            "white";


        toast.style.padding =
            "10px 16px";


        toast.style.borderRadius =
            "10px";


        toast.style.zIndex =
            "99999";


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

    $("newChatBtn")
        ?.addEventListener(
            "click",
            newChat
        );


    $("sendBtn")
        ?.addEventListener(
            "click",
            sendMessage
        );


    $("shareBtn")
        ?.addEventListener(
            "click",
            shareChat
        );


    $("voiceBtn")
        ?.addEventListener(
            "click",
            toggleVoice
        );


    $("moreBtn")
        ?.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                toggleMore();

            }
        );


    $("saveBtn")
        ?.addEventListener(
            "click",
            saveCurrentChat
        );


    $("clearHistoryBtn")
        ?.addEventListener(
            "click",
            clearHistory
        );


    $("mobileMenuBtn")
        ?.addEventListener(
            "click",
            () => {

                $("sidebar")
                    ?.classList
                    .toggle("open");

            }
        );


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


    document
        .querySelectorAll(
            "[data-language]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        setLanguage(
                            button.dataset.language
                        );

                    }
                );

            }
        );


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


    loadSharedChat();

}
```
