"use strict";

/* =========================================
   VIGGO AI - FULL SCRIPT.JS
   Features:
   - Chat
   - History
   - New Chat
   - Pin Chat
   - Select Chats
   - Delete Selected
   - Clear History
   - Save
   - Languages
   - Share
   - Voice input
   - Male / Female voice output
   - Voice Stop button
   - Copy
   - Render API connection
========================================= */


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

let selectedVoiceType = "female";

let selectedChats = new Set();
let selectionMode = false;


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

        createVoiceMenu();

        updateVoiceButton();

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

        if (data.voiceType) {
            selectedVoiceType =
                data.voiceType;
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

            voiceType:
                selectedVoiceType

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

    selectedChats.clear();

    selectionMode = false;

    renderMessages();

    updateTitle();

    renderHistory();

    updateSelectionUI();

    closeMore();

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


    if (selectionMode) {

        toggleSelectedChat(id);

        return;

    }


    currentChatId =
        chat.id;

    messages =
        chat.messages || [];

    renderMessages();

    updateTitle();

    renderHistory();

    closeMore();

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
   UPDATE TITLE
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


/* =========================================
   ADD HISTORY
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

                checkbox.onclick =
                    event => {

                        event.stopPropagation();

                        toggleSelectedChat(
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

            pin.className =
                "history-action";

            pin.type =
                "button";

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


            /* DELETE */

            const del =
                document.createElement(
                    "button"
                );

            del.className =
                "history-action delete";

            del.type =
                "button";

            del.textContent =
                "🗑";

            del.title =
                "Delete";


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

    if (!chat) return;

    chat.pinned =
        !chat.pinned;

    saveChats(chats);

    renderHistory();

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
   SELECT CHAT
========================================= */

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


/* =========================================
   SELECT MODE
========================================= */

function toggleSelectionMode() {

    selectionMode =
        !selectionMode;


    if (!selectionMode) {

        selectedChats.clear();

    }


    renderHistory();

    updateSelectionUI();

    closeMore();

}


/* =========================================
   DELETE SELECTED
========================================= */

function deleteSelectedChats() {

    if (!selectedChats.size) {

        showToast(
            "Select chats first"
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

    selectionMode = false;

    renderHistory();

    updateSelectionUI();

    showToast(
        `${count} chat${count > 1 ? "s" : ""} deleted`
    );

}


/* =========================================
   SELECTION UI
========================================= */

function updateSelectionUI() {

    const button =
        $("selectChatsBtn");

    const deleteButton =
        $("deleteSelectedBtn");


    if (button) {

        button.textContent =
            selectionMode
                ? "✓ Done Selecting"
                : "☑ Select Chats";

    }


    if (deleteButton) {

        deleteButton.style.display =
            selectionMode &&
            selectedChats.size > 0
                ? "block"
                : "none";

    }

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

    selectedChats.clear();

    selectionMode = false;

    renderMessages();

    updateTitle();

    renderHistory();

    updateSelectionUI();

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

        copy.className =
            "message-action";

        copy.type =
            "button";

        copy.textContent =
            "📋";

        copy.title =
            "Copy";

        copy.onclick =
            () =>
                copyText(text);


        /* SPEAK */

        const voice =
            document.createElement(
                "button"
            );

        voice.className =
            "message-action";

        voice.type =
            "button";

        voice.textContent =
            "🔊";

        voice.title =
            "Read aloud";

        voice.onclick =
            () =>
                speakText(text);


        /* STOP */

        const stop =
            document.createElement(
                "button"
            );

        stop.className =
            "message-action";

        stop.type =
            "button";

        stop.textContent =
            "⏹";

        stop.title =
            "Stop voice";

        stop.onclick =
            stopSpeaking;


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
   SEND MESSAGE
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
   VOICE MENU
========================================= */

function createVoiceMenu() {

    if (
        $("viggoVoiceMenu")
    ) {

        return;

    }


    const menu =
        document.createElement(
            "div"
        );


    menu.id =
        "viggoVoiceMenu";


    menu.style.position =
        "fixed";

    menu.style.bottom =
        "80px";

    menu.style.right =
        "20px";

    menu.style.background =
        "#ffffff";

    menu.style.border =
        "1px solid #ddd";

    menu.style.borderRadius =
        "12px";

    menu.style.padding =
        "8px";

    menu.style.boxShadow =
        "0 8px 25px rgba(0,0,0,.15)";

    menu.style.zIndex =
        "99999";

    menu.style.display =
        "none";


    menu.innerHTML = `

        <div style="
            font-weight:600;
            padding:8px 10px;
        ">
            🔊 Voice
        </div>

        <button
            type="button"
            id="femaleVoiceBtn"
            style="
                display:block;
                width:100%;
                border:0;
                background:none;
                padding:9px 12px;
                text-align:left;
                cursor:pointer;
                border-radius:8px;
            "
        >
            👩 Female Voice
        </button>

        <button
            type="button"
            id="maleVoiceBtn"
            style="
                display:block;
                width:100%;
                border:0;
                background:none;
                padding:9px 12px;
                text-align:left;
                cursor:pointer;
                border-radius:8px;
            "
        >
            👨 Male Voice
        </button>

        <button
            type="button"
            id="stopVoiceBtn"
            style="
                display:block;
                width:100%;
                border:0;
                background:none;
                padding:9px 12px;
                text-align:left;
                cursor:pointer;
                border-radius:8px;
            "
        >
            ⏹ Stop Voice
        </button>

    `;


    document.body.appendChild(
        menu
    );


    $("femaleVoiceBtn")
        ?.addEventListener(
            "click",
            () => {

                selectedVoiceType =
                    "female";

                saveSettings();

                closeVoiceMenu();

                showToast(
                    "Female voice selected"
                );

            }
        );


    $("maleVoiceBtn")
        ?.addEventListener(
            "click",
            () => {

                selectedVoiceType =
                    "male";

                saveSettings();

                closeVoiceMenu();

                showToast(
                    "Male voice selected"
                );

            }
        );


    $("stopVoiceBtn")
        ?.addEventListener(
            "click",
            () => {

                stopSpeaking();

                closeVoiceMenu();

            }
        );

}


/* =========================================
   OPEN VOICE MENU
========================================= */

function toggleVoiceMenu() {

    const menu =
        $("viggoVoiceMenu");

    if (!menu) return;


    menu.style.display =
        menu.style.display === "none"
            ? "block"
            : "none";

}


function closeVoiceMenu() {

    const menu =
        $("viggoVoiceMenu");

    if (menu) {

        menu.style.display =
            "none";

    }

}


/* =========================================
   UPDATE VOICE BUTTON
========================================= */

function updateVoiceButton() {

    const button =
        $("voiceBtn");

    if (!button) return;


    button.title =
        "Voice input / voice options";

}


/* =========================================
   GET SPEECH VOICES
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

function findBestVoice() {

    const voices =
        getVoices();


    if (!voices.length)
        return null;


    const languageMap = {

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


    const languages =
        languageMap[
            currentLanguage
        ] || ["en-IN"];


    let candidates =
        voices.filter(
            voice =>
                languages.some(
                    lang =>
                        voice.lang
                            .toLowerCase()
                            .startsWith(
                                lang.toLowerCase()
                            )
                )
        );


    if (!candidates.length) {

        candidates =
            voices.filter(
                voice =>
                    voice.lang
                        .toLowerCase()
                        .startsWith(
                            currentLanguage
                        )
            );

    }


    if (!candidates.length) {

        candidates =
            voices;

    }


    /*
       Browser voices do not always expose
       gender information.

       We use common voice names as a
       best-effort selection.
    */

    const femaleWords = [
        "female",
        "woman",
        "girl",
        "samantha",
        "victoria",
        "zira",
        "susan",
        "karen",
        "moira",
        "veena",
        "google uk english female",
        "google हिन्दी female"
    ];


    const maleWords = [
        "male",
        "man",
        "boy",
        "david",
        "mark",
        "daniel",
        "alex",
        "ravi",
        "rishi",
        "google uk english male"
    ];


    const words =
        selectedVoiceType === "male"
            ? maleWords
            : femaleWords;


    for (
        const voice of candidates
    ) {

        const name =
            voice.name
                .toLowerCase();

        if (
            words.some(
                word =>
                    name.includes(word)
            )
        ) {

            return voice;

        }

    }


    /*
       If exact gender voice is not
       available, return first matching
       language voice.
    */

    return candidates[0] || null;

}


/* =========================================
   SPEAK TEXT
========================================= */

function speakText(text) {

    if (
        !window.speechSynthesis
    ) {

        showToast(
            "Voice not supported in this browser."
        );

        return;

    }


    stopSpeaking();


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
        findBestVoice();


    if (voice) {

        speech.voice =
            voice;

    }


    /*
       Slight pitch difference helps when
       browser provides only one voice.
    */

    if (
        selectedVoiceType === "female"
    ) {

        speech.pitch =
            1.08;

        speech.rate =
            0.95;

    } else {

        speech.pitch =
            0.88;

        speech.rate =
            0.95;

    }


    speech.volume =
        1;


    speech.onstart =
        () => {

            showToast(
                selectedVoiceType === "male"
                    ? "👨 Male voice"
                    : "👩 Female voice"
            );

        };


    speech.onend =
        () => {

            updateSpeakingState(
                false
            );

        };


    speech.onerror =
        error => {

            console.error(
                "Speech error:",
                error
            );

            updateSpeakingState(
                false
            );

        };


    updateSpeakingState(
        true
    );


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

    updateSpeakingState(
        false
    );

    showToast(
        "Voice stopped"
    );

}


/* =========================================
   SPEAKING STATE
========================================= */

function updateSpeakingState(
    speaking
) {

    document
        .querySelectorAll(
            ".message-action"
        )
        .forEach(
            button => {

                if (
                    button.title ===
                    "Stop voice"
                ) {

                    button.disabled =
                        !speaking;

                }

            }
        );

}


/* =========================================
   LOAD BROWSER VOICES
========================================= */

if (
    window.speechSynthesis
) {

    speechSynthesis.onvoiceschanged =
        () => {

            getVoices();

        };

}


/* =========================================
   VOICE INPUT
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
   TOGGLE VOICE INPUT
========================================= */

function toggleVoice() {

    /*
       Long press is not required.
       Click opens voice menu.
    */

    if (!recognition) {

        toggleVoiceMenu();

        showToast(
            "Voice input is not supported. Voice options are available."
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


/* =========================================
   SHARE CHAT
========================================= */

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


    /*
       Shorter share link:
       Only chat ID is placed in URL.

       IMPORTANT:
       This requires the shared chat to
       exist in localStorage on the same
       browser. For cross-device sharing,
       backend/database storage is needed.
    */

    const link =
        window.location.origin +
        window.location.pathname +
        "?chat=" +
        encodeURIComponent(
            chat.id
        );


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


    const id =
        params.get("chat");


    if (!id)
        return;


    /*
       Short-link version:
       Find chat from localStorage.
    */

    const chats =
        getChats();


    const chat =
        chats.find(
            item =>
                item.id === id
        );


    if (!chat) {

        showToast(
            "Shared chat is not available on this device."
        );

        return;

    }


    currentChatId =
        chat.id;

    messages =
        chat.messages || [];


    renderMessages();

    updateTitle();


    showToast(
        "Shared chat opened"
    );

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

    $("moreMenu")
        ?.classList
        .remove(
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
        (
            names[language] ||
            language
        )
    );


    closeMore();

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
            "0 5px 20px rgba(0,0,0,.2)";


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
            event => {

                /*
                   Normal click:
                   Start / stop microphone.

                   Double click:
                   Open voice selection menu.
                */

                toggleVoice();

            }
        );


    /*
       Double-click microphone to open
       Male / Female / Stop menu.
    */

    $("voiceBtn")
        ?.addEventListener(
            "dblclick",
            event => {

                event.preventDefault();

                toggleVoiceMenu();

            }
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
            toggleSelectionMode
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


            if (
                !event.target.closest(
                    "#viggoVoiceMenu"
                ) &&
                !event.target.closest(
                    "#voiceBtn"
                )
            ) {

                closeVoiceMenu();

            }

        }
    );


    /*
       Stop voice when page is hidden.
    */

    document.addEventListener(
        "visibilitychange",
        () => {

            if (
                document.hidden
            ) {

                stopSpeaking();

            }

        }
    );


    loadSharedChat();

}


/* =========================================
   END
========================================= */
