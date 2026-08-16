```javascript
"use strict";

/* =====================================================
   VIGGO AI - FULL SCRIPT
===================================================== */


/* =========================
   API
========================= */

const API_BASE =
    "https://ai-tool-1-fgmc.onrender.com";

const CHAT_API =
    API_BASE + "/chat";


/* =========================
   STORAGE
========================= */

const STORAGE_KEY = "viggo_chats";
const SETTINGS_KEY = "viggo_settings";
const VOICE_KEY = "viggo_voice_gender";


/* =========================
   STATE
========================= */

let currentChatId = null;
let messages = [];
let currentLanguage = "en";
let isSending = false;

let recognition = null;
let isListening = false;

let selectedChats = new Set();
let isSelectMode = false;


/* =========================
   DOM HELPER
========================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================
   START
========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadSettings();

        initializeChat();

        setupEvents();

        setupVoiceInput();

        setupMoreVoiceSettings();

        loadBrowserVoices();

        loadSharedChat();

    }
);


/* =====================================================
   SETTINGS
===================================================== */

function loadSettings() {

    try {

        const settings =
            JSON.parse(
                localStorage.getItem(
                    SETTINGS_KEY
                ) || "{}"
            );

        if (settings.language) {

            currentLanguage =
                settings.language;

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
            language: currentLanguage
        })

    );

}


/* =====================================================
   CHAT STORAGE
===================================================== */

function getChats() {

    try {

        const chats =
            JSON.parse(
                localStorage.getItem(
                    STORAGE_KEY
                ) || "[]"
            );

        return Array.isArray(chats)
            ? chats
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


/* =====================================================
   CREATE CHAT
===================================================== */

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


/* =====================================================
   INITIALIZE
===================================================== */

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


/* =====================================================
   NEW CHAT
===================================================== */

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


/* =====================================================
   OPEN CHAT
===================================================== */

function openChat(id) {

    const chats =
        getChats();

    const chat =
        chats.find(
            item =>
                item.id === id
        );

    if (!chat)
        return;


    stopSpeaking();

    currentChatId =
        chat.id;

    messages =
        chat.messages || [];


    renderMessages();

    updateTitle();

    renderHistory();

}


/* =====================================================
   UPDATE CHAT
===================================================== */

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


    const firstUserMessage =
        messages.find(
            item =>
                item.role === "user"
        );


    if (
        firstUserMessage &&
        chat.title === "New Chat"
    ) {

        chat.title =
            firstUserMessage.content
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 40);

    }


    saveChats(chats);

    updateTitle();

    renderHistory();

}


/* =====================================================
   TITLE
===================================================== */

function updateTitle() {

    const title =
        $("chatTitle");

    if (!title)
        return;


    const chats =
        getChats();

    const chat =
        chats.find(
            item =>
                item.id === currentChatId
        );


    title.textContent =
        chat?.title ||
        "New Chat";

}


/* =====================================================
   HISTORY
===================================================== */

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


    renderHistoryGroup(
        list,
        "Pinned",
        pinned
    );


    renderHistoryGroup(
        list,
        "Recent",
        recent
    );


    updateSelectionButtons();

}


/* =====================================================
   HISTORY GROUP
===================================================== */

function renderHistoryGroup(
    list,
    groupName,
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
        groupName;

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


            /* CHECKBOX */

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


            /* TITLE */

            const title =
                document.createElement(
                    "div"
                );

            title.className =
                "history-title";

            title.textContent =
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
                    ? "Unpin"
                    : "Pin";

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
                "Delete";

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
                title
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


/* =====================================================
   SELECT CHATS
===================================================== */

function toggleSelectChats() {

    isSelectMode =
        !isSelectMode;

    selectedChats.clear();


    const button =
        $("selectChatsBtn");


    if (button) {

        button.textContent =
            isSelectMode
                ? "✕ Cancel Selection"
                : "☑ Select Chats";

    }


    renderHistory();

}


/* =====================================================
   CHAT SELECTION
===================================================== */

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


/* =====================================================
   SELECTION BUTTON
===================================================== */

function updateSelectionButtons() {

    const button =
        $("deleteSelectedBtn");


    if (!button)
        return;


    if (
        isSelectMode &&
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


/* =====================================================
   DELETE SELECTED
===================================================== */

function deleteSelectedChats() {

    if (
        selectedChats.size === 0
    ) {

        showToast(
            "No chats selected"
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
        !chats.some(
            chat =>
                chat.id === currentChatId
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


/* =====================================================
   PIN
===================================================== */

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


    showToast(
        chat.pinned
            ? "📌 Chat pinned"
            : "Chat unpinned"
    );

}


/* =====================================================
   DELETE CHAT
===================================================== */

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


/* =====================================================
   SAVE
===================================================== */

function saveCurrentChat() {

    updateChat();

    closeMore();


    showToast(
        "✓ Chat saved"
    );

}


/* =====================================================
   CLEAR HISTORY
===================================================== */

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


/* =====================================================
   RENDER MESSAGES
===================================================== */

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
        message => {

            addMessage(
                message.role,
                message.content
            );

        }
    );


    scrollBottom();

}


/* =====================================================
   ADD MESSAGE
===================================================== */

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


    /* =================================================
       AI MESSAGE
       
       IMPORTANT:
       NO Female / Male text here.
       NO "Voice" text here.
       ONLY speaker + stop icons.
    ================================================= */

    if (
        role === "assistant"
    ) {

        const actions =
            document.createElement(
                "div"
            );


        actions.className =
            "message-actions";


        /* SPEAKER ICON ONLY */

        const speaker =
            document.createElement(
                "button"
            );


        speaker.type =
            "button";

        speaker.className =
            "message-action speaker-button";

        speaker.title =
            "Speak";

        speaker.setAttribute(
            "aria-label",
            "Speak"
        );

        speaker.textContent =
            "🔊";


        speaker.onclick =
            () => {

                speakText(
                    text
                );

            };


        /* STOP ICON ONLY */

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

        stop.setAttribute(
            "aria-label",
            "Stop voice"
        );

        stop.textContent =
            "⏹️";


        stop.onclick =
            () => {

                stopSpeaking();

            };


        actions.appendChild(
            speaker
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


/* =====================================================
   SEND MESSAGE
===================================================== */

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


    const send =
        $("sendBtn");


    if (send) {

        send.disabled =
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


    if (send) {

        send.disabled =
            false;

    }

}


/* =====================================================
   API
===================================================== */

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
            JSON.parse(
                raw
            );

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


/* =====================================================
   TYPING
===================================================== */

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

    const typing =
        $("viggoTyping");


    if (typing) {

        typing.remove();

    }

}


/* =====================================================
   VOICE LANGUAGE
===================================================== */

const VOICE_LANGUAGES = {

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


/* =====================================================
   LANGUAGE NAMES
===================================================== */

const LANGUAGE_NAMES = {

    en:
        "English",

    ta:
        "Tamil",

    hi:
        "Hindi",

    ml:
        "Malayalam",

    te:
        "Telugu",

    kn:
        "Kannada"

};


function getLanguageName(
    language
) {

    return (
        LANGUAGE_NAMES[language] ||
        "English"
    );

}


/* =====================================================
   GET BROWSER VOICES
===================================================== */

function getVoices() {

    if (
        !window.speechSynthesis
    ) {

        return [];

    }


    return speechSynthesis.getVoices();

}


/* =====================================================
   LANGUAGE VOICES
===================================================== */

function getLanguageVoices(
    language
) {

    const voices =
        getVoices();


    const targets =
        VOICE_LANGUAGES[
            language
        ] || [];


    return voices.filter(
        voice => {

            const voiceLang =
                voice.lang
                    .replace("_", "-")
                    .toLowerCase();


            return targets.some(
                target => {

                    const targetLang =
                        target
                            .toLowerCase();


                    return (
                        voiceLang ===
                        targetLang ||

                        voiceLang.startsWith(
                            targetLang
                                .split("-")[0]
                        )
                    );

                }
            );

        }
    );

}


/* =====================================================
   FIND VOICE
===================================================== */

function findVoice(
    language,
    gender
) {

    const voices =
        getLanguageVoices(
            language
        );


    /*
       IMPORTANT:
       Never choose English for Tamil,
       Hindi, Malayalam, Telugu or Kannada.
    */

    if (!voices.length) {

        return null;

    }


    const femaleKeywords = [

        "female",
        "woman",
        "girl",
        "zira",
        "samantha",
        "susan",
        "karen",
        "moira"

    ];


    const maleKeywords = [

        "male",
        "man",
        "boy",
        "david",
        "mark",
        "daniel",
        "alex"

    ];


    const keywords =
        gender === "female"
            ? femaleKeywords
            : maleKeywords;


    const genderVoice =
        voices.find(
            voice => {

                const name =
                    voice.name
                        .toLowerCase();


                return keywords.some(
                    keyword =>
                        name.includes(
                            keyword
                        )
                );

            }
        );


    return (
        genderVoice ||
        voices[0]
    );

}


/* =====================================================
   VOICE GENDER
===================================================== */

function getVoiceGender() {

    return (
        localStorage.getItem(
            VOICE_KEY
        ) ||
        "female"
    );

}


function setVoiceGender(
    gender
) {

    localStorage.setItem(
        VOICE_KEY,
        gender
    );

}


/* =====================================================
   MORE → VOICE SETTINGS
===================================================== */

function setupMoreVoiceSettings() {

    const moreMenu =
        $("moreMenu");


    if (!moreMenu)
        return;


    if (
        $("voiceSettingsButton")
    ) {

        return;

    }


    const divider =
        document.createElement(
            "div"
        );


    divider.className =
        "menu-divider";


    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";

    button.id =
        "voiceSettingsButton";

    button.textContent =
        "🔊 Voice Settings";


    moreMenu.appendChild(
        divider
    );

    moreMenu.appendChild(
        button
    );


    const panel =
        document.createElement(
            "div"
        );


    panel.id =
        "voiceSettingsPanel";

    panel.className =
        "voice-settings-panel";

    panel.style.display =
        "none";


    panel.innerHTML = `

        <div class="voice-setting-title">
            Voice
        </div>

        <button
            type="button"
            id="femaleVoiceBtn"
            class="voice-choice"
        >
            👩 Female
        </button>

        <button
            type="button"
            id="maleVoiceBtn"
            class="voice-choice"
        >
            👨 Male
        </button>

        <div
            id="voiceLanguageStatus"
            class="voice-language-status"
        ></div>

    `;


    moreMenu.appendChild(
        panel
    );


    updateVoiceSettingsUI();


    button.addEventListener(
        "click",
        event => {

            event.stopPropagation();


            const visible =
                panel.style.display !==
                "none";


            panel.style.display =
                visible
                    ? "none"
                    : "block";


            updateVoiceSettingsUI();

        }
    );


    $("femaleVoiceBtn")
        ?.addEventListener(
            "click",
            () => {

                setVoiceGender(
                    "female"
                );

                updateVoiceSettingsUI();

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

                updateVoiceSettingsUI();

                showToast(
                    "👨 Male voice selected"
                );

            }
        );

}


/* =====================================================
   VOICE SETTINGS UI
===================================================== */

function updateVoiceSettingsUI() {

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


    const status =
        $("voiceLanguageStatus");


    if (!status)
        return;


    const voices =
        getLanguageVoices(
            currentLanguage
        );


    if (voices.length) {

        status.textContent =
            `✓ ${getLanguageName(currentLanguage)} voice available`;

    } else {

        status.textContent =
            `⚠️ ${getLanguageName(currentLanguage)} voice unavailable`;

    }

}


/* =====================================================
   SPEAK
===================================================== */

function speakText(
    text
) {

    if (
        !window.speechSynthesis
    ) {

        showToast(
            "Voice is not supported."
        );

        return;

    }


    stopSpeaking();


    const gender =
        getVoiceGender();


    const voice =
        findVoice(
            currentLanguage,
            gender
        );


    /*
       NO ENGLISH FALLBACK.
    */

    if (!voice) {

        showToast(

            `⚠️ ${getLanguageName(currentLanguage)} voice is not available in this browser.`

        );

        return;

    }


    const speech =
        new SpeechSynthesisUtterance(
            text
        );


    speech.voice =
        voice;


    speech.lang =
        voice.lang;


    speech.rate =
        0.95;


    speech.pitch =
        gender === "female"
            ? 1.05
            : 0.85;


    speech.volume =
        1;


    speech.onend =
        () => {

            updateSpeakerButtons(
                false
            );

        };


    speech.onerror =
        () => {

            updateSpeakerButtons(
                false
            );

        };


    updateSpeakerButtons(
        true
    );


    speechSynthesis.speak(
        speech
    );

}


/* =====================================================
   SPEAKER UI
===================================================== */

function updateSpeakerButtons(
    speaking
) {

    document
        .querySelectorAll(
            ".speaker-button"
        )
        .forEach(
            button => {

                button.textContent =
                    "🔊";

            }
        );

}


/* =====================================================
   STOP VOICE
===================================================== */

function stopSpeaking() {

    if (
        window.speechSynthesis
    ) {

        speechSynthesis.cancel();

    }


    updateSpeakerButtons(
        false
    );

}


/* =====================================================
   BROWSER VOICES
===================================================== */

function loadBrowserVoices() {

    if (
        !window.speechSynthesis
    )
        return;


    speechSynthesis.getVoices();


    speechSynthesis.onvoiceschanged =
        () => {

            speechSynthesis.getVoices();

            updateVoiceSettingsUI();

        };

}


/* =====================================================
   VOICE INPUT
===================================================== */

function setupVoiceInput() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        console.warn(
            "Speech Recognition unavailable."
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


/* =====================================================
   VOICE INPUT TOGGLE
===================================================== */

function toggleVoiceInput() {

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


    const languages =
        VOICE_LANGUAGES[
            currentLanguage
        ] || ["en-IN"];


    recognition.lang =
        languages[0];


    try {

        recognition.start();

    } catch (error) {

        console.error(
            error
        );

    }

}


/* =====================================================
   LANGUAGE
===================================================== */

function setLanguage(
    language
) {

    const valid = [

        "en",
        "ta",
        "hi",
        "ml",
        "te",
        "kn"

    ];


    if (
        !valid.includes(
            language
        )
    )
        return;


    currentLanguage =
        language;


    saveSettings();


    stopSpeaking();


    updateVoiceSettingsUI();


    showToast(
        `🌐 ${getLanguageName(language)} selected`
    );


    closeMore();

}


/* =====================================================
   SHARE
===================================================== */

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


    const data = {

        t:
            chat.title,

        m:
            chat.messages

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

    } catch {

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

        } else {

            await navigator.clipboard.writeText(
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


/* =====================================================
   LOAD SHARED CHAT
===================================================== */

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

    } catch (error) {

        console.error(
            error
        );


        showToast(
            "Invalid share link"
        );

    }

}


/* =====================================================
   MORE MENU
===================================================== */

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


/* =====================================================
   TOAST
===================================================== */

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
            3000
        );

}


/* =====================================================
   SCROLL
===================================================== */

function scrollBottom() {

    const area =
        $("messages");


    if (area) {

        area.scrollTop =
            area.scrollHeight;

    }

}


/* =====================================================
   EVENTS
===================================================== */

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


    /* VOICE INPUT */

    $("voiceBtn")
        ?.addEventListener(
            "click",
            toggleVoiceInput
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
            toggleSelectChats
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


    /* ENTER */

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
