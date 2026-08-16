```javascript
"use strict";

/* =========================================================
   VIGGO AI - FULL SCRIPT
========================================================= */


/* =========================================================
   API
========================================================= */

const API_BASE = "https://ai-tool-1-fgmc.onrender.com";
const CHAT_API = API_BASE + "/chat";


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

let selectedChats = new Set();

let availableVoices = [];
let selectedVoiceName = "";

let isSpeaking = false;


/* =========================================================
   DOM
========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   START
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    loadSettings();

    initializeChat();

    setupEvents();

    setupVoiceInput();

    setupSpeechVoices();

    createVoiceSelector();

});


/* =========================================================
   SETTINGS
========================================================= */

function loadSettings() {

    try {

        const data =
            JSON.parse(
                localStorage.getItem(SETTINGS_KEY) || "{}"
            );

        if (data.language) {
            currentLanguage = data.language;
        }

        if (data.voiceName) {
            selectedVoiceName = data.voiceName;
        }

    } catch (error) {

        console.error("Settings error:", error);

    }

}


function saveSettings() {

    localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
            language: currentLanguage,
            voiceName: selectedVoiceName
        })
    );

}


/* =========================================================
   CHAT STORAGE
========================================================= */

function getChats() {

    try {

        const data =
            JSON.parse(
                localStorage.getItem(STORAGE_KEY) || "[]"
            );

        return Array.isArray(data) ? data : [];

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

        title: "New Chat",

        messages: [],

        pinned: false,

        createdAt: Date.now(),

        updatedAt: Date.now()

    };

}


/* =========================================================
   INITIALIZE CHAT
========================================================= */

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


/* =========================================================
   NEW CHAT
========================================================= */

function newChat() {

    const chat = createChat();

    const chats = getChats();

    chats.unshift(chat);

    saveChats(chats);

    currentChatId = chat.id;

    messages = [];

    selectedChats.clear();

    renderMessages();

    updateTitle();

    renderHistory();

    closeMore();

}


/* =========================================================
   OPEN CHAT
========================================================= */

function openChat(id) {

    const chats = getChats();

    const chat =
        chats.find(item => item.id === id);

    if (!chat) return;

    currentChatId = chat.id;

    messages = chat.messages || [];

    renderMessages();

    updateTitle();

    renderHistory();

}


/* =========================================================
   UPDATE CHAT
========================================================= */

function updateChat() {

    const chats = getChats();

    const chat =
        chats.find(
            item => item.id === currentChatId
        );

    if (!chat) return;

    chat.messages = messages;

    chat.updatedAt = Date.now();

    const firstUser =
        messages.find(
            item => item.role === "user"
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


/* =========================================================
   TITLE
========================================================= */

function updateTitle() {

    const element = $("chatTitle");

    if (!element) return;

    const chats = getChats();

    const chat =
        chats.find(
            item => item.id === currentChatId
        );

    element.textContent =
        chat?.title || "New Chat";

}


/* =========================================================
   HISTORY
========================================================= */

function renderHistory() {

    const list = $("historyList");

    if (!list) return;

    const chats = getChats();

    list.innerHTML = "";

    const pinned =
        chats.filter(chat => chat.pinned);

    const recent =
        chats.filter(chat => !chat.pinned);

    addHistory(list, "Pinned", pinned);

    addHistory(list, "Recent", recent);

}


/* =========================================================
   ADD HISTORY
========================================================= */

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


        if (selectedChats.has(chat.id)) {

            row.classList.add("selected");

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

        pin.type = "button";

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


        pin.onclick = event => {

            event.stopPropagation();

            togglePin(chat.id);

        };


        /* DELETE */

        const del =
            document.createElement("button");

        del.type = "button";

        del.className =
            "history-action delete";

        del.title = "Delete chat";

        del.textContent = "🗑";


        del.onclick = event => {

            event.stopPropagation();

            deleteChat(chat.id);

        };


        actions.appendChild(pin);

        actions.appendChild(del);


        row.appendChild(titleEl);

        row.appendChild(actions);


        row.onclick = () => {

            if (selectedChats.size > 0) {

                toggleChatSelection(chat.id);

            } else {

                openChat(chat.id);

            }

        };


        list.appendChild(row);

    });

}


/* =========================================================
   PIN
========================================================= */

function togglePin(id) {

    const chats = getChats();

    const chat =
        chats.find(item => item.id === id);

    if (!chat) return;

    chat.pinned = !chat.pinned;

    saveChats(chats);

    renderHistory();

}


/* =========================================================
   DELETE SINGLE CHAT
========================================================= */

function deleteChat(id) {

    if (
        !confirm("Delete this chat?")
    ) {

        return;

    }

    let chats = getChats();

    chats =
        chats.filter(
            chat => chat.id !== id
        );


    if (!chats.length) {

        chats.push(createChat());

    }


    saveChats(chats);


    if (currentChatId === id) {

        currentChatId = chats[0].id;

        messages =
            chats[0].messages || [];

        renderMessages();

        updateTitle();

    }


    selectedChats.delete(id);

    renderHistory();

    showToast("Chat deleted");

}


/* =========================================================
   SELECT CHAT MODE
========================================================= */

function toggleSelectMode() {

    if (selectedChats.size > 0) {

        selectedChats.clear();

        renderHistory();

        updateDeleteSelectedButton();

        showToast("Selection cleared");

        return;

    }


    showToast(
        "Select chats from Recent or Pinned"
    );

    updateDeleteSelectedButton();

}


function toggleChatSelection(id) {

    if (selectedChats.has(id)) {

        selectedChats.delete(id);

    } else {

        selectedChats.add(id);

    }

    renderHistory();

    updateDeleteSelectedButton();

}


function updateDeleteSelectedButton() {

    const button =
        $("deleteSelectedBtn");

    if (!button) return;

    if (selectedChats.size > 0) {

        button.style.display = "flex";

        button.textContent =
            `🗑 Delete Selected (${selectedChats.size})`;

    } else {

        button.style.display = "none";

    }

}


/* =========================================================
   DELETE SELECTED
========================================================= */

function deleteSelectedChats() {

    if (!selectedChats.size) {

        showToast("No chats selected");

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


    let chats = getChats();


    chats =
        chats.filter(
            chat => !selectedChats.has(chat.id)
        );


    if (!chats.length) {

        chats.push(createChat());

    }


    saveChats(chats);


    if (
        selectedChats.has(currentChatId)
    ) {

        currentChatId =
            chats[0].id;

        messages =
            chats[0].messages || [];

        renderMessages();

        updateTitle();

    }


    selectedChats.clear();

    renderHistory();

    updateDeleteSelectedButton();

    showToast("Selected chats deleted");

}


/* =========================================================
   SAVE
========================================================= */

function saveCurrentChat() {

    updateChat();

    showToast("✓ Chat saved");

    closeMore();

}


/* =========================================================
   CLEAR HISTORY
========================================================= */

function clearHistory() {

    if (
        !confirm(
            "Delete all chat history?"
        )
    ) {

        return;

    }


    const chat = createChat();

    saveChats([chat]);

    currentChatId = chat.id;

    messages = [];

    selectedChats.clear();

    renderMessages();

    updateTitle();

    renderHistory();

    updateDeleteSelectedButton();

    showToast("History cleared");

    closeMore();

}


/* =========================================================
   RENDER MESSAGES
========================================================= */

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


/* =========================================================
   ADD MESSAGE
========================================================= */

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


        /* COPY */

        const copy =
            document.createElement("button");

        copy.type = "button";

        copy.className =
            "message-action";

        copy.title = "Copy";

        copy.textContent = "📋";

        copy.onclick =
            () => copyText(text);


        /* PLAY */

        const voice =
            document.createElement("button");

        voice.type = "button";

        voice.className =
            "message-action";

        voice.title = "Speak";

        voice.textContent = "🔊";

        voice.onclick =
            () => speakText(text);


        /* STOP */

        const stop =
            document.createElement("button");

        stop.type = "button";

        stop.className =
            "message-action";

        stop.title = "Stop voice";

        stop.textContent = "⏹";

        stop.onclick =
            stopSpeaking;


        actions.appendChild(copy);

        actions.appendChild(voice);

        actions.appendChild(stop);

        wrapper.appendChild(actions);

    }


    area.appendChild(wrapper);

}


/* =========================================================
   SEND
========================================================= */

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

        console.error(error);


        messages.push({

            role: "assistant",

            content:
                "⚠️ " +
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


/* =========================================================
   API CALL
========================================================= */

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
                                    .map(item => ({

                                        role:
                                            item.role,

                                        content:
                                            item.content

                                    }))

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

        data = JSON.parse(raw);

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


    if (!data.success) {

        throw new Error(
            data.details ||
            data.error ||
            "Viggo AI error"
        );

    }


    return data.reply;

}


/* =========================================================
   TYPING
========================================================= */

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


/* =========================================================
   COPY
========================================================= */

async function copyText(text) {

    try {

        await navigator.clipboard.writeText(text);

    } catch {

        const textarea =
            document.createElement("textarea");

        textarea.value = text;

        document.body.appendChild(textarea);

        textarea.select();

        document.execCommand("copy");

        textarea.remove();

    }


    showToast("Copied");

}


/* =========================================================
   SPEECH VOICES
========================================================= */

function setupSpeechVoices() {

    if (
        !("speechSynthesis" in window)
    ) {

        return;

    }


    loadSpeechVoices();


    if (
        "onvoiceschanged"
        in window.speechSynthesis
    ) {

        window.speechSynthesis.onvoiceschanged =
            loadSpeechVoices;

    }

}


function loadSpeechVoices() {

    availableVoices =
        window.speechSynthesis.getVoices();


    if (!availableVoices.length) {

        return;

    }


    updateVoiceSelector();

}


/* =========================================================
   CREATE VOICE SELECTOR
========================================================= */

function createVoiceSelector() {

    const moreMenu =
        $("moreMenu");

    if (!moreMenu) return;


    if ($("viggoVoiceSection")) {

        return;

    }


    const divider =
        document.createElement("div");

    divider.className =
        "menu-divider";


    const section =
        document.createElement("div");

    section.id =
        "viggoVoiceSection";


    section.innerHTML = `

        <div class="language-title">
            🔊 Voice
        </div>

        <select
            id="voiceSelect"
            class="voice-select"
        >
            <option value="">
                Loading voices...
            </option>
        </select>

        <button
            type="button"
            id="testVoiceBtn"
        >
            🔊 Test Voice
        </button>

        <button
            type="button"
            id="stopVoiceBtn"
        >
            ⏹ Stop Voice
        </button>

    `;


    moreMenu.appendChild(divider);

    moreMenu.appendChild(section);


    const select =
        $("voiceSelect");


    if (select) {

        select.addEventListener(
            "change",
            () => {

                selectedVoiceName =
                    select.value;

                saveSettings();

                showToast(
                    "Voice changed"
                );

            }
        );

    }


    $("testVoiceBtn")
        ?.addEventListener(
            "click",
            () => {

                speakText(
                    "Hello, I am Viggo AI."
                );

            }
        );


    $("stopVoiceBtn")
        ?.addEventListener(
            "click",
            stopSpeaking
        );


    updateVoiceSelector();

}


/* =========================================================
   UPDATE VOICE SELECTOR
========================================================= */

function updateVoiceSelector() {

    const select =
        $("voiceSelect");

    if (!select) return;


    select.innerHTML = "";


    if (!availableVoices.length) {

        const option =
            document.createElement("option");

        option.value = "";

        option.textContent =
            "No voices available";

        select.appendChild(option);

        return;

    }


    const languagePrefix =
        getLanguagePrefix();


    let filtered =
        availableVoices.filter(
            voice =>
                voice.lang
                    .toLowerCase()
                    .startsWith(languagePrefix)
        );


    if (!filtered.length) {

        filtered =
            availableVoices.filter(
                voice =>
                    voice.lang
                        .toLowerCase()
                        .startsWith("en")
            );

    }


    /*
       Try to show male/female-like voices first.
       Browser voice names vary by device.
    */

    const female =
        filtered.filter(
            voice =>
                /female|woman|girl|samantha|zira|susan|karen|moira|veena|google uk english female|google us english/i
                    .test(voice.name)
        );


    const male =
        filtered.filter(
            voice =>
                /male|man|boy|david|mark|daniel|alex|rishi|google uk english male/i
                    .test(voice.name)
        );


    const other =
        filtered.filter(
            voice =>
                !female.includes(voice) &&
                !male.includes(voice)
        );


    const groups = [];


    if (female.length) {

        groups.push({
            title: "👩 Female",
            voices: female
        });

    }


    if (male.length) {

        groups.push({
            title: "👨 Male",
            voices: male
        });

    }


    if (other.length) {

        groups.push({
            title: "🔊 Other",
            voices: other
        });

    }


    groups.forEach(group => {

        const optgroup =
            document.createElement(
                "optgroup"
            );

        optgroup.label =
            group.title;


        group.voices.forEach(voice => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                voice.name;

            option.textContent =
                `${voice.name} (${voice.lang})`;

            optgroup.appendChild(option);

        });


        select.appendChild(
            optgroup
        );

    });


    if (
        selectedVoiceName &&
        availableVoices.some(
            voice =>
                voice.name ===
                selectedVoiceName
        )
    ) {

        select.value =
            selectedVoiceName;

    } else {

        const first =
            filtered[0] ||
            availableVoices[0];

        if (first) {

            select.value =
                first.name;

            selectedVoiceName =
                first.name;

            saveSettings();

        }

    }

}


/* =========================================================
   LANGUAGE PREFIX
========================================================= */

function getLanguagePrefix() {

    const map = {

        en: "en",

        ta: "ta",

        hi: "hi",

        ml: "ml",

        te: "te",

        kn: "kn"

    };

    return map[currentLanguage] || "en";

}


/* =========================================================
   SPEAK TEXT
========================================================= */

function speakText(text) {

    if (
        !("speechSynthesis" in window)
    ) {

        showToast(
            "Voice is not supported"
        );

        return;

    }


    stopSpeaking();


    const utterance =
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


    utterance.lang =
        languageMap[currentLanguage] ||
        "en-IN";


    const selected =
        availableVoices.find(
            voice =>
                voice.name ===
                selectedVoiceName
        );


    if (selected) {

        utterance.voice = selected;

    }


    utterance.rate = 1;

    utterance.pitch = 1;

    utterance.volume = 1;


    utterance.onstart = () => {

        isSpeaking = true;

    };


    utterance.onend = () => {

        isSpeaking = false;

    };


    utterance.onerror = () => {

        isSpeaking = false;

    };


    window.speechSynthesis.speak(
        utterance
    );

}


/* =========================================================
   STOP SPEAKING
========================================================= */

function stopSpeaking() {

    if (
        "speechSynthesis" in window
    ) {

        window.speechSynthesis.cancel();

    }

    isSpeaking = false;

}


/* =========================================================
   VOICE INPUT
========================================================= */

function setupVoiceInput() {

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

    recognition.maxAlternatives = 1;


    recognition.onstart = () => {

        isListening = true;

        const button =
            $("voiceBtn");

        if (button) {

            button.classList.add("active");

            button.textContent = "⏹";

            button.title =
                "Stop listening";

        }

        showToast("Listening...");

    };


    recognition.onresult = event => {

        const text =
            event
                .results[0][0]
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
            "Speech recognition error:",
            event.error
        );

        isListening = false;

        resetVoiceButton();

        if (
            event.error !==
            "aborted"
        ) {

            showToast(
                "Voice error: " +
                event.error
            );

        }

    };


    recognition.onend = () => {

        isListening = false;

        resetVoiceButton();

    };

}


/* =========================================================
   TOGGLE VOICE INPUT
========================================================= */

function toggleVoice() {

    if (!recognition) {

        showToast(
            "Voice input is not supported in this browser."
        );

        return;

    }


    if (isListening) {

        /*
           stop() asks recognition to stop and return
           captured speech. abort() forcefully stops it.
        */

        try {

            recognition.stop();

        } catch {

            try {

                recognition.abort();

            } catch {}

        }

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

        try {

            recognition.abort();

            setTimeout(() => {

                try {

                    recognition.start();

                } catch {}

            }, 200);

        } catch {

            showToast(
                "Unable to start microphone"
            );

        }

    }

}


/* =========================================================
   RESET VOICE BUTTON
========================================================= */

function resetVoiceButton() {

    const button =
        $("voiceBtn");

    if (!button) return;

    button.classList.remove("active");

    button.textContent = "🎤";

    button.title = "Voice input";

}


/* =========================================================
   SHARE CHAT
========================================================= */

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
       Shorter share format:
       ?c=Base64EncodedChat
    */

    const encoded =
        btoa(
            encodeURIComponent(
                JSON.stringify({
                    title: chat.title,
                    messages: chat.messages
                })
            )
        );


    const link =
        window.location.origin +
        window.location.pathname +
        "?c=" +
        encoded;


    try {

        if (navigator.share) {

            await navigator.share({

                title:
                    chat.title || "Viggo AI Chat",

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

            console.error(error);

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


    /*
       New short parameter:
       ?c=
    */

    let encoded =
        params.get("c");


    /*
       Also support old:
       ?chat=
    */

    if (!encoded) {

        encoded =
            params.get("chat");

    }


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


/* =========================================================
   MORE MENU
========================================================= */

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


/* =========================================================
   LANGUAGE
========================================================= */

function setLanguage(language) {

    currentLanguage =
        language;

    saveSettings();

    updateVoiceSelector();

    showToast(
        "Language changed"
    );

}


/* =========================================================
   TOAST
========================================================= */

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


/* =========================================================
   SCROLL
========================================================= */

function scrollBottom() {

    const area =
        $("messages");

    if (area) {

        area.scrollTop =
            area.scrollHeight;

    }

}


/* =========================================================
   EVENTS
========================================================= */

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


    /* OUTSIDE MORE CLICK */

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


    /* LOAD SHARED */

    loadSharedChat();

}


/* =========================================================
   INITIAL VOICE SAFETY
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        stopSpeaking();

        if (recognition) {

            try {

                recognition.abort();

            } catch {}

        }

    }
);
```
