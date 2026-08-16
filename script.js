"use strict";


/* =========================================
   CONFIG
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

let selectedChats = new Set();

let selectMode = false;

let selectedVoice = "female";


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

        updateVoiceButtons();

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


        if (data.voice) {

            selectedVoice =
                data.voice;

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
                currentLanguage,

            voice:
                selectedVoice

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

    selectMode = false;


    updateSelectButton();

    renderMessages();

    updateTitle();

    renderHistory();

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


        if (
            selectMode
        ) {

            row.classList.add(
                "selectable"
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


        if (selectMode) {

            const checkbox =
                document.createElement(
                    "input"
                );


            checkbox.type =
                "checkbox";


            checkbox.checked =
                selectedChats.has(
                    chat.id
                );


            checkbox.onclick =
                event => {

                    event.stopPropagation();

                };


            checkbox.onchange =
                event => {

                    if (
                        event.target.checked
                    ) {

                        selectedChats.add(
                            chat.id
                        );

                    } else {

                        selectedChats.delete(
                            chat.id
                        );

                    }


                    updateSelectButton();

                };


            actions.appendChild(
                checkbox
            );

        } else {

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


            pin.onclick =
                event => {

                    event.stopPropagation();

                    togglePin(chat.id);

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

                if (selectMode) {

                    if (
                        selectedChats.has(
                            chat.id
                        )
                    ) {

                        selectedChats.delete(
                            chat.id
                        );

                    } else {

                        selectedChats.add(
                            chat.id
                        );

                    }


                    renderHistory();

                    updateSelectButton();

                } else {

                    openChat(
                        chat.id
                    );

                }

            };


        list.appendChild(row);

    });

}


/* =========================================
   SELECT CHAT MODE
========================================= */

function toggleSelectMode() {

    selectMode =
        !selectMode;


    if (!selectMode) {

        selectedChats.clear();

    }


    renderHistory();

    updateSelectButton();

}


function updateSelectButton() {

    const button =
        $("selectChatsBtn");


    const deleteButton =
        $("deleteSelectedBtn");


    if (!button)
        return;


    if (selectMode) {

        button.textContent =
            "✖ Cancel Selection";

    } else {

        button.textContent =
            "☑ Select Chats";

    }


    if (deleteButton) {

        deleteButton.style.display =
            selectMode &&
            selectedChats.size > 0
                ? "block"
                : "none";

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
            "Select chats first"
        );

        return;

    }


    const count =
        selectedChats.size;


    if (
        !confirm(
            `Delete ${count} selected chat(s)?`
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

    selectMode = false;


    renderHistory();

    updateSelectButton();


    showToast(
        `${count} chat(s) deleted`
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

    selectMode = false;


    renderMessages();

    updateTitle();

    renderHistory();

    updateSelectButton();


    showToast(
        "History cleared"
    );


    closeMore();

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


        copy.type =
            "button";


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


        voice.type =
            "button";


        voice.textContent =
            "🔊";


        voice.onclick =
            () =>
                speakText(text);


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
            "Viggo server-க்கு connect ஆகவில்லை."
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
   VOICE SETTINGS
========================================= */

function setVoice(type) {

    selectedVoice =
        type;


    saveSettings();

    updateVoiceButtons();


    showToast(
        type === "male"
            ? "👨 Male voice selected"
            : "👩 Female voice selected"
    );

}


function updateVoiceButtons() {

    const male =
        $("maleVoiceBtn");


    const female =
        $("femaleVoiceBtn");


    if (male) {

        male.textContent =
            selectedVoice === "male"
                ? "✅ 👨 Male Voice"
                : "👨 Male Voice";

    }


    if (female) {

        female.textContent =
            selectedVoice === "female"
                ? "✅ 👩 Female Voice"
                : "👩 Female Voice";

    }

}


/* =========================================
   FIND VOICE
========================================= */

function findBestVoice() {

    if (
        !window.speechSynthesis
    ) {

        return null;

    }


    const voices =
        speechSynthesis.getVoices();


    const langMap = {

        en: ["en-IN", "en-US", "en-GB"],

        ta: ["ta-IN"],

        hi: ["hi-IN"],

        ml: ["ml-IN"],

        te: ["te-IN"],

        kn: ["kn-IN"]

    };


    const preferredLanguages =
        langMap[currentLanguage] ||
        ["en-IN"];


    const matching =
        voices.filter(
            voice =>
                preferredLanguages.some(
                    lang =>
                        voice.lang
                            .toLowerCase()
                            .startsWith(
                                lang
                                    .toLowerCase()
                                    .split("-")[0]
                            )
                )
        );


    if (!matching.length) {

        return voices[0] || null;

    }


    const femaleWords = [
        "female",
        "woman",
        "girl",
        "samantha",
        "zira",
        "susan",
        "karen",
        "google uk english female"
    ];


    const maleWords = [
        "male",
        "man",
        "boy",
        "david",
        "mark",
        "alex",
        "ravi",
        "daniel"
    ];


    const words =
        selectedVoice === "female"
            ? femaleWords
            : maleWords;


    const selected =
        matching.find(
            voice => {

                const name =
                    voice.name.toLowerCase();

                return words.some(
                    word =>
                        name.includes(word)
                );

            }
        );


    return selected ||
        matching[0] ||
        null;

}


/* =========================================
   VOICE OUTPUT
========================================= */

function speakText(text) {

    if (
        !window.speechSynthesis
    ) {

        showToast(
            "Voice not supported in this browser"
        );

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


    const voice =
        findBestVoice();


    if (voice) {

        speech.voice =
            voice;

    }


    speech.rate =
        1;


    speech.pitch =
        selectedVoice === "female"
            ? 1.05
            : 0.85;


    speech.volume =
        1;


    speechSynthesis.speak(
        speech
    );

}


/* Load voices when browser creates them */

if (
    window.speechSynthesis
) {

    speechSynthesis.onvoiceschanged =
        () => {

            findBestVoice();

        };

}


/* =========================================
   STOP VOICE
========================================= */

function stopVoice() {

    if (
        window.speechSynthesis
    ) {

        speechSynthesis.cancel();

        showToast(
            "⏹ Voice stopped"
        );

    }

}


/* =========================================
   VOICE INPUT
========================================= */

function setupVoice() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

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
                .add("active");


            showToast(
                "🎤 Listening..."
            );

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

                input.focus();

            }

        };


    recognition.onerror =
        event => {

            console.error(
                "Voice error:",
                event.error
            );


            if (
                event.error ===
                "not-allowed"
            ) {

                showToast(
                    "Microphone permission denied"
                );

            } else {

                showToast(
                    "Voice error: " +
                    event.error
                );

            }

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
            "Voice input is not supported. Use Chrome."
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

        console.error(error);

    }

}


/* =========================================
   SHARE
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
       Short link version:

       Instead of putting the entire chat
       inside the URL, create a compact ID.
       
       This stores the shared chat locally
       and uses a short URL parameter.
    */

    const shareId =
        "s" +
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .slice(2, 6);


    const sharedKey =
        "viggo_shared_" +
        shareId;


    localStorage.setItem(
        sharedKey,
        JSON.stringify(chat)
    );


    const link =
        window.location.origin +
        window.location.pathname +
        "?share=" +
        shareId;


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
                "🔗 Short share link copied"
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


/* =========================================
   LOAD SHARED CHAT
========================================= */

function loadSharedChat() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const shareId =
        params.get("share");


    if (!shareId)
        return;


    const key =
        "viggo_shared_" +
        shareId;


    const saved =
        localStorage.getItem(key);


    if (!saved) {

        showToast(
            "Shared chat is unavailable on this browser"
        );

        return;

    }


    try {

        const chat =
            JSON.parse(saved);


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
            "🔗 Shared chat opened"
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


/* =========================================
   TOAST
========================================= */

function showToast(message) {

    let toast =
        $("viggoToast");


    if (!toast)
        return;


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


    $("maleVoiceBtn")
        ?.addEventListener(
            "click",
            () =>
                setVoice("male")
        );


    $("femaleVoiceBtn")
        ?.addEventListener(
            "click",
            () =>
                setVoice("female")
        );


    $("stopVoiceBtn")
        ?.addEventListener(
            "click",
            stopVoice
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
