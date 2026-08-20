"use strict";

/* =========================================================
   VIGGO AI - FULL WORKING SCRIPT
   ========================================================= */

/* =========================
   CONFIG
========================= */

const API_URL =
    "https://ai-tool-2-zpul.onrender.com";

const STORAGE = {
    chats: "viggo_chats",
    currentChat: "viggo_current_chat",
    language: "viggo_language",
    voice: "viggo_voice"
};


/* =========================
   STATE
========================= */

let chats = [];

let currentChatId = null;

let selectedLanguage =
    localStorage.getItem(STORAGE.language) || "en";

let selectedVoice =
    localStorage.getItem(STORAGE.voice) || "female";

let isSending = false;


/* =========================
   LOAD STORAGE
========================= */

try {

    chats =
        JSON.parse(
            localStorage.getItem(STORAGE.chats) || "[]"
        );

} catch {

    chats = [];

}

currentChatId =
    localStorage.getItem(
        STORAGE.currentChat
    );


/* =========================
   HELPERS
========================= */

function $(selector) {
    return document.querySelector(selector);
}

function all(selector) {
    return [...document.querySelectorAll(selector)];
}

function createId() {

    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .substring(2, 10)
    );

}

function escapeHTML(text) {

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

function saveChats() {

    localStorage.setItem(
        STORAGE.chats,
        JSON.stringify(chats)
    );

}

function saveCurrentChat() {

    if (currentChatId) {

        localStorage.setItem(
            STORAGE.currentChat,
            currentChatId
        );

    }

}


/* =========================
   INPUT
========================= */

function getInput() {

    return (
        $("#messageInput") ||
        $("#chatInput") ||
        $(".message-input") ||
        $(".chat-input") ||
        document.querySelector(
            "textarea"
        )
    );

}


/* =========================================================
   CHAT
========================================================= */

function createChat() {

    const chat = {

        id: createId(),

        title: "New Chat",

        createdAt:
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString(),

        messages: []

    };

    chats.unshift(chat);

    currentChatId =
        chat.id;

    saveChats();

    saveCurrentChat();

    renderHistory();

    renderMessages();

    return chat;

}


function getCurrentChat() {

    let chat =
        chats.find(
            item =>
                item.id ===
                currentChatId
        );

    if (!chat) {

        chat =
            createChat();

    }

    return chat;

}


/* =========================================================
   NEW CHAT
========================================================= */

function newChat() {

    createChat();

    const input =
        getInput();

    if (input) {

        input.value = "";

        input.focus();

    }

}


/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage() {

    if (isSending) {
        return;
    }

    const input =
        getInput();

    if (!input) {

        console.error(
            "Viggo: message input not found."
        );

        return;

    }

    const message =
        input.value.trim();

    if (!message) {
        return;
    }


    const chat =
        getCurrentChat();


    /* USER MESSAGE */

    chat.messages.push({

        id: createId(),

        role: "user",

        content: message,

        time:
            new Date().toISOString()

    });


    if (
        chat.title ===
        "New Chat"
    ) {

        chat.title =
            message.length > 35
                ? message.substring(0, 35) + "..."
                : message;

    }


    chat.updatedAt =
        new Date().toISOString();


    input.value = "";

    saveChats();

    renderMessages();

    renderHistory();


    isSending = true;

    setSending(true);


    const loadingId =
        createId();


    addLoading(
        loadingId
    );


    try {

        const reply =
            await askViggo(
                message,
                chat.messages
            );


        removeLoading(
            loadingId
        );


        if (!reply) {

            throw new Error(
                "Empty response from Viggo."
            );

        }


        chat.messages.push({

            id: createId(),

            role: "assistant",

            content: reply,

            time:
                new Date().toISOString(),

            liked: false

        });


        chat.updatedAt =
            new Date().toISOString();


        saveChats();

        renderMessages();

        renderHistory();

    }


    catch (error) {

        console.error(
            "Viggo error:",
            error
        );


        removeLoading(
            loadingId
        );


        const errorText =
            error?.message ||
            "Unknown error";


        addAssistantMessage(
            "⚠️ " +
            errorText
        );

    }


    finally {

        isSending = false;

        setSending(false);

    }

}


/* =========================================================
   ASK VIGGO
========================================================= */

async function askViggo(
    message,
    messages
) {

    const url =
        API_URL + "/chat";


    console.log(
        "→ Viggo request:",
        url
    );


    const history =
        Array.isArray(messages)
            ? messages
                .slice(-12)
                .map(item => ({

                    role:
                        item.role,

                    content:
                        String(
                            item.content || ""
                        )

                }))
            : [];


    let response;


    try {

        response =
            await fetch(
                url,
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
                                message,

                            language:
                                selectedLanguage,

                            history:
                                history

                        })

                }
            );

    }


    catch (networkError) {

        console.error(
            "Fetch failed:",
            networkError
        );

        throw new Error(
            "Viggo server connection failed."
        );

    }


    console.log(
        "← HTTP:",
        response.status
    );


    /* IMPORTANT:
       Read TEXT first.
       This catches HTML / proxy errors too.
    */

    const raw =
        await response.text();


    console.log(
        "← Server response:",
        raw
    );


    let data = null;


    if (raw.trim()) {

        try {

            data =
                JSON.parse(raw);

        }

        catch (parseError) {

            console.error(
                "JSON parse error:",
                parseError
            );

            console.error(
                "Raw server response:",
                raw
            );


            throw new Error(
                "Server returned invalid JSON."
            );

        }

    }


    /* HTTP ERROR */

    if (!response.ok) {

        if (data) {

            throw new Error(

                data.details ||
                data.error ||
                `Server error ${response.status}`

            );

        }


        throw new Error(
            `Server error ${response.status}`
        );

    }


    /* EMPTY RESPONSE */

    if (!data) {

        throw new Error(
            "Server returned an empty response."
        );

    }


    /* EXPECTED RESPONSE */

    if (
        data.success === true &&
        typeof data.reply ===
            "string"
    ) {

        return data.reply.trim();

    }


    /* OTHER POSSIBLE RESPONSE FORMAT */

    if (
        typeof data.reply ===
        "string"
    ) {

        return data.reply.trim();

    }


    if (
        typeof data.message ===
        "string" &&
        data.success === true
    ) {

        return data.message.trim();

    }


    console.error(
        "Unexpected server JSON:",
        data
    );


    throw new Error(
        data.details ||
        data.error ||
        "Server invalid response."
    );

}


/* =========================================================
   ASSISTANT MESSAGE
========================================================= */

function addAssistantMessage(
    text
) {

    const chat =
        getCurrentChat();


    chat.messages.push({

        id: createId(),

        role: "assistant",

        content: text,

        time:
            new Date().toISOString(),

        liked: false

    });


    chat.updatedAt =
        new Date().toISOString();


    saveChats();

    renderMessages();

}


/* =========================================================
   RENDER MESSAGES
========================================================= */

function getMessageContainer() {

    return (
        $("#messages") ||
        $("#chatMessages") ||
        $(".messages") ||
        $(".chat-messages")
    );

}


function renderMessages() {

    const container =
        getMessageContainer();

    if (!container) {

        console.warn(
            "Viggo: message container not found."
        );

        return;

    }


    const chat =
        getCurrentChat();


    container.innerHTML = "";


    if (
        !chat.messages.length
    ) {

        container.innerHTML = `

            <div class="welcome-message">

                <h2>
                    Hi, I'm Viggo AI 👋
                </h2>

                <p>
                    How can I help you today?
                </p>

            </div>

        `;

        return;

    }


    chat.messages.forEach(
        message => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "message-row " +
                (
                    message.role ===
                    "user"
                        ? "user-message"
                        : "assistant-message"
                );


            const bubble =
                document.createElement(
                    "div"
                );


            bubble.className =
                "message-bubble";


            const content =
                document.createElement(
                    "div"
                );


            content.className =
                "message-content";


            content.innerHTML =
                escapeHTML(
                    message.content
                ).replace(
                    /\n/g,
                    "<br>"
                );


            bubble.appendChild(
                content
            );


            /* ASSISTANT ACTIONS */

            if (
                message.role ===
                "assistant"
            ) {

                const actions =
                    document.createElement(
                        "div"
                    );


                actions.className =
                    "message-actions";


                actions.innerHTML = `

                    <button
                        class="msg-action"
                        data-action="copy"
                        data-id="${message.id}"
                        title="Copy">
                        📋
                    </button>

                    <button
                        class="msg-action"
                        data-action="share"
                        data-id="${message.id}"
                        title="Share">
                        🔗
                    </button>

                    <button
                        class="msg-action ${
                            message.liked
                                ? "active"
                                : ""
                        }"
                        data-action="like"
                        data-id="${message.id}"
                        title="Like">
                        ❤️
                    </button>

                    <button
                        class="msg-action"
                        data-action="speak"
                        data-id="${message.id}"
                        title="Speaker">
                        🔊
                    </button>

                `;


                bubble.appendChild(
                    actions
                );

            }


            row.appendChild(
                bubble
            );


            container.appendChild(
                row
            );

        }
    );


    container.scrollTop =
        container.scrollHeight;


    attachMessageActions();

}


/* =========================================================
   MESSAGE ACTIONS
========================================================= */

function attachMessageActions() {

    all(
        "[data-action='copy']"
    )
    .forEach(
        button => {

            button.onclick =
                () =>
                    copyMessage(
                        button.dataset.id
                    );

        }
    );


    all(
        "[data-action='share']"
    )
    .forEach(
        button => {

            button.onclick =
                () =>
                    shareMessage(
                        button.dataset.id
                    );

        }
    );


    all(
        "[data-action='like']"
    )
    .forEach(
        button => {

            button.onclick =
                () =>
                    likeMessage(
                        button.dataset.id
                    );

        }
    );


    all(
        "[data-action='speak']"
    )
    .forEach(
        button => {

            button.onclick =
                () =>
                    speakMessage(
                        button.dataset.id
                    );

        }
    );

}


/* =========================================================
   COPY
========================================================= */

async function copyMessage(
    id
) {

    const chat =
        getCurrentChat();


    const message =
        chat.messages.find(
            item =>
                item.id === id
        );


    if (!message) {
        return;
    }


    try {

        await navigator.clipboard.writeText(
            message.content
        );

        showToast(
            "Copied ✓"
        );

    }

    catch {

        showToast(
            "Copy failed"
        );

    }

}


/* =========================================================
   LIKE
========================================================= */

function likeMessage(
    id
) {

    const chat =
        getCurrentChat();


    const message =
        chat.messages.find(
            item =>
                item.id === id
        );


    if (!message) {
        return;
    }


    message.liked =
        !message.liked;


    saveChats();

    renderMessages();

}


/* =========================================================
   SPEAKER
========================================================= */

function speakMessage(
    id
) {

    if (
        !("speechSynthesis" in window)
    ) {

        showToast(
            "Voice not supported"
        );

        return;

    }


    const chat =
        getCurrentChat();


    const message =
        chat.messages.find(
            item =>
                item.id === id
        );


    if (!message) {
        return;
    }


    speechSynthesis.cancel();


    const utterance =
        new SpeechSynthesisUtterance(
            message.content
        );


    utterance.lang =
        speechLanguage(
            selectedLanguage
        );


    const voices =
        speechSynthesis.getVoices();


    const languageCode =
        utterance.lang
            .split("-")[0]
            .toLowerCase();


    const matching =
        voices.filter(
            voice =>
                voice.lang
                    ?.toLowerCase()
                    .startsWith(
                        languageCode
                    )
        );


    if (
        selectedVoice ===
        "female"
    ) {

        const female =
            matching.find(
                voice =>
                    /female|zira|samantha|susan|google.*female|microsoft.*female/i
                        .test(
                            voice.name
                        )
            );


        if (female) {

            utterance.voice =
                female;

        }

    }


    if (
        selectedVoice ===
        "male"
    ) {

        const male =
            matching.find(
                voice =>
                    /male|david|alex|mark|google.*male|microsoft.*male/i
                        .test(
                            voice.name
                        )
            );


        if (male) {

            utterance.voice =
                male;

        }

    }


    speechSynthesis.speak(
        utterance
    );

}


function speechLanguage(
    language
) {

    const languages = {

        en: "en-US",

        ta: "ta-IN",

        hi: "hi-IN",

        ml: "ml-IN",

        te: "te-IN",

        kn: "kn-IN",

        bn: "bn-IN",

        mr: "mr-IN",

        gu: "gu-IN",

        pa: "pa-IN",

        ur: "ur-IN",

        es: "es-ES",

        fr: "fr-FR",

        de: "de-DE",

        ja: "ja-JP",

        ko: "ko-KR",

        zh: "zh-CN",

        ar: "ar-SA"

    };


    return (
        languages[language] ||
        "en-US"
    );

}


/* =========================================================
   SHARE MESSAGE
========================================================= */

async function shareMessage(
    id
) {

    const chat =
        getCurrentChat();


    const message =
        chat.messages.find(
            item =>
                item.id === id
        );


    if (!message) {
        return;
    }


    const text =
        "Viggo AI\n\n" +
        message.content;


    if (
        navigator.share
    ) {

        try {

            await navigator.share({

                title:
                    "Viggo AI",

                text:
                    text

            });

            return;

        }

        catch {

            /* cancelled */

        }

    }


    try {

        await navigator.clipboard.writeText(
            text
        );

        showToast(
            "Share text copied ✓"
        );

    }

    catch {

        showToast(
            "Share unavailable"
        );

    }

}


/* =========================================================
   SHARE CURRENT CHAT
========================================================= */

async function shareCurrentChat() {

    const chat =
        getCurrentChat();


    const text =
        chat.messages
            .map(
                item =>
                    `${
                        item.role ===
                        "user"
                            ? "You"
                            : "Viggo"
                    }: ${item.content}`
            )
            .join("\n\n");


    if (
        navigator.share
    ) {

        try {

            await navigator.share({

                title:
                    chat.title,

                text:
                    text

            });

            return;

        }

        catch {

            /* cancelled */

        }

    }


    try {

        await navigator.clipboard.writeText(
            text
        );

        showToast(
            "Chat copied ✓"
        );

    }

    catch {

        showToast(
            "Share failed"
        );

    }

}


/* =========================================================
   HISTORY
========================================================= */

function getHistoryContainer() {

    return (
        $("#chatHistory") ||
        $("#history") ||
        $(".chat-history") ||
        $(".history")
    );

}


function renderHistory() {

    const container =
        getHistoryContainer();


    if (!container) {

        console.warn(
            "Viggo: history container not found."
        );

        return;

    }


    container.innerHTML = "";


    const sorted =
        [...chats].sort(
            (a, b) =>
                new Date(b.updatedAt) -
                new Date(a.updatedAt)
        );


    sorted.forEach(
        chat => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "history-item " +
                (
                    chat.id ===
                    currentChatId
                        ? "active"
                        : ""
                );


            item.innerHTML = `

                <button
                    class="history-chat"
                    data-chat-id="${chat.id}">

                    <span>
                        💬
                    </span>

                    <span>
                        ${escapeHTML(
                            chat.title
                        )}
                    </span>

                </button>

                <button
                    class="history-more"
                    data-chat-id="${chat.id}"
                    title="More">
                    ⋯
                </button>

            `;


            container.appendChild(
                item
            );

        }
    );


    all(
        ".history-chat"
    )
    .forEach(
        button => {

            button.onclick =
                () =>
                    openChat(
                        button.dataset.chatId
                    );

        }
    );


    all(
        ".history-more"
    )
    .forEach(
        button => {

            button.onclick =
                event => {

                    event.stopPropagation();

                    showHistoryMenu(
                        button.dataset.chatId,
                        button
                    );

                };

        }
    );

}


/* =========================================================
   OPEN CHAT
========================================================= */

function openChat(
    id
) {

    const chat =
        chats.find(
            item =>
                item.id === id
        );


    if (!chat) {
        return;
    }


    currentChatId =
        id;


    saveCurrentChat();

    renderHistory();

    renderMessages();

}


/* =========================================================
   DELETE CHAT
========================================================= */

function deleteChat(
    id
) {

    const confirmed =
        confirm(
            "Delete this chat?"
        );


    if (!confirmed) {
        return;
    }


    chats =
        chats.filter(
            chat =>
                chat.id !== id
        );


    if (
        currentChatId === id
    ) {

        if (
            chats.length
        ) {

            currentChatId =
                chats[0].id;

        } else {

            currentChatId =
                null;

            createChat();

        }

    }


    saveChats();

    saveCurrentChat();

    renderHistory();

    renderMessages();

}


/* =========================================================
   CLEAR ALL
========================================================= */

function clearAllChats() {

    const confirmed =
        confirm(
            "Clear all chat history?"
        );


    if (!confirmed) {
        return;
    }


    chats = [];

    currentChatId =
        null;


    localStorage.removeItem(
        STORAGE.chats
    );

    localStorage.removeItem(
        STORAGE.currentChat
    );


    createChat();

}


/* =========================================================
   HISTORY MORE MENU
========================================================= */

function showHistoryMenu(
    id,
    button
) {

    closeMenus();


    const menu =
        document.createElement(
            "div"
        );


    menu.className =
        "viggo-history-menu";


    menu.innerHTML = `

        <button data-action="delete">
            🗑 Delete
        </button>

        <button data-action="share">
            🔗 Share
        </button>

        <button data-action="select">
            ☑ Select
        </button>

    `;


    document.body.appendChild(
        menu
    );


    const rect =
        button.getBoundingClientRect();


    menu.style.position =
        "fixed";

    menu.style.top =
        `${rect.bottom + 4}px`;

    menu.style.left =
        `${Math.max(
            10,
            rect.left - 120
        )}px`;


    menu.querySelector(
        "[data-action='delete']"
    ).onclick =
        () => {

            menu.remove();

            deleteChat(id);

        };


    menu.querySelector(
        "[data-action='share']"
    ).onclick =
        () => {

            menu.remove();

            openChat(id);

            shareCurrentChat();

        };


    menu.querySelector(
        "[data-action='select']"
    ).onclick =
        () => {

            menu.remove();

            openChat(id);

        };

}


function closeMenus() {

    all(
        ".viggo-history-menu"
    )
    .forEach(
        menu =>
            menu.remove()
    );

}


/* =========================================================
   PLUS MENU
========================================================= */

function openPlusMenu() {

    const old =
        $(".viggo-plus-menu");


    if (old) {

        old.remove();

        return;

    }


    const menu =
        document.createElement(
            "div"
        );


    menu.className =
        "viggo-plus-menu";


    menu.innerHTML = `

        <button data-type="photo">
            📷 Photos
        </button>

        <button data-type="video">
            🎥 Videos
        </button>

        <button data-type="file">
            📎 Files
        </button>

    `;


    document.body.appendChild(
        menu
    );


    menu.querySelector(
        "[data-type='photo']"
    ).onclick =
        () => {

            filePicker(
                "image/*"
            );

            menu.remove();

        };


    menu.querySelector(
        "[data-type='video']"
    ).onclick =
        () => {

            filePicker(
                "video/*"
            );

            menu.remove();

        };


    menu.querySelector(
        "[data-type='file']"
    ).onclick =
        () => {

            filePicker(
                "*/*"
            );

            menu.remove();

        };

}


/* =========================================================
   FILE PICKER
========================================================= */

function filePicker(
    accept
) {

    const input =
        document.createElement(
            "input"
        );


    input.type =
        "file";

    input.accept =
        accept;

    input.multiple =
        true;


    input.onchange =
        () => {

            if (
                !input.files.length
            ) {
                return;
            }


            const names =
                [...input.files]
                    .map(
                        file =>
                            file.name
                    )
                    .join(", ");


            showToast(
                names
            );

        };


    input.click();

}


/* =========================================================
   LANGUAGE
========================================================= */

function setLanguage(
    language
) {

    selectedLanguage =
        language;


    localStorage.setItem(
        STORAGE.language,
        language
    );


    showToast(
        "Language changed ✓"
    );

}


/* =========================================================
   VOICE
========================================================= */

function setVoice(
    voice
) {

    selectedVoice =
        voice;


    localStorage.setItem(
        STORAGE.voice,
        voice
    );


    showToast(
        voice === "female"
            ? "Female voice selected ✓"
            : "Male voice selected ✓"
    );

}


/* =========================================================
   VOICE ON/OFF
========================================================= */

let voiceEnabled =
    true;


function toggleVoice() {

    voiceEnabled =
        !voiceEnabled;


    if (
        !voiceEnabled &&
        "speechSynthesis" in window
    ) {

        speechSynthesis.cancel();

    }


    showToast(
        voiceEnabled
            ? "Voice ON 🔊"
            : "Voice OFF 🔇"
    );

}


/* =========================================================
   LOADING
========================================================= */

function addLoading(
    id
) {

    const container =
        getMessageContainer();


    if (!container) {
        return;
    }


    const row =
        document.createElement(
            "div"
        );


    row.id =
        "viggo-loading-" + id;


    row.className =
        "message-row assistant-message";


    row.innerHTML = `

        <div class="message-bubble">

            <div class="typing">
                <span></span>
                <span></span>
                <span></span>
            </div>

        </div>

    `;


    container.appendChild(
        row
    );


    container.scrollTop =
        container.scrollHeight;

}


function removeLoading(
    id
) {

    const element =
        document.getElementById(
            "viggo-loading-" + id
        );


    if (element) {
        element.remove();
    }

}


/* =========================================================
   SEND BUTTON STATE
========================================================= */

function setSending(
    state
) {

    const button =
        $("#sendButton") ||
        $("#sendBtn") ||
        $(".send-button") ||
        $(".send-btn");


    if (!button) {
        return;
    }


    button.disabled =
        state;


    button.style.opacity =
        state
            ? "0.6"
            : "1";

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message
) {

    let toast =
        $(".viggo-toast");


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );


        toast.className =
            "viggo-toast";


        document.body.appendChild(
            toast
        );

    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toast._timer
    );


    toast._timer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            1800
        );

}


/* =========================================================
   ENTER KEY
========================================================= */

function inputKeydown(
    event
) {

    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {

        event.preventDefault();

        sendMessage();

    }

}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "✓ Viggo script loaded."
        );


        /* CREATE CHAT */

        if (
            !chats.length
        ) {

            createChat();

        } else if (
            !chats.some(
                chat =>
                    chat.id ===
                    currentChatId
            )
        ) {

            currentChatId =
                chats[0].id;

            saveCurrentChat();

        }


        renderHistory();

        renderMessages();


        /* SEND */

        const sendButton =
            $("#sendButton") ||
            $("#sendBtn") ||
            $(".send-button") ||
            $(".send-btn");


        if (sendButton) {

            sendButton.onclick =
                sendMessage;

        }


        /* INPUT */

        const input =
            getInput();


        if (input) {

            input.addEventListener(
                "keydown",
                inputKeydown
            );

        }


        /* PLUS */

        const plusButton =
            $("#plusButton") ||
            $("#plusBtn") ||
            $(".plus-button") ||
            $(".plus-btn");


        if (plusButton) {

            plusButton.onclick =
                event => {

                    event.stopPropagation();

                    openPlusMenu();

                };

        }


        /* NEW CHAT */

        const newButton =
            $("#newChat") ||
            $("#newChatButton") ||
            $(".new-chat");


        if (newButton) {

            newButton.onclick =
                newChat;

        }


        /* SHARE */

        const shareButton =
            $("#shareButton") ||
            $("#shareChat") ||
            $(".share-chat");


        if (shareButton) {

            shareButton.onclick =
                shareCurrentChat;

        }


        /* CLEAR */

        const clearButton =
            $("#clearHistory") ||
            $("#clearChats");


        if (clearButton) {

            clearButton.onclick =
                clearAllChats;

        }


        /* VOICE */

        const voiceButton =
            $("#voiceButton") ||
            $("#voiceToggle") ||
            $(".voice-button");


        if (voiceButton) {

            voiceButton.onclick =
                toggleVoice;

        }


        /* SPEECH VOICES */

        if (
            "speechSynthesis" in window
        ) {

            speechSynthesis.onvoiceschanged =
                () => {

                    speechSynthesis.getVoices();

                };

        }

    }
);


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.sendMessage =
    sendMessage;

window.askViggo =
    askViggo;

window.newChat =
    newChat;

window.openChat =
    openChat;

window.deleteChat =
    deleteChat;

window.clearAllChats =
    clearAllChats;

window.openPlusMenu =
    openPlusMenu;

window.shareCurrentChat =
    shareCurrentChat;

window.setLanguage =
    setLanguage;

window.setVoice =
    setVoice;

window.toggleVoice =
    toggleVoice;

console.log(
    "✓ Viggo AI script ready."
);
