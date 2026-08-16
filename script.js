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

const STORAGE_KEY = "viggo_chats";
const SETTINGS_KEY = "viggo_settings";

let currentChatId = null;
let messages = [];
let currentLanguage = "en";
let voiceGender = "female";

let isSending = false;
let recognition = null;
let isListening = false;

let isSpeaking = false;
let currentSpeakingButton = null;

let selectionMode = false;
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

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadSettings();

        initializeChat();

        setupEvents();

        setupVoice();

        loadSharedChat();

        loadVoices();

    }
);


/* =========================================
   SETTINGS
========================================= */

function loadSettings() {

    try {

        const data = JSON.parse(
            localStorage.getItem(
                SETTINGS_KEY
            ) || "{}"
        );

        if (data.language) {
            currentLanguage = data.language;
        }

        if (data.voiceGender) {
            voiceGender = data.voiceGender;
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
                currentLanguage,

            voiceGender:
                voiceGender

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

    renderMessages();

    updateTitle();

    renderHistory();

}


/* =========================================
   OPEN CHAT
========================================= */

function openChat(id) {

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


/* =========================================
   HISTORY
========================================= */

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

}


/* =========================================
   HISTORY ITEM
========================================= */

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


            /* SELECT CHECKBOX */

            if (selectionMode) {

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

                        if (
                            checkbox.checked
                        ) {

                            selectedChats.add(
                                chat.id
                            );

                        } else {

                            selectedChats.delete(
                                chat.id
                            );

                        }

                        updateDeleteSelectedButton();

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


            const actions =
                document.createElement(
                    "div"
                );

            actions.className =
                "history-actions";


            /* PIN */

            if (!selectionMode) {

                const pin =
                    document.createElement(
                        "button"
                    );

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

                pin.onclick =
                    event => {

                        event.stopPropagation();

                        togglePin(
                            chat.id
                        );

                    };

                actions.appendChild(
                    pin
                );

            }


            row.appendChild(
                titleEl
            );

            row.appendChild(
                actions
            );


            row.onclick =
                () => {

                    if (selectionMode) {

                        const checkbox =
                            row.querySelector(
                                ".chat-checkbox"
                            );

                        if (checkbox) {

                            checkbox.checked =
                                !checkbox.checked;

                            if (
                                checkbox.checked
                            ) {

                                selectedChats.add(
                                    chat.id
                                );

                            } else {

                                selectedChats.delete(
                                    chat.id
                                );

                            }

                            updateDeleteSelectedButton();

                        }

                        return;

                    }

                    openChat(
                        chat.id
                    );

                };


            list.appendChild(
                row
            );

        }
    );

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

    if (!chat)
        return;

    chat.pinned =
        !chat.pinned;

    saveChats(chats);

    renderHistory();

}


/* =========================================
   SELECT CHATS
========================================= */

function toggleSelectionMode() {

    selectionMode =
        !selectionMode;

    selectedChats.clear();

    const button =
        $("selectChatsBtn");

    if (button) {

        button.textContent =
            selectionMode
                ? "✓ Done Selecting"
                : "☑ Select Chats";

    }

    renderHistory();

    updateDeleteSelectedButton();

}


/* =========================================
   DELETE SELECTED
========================================= */

function updateDeleteSelectedButton() {

    const button =
        $("deleteSelectedBtn");

    if (!button)
        return;

    if (
        selectionMode &&
        selectedChats.size > 0
    ) {

        button.style.display =
            "block";

        button.textContent =
            `🗑 Delete Selected (${selectedChats.size})`;

    } else {

        button.style.display =
            "none";

    }

}


/* =========================================
   DELETE SELECTED CHAT
========================================= */

function deleteSelectedChats() {

    if (
        selectedChats.size === 0
    ) {

        showToast(
            "Select chats first"
        );

        return;

    }


    if (
        !confirm(
            `Delete ${selectedChats.size} selected chat(s)?`
        )
    ) {

        return;

    }


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

        chats.push(
            createChat()
        );

    }


    saveChats(chats);


    if (
        selectedChats.has(
            currentChatId
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

    selectionMode =
        false;

    const button =
        $("selectChatsBtn");

    if (button) {

        button.textContent =
            "☑ Select Chats";

    }


    renderHistory();

    updateDeleteSelectedButton();

    showToast(
        "Selected chats deleted"
    );

}


/* =========================================
   DELETE SINGLE CHAT
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
   CLEAR HISTORY
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
   RENDER MESSAGES
========================================= */

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


/* =========================================
   ADD MESSAGE
========================================= */

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


    /* ASSISTANT ACTIONS */

    if (
        role === "assistant"
    ) {

        const actions =
            document.createElement(
                "div"
            );

        actions.className =
            "message-actions";


        /* COPY */

        const copy =
            document.createElement(
                "button"
            );

        copy.type =
            "button";

        copy.className =
            "message-action";

        copy.textContent =
            "📋";

        copy.title =
            "Copy";

        copy.onclick =
            () =>
                copyText(text);


        /* VOICE */

        const voice =
            document.createElement(
                "button"
            );

        voice.type =
            "button";

        voice.className =
            "message-action";

        voice.textContent =
            "🔊";

        voice.title =
            "Play / Stop voice";

        voice.onclick =
            () =>
                speakText(
                    text,
                    voice
                );


        actions.appendChild(
            copy
        );

        actions.appendChild(
            voice
        );


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


    const sendButton =
        $("sendBtn");

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


    if (sendButton) {

        sendButton.disabled =
            false;

    }

}


/* =========================================
   API
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

    if (!area)
        return;


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


    area.appendChild(
        div
    );

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

async function copyText(
    text
) {

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
   VOICE GENDER
========================================= */

function setVoiceGender(
    gender
) {

    voiceGender =
        gender;

    saveSettings();


    stopSpeaking();


    showToast(

        gender === "male"
            ? "👨 Male voice selected"
            : "👩 Female voice selected"

    );


    closeMore();

}


/* =========================================
   LOAD VOICES
========================================= */

function loadVoices() {

    if (
        !window.speechSynthesis
    )
        return;

    speechSynthesis.getVoices();

}


if (
    "speechSynthesis" in window
) {

    speechSynthesis.onvoiceschanged =
        loadVoices;

}


/* =========================================
   FIND VOICE
========================================= */

function getSelectedVoice() {

    if (
        !window.speechSynthesis
    )
        return null;


    const voices =
        speechSynthesis.getVoices();


    const languageMap = {

        en: "en-IN",
        ta: "ta-IN",
        hi: "hi-IN",
        ml: "ml-IN",
        te: "te-IN",
        kn: "kn-IN"

    };


    const lang =
        languageMap[
            currentLanguage
        ] || "en-IN";


    const languageCode =
        lang
            .split("-")[0]
            .toLowerCase();


    const sameLanguage =
        voices.filter(
            voice =>
                voice.lang &&
                voice.lang
                    .toLowerCase()
                    .startsWith(
                        languageCode
                    )
        );


    if (!sameLanguage.length)
        return null;


    const femaleWords = [

        "female",
        "woman",
        "girl",
        "samantha",
        "zira",
        "susan",
        "karen",
        "veena",
        "heera",
        "google uk english female"

    ];


    const maleWords = [

        "male",
        "man",
        "boy",
        "david",
        "mark",
        "daniel",
        "ravi",
        "google uk english male"

    ];


    const words =
        voiceGender === "male"
            ? maleWords
            : femaleWords;


    const matched =
        sameLanguage.find(
            voice => {

                const name =
                    voice.name
                        .toLowerCase();

                return words.some(
                    word =>
                        name.includes(
                            word
                        )
                );

            }
        );


    return (
        matched ||
        sameLanguage[0]
    );

}


/* =========================================
   SPEAK / STOP
========================================= */

function speakText(
    text,
    button = null
) {

    if (
        !window.speechSynthesis
    ) {

        showToast(
            "Voice not supported"
        );

        return;

    }


    /* STOP */

    if (isSpeaking) {

        stopSpeaking();

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


    const selectedVoice =
        getSelectedVoice();


    if (selectedVoice) {

        speech.voice =
            selectedVoice;

    }


    speech.rate =
        1;

    speech.pitch =
        voiceGender === "male"
            ? 0.90
            : 1.05;

    speech.volume =
        1;


    if (button) {

        button.textContent =
            "⏹️";

        currentSpeakingButton =
            button;

    }


    isSpeaking =
        true;


    speech.onend =
        () => {

            resetVoiceButton();

        };


    speech.onerror =
        () => {

            resetVoiceButton();

        };


    speechSynthesis.speak(
        speech
    );

}


/* =========================================
   STOP SPEAKING
========================================= */

function stopSpeaking() {

    if (
        window.speechSynthesis
    ) {

        speechSynthesis.cancel();

    }

    resetVoiceButton();

}


function resetVoiceButton() {

    isSpeaking =
        false;


    if (
        currentSpeakingButton
    ) {

        currentSpeakingButton.textContent =
            "🔊";

    }


    currentSpeakingButton =
        null;

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
                event
                    .results[0][0]
                    .transcript;


            const input =
                $("messageInput");


            if (input) {

                input.value =
                    text;

            }

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


/* =========================================
   TOGGLE MIC
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
        languageMap[
            currentLanguage
        ] || "en-IN";


    try {

        recognition.start();

    } catch (error) {

        console.error(
            error
        );

    }

}


/* =========================================
   SHARE CHAT
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


    /*
       Compact encoded share link.
       Note: this is shorter than
       the previous JSON-heavy link,
       but it still stores the chat
       inside the URL.
    */

    const chatData = {

        t:
            chat.title || "New Chat",

        m:
            chat.messages || []

    };


    const encoded =
        btoa(
            encodeURIComponent(
                JSON.stringify(
                    chatData
                )
            )
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
                "Short share link copied"
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
        params.get("c") ||
        params.get("chat");


    if (!encoded)
        return;


    try {

        const decoded =
            decodeURIComponent(
                atob(encoded)
            );


        const data =
            JSON.parse(
                decoded
            );


        let sharedMessages;
        let sharedTitle;


        /* New compact format */

        if (
            data &&
            Array.isArray(
                data.m
            )
        ) {

            sharedMessages =
                data.m;

            sharedTitle =
                data.t ||
                "Shared Chat";

        }

        /* Old format */

        else if (
            data &&
            Array.isArray(
                data.messages
            )
        ) {

            sharedMessages =
                data.messages;

            sharedTitle =
                data.title ||
                "Shared Chat";

        }

        else {

            throw new Error(
                "Invalid chat"
            );

        }


        messages =
            sharedMessages;


        currentChatId =
            "shared_" +
            Date.now();


        renderMessages();


        const title =
            $("chatTitle");


        if (title) {

            title.textContent =
                sharedTitle;

        }


        showToast(
            "Shared chat opened"
        );


    } catch (error) {

        console.error(
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

    if (!menu)
        return;

    menu.classList.toggle(
        "show"
    );

}


function closeMore() {

    const menu =
        $("moreMenu");

    if (menu) {

        menu.classList.remove(
            "show"
        );

    }

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


    /* MIC */

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
            toggleSelectionMode
        );


    /* DELETE SELECTED */

    $("deleteSelectedBtn")
        ?.addEventListener(
            "click",
            deleteSelectedChats
        );


    /* CLEAR */

    $("clearHistoryBtn")
        ?.addEventListener(
            "click",
            clearHistory
        );


    /* MOBILE */

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


    /* MESSAGE ENTER */

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


    /* MALE VOICE */

    $("maleVoiceBtn")
        ?.addEventListener(
            "click",
            () => {

                setVoiceGender(
                    "male"
                );

            }
        );


    /* FEMALE VOICE */

    $("femaleVoiceBtn")
        ?.addEventListener(
            "click",
            () => {

                setVoiceGender(
                    "female"
                );

            }
        );


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

}
```

**HTML-ல்** `More` menu-க்குள் Male/Female buttons இல்லையென்றால், இந்த பகுதியை மட்டும் சேர்க்க மறக்காதே:

```html
<div class="menu-divider"></div>

<div class="language-title">
    🎙️ Voice
</div>

<button
    id="maleVoiceBtn"
    type="button"
>
    👨 Male Voice
</button>

<button
    id="femaleVoiceBtn"
    type="button"
>
    👩 Female Voice
</button>
```

இப்போ:

* 👨 **Male Voice** → Male voice select
* 👩 **Female Voice** → Female voice select
* 🔊 → Voice play
* ⏹️ → Voice stop
* மீண்டும் page open செய்தாலும் voice choice save ஆகும்
* ☑ **Select Chats** → chats select
* 🗑 **Delete Selected** → selected chats மட்டும் delete
* 📌 Pin வேலை செய்யும்
* 💾 Save வேலை செய்யும்
* 🌐 Language selection வேலை செய்யும்
* ↗ Share → compact `?c=` share link உருவாகும்

**ஒரு முக்கியமான விஷயம்:** Browser-ல் available voice list-ல் உண்மையான male/female voices இல்லையென்றால், `Male Voice` / `Female Voice` option இருந்தாலும் browser fallback voice-ஐ பயன்படுத்தும். அதனால் **உண்மையான natural male/female AI voice** வேண்டுமென்றால் TTS service-ஐ server-ல் connect செய்ய வேண்டும்.
