
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


/* =========================================
   STATE
========================================= */

let currentChatId = null;

let messages = [];

let currentLanguage = "en";

let isSending = false;

let recognition = null;

let isListening = false;

let selectedChats = new Set();

let isSelectMode = false;

let currentSpeech = null;


/* =========================================
   DOM HELPER
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

        setupVoiceStyle();

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

    let chats =
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

    selectedChats.clear();

    isSelectMode = false;

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

    stopSpeaking();

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

    updateSelectionButtons();

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


            if (
                selectedChats.has(
                    chat.id
                )
            ) {

                row.classList.add(
                    "selected"
                );

            }


            /* SELECT CHECKBOX */

            if (isSelectMode) {

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

                checkbox.onclick =
                    event => {

                        event.stopPropagation();

                        toggleChatSelection(
                            chat.id
                        );

                    };

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


            /* ACTIONS */

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

            pin.onclick =
                event => {

                    event.stopPropagation();

                    togglePin(
                        chat.id
                    );

                };


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

            del.onclick =
                event => {

                    event.stopPropagation();

                    deleteChat(
                        chat.id
                    );

                };


            actions.appendChild(
                pin
            );

            actions.appendChild(
                del
            );


            row.appendChild(
                titleEl
            );

            row.appendChild(
                actions
            );


            row.onclick =
                () => {

                    if (isSelectMode) {

                        toggleChatSelection(
                            chat.id
                        );

                    } else {

                        openChat(
                            chat.id
                        );

                    }

                };


            list.appendChild(
                row
            );

        }
    );

}


/* =========================================
   SELECT CHATS
========================================= */

function toggleSelectChats() {

    isSelectMode =
        !isSelectMode;

    selectedChats.clear();

    renderHistory();

    const button =
        $("selectChatsBtn");

    if (button) {

        button.textContent =
            isSelectMode
                ? "✕ Cancel Selection"
                : "☑ Select Chats";

    }

}


/* =========================================
   SELECT CHAT
========================================= */

function toggleChatSelection(id) {

    if (
        selectedChats.has(id)
    ) {

        selectedChats.delete(id);

    } else {

        selectedChats.add(id);

    }

    renderHistory();

}


/* =========================================
   SELECTION BUTTON
========================================= */

function updateSelectionButtons() {

    const deleteBtn =
        $("deleteSelectedBtn");

    if (!deleteBtn)
        return;

    if (
        isSelectMode &&
        selectedChats.size > 0
    ) {

        deleteBtn.style.display =
            "block";

        deleteBtn.textContent =
            `🗑 Delete Selected (${selectedChats.size})`;

    } else {

        deleteBtn.style.display =
            "none";

    }

}


/* =========================================
   DELETE SELECTED
========================================= */

function deleteSelectedChats() {

    if (
        selectedChats.size === 0
    ) {

        showToast(
            "No chats selected"
        );

        return;

    }


    const count =
        selectedChats.size;


    if (
        !confirm(
            `Delete ${count} selected chat${count > 1 ? "s" : ""}?`
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
        !chats.some(
            chat =>
                chat.id ===
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

    isSelectMode = false;

    renderHistory();

    closeMore();

    showToast(
        "Selected chats deleted"
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

    if (!chat) return;

    chat.pinned =
        !chat.pinned;

    saveChats(chats);

    renderHistory();

    showToast(
        chat.pinned
            ? "📌 Chat pinned"
            : "Chat unpinned"
    );

}


/* =========================================
   DELETE ONE CHAT
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


    selectedChats.delete(id);

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


    stopSpeaking();

    const chat =
        createChat();

    saveChats([chat]);

    currentChatId =
        chat.id;

    messages = [];

    selectedChats.clear();

    isSelectMode = false;

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

    if (!area) return;


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


    /* SPEAKER FOR AI */

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

        copy.title =
            "Copy";

        copy.textContent =
            "📋";

        copy.onclick =
            () =>
                copyText(text);


        /* SPEAKER */

        const voice =
            document.createElement(
                "button"
            );

        voice.type =
            "button";

        voice.className =
            "message-action speaker-button";

        voice.title =
            "Speak";

        voice.textContent =
            "🔊";

        voice.onclick =
            () =>
                speakText(text);


        /* STOP */

        const stop =
            document.createElement(
                "button"
            );

        stop.type =
            "button";

        stop.className =
            "message-action stop-voice-button";

        stop.title =
            "Stop voice";

        stop.textContent =
            "⏹️";

        stop.onclick =
            () =>
                stopSpeaking();


        actions.appendChild(
            copy
        );

        actions.appendChild(
            voice
        );

        actions.appendChild(
            stop
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

    }


    catch (error) {

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

    }

    catch {

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


    return data.reply;

}


/* =========================================
   TYPING
========================================= */

function showTyping() {

    const area =
        $("messages");

    if (!area) return;


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

async function copyText(text) {

    try {

        await navigator.clipboard.writeText(
            text
        );

    }

    catch {

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
   VOICE LANGUAGES
========================================= */

const voiceLanguageMap = {

    en: [
        "en-IN",
        "en-US",
        "en-GB"
    ],

    ta: [
        "ta-IN"
    ],

    hi: [
        "hi-IN"
    ],

    ml: [
        "ml-IN"
    ],

    te: [
        "te-IN"
    ],

    kn: [
        "kn-IN"
    ]

};


/* =========================================
   GET AVAILABLE VOICES
========================================= */

function getVoices() {

    if (
        !window.speechSynthesis
    ) {

        return [];

    }

    return speechSynthesis.getVoices();

}


/* =========================================
   FIND VOICE
========================================= */

function findVoice(
    language,
    gender
) {

    const voices =
        getVoices();


    if (!voices.length)
        return null;


    const languages =
        voiceLanguageMap[
            language
        ] || ["en-IN"];


    const languageVoices =
        voices.filter(
            voice => {

                const lang =
                    voice.lang
                        .replace("_", "-")
                        .toLowerCase();

                return languages.some(
                    target =>
                        lang.startsWith(
                            target
                                .toLowerCase()
                        )
                );

            }
        );


    if (!languageVoices.length) {

        return voices.find(
            voice =>
                voice.lang
                    .toLowerCase()
                    .startsWith(
                        "en"
                    )
        ) || voices[0];

    }


    /* Try gender from voice name */

    const femaleWords = [
        "female",
        "woman",
        "girl",
        "zira",
        "samantha",
        "susan",
        "karen",
        "google uk english female",
        "google us english female"
    ];


    const maleWords = [
        "male",
        "man",
        "boy",
        "david",
        "mark",
        "alex",
        "daniel",
        "google uk english male",
        "google us english male"
    ];


    const keywords =
        gender === "female"
            ? femaleWords
            : maleWords;


    const genderVoice =
        languageVoices.find(
            voice => {

                const name =
                    voice.name
                        .toLowerCase();

                return keywords.some(
                    word =>
                        name.includes(
                            word
                        )
                );

            }
        );


    return (
        genderVoice ||
        languageVoices[0]
    );

}


/* =========================================
   SAVE VOICE PREFERENCE
========================================= */

function getVoiceGender() {

    return (
        localStorage.getItem(
            "viggo_voice_gender"
        ) || "female"
    );

}


function setVoiceGender(
    gender
) {

    localStorage.setItem(
        "viggo_voice_gender",
        gender
    );

}


/* =========================================
   VOICE UI
========================================= */

function setupVoiceStyle() {

    const inputArea =
        document.querySelector(
            ".input-area"
        );

    if (!inputArea)
        return;


    if (
        $("voiceSettings")
    ) {

        return;

    }


    const panel =
        document.createElement(
            "div"
        );

    panel.id =
        "voiceSettings";

    panel.className =
        "voice-settings";


    panel.innerHTML = `

        <span class="voice-label">
            🔊 Voice
        </span>

        <button
            type="button"
            id="femaleVoiceBtn"
            class="voice-gender-btn"
        >
            👩 Female
        </button>

        <button
            type="button"
            id="maleVoiceBtn"
            class="voice-gender-btn"
        >
            👨 Male
        </button>

        <button
            type="button"
            id="stopVoiceBtn"
            class="voice-stop-btn"
        >
            ⏹ Stop
        </button>

    `;


    inputArea.insertBefore(
        panel,
        inputArea.firstChild
    );


    updateVoiceButtons();


    $("femaleVoiceBtn")
        ?.addEventListener(
            "click",
            () => {

                setVoiceGender(
                    "female"
                );

                updateVoiceButtons();

                showToast(
                    "👩 Female voice selected"
                );

            }
        );


    $("maleVoiceBtn")
        ?.addEventListener(
            "click",
            () => {

                setVoiceGender(
                    "male"
                );

                updateVoiceButtons();

                showToast(
                    "👨 Male voice selected"
                );

            }
        );


    $("stopVoiceBtn")
        ?.addEventListener(
            "click",
            stopSpeaking
        );

}


/* =========================================
   UPDATE VOICE BUTTONS
========================================= */

function updateVoiceButtons() {

    const gender =
        getVoiceGender();


    const female =
        $("femaleVoiceBtn");

    const male =
        $("maleVoiceBtn");


    if (female) {

        female.classList.toggle(
            "active",
            gender === "female"
        );

    }


    if (male) {

        male.classList.toggle(
            "active",
            gender === "male"
        );

    }

}


/* =========================================
   SPEAK TEXT
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


    stopSpeaking();


    const gender =
        getVoiceGender();


    const speech =
        new SpeechSynthesisUtterance(
            text
        );


    speech.lang =
        (
            voiceLanguageMap[
                currentLanguage
            ] || ["en-IN"]
        )[0];


    speech.rate =
        0.95;

    speech.pitch =
        gender === "female"
            ? 1.05
            : 0.85;


    speech.volume =
        1;


    const voice =
        findVoice(
            currentLanguage,
            gender
        );


    if (voice) {

        speech.voice =
            voice;

        speech.lang =
            voice.lang;

    }


    currentSpeech =
        speech;


    speech.onend =
        () => {

            currentSpeech =
                null;

        };


    speech.onerror =
        () => {

            currentSpeech =
                null;

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


    currentSpeech =
        null;

}


/* =========================================
   VOICE INPUT SETUP
========================================= */

function setupVoice() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        console.warn(
            "Speech Recognition not supported."
        );

        return;

    }


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


            showToast(
                "🎤 Listening..."
            );

        };


    recognition.onresult =
        event => {

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

        };


    recognition.onerror =
        event => {

            console.error(
                "Voice input error:",
                event.error
            );


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
   VOICE INPUT TOGGLE
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


    const languages =
        voiceLanguageMap[
            currentLanguage
        ] || ["en-IN"];


    recognition.lang =
        languages[0];


    try {

        recognition.start();

    }

    catch (error) {

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
       Short share links require a server-side
       short-link service.

       This version uses a compact encoded
       share parameter instead of the previous
       very long raw URL.
    */

    const data = {

        t:
            chat.title || "Viggo Chat",

        m:
            chat.messages || []

    };


    let encoded;


    try {

        encoded =
            btoa(
                unescape(
                    encodeURIComponent(
                        JSON.stringify(data)
                    )
                )
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
        "?s=" +
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

        }

        else {

            await copyText(
                link
            );

            showToast(
                "Short share link copied"
            );

        }

    }

    catch (error) {

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
        params.get("s");


    if (!encoded)
        return;


    try {

        const data =
            JSON.parse(
                decodeURIComponent(
                    escape(
                        atob(encoded)
                    )
                )
            );


        if (
            !data ||
            !Array.isArray(
                data.m
            )
        ) {

            throw new Error(
                "Invalid share"
            );

        }


        messages =
            data.m;


        currentChatId =
            "shared_" +
            Date.now();


        renderMessages();


        const title =
            $("chatTitle");


        if (title) {

            title.textContent =
                data.t ||
                "Shared Chat";

        }


        showToast(
            "Shared chat opened"
        );

    }

    catch (error) {

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


    stopSpeaking();


    const names = {

        en: "English",
        ta: "தமிழ்",
        hi: "हिन्दी",
        ml: "മലയാളം",
        te: "తెలుగు",
        kn: "ಕನ್ನಡ"

    };


    showToast(
        `🌐 ${names[language]} selected`
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


    $("selectChatsBtn")
        ?.addEventListener(
            "click",
            toggleSelectChats
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


    /* Load browser voices */

    if (
        window.speechSynthesis
    ) {

        speechSynthesis.onvoiceschanged =
            () => {

                getVoices();

            };

    }

}

