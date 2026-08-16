"use strict";

/* =========================================================
   VIGGO AI - FULL SCRIPT
   Includes:
   - New Chat
   - Chat History
   - Pin / Delete
   - Select Chats
   - Clear History
   - Language
   - Send Message
   - Voice Input
   - AI Reply Speaker ON/OFF
   - Copy
   - Share
   - Typing indicator
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

/* Speaker state */
let speaking = false;
let speakingText = "";


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
    () => {

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
            localStorage.getItem(
                SETTINGS_KEY
            ) || "{}"
        );

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

    localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
            language:
                currentLanguage
        })
    );

}


/* =========================================================
   CHAT STORAGE
========================================================= */

function getChats() {

    try {

        const data = JSON.parse(
            localStorage.getItem(
                STORAGE_KEY
            ) || "[]"
        );

        return Array.isArray(data)
            ? data
            : [];

    } catch (error) {

        console.error(
            "Storage error:",
            error
        );

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


/* =========================================================
   INITIALIZE
========================================================= */

function initializeChat() {

    let chats = getChats();

    if (!chats.length) {

        const chat =
            createChat();

        chats = [chat];

        saveChats(chats);

    }

    chats.sort(
        (a, b) =>
            (b.updatedAt || 0) -
            (a.updatedAt || 0)
    );

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

    renderHistory();

}


/* =========================================================
   NEW CHAT
========================================================= */

function newChat() {

    stopSpeaking();

    const chat =
        createChat();

    const chats =
        getChats();

    chats.unshift(chat);

    saveChats(chats);

    currentChatId =
        chat.id;

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

    stopSpeaking();

    const chats =
        getChats();

    const chat =
        chats.find(
            item =>
                item.id === id
        );

    if (!chat)
        return;

    currentChatId =
        chat.id;

    messages =
        Array.isArray(
            chat.messages
        )
            ? chat.messages
            : [];

    renderMessages();

    updateTitle();

    renderHistory();

    $("sidebar")
        ?.classList
        .remove("open");

}


/* =========================================================
   UPDATE CHAT
========================================================= */

function updateChat() {

    const chats =
        getChats();

    const chat =
        chats.find(
            item =>
                item.id === currentChatId
        );

    if (!chat)
        return;

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

        const title =
            String(
                firstUser.content || ""
            )
                .replace(
                    /\s+/g,
                    " "
                )
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
   UPDATE TITLE
========================================================= */

function updateTitle() {

    const element =
        $("chatTitle");

    if (!element)
        return;

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


/* =========================================================
   HISTORY
========================================================= */

function renderHistory() {

    const list =
        $("historyList");

    if (!list)
        return;

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

    if (!chats.length)
        return;

    const heading =
        document.createElement(
            "div"
        );

    heading.className =
        "history-section-title";

    heading.textContent =
        sectionTitle;

    list.appendChild(
        heading
    );

    chats.forEach(
        chat => {

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

            if (selectMode) {

                row.classList.add(
                    "select-mode"
                );

                const checkbox =
                    document.createElement(
                        "input"
                    );

                checkbox.type =
                    "checkbox";

                checkbox.className =
                    "chat-checkbox";

                checkbox.checked =
                    selectedChats.has(
                        chat.id
                    );

                checkbox.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();

                    }
                );

                checkbox.addEventListener(
                    "change",
                    () => {

                        toggleSelectedChat(
                            chat.id
                        );

                    }
                );

                row.appendChild(
                    checkbox
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

            row.appendChild(
                titleEl
            );

            if (!selectMode) {

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

                pin.type =
                    "button";

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

                        togglePin(
                            chat.id
                        );

                    }
                );

                /* DELETE */

                const del =
                    document.createElement(
                        "button"
                    );

                del.type =
                    "button";

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

                        deleteChat(
                            chat.id
                        );

                    }
                );

                actions.appendChild(
                    pin
                );

                actions.appendChild(
                    del
                );

                row.appendChild(
                    actions
                );

            }

            row.addEventListener(
                "click",
                () => {

                    if (selectMode) {

                        toggleSelectedChat(
                            chat.id
                        );

                    } else {

                        openChat(
                            chat.id
                        );

                    }

                }
            );

            list.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   PIN
========================================================= */

function togglePin(id) {

    const chats =
        getChats();

    const chat =
        chats.find(
            item =>
                item.id === id
        );

    if (!chat)
        return;

    chat.pinned =
        !chat.pinned;

    chat.updatedAt =
        Date.now();

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

    const chats =
        getChats();

    const chat =
        chats.find(
            item =>
                item.id === id
        );

    if (!chat)
        return;

    const confirmed =
        confirm(
            `Delete "${chat.title || "New Chat"}"?`
        );

    if (!confirmed)
        return;

    let updated =
        chats.filter(
            item =>
                item.id !== id
        );

    if (!updated.length) {

        updated = [
            createChat()
        ];

    }

    saveChats(updated);

    if (
        currentChatId === id
    ) {

        stopSpeaking();

        currentChatId =
            updated[0].id;

        messages =
            updated[0].messages || [];

        renderMessages();

        updateTitle();

    }

    selectedChats.delete(id);

    renderHistory();

    showToast(
        "🗑 Chat deleted"
    );

}


/* =========================================================
   SELECT MODE
========================================================= */

function toggleSelectMode() {

    selectMode =
        !selectMode;

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

    if (
        selectedChats.has(id)
    ) {

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

    if (
        !selectedChats.size
    ) {

        showToast(
            "Select at least one chat"
        );

        return;

    }

    const count =
        selectedChats.size;

    const confirmed =
        confirm(
            `Delete ${count} selected chat${count > 1 ? "s" : ""}?`
        );

    if (!confirmed)
        return;

    let chats =
        getChats();

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
                chat.id ===
                currentChatId
        )
    ) {

        stopSpeaking();

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

    const button =
        $("deleteSelectedBtn");

    if (button) {

        if (selectMode) {

            button.style.display =
                "flex";

            button.textContent =
                selectedChats.size
                    ? `🗑 Delete Selected (${selectedChats.size})`
                    : "🗑 Delete Selected";

        } else {

            button.style.display =
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

    showToast(
        "✓ Chat saved"
    );

    closeMore();

}


/* =========================================================
   CLEAR HISTORY
========================================================= */

function clearHistory() {

    const confirmed =
        confirm(
            "Delete all chat history?"
        );

    if (!confirmed)
        return;

    stopSpeaking();

    const chat =
        createChat();

    saveChats([
        chat
    ]);

    currentChatId =
        chat.id;

    messages = [];

    selectedChats.clear();

    selectMode = false;

    renderMessages();

    updateTitle();

    renderHistory();

    updateSelectionUI();

    closeMore();

    showToast(
        "🗑 History cleared"
    );

}


/* =========================================================
   RENDER MESSAGES
========================================================= */

function renderMessages() {

    const area =
        $("messages");

    if (!area)
        return;

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

    const area =
        $("messages");

    if (!area)
        return;

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


    /* =====================================================
       ASSISTANT ACTIONS
    ===================================================== */

    if (
        role === "assistant"
    ) {

        const actions =
            document.createElement(
                "div"
            );

        actions.className =
            "message-actions";


        /* =================================================
           COPY BUTTON
        ================================================= */

        const copy =
            document.createElement(
                "button"
            );

        copy.type =
            "button";

        copy.className =
            "message-action";

        copy.title =
            "Copy";

        copy.textContent =
            "📋";

        copy.addEventListener(
            "click",
            () => {

                copyText(
                    text
                );

            }
        );


        /* =================================================
           SPEAKER BUTTON
        ================================================= */

        const speaker =
            document.createElement(
                "button"
            );

        speaker.type =
            "button";

        speaker.className =
            "message-action speaker-button";

        speaker.title =
            "Read aloud";

        speaker.textContent =
            "🔊";


        speaker.addEventListener(
            "click",
            () => {

                toggleSpeak(
                    text,
                    speaker
                );

            }
        );


        actions.appendChild(
            copy
        );

        actions.appendChild(
            speaker
        );

        wrapper.appendChild(
            actions
        );

    }


    area.appendChild(
        wrapper
    );

}


/* =========================================================
   SPEAKER TOGGLE
========================================================= */

function toggleSpeak(
    text,
    button
) {

    if (
        !window.speechSynthesis
    ) {

        showToast(
            "Voice not supported"
        );

        return;

    }


    /* -----------------------------------------
       IF CURRENTLY SPEAKING
    ----------------------------------------- */

    if (
        speaking &&
        speakingText === text
    ) {

        stopSpeaking();

        return;

    }


    /* -----------------------------------------
       STOP OLD VOICE
    ----------------------------------------- */

    speechSynthesis.cancel();

    resetSpeakerButtons();


    /* -----------------------------------------
       NEW SPEECH
    ----------------------------------------- */

    speaking = true;

    speakingText =
        text;


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


    /* NORMAL VOICE */

    speech.rate =
        1.0;

    speech.pitch =
        1.0;

    speech.volume =
        1.0;


    /* Change clicked button */

    if (button) {

        button.textContent =
            "⏹";

        button.title =
            "Stop";

        button.classList.add(
            "speaking"
        );

    }


    speech.onend =
        () => {

            speaking =
                false;

            speakingText =
                "";

            resetSpeakerButtons();

        };


    speech.onerror =
        () => {

            speaking =
                false;

            speakingText =
                "";

            resetSpeakerButtons();

        };


    speechSynthesis.speak(
        speech
    );

}


/* =========================================================
   STOP SPEAKING
========================================================= */

function stopSpeaking() {

    if (
        window.speechSynthesis
    ) {

        speechSynthesis.cancel();

    }

    speaking =
        false;

    speakingText =
        "";

    resetSpeakerButtons();

}


/* =========================================================
   RESET SPEAKER BUTTONS
========================================================= */

function resetSpeakerButtons() {

    document
        .querySelectorAll(
            ".speaker-button"
        )
        .forEach(
            button => {

                button.textContent =
                    "🔊";

                button.title =
                    "Read aloud";

                button.classList.remove(
                    "speaking"
                );

            }
        );

}


/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage() {

    if (isSending)
        return;

    const input =
        $("messageInput");

    const sendButton =
        $("sendBtn");

    if (!input)
        return;

    const text =
        input.value.trim();

    if (!text)
        return;

    isSending =
        true;

    if (sendButton) {

        sendButton.disabled =
            true;

    }

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
            await askViggo(
                text
            );

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

    }

    catch (error) {

        removeTyping();

        console.error(
            "Viggo error:",
            error
        );

        messages.push({

            role:
                "assistant",

            content:
                "⚠️ " +
                (
                    error.message ||
                    "Viggo AI error"
                ),

            timestamp:
                Date.now()

        });

        renderMessages();

        updateChat();

    }

    finally {

        isSending =
            false;

        if (sendButton) {

            sendButton.disabled =
                false;

        }

        input.focus();

    }

}


/* =========================================================
   API
========================================================= */

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

        data =
            JSON.parse(raw);

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

    return String(
        data.reply
    );

}


/* =========================================================
   TYPING
========================================================= */

function showTyping() {

    const area =
        $("messages");

    if (!area)
        return;

    removeTyping();

    const div =
        document.createElement(
            "div"
        );

    div.id =
        "viggoTyping";

    div.className =
        "message assistant-message";

    div.innerHTML = `

        <div class="message-bubble typing-bubble">

            <span>●</span>
            <span>●</span>
            <span>●</span>

        </div>

    `;

    area.appendChild(
        div
    );

    scrollBottom();

}


/* =========================================================
   REMOVE TYPING
========================================================= */

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

async function copyText(
    text
) {

    try {

        if (
            navigator.clipboard
        ) {

            await navigator.clipboard.writeText(
                text
            );

        } else {

            throw new Error();

        }

    }

    catch {

        const textarea =
            document.createElement(
                "textarea"
            );

        textarea.value =
            text;

        textarea.style.position =
            "fixed";

        textarea.style.opacity =
            "0";

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
        "✓ Copied"
    );

}


/* =========================================================
   VOICE OUTPUT
========================================================= */

function speakText(
    text
) {

    toggleSpeak(
        text,
        null
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

    recognition.maxAlternatives =
        1;

    recognition.onstart =
        () => {

            isListening =
                true;

            $("voiceBtn")
                ?.classList
                .add(
                    "active"
                );

            showToast(
                "🎤 Listening..."
            );

        };

    recognition.onresult =
        event => {

            const result =
                event.results?.[0]?.[0];

            if (!result)
                return;

            const input =
                $("messageInput");

            if (input) {

                input.value =
                    result.transcript;

                input.focus();

            }

        };

    recognition.onerror =
        event => {

            console.error(
                "Voice error:",
                event.error
            );

            showToast(
                event.error ===
                "not-allowed"
                    ? "Microphone permission denied"
                    : "Voice error"
            );

        };

    recognition.onend =
        () => {

            isListening =
                false;

            $("voiceBtn")
                ?.classList
                .remove(
                    "active"
                );

        };

}


/* =========================================================
   TOGGLE VOICE INPUT
========================================================= */

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

    try {

        recognition.start();

    }

    catch (error) {

        console.error(
            error
        );

    }

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
                item.id ===
                currentChatId
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
                chat.title,

            messages:
                chat.messages

        });

    let encoded;

    try {

        encoded =
            btoa(
                unescape(
                    encodeURIComponent(
                        json
                    )
                )
            )
                .replace(
                    /\+/g,
                    "-"
                )
                .replace(
                    /\//g,
                    "_"
                )
                .replace(
                    /=+$/,
                    ""
                );

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

        }

        else {

            await copyText(
                link
            );

            showToast(
                "🔗 Share link copied"
            );

        }

    }

    catch (error) {

        if (
            error?.name !==
            "AbortError"
        ) {

            console.error(
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
        params.get(
            "chat"
        );

    if (!encoded)
        return;

    try {

        let fixed =
            encoded
                .replace(
                    /-/g,
                    "+"
                )
                .replace(
                    /_/g,
                    "/"
                );

        while (
            fixed.length % 4
        ) {

            fixed += "=";

        }

        const json =
            decodeURIComponent(
                escape(
                    atob(
                        fixed
                    )
                )
            );

        const chat =
            JSON.parse(
                json
            );

        if (
            !chat ||
            !Array.isArray(
                chat.messages
            )
        ) {

            throw new Error(
                "Invalid shared chat"
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
            "🔗 Shared chat opened"
        );

    }

    catch (error) {

        console.error(
            "Share error:",
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

    const menu =
        $("moreMenu");

    if (!menu)
        return;

    menu.classList.toggle(
        "show"
    );

}


function closeMore() {

    $("moreMenu")
        ?.classList
        .remove(
            "show"
        );

}


/* =========================================================
   LANGUAGE
========================================================= */

function setLanguage(
    language
) {

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

function showToast(
    message
) {

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

    toast.classList.add(
        "show"
    );

    clearTimeout(
        toast.timer
    );

    toast.timer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

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

    if (!area)
        return;

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


    $("selectChatsBtn")
        ?.addEventListener(
            "click",
            toggleSelectMode
        );


    $("deleteSelectedBtn")
        ?.addEventListener(
            "click",
            deleteSelectedChats
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
                    .toggle(
                        "open"
                    );

            }
        );


    $("messageInput")
        ?.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter" &&
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


/* =========================================================
   PREVENT FORM SUBMIT
========================================================= */

document.addEventListener(
    "submit",
    event => {

        event.preventDefault();

    }
);
