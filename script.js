"use strict";

/* =========================================================
   VIGGO AI - FULL SCRIPT
   Chat + History + Recent + Pin + Delete + Selection
   Share + More Menu + Language + Voice
========================================================= */

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

let currentSpeechButton = null;
let currentUtterance = null;

let selectedVoiceGender = "female";

let selectMode = false;
let selectedChats = new Set();


/* =========================================================
   DOM HELPER
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

    setupVoice();

    setupSpeechVoices();

    loadSharedChat();

});


/* =========================================================
   SETTINGS
========================================================= */

function loadSettings() {

    try {

        const data = JSON.parse(
            localStorage.getItem(SETTINGS_KEY) || "{}"
        );

        if (data.language) {
            currentLanguage = data.language;
        }

        if (
            data.voiceGender === "male" ||
            data.voiceGender === "female"
        ) {
            selectedVoiceGender = data.voiceGender;
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
            voiceGender: selectedVoiceGender
        })
    );

}


/* =========================================================
   STORAGE
========================================================= */

function getChats() {

    try {

        const chats = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]"
        );

        return Array.isArray(chats) ? chats : [];

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
                .substring(2, 8),

        title: "New Chat",

        messages: [],

        pinned: false,

        createdAt: Date.now(),

        updatedAt: Date.now()

    };

}


/* =========================================================
   INITIALIZE
========================================================= */

function initializeChat() {

    let chats = getChats();

    if (!chats.length) {

        const chat = createChat();

        chats = [chat];

        saveChats(chats);

    }

    chats.sort(
        (a, b) =>
            (b.updatedAt || 0) -
            (a.updatedAt || 0)
    );

    currentChatId = chats[0].id;

    messages =
        Array.isArray(chats[0].messages)
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

    stopAllVoice();

    const chat = createChat();

    const chats = getChats();

    chats.unshift(chat);

    saveChats(chats);

    currentChatId = chat.id;

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

    stopAllVoice();

    const chats = getChats();

    const chat = chats.find(
        item => item.id === id
    );

    if (!chat) return;

    currentChatId = chat.id;

    messages =
        Array.isArray(chat.messages)
            ? chat.messages
            : [];

    renderMessages();

    updateTitle();

    renderHistory();

    closeMore();

}


/* =========================================================
   UPDATE CHAT
========================================================= */

function updateChat() {

    const chats = getChats();

    const chat = chats.find(
        item => item.id === currentChatId
    );

    if (!chat) return;

    chat.messages = messages;

    chat.updatedAt = Date.now();

    const firstUserMessage =
        messages.find(
            item => item.role === "user"
        );

    if (
        firstUserMessage &&
        chat.title === "New Chat"
    ) {

        const title =
            String(firstUserMessage.content || "")
                .replace(/\s+/g, " ")
                .trim();

        if (title) {

            chat.title =
                title.substring(0, 40);

        }

    }

    saveChats(chats);

    updateTitle();

    renderHistory();

}


/* =========================================================
   TITLE
========================================================= */

function updateTitle() {

    const titleElement = $("chatTitle");

    if (!titleElement) return;

    const chats = getChats();

    const chat = chats.find(
        item => item.id === currentChatId
    );

    titleElement.textContent =
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

    if (!chats.length) return;

    const heading =
        document.createElement("div");

    heading.className =
        "history-section-title";

    heading.textContent =
        sectionTitle;

    list.appendChild(heading);

    chats.forEach(chat => {

        const row =
            document.createElement("div");

        row.className =
            "history-item";

        if (chat.id === currentChatId) {

            row.classList.add("active");

        }

        if (
            selectMode &&
            selectedChats.has(chat.id)
        ) {

            row.classList.add("selected");

        }

        if (selectMode) {

            row.classList.add("select-mode");

            const checkbox =
                document.createElement("input");

            checkbox.type = "checkbox";

            checkbox.className =
                "chat-checkbox";

            checkbox.checked =
                selectedChats.has(chat.id);

            checkbox.addEventListener(
                "click",
                event => event.stopPropagation()
            );

            checkbox.addEventListener(
                "change",
                () =>
                    toggleSelectedChat(chat.id)
            );

            row.appendChild(checkbox);

        }

        const title =
            document.createElement("div");

        title.className =
            "history-title";

        title.textContent =
            chat.title || "New Chat";

        row.appendChild(title);

        if (!selectMode) {

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

            pin.textContent =
                chat.pinned ? "📌" : "📍";

            pin.title =
                chat.pinned
                    ? "Unpin chat"
                    : "Pin chat";

            pin.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    togglePin(chat.id);

                }
            );

            /* DELETE */

            const del =
                document.createElement("button");

            del.type = "button";

            del.className =
                "history-action delete";

            del.textContent = "🗑";

            del.title = "Delete chat";

            del.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    deleteChat(chat.id);

                }
            );

            actions.appendChild(pin);

            actions.appendChild(del);

            row.appendChild(actions);

        }

        row.addEventListener(
            "click",
            () => {

                if (selectMode) {

                    toggleSelectedChat(chat.id);

                } else {

                    openChat(chat.id);

                }

            }
        );

        list.appendChild(row);

    });

}


/* =========================================================
   PIN
========================================================= */

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
            ? "📌 Chat pinned"
            : "Chat unpinned"
    );

}


/* =========================================================
   DELETE CHAT
========================================================= */

function deleteChat(id) {

    const chats = getChats();

    const chat = chats.find(
        item => item.id === id
    );

    if (!chat) return;

    if (
        !confirm(
            `Delete "${chat.title || "New Chat"}"?`
        )
    ) {
        return;
    }

    let updated =
        chats.filter(
            item => item.id !== id
        );

    if (!updated.length) {

        updated = [createChat()];

    }

    saveChats(updated);

    if (currentChatId === id) {

        currentChatId =
            updated[0].id;

        messages =
            updated[0].messages || [];

        renderMessages();

        updateTitle();

    }

    selectedChats.delete(id);

    renderHistory();

    showToast("🗑 Chat deleted");

}


/* =========================================================
   SELECT MODE
========================================================= */

function toggleSelectMode() {

    selectMode = !selectMode;

    selectedChats.clear();

    renderHistory();

    updateSelectionUI();

}


/* =========================================================
   SELECT CHAT
========================================================= */

function toggleSelectedChat(id) {

    if (selectedChats.has(id)) {

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

    if (!selectedChats.size) {

        showToast(
            "Select at least one chat"
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

    let chats = getChats();

    chats =
        chats.filter(
            chat =>
                !selectedChats.has(chat.id)
        );

    if (!chats.length) {

        chats = [createChat()];

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

    selectMode = false;

    renderHistory();

    updateSelectionUI();

    closeMore();

    showToast(
        `🗑 ${count} chat${count > 1 ? "s" : ""} deleted`
    );

}


/* =========================================================
   SELECTION UI
========================================================= */

function updateSelectionUI() {

    const deleteButton =
        $("deleteSelectedBtn");

    if (deleteButton) {

        if (selectMode) {

            deleteButton.style.display =
                "flex";

            deleteButton.textContent =
                selectedChats.size
                    ? `🗑 Delete Selected (${selectedChats.size})`
                    : "🗑 Delete Selected";

        } else {

            deleteButton.style.display =
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
   SAVE CHAT
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

    stopAllVoice();

    const chat = createChat();

    saveChats([chat]);

    currentChatId = chat.id;

    messages = [];

    selectedChats.clear();

    selectMode = false;

    renderMessages();

    updateTitle();

    renderHistory();

    updateSelectionUI();

    closeMore();

    showToast("🗑 History cleared");

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

function addMessage(
    role,
    text
) {

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

        copy.textContent = "📋";

        copy.title = "Copy";

        copy.addEventListener(
            "click",
            () => copyText(text)
        );

        /* VOICE */

        const voice =
            document.createElement("button");

        voice.type = "button";

        voice.className =
            "message-action voice-action";

        voice.textContent = "🔊";

        voice.title = "Read aloud";

        voice.addEventListener(
            "click",
            () =>
                speakText(
                    text,
                    voice
                )
        );

        actions.appendChild(copy);

        actions.appendChild(voice);

        wrapper.appendChild(actions);

    }

    area.appendChild(wrapper);

}


/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage() {

    if (isSending) return;

    const input = $("messageInput");

    const sendButton = $("sendBtn");

    if (!input) return;

    const text = input.value.trim();

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

    }

    catch (error) {

        removeTyping();

        console.error(
            "Viggo error:",
            error
        );

        messages.push({

            role: "assistant",

            content:
                "⚠️ " +
                (
                    error.message ||
                    "Viggo AI error"
                ),

            timestamp: Date.now()

        });

        renderMessages();

        updateChat();

    }

    finally {

        isSending = false;

        if (sendButton) {

            sendButton.disabled = false;

        }

        input.focus();

    }

}


/* =========================================================
   API
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

        data = JSON.parse(raw);

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

    return String(data.reply);

}


/* =========================================================
   TYPING
========================================================= */

function showTyping() {

    const area = $("messages");

    if (!area) return;

    removeTyping();

    const div =
        document.createElement("div");

    div.id = "viggoTyping";

    div.className =
        "message assistant-message";

    div.innerHTML = `

        <div class="message-bubble typing-bubble">

            <span>●</span>
            <span>●</span>
            <span>●</span>

        </div>

    `;

    area.appendChild(div);

    scrollBottom();

}


function removeTyping() {

    $("viggoTyping")?.remove();

}


/* =========================================================
   COPY
========================================================= */

async function copyText(text) {

    try {

        await navigator.clipboard.writeText(
            text
        );

    }

    catch {

        const textarea =
            document.createElement("textarea");

        textarea.value = text;

        textarea.style.position = "fixed";

        textarea.style.opacity = "0";

        document.body.appendChild(
            textarea
        );

        textarea.select();

        document.execCommand("copy");

        textarea.remove();

    }

    showToast("✓ Copied");

}


/* =========================================================
   SPEECH LANGUAGE
========================================================= */

function getSpeechLanguage() {

    const languageMap = {

        en: "en-IN",

        ta: "ta-IN",

        hi: "hi-IN",

        ml: "ml-IN",

        te: "te-IN",

        kn: "kn-IN"

    };

    return (
        languageMap[currentLanguage] ||
        "en-IN"
    );

}


/* =========================================================
   FEMALE VOICE
========================================================= */

function getFemaleVoice() {

    if (!window.speechSynthesis) {
        return null;
    }

    const voices =
        speechSynthesis.getVoices();

    if (!voices.length) {
        return null;
    }

    const languages = {

        en: ["en-IN", "en-US", "en-GB"],
        ta: ["ta-IN"],
        hi: ["hi-IN"],
        ml: ["ml-IN"],
        te: ["te-IN"],
        kn: ["kn-IN"]

    };

    const preferred =
        languages[currentLanguage] ||
        ["en-IN"];

    const femaleWords = [

        "female",
        "woman",
        "zira",
        "samantha",
        "susan",
        "heera",
        "veena",
        "lekha",
        "kalpana"

    ];

    for (const lang of preferred) {

        const voice =
            voices.find(v => {

                const name =
                    v.name.toLowerCase();

                return (
                    v.lang.toLowerCase() ===
                    lang.toLowerCase()
                    &&
                    femaleWords.some(
                        word =>
                            name.includes(word)
                    )
                );

            });

        if (voice) {
            return voice;
        }

    }

    for (const lang of preferred) {

        const voice =
            voices.find(v =>
                v.lang
                    .toLowerCase()
                    .startsWith(
                        lang
                            .split("-")[0]
                            .toLowerCase()
                    )
            );

        if (voice) {
            return voice;
        }

    }

    return voices[0];

}


/* =========================================================
   MALE VOICE
========================================================= */

function getMaleVoice() {

    if (!window.speechSynthesis) {
        return null;
    }

    const voices =
        speechSynthesis.getVoices();

    if (!voices.length) {
        return null;
    }

    const languages = {

        en: ["en-IN", "en-US", "en-GB"],
        ta: ["ta-IN"],
        hi: ["hi-IN"],
        ml: ["ml-IN"],
        te: ["te-IN"],
        kn: ["kn-IN"]

    };

    const preferred =
        languages[currentLanguage] ||
        ["en-IN"];

    const maleWords = [

        "male",
        "man",
        "david",
        "mark",
        "daniel",
        "alex",
        "ravi"

    ];

    for (const lang of preferred) {

        const voice =
            voices.find(v => {

                const name =
                    v.name.toLowerCase();

                return (
                    v.lang.toLowerCase() ===
                    lang.toLowerCase()
                    &&
                    maleWords.some(
                        word =>
                            name.includes(word)
                    )
                );

            });

        if (voice) {
            return voice;
        }

    }

    for (const lang of preferred) {

        const languageVoices =
            voices.filter(v =>
                v.lang
                    .toLowerCase()
                    .startsWith(
                        lang
                            .split("-")[0]
                            .toLowerCase()
                    )
            );

        if (languageVoices.length > 1) {

            return languageVoices[
                languageVoices.length - 1
            ];

        }

    }

    return voices[0];

}


/* =========================================================
   SELECTED VOICE
========================================================= */

function getSelectedVoice() {

    return selectedVoiceGender === "male"
        ? getMaleVoice()
        : getFemaleVoice();

}


/* =========================================================
   SPEAK
========================================================= */

function speakText(
    text,
    button
) {

    if (!window.speechSynthesis) {

        showToast(
            "Voice not supported"
        );

        return;

    }

    if (speechSynthesis.speaking) {

        speechSynthesis.cancel();

        resetSpeechButton();

        return;

    }

    speechSynthesis.cancel();

    const speech =
        new SpeechSynthesisUtterance(text);

    speech.lang =
        getSpeechLanguage();

    speech.rate = 0.9;

    speech.pitch =
        selectedVoiceGender === "male"
            ? 0.85
            : 1.05;

    speech.volume = 1;

    const selectedVoice =
        getSelectedVoice();

    if (selectedVoice) {

        speech.voice =
            selectedVoice;

        speech.lang =
            selectedVoice.lang;

    }

    currentSpeechButton = button;

    currentUtterance = speech;

    if (button) {

        button.textContent = "⏹";

        button.title = "Stop voice";

        button.classList.add(
            "speaking"
        );

    }

    speech.onend = () => {

        resetSpeechButton();

    };

    speech.onerror = () => {

        resetSpeechButton();

    };

    speechSynthesis.speak(speech);

}


/* =========================================================
   RESET SPEECH BUTTON
========================================================= */

function resetSpeechButton() {

    if (currentSpeechButton) {

        currentSpeechButton.textContent =
            "🔊";

        currentSpeechButton.title =
            "Read aloud";

        currentSpeechButton.classList.remove(
            "speaking"
        );

    }

    currentSpeechButton = null;

    currentUtterance = null;

}


/* =========================================================
   STOP VOICE
========================================================= */

function stopAllVoice() {

    if (window.speechSynthesis) {

        speechSynthesis.cancel();

    }

    document
        .querySelectorAll(".voice-action")
        .forEach(button => {

            button.textContent = "🔊";

            button.title = "Read aloud";

            button.classList.remove(
                "speaking"
            );

        });

    currentSpeechButton = null;

    currentUtterance = null;

}


/* =========================================================
   VOICE SETTINGS UI
========================================================= */

function updateVoiceSettingsUI() {

    const femaleButton =
        $("femaleVoiceBtn");

    const maleButton =
        $("maleVoiceBtn");

    if (femaleButton) {

        femaleButton.classList.toggle(
            "active",
            selectedVoiceGender === "female"
        );

    }

    if (maleButton) {

        maleButton.classList.toggle(
            "active",
            selectedVoiceGender === "male"
        );

    }

    const status =
        $("voiceLanguageStatus");

    if (status) {

        status.textContent =
            selectedVoiceGender === "male"
                ? "👨 Male voice selected"
                : "👩 Female voice selected";

    }

}


/* =========================================================
   FEMALE
========================================================= */

function selectFemaleVoice() {

    selectedVoiceGender = "female";

    saveSettings();

    stopAllVoice();

    updateVoiceSettingsUI();

    showToast(
        "👩 Female voice selected"
    );

}


/* =========================================================
   MALE
========================================================= */

function selectMaleVoice() {

    selectedVoiceGender = "male";

    saveSettings();

    stopAllVoice();

    updateVoiceSettingsUI();

    showToast(
        "👨 Male voice selected"
    );

}


/* =========================================================
   SPEECH VOICES
========================================================= */

function setupSpeechVoices() {

    if (!window.speechSynthesis) {
        return;
    }

    speechSynthesis.onvoiceschanged =
        () => {

            speechSynthesis.getVoices();

            updateVoiceSettingsUI();

        };

    speechSynthesis.getVoices();

    updateVoiceSettingsUI();

}


/* =========================================================
   VOICE INPUT
========================================================= */

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

    recognition.maxAlternatives = 1;

    recognition.onstart = () => {

        isListening = true;

        $("voiceBtn")
            ?.classList
            .add("active");

        showToast("🎤 Listening...");

    };

    recognition.onresult = event => {

        const result =
            event.results?.[0]?.[0];

        if (!result) return;

        const input =
            $("messageInput");

        if (input) {

            input.value =
                result.transcript;

            input.focus();

        }

    };

    recognition.onerror = event => {

        console.error(
            "Voice input error:",
            event.error
        );

        showToast(
            event.error === "not-allowed"
                ? "Microphone permission denied"
                : "Voice error"
        );

    };

    recognition.onend = () => {

        isListening = false;

        $("voiceBtn")
            ?.classList
            .remove("active");

    };

}


/* =========================================================
   TOGGLE VOICE
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

    recognition.lang =
        getSpeechLanguage();

    try {

        recognition.start();

    }

    catch (error) {

        console.error(error);

    }

}


/* =========================================================
   SHARE CHAT
========================================================= */

async function shareChat() {

    const chats = getChats();

    const chat = chats.find(
        item => item.id === currentChatId
    );

    if (!chat) {

        showToast(
            "No chat to share"
        );

        return;

    }

    const link =
        window.location.origin +
        window.location.pathname +
        "?chat=" +
        encodeURIComponent(chat.id);

    try {

        if (navigator.share) {

            await navigator.share({

                title:
                    chat.title ||
                    "Viggo AI Chat",

                text:
                    "Open this Viggo AI chat",

                url: link

            });

        }

        else {

            await copyText(link);

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
                "Share error:",
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

    const chatId =
        params.get("chat");

    if (!chatId) return;

    const chats = getChats();

    const chat =
        chats.find(
            item => item.id === chatId
        );

    if (!chat) {

        showToast(
            "Shared chat is not available on this device."
        );

        return;

    }

    currentChatId = chat.id;

    messages =
        Array.isArray(chat.messages)
            ? chat.messages
            : [];

    renderMessages();

    updateTitle();

    showToast(
        "🔗 Shared chat opened"
    );

}


/* =========================================================
   ⭐ MORE MENU
========================================================= */

function toggleMore() {

    const menu = $("moreMenu");

    if (!menu) {

        console.error(
            "moreMenu element not found"
        );

        return;

    }

    menu.classList.toggle("show");

}


/* =========================================================
   CLOSE MORE
========================================================= */

function closeMore() {

    const menu = $("moreMenu");

    if (!menu) return;

    menu.classList.remove("show");

}


/* =========================================================
   VOICE SETTINGS PANEL
========================================================= */

function toggleVoiceSettings() {

    const panel =
        $("voiceSettingsPanel");

    if (!panel) return;

    panel.classList.toggle("show");

    updateVoiceSettingsUI();

}


/* =========================================================
   LANGUAGE
========================================================= */

function setLanguage(language) {

    const validLanguages = [

        "en",
        "ta",
        "hi",
        "ml",
        "te",
        "kn"

    ];

    if (
        !validLanguages.includes(language)
    ) {
        return;
    }

    currentLanguage = language;

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

function showToast(message) {

    let toast = $("viggoToast");

    if (!toast) {

        toast =
            document.createElement("div");

        toast.id = "viggoToast";

        toast.className = "toast";

        document.body.appendChild(toast);

    }

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(toast.timer);

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

    const area = $("messages");

    if (!area) return;

    requestAnimationFrame(() => {

        area.scrollTop =
            area.scrollHeight;

    });

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


    /* VOICE */

    $("voiceBtn")
        ?.addEventListener(
            "click",
            toggleVoice
        );


    /* =====================================================
       ⭐ MORE BUTTON - IMPORTANT
    ===================================================== */

    const moreButton =
        $("moreBtn");

    if (moreButton) {

        moreButton.addEventListener(
            "click",
            function(event) {

                event.preventDefault();

                event.stopPropagation();

                toggleMore();

            }
        );

    }


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
            toggleSelectMode
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


    /* MESSAGE INPUT */

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
        .querySelectorAll("[data-language]")
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


    /* VOICE SETTINGS */

    $("voiceSettingsButton")
        ?.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                toggleVoiceSettings();

            }
        );


    /* FEMALE */

    $("femaleVoiceBtn")
        ?.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                selectFemaleVoice();

            }
        );


    /* MALE */

    $("maleVoiceBtn")
        ?.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                selectMaleVoice();

            }
        );


    /* =====================================================
       OUTSIDE CLICK
    ===================================================== */

    document.addEventListener(
        "click",
        event => {

            const moreArea =
                event.target.closest(
                    ".sidebar-more"
                );

            if (!moreArea) {

                closeMore();

            }

        }
    );

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
