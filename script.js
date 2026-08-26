"use strict";

/* =====================================================
   VIGGO AI - FULL SCRIPT
   FIXED VERSION
===================================================== */

/* =====================================================
   API
===================================================== */

const API_URL =" https://ai-tool-2-zpul.onrender.co";



/* =====================================================
   GLOBAL VARIABLES
===================================================== */

let sidebar;
let openSidebar;
let closeSidebar;
let newChat;
let searchChat;
let chatHistory;
let conversation;
let message;
let send;
let mic;
let plusBtn;
let plusMenu;
let shareBtn;
let moreBtn;
let moreMenu;
let voiceMenuBtn;
let languageBtn;
let clearChatBtn;
let savedChatsBtn;
let selectChatsBtn;
let deleteSelectedBtn;
let plusVoiceBtn;

let photoInput;
let videoInput;
let fileInput;

let chats = [];
let currentChatId = null;
let selectingChats = false;
let pinnedChats = [];
let speakerEnabled = true;
let recognition = null;


/* =====================================================
   LANGUAGE LIST
===================================================== */

const languages = [

    {
        code: "en-IN",
        name: "🇮🇳 English - India",
        timezone: "Asia/Kolkata"
    },

    {
        code: "en-US",
        name: "🇺🇸 English - USA",
        timezone: "America/New_York"
    },

    {
        code: "en-GB",
        name: "🇬🇧 English - UK",
        timezone: "Europe/London"
    },

    {
        code: "en-AU",
        name: "🇦🇺 English - Australia",
        timezone: "Australia/Sydney"
    },

    {
        code: "ta-IN",
        name: "🇮🇳 தமிழ்",
        timezone: "Asia/Kolkata"
    },

    {
        code: "hi-IN",
        name: "🇮🇳 हिन्दी",
        timezone: "Asia/Kolkata"
    },

    {
        code: "te-IN",
        name: "🇮🇳 తెలుగు",
        timezone: "Asia/Kolkata"
    },

    {
        code: "kn-IN",
        name: "🇮🇳 ಕನ್ನಡ",
        timezone: "Asia/Kolkata"
    },

    {
        code: "ml-IN",
        name: "🇮🇳 മലയാളം",
        timezone: "Asia/Kolkata"
    },

    {
        code: "bn-IN",
        name: "🇮🇳 বাংলা",
        timezone: "Asia/Kolkata"
    },

    {
        code: "mr-IN",
        name: "🇮🇳 मराठी",
        timezone: "Asia/Kolkata"
    },

    {
        code: "gu-IN",
        name: "🇮🇳 ગુજરાતી",
        timezone: "Asia/Kolkata"
    },

    {
        code: "pa-IN",
        name: "🇮🇳 ਪੰਜਾਬੀ",
        timezone: "Asia/Kolkata"
    },

    {
        code: "ur-IN",
        name: "🇮🇳 اردو",
        timezone: "Asia/Kolkata"
    },

    {
        code: "or-IN",
        name: "🇮🇳 ଓଡ଼ିଆ",
        timezone: "Asia/Kolkata"
    },

    {
        code: "as-IN",
        name: "🇮🇳 অসমীয়া",
        timezone: "Asia/Kolkata"
    },

    {
        code: "fr-FR",
        name: "🇫🇷 Français",
        timezone: "Europe/Paris"
    },

    {
        code: "de-DE",
        name: "🇩🇪 Deutsch",
        timezone: "Europe/Berlin"
    },

    {
        code: "es-ES",
        name: "🇪🇸 Español",
        timezone: "Europe/Madrid"
    },

    {
        code: "it-IT",
        name: "🇮🇹 Italiano",
        timezone: "Europe/Rome"
    },

    {
        code: "pt-BR",
        name: "🇧🇷 Português",
        timezone: "America/Sao_Paulo"
    },

    {
        code: "ru-RU",
        name: "🇷🇺 Русский",
        timezone: "Europe/Moscow"
    },

    {
        code: "ja-JP",
        name: "🇯🇵 日本語",
        timezone: "Asia/Tokyo"
    },

    {
        code: "ko-KR",
        name: "🇰🇷 한국어",
        timezone: "Asia/Seoul"
    },

    {
        code: "zh-CN",
        name: "🇨🇳 中文",
        timezone: "Asia/Shanghai"
    },

    {
        code: "ar-SA",
        name: "🇸🇦 العربية",
        timezone: "Asia/Riyadh"
    },

    {
        code: "tr-TR",
        name: "🇹🇷 Türkçe",
        timezone: "Europe/Istanbul"
    },

    {
        code: "nl-NL",
        name: "🇳🇱 Nederlands",
        timezone: "Europe/Amsterdam"
    },

    {
        code: "pl-PL",
        name: "🇵🇱 Polski",
        timezone: "Europe/Warsaw"
    },

    {
        code: "sv-SE",
        name: "🇸🇪 Svenska",
        timezone: "Europe/Stockholm"
    },

    {
        code: "da-DK",
        name: "🇩🇰 Dansk",
        timezone: "Europe/Copenhagen"
    },

    {
        code: "fi-FI",
        name: "🇫🇮 Suomi",
        timezone: "Europe/Helsinki"
    },

    {
        code: "no-NO",
        name: "🇳🇴 Norsk",
        timezone: "Europe/Oslo"
    },

    {
        code: "el-GR",
        name: "🇬🇷 Ελληνικά",
        timezone: "Europe/Athens"
    },

    {
        code: "he-IL",
        name: "🇮🇱 עברית",
        timezone: "Asia/Jerusalem"
    },

    {
        code: "th-TH",
        name: "🇹🇭 ไทย",
        timezone: "Asia/Bangkok"
    },

    {
        code: "vi-VN",
        name: "🇻🇳 Tiếng Việt",
        timezone: "Asia/Ho_Chi_Minh"
    },

    {
        code: "id-ID",
        name: "🇮🇩 Bahasa Indonesia",
        timezone: "Asia/Jakarta"
    },

    {
        code: "ms-MY",
        name: "🇲🇾 Bahasa Melayu",
        timezone: "Asia/Kuala_Lumpur"
    }
];


/* =====================================================
   DOM INITIALIZATION
===================================================== */

function initializeElements() {

    sidebar =
        document.getElementById("sidebar");

    openSidebar =
        document.getElementById("openSidebar");

    closeSidebar =
        document.getElementById("closeSidebar");

    newChat =
        document.getElementById("newChat");

    searchChat =
        document.getElementById("searchChat");

    chatHistory =
        document.getElementById("chatHistory");

    conversation =
        document.getElementById("conversation");

    message =
        document.getElementById("message");

    send =
        document.getElementById("send");

    mic =
        document.getElementById("mic");

    plusBtn =
        document.getElementById("plusBtn");

    plusMenu =
        document.getElementById("plusMenu");

    shareBtn =
        document.getElementById("shareBtn");

    moreBtn =
        document.getElementById("moreBtn");

    moreMenu =
        document.getElementById("moreMenu");

    voiceMenuBtn =
        document.getElementById("voiceMenuBtn");

    languageBtn =
        document.getElementById("languageBtn");

    clearChatBtn =
        document.getElementById("clearChatBtn");

    savedChatsBtn =
        document.getElementById("savedChatsBtn");

    selectChatsBtn =
        document.getElementById("selectChatsBtn");

    deleteSelectedBtn =
        document.getElementById("deleteSelectedBtn");

    plusVoiceBtn =
        document.getElementById("plusVoiceBtn");
}


/* =====================================================
   VIEWPORT
===================================================== */

function fixViewportHeight() {

    const height =
        window.visualViewport
            ? window.visualViewport.height
            : window.innerHeight;

    document.documentElement.style.setProperty(
        "--app-height",
        `${height}px`
    );
}


/* =====================================================
   FILE INPUTS
===================================================== */

function createFileInputs() {

    photoInput =
        document.createElement("input");

    photoInput.type = "file";
    photoInput.accept = "image/*";
    photoInput.style.display = "none";

    document.body.appendChild(
        photoInput
    );


    videoInput =
        document.createElement("input");

    videoInput.type = "file";
    videoInput.accept = "video/*";
    videoInput.style.display = "none";

    document.body.appendChild(
        videoInput
    );


    fileInput =
        document.createElement("input");

    fileInput.type = "file";
    fileInput.accept = "*/*";
    fileInput.style.display = "none";

    document.body.appendChild(
        fileInput
    );
}


/* =====================================================
   STORAGE
===================================================== */

function loadStorage() {

    try {

        chats =
            JSON.parse(
                localStorage.getItem(
                    "viggoChats"
                ) || "[]"
            );

        if (!Array.isArray(chats)) {
            chats = [];
        }

    } catch (error) {

        console.error(
            "Chat storage error:",
            error
        );

        chats = [];
    }


    currentChatId =
        localStorage.getItem(
            "viggoCurrentChatId"
        );


    try {

        pinnedChats =
            JSON.parse(
                localStorage.getItem(
                    "viggoPinnedChats"
                ) || "[]"
            );

        if (!Array.isArray(pinnedChats)) {
            pinnedChats = [];
        }

    } catch {

        pinnedChats = [];
    }


    if (
        !localStorage.getItem(
            "viggoLanguage"
        )
    ) {

        localStorage.setItem(
            "viggoLanguage",
            "en-IN"
        );
    }


    if (
        !localStorage.getItem(
            "viggoVoice"
        )
    ) {

        localStorage.setItem(
            "viggoVoice",
            "female"
        );
    }
}


/* =====================================================
   SAVE STORAGE
===================================================== */

function saveChats() {

    localStorage.setItem(
        "viggoChats",
        JSON.stringify(chats)
    );

    if (currentChatId) {

        localStorage.setItem(
            "viggoCurrentChatId",
            String(currentChatId)
        );

    } else {

        localStorage.removeItem(
            "viggoCurrentChatId"
        );
    }

    localStorage.setItem(
        "viggoPinnedChats",
        JSON.stringify(pinnedChats)
    );
}


/* =====================================================
   TIMEZONE
===================================================== */

function getBrowserTimezone() {

    try {

        return (
            Intl.DateTimeFormat()
                .resolvedOptions()
                .timeZone ||
            "Asia/Kolkata"
        );

    } catch {

        return "Asia/Kolkata";
    }
}


function getLanguageTimezone() {

    const language =
        localStorage.getItem(
            "viggoLanguage"
        ) || "en-IN";

    const found =
        languages.find(
            item =>
                item.code === language
        );

    return (
        found?.timezone ||
        getBrowserTimezone()
    );
}


function getCurrentDateTime() {

    const timezone =
        getLanguageTimezone();

    try {

        const now =
            new Date();

        const formatter =
            new Intl.DateTimeFormat(
                "en-US",
                {
                    timeZone: timezone,
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true
                }
            );

        return formatter.format(now);

    } catch {

        return new Date().toString();
    }
}


/* =====================================================
   CREATE CHAT
===================================================== */

function createChat() {

    const id =
        Date.now().toString();

    const chat = {

        id,

        title: "New Chat",

        messages: [],

        createdAt: Date.now(),

        selected: false
    };

    chats.unshift(chat);

    currentChatId = id;

    saveChats();

    renderHistory();

    renderConversation();

    message?.focus();
}


/* =====================================================
   CURRENT CHAT
===================================================== */

function getCurrentChat() {

    return chats.find(
        chat =>
            String(chat.id) ===
            String(currentChatId)
    );
}


function ensureChat() {

    if (
        !currentChatId ||
        !getCurrentChat()
    ) {

        createChat();
    }
}


/* =====================================================
   DELETE CHAT
===================================================== */

function deleteChat(chatId) {

    const id =
        String(chatId);

    chats =
        chats.filter(
            chat =>
                String(chat.id) !== id
        );

    pinnedChats =
        pinnedChats.filter(
            pin =>
                String(pin) !== id
        );

    if (
        String(currentChatId) === id
    ) {

        currentChatId =
            chats.length
                ? chats[0].id
                : null;
    }

    if (!chats.length) {
        createChat();
        return;
    }

    saveChats();

    renderHistory();

    renderConversation();
}


/* =====================================================
   PIN
===================================================== */

function togglePinChat(chatId) {

    const id =
        String(chatId);

    const index =
        pinnedChats.indexOf(id);

    if (index === -1) {

        pinnedChats.unshift(id);

    } else {

        pinnedChats.splice(index, 1);
    }

    saveChats();

    renderHistory(
        searchChat?.value || ""
    );
}


/* =====================================================
   HISTORY
===================================================== */

function renderHistory(filter = "") {

    if (!chatHistory) {
        return;
    }

    chatHistory.innerHTML = "";

    const search =
        String(filter)
            .toLowerCase()
            .trim();

    const filtered =
        chats.filter(
            chat =>
                String(
                    chat.title ||
                    "New Chat"
                )
                    .toLowerCase()
                    .includes(search)
        );


    filtered.sort(
        (a, b) => {

            const ap =
                pinnedChats.includes(
                    String(a.id)
                );

            const bp =
                pinnedChats.includes(
                    String(b.id)
                );

            if (ap && !bp) {
                return -1;
            }

            if (!ap && bp) {
                return 1;
            }

            return (
                Number(b.createdAt || 0) -
                Number(a.createdAt || 0)
            );
        }
    );


    filtered.forEach(
        chat => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "history-item";


            if (
                String(chat.id) ===
                String(currentChatId)
            ) {

                item.classList.add(
                    "active"
                );
            }


            const title =
                document.createElement(
                    "div"
                );

            title.className =
                "history-chat-title";

            title.textContent =
                chat.title ||
                "New Chat";


            const actions =
                document.createElement(
                    "div"
                );

            actions.className =
                "history-actions";


            if (selectingChats) {

                const check =
                    document.createElement(
                        "button"
                    );

                check.type = "button";

                check.className =
                    "history-action-btn";

                check.textContent =
                    chat.selected
                        ? "☑"
                        : "☐";

                check.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();

                        chat.selected =
                            !chat.selected;

                        saveChats();

                        renderHistory(
                            searchChat?.value || ""
                        );
                    }
                );

                actions.appendChild(check);
            }


            const pinBtn =
                document.createElement(
                    "button"
                );

            pinBtn.type = "button";

            pinBtn.className =
                "history-action-btn";

            const pinned =
                pinnedChats.includes(
                    String(chat.id)
                );

            pinBtn.textContent =
                pinned
                    ? "📍"
                    : "📌";

            pinBtn.title =
                pinned
                    ? "Unpin"
                    : "Pin";

            pinBtn.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    togglePinChat(
                        chat.id
                    );
                }
            );

            actions.appendChild(
                pinBtn
            );


            const deleteBtn =
                document.createElement(
                    "button"
                );

            deleteBtn.type = "button";

            deleteBtn.className =
                "history-action-btn";

            deleteBtn.textContent =
                "🗑️";

            deleteBtn.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    deleteChat(
                        chat.id
                    );
                }
            );

            actions.appendChild(
                deleteBtn
            );


            item.appendChild(title);

            item.appendChild(actions);


            item.addEventListener(
                "click",
                () => {

                    if (selectingChats) {

                        chat.selected =
                            !chat.selected;

                        saveChats();

                        renderHistory(
                            searchChat?.value || ""
                        );

                        return;
                    }

                    currentChatId =
                        chat.id;

                    saveChats();

                    renderConversation();

                    if (
                        window.innerWidth <= 768
                    ) {

                        sidebar?.classList.remove(
                            "open"
                        );
                    }
                }
            );

            chatHistory.appendChild(item);
        }
    );
}


/* =====================================================
   SPEECH VOICE
===================================================== */

function getSelectedSpeechVoice() {

    if (!window.speechSynthesis) {
        return null;
    }

    const selectedVoice =
        localStorage.getItem(
            "viggoVoice"
        ) || "female";

    const language =
        localStorage.getItem(
            "viggoLanguage"
        ) || "en-IN";

    const voices =
        window.speechSynthesis.getVoices();

    if (!voices.length) {
        return null;
    }


    const languageVoices =
        voices.filter(
            voice =>
                voice.lang === language ||
                voice.lang.startsWith(
                    language.split("-")[0]
                )
        );


    if (selectedVoice === "female") {

        const female =
            languageVoices.find(
                voice => {

                    const name =
                        voice.name.toLowerCase();

                    return (
                        name.includes("female") ||
                        name.includes("woman") ||
                        name.includes("zira") ||
                        name.includes("samantha") ||
                        name.includes("susan") ||
                        name.includes("hazel")
                    );
                }
            );

        if (female) {
            return female;
        }
    }


    if (selectedVoice === "male") {

        const male =
            languageVoices.find(
                voice => {

                    const name =
                        voice.name.toLowerCase();

                    return (
                        name.includes("male") ||
                        name.includes("man") ||
                        name.includes("david") ||
                        name.includes("mark") ||
                        name.includes("daniel")
                    );
                }
            );

        if (male) {
            return male;
        }
    }


    return (
        languageVoices[0] ||
        voices[0]
    );
}


/* =====================================================
   SPEAK
===================================================== */

function speakText(text, button) {

    if (!speakerEnabled) {
        return;
    }

    if (
        !window.speechSynthesis ||
        !window.SpeechSynthesisUtterance
    ) {

        alert(
            "Speaker is not supported."
        );

        return;
    }

    window.speechSynthesis.cancel();

    const language =
        localStorage.getItem(
            "viggoLanguage"
        ) || "en-IN";

    const speech =
        new SpeechSynthesisUtterance(
            text
        );

    speech.lang = language;

    speech.rate = 1;

    speech.pitch = 1;

    speech.volume = 1;


    const voice =
        getSelectedSpeechVoice();

    if (voice) {
        speech.voice = voice;
    }


    if (button) {
        button.textContent =
            "🔊 Speaking...";
    }


    speech.onend = () => {

        if (button) {

            button.textContent =
                "🔊 Speaker";
        }
    };


    speech.onerror = error => {

        console.error(
            "Speech error:",
            error
        );

        if (button) {

            button.textContent =
                "🔊 Speaker";
        }
    };


    window.speechSynthesis.speak(
        speech
    );
}


/* =====================================================
   STOP SPEAKER
===================================================== */

function stopSpeaker(button) {

    window.speechSynthesis?.cancel();

    if (button) {

        button.textContent =
            "🔇 Speaker OFF";

        setTimeout(
            () => {

                button.textContent =
                    "🔊 Speaker";

            },
            800
        );
    }
}


/* =====================================================
   ADD MESSAGE UI
===================================================== */

function addMessageToUI(
    role,
    text,
    media = null
) {

    if (!conversation) {
        return;
    }

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.className =
        "message " +
        (
            role === "user"
                ? "user"
                : "ai"
        );


    const content =
        document.createElement(
            "div"
        );

    content.className =
        "message-content";


    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        "message-bubble";


    if (text) {

        bubble.textContent =
            text;
    }


    /* IMAGE */

    if (
        media?.type?.startsWith("image/") &&
        media.data
    ) {

        const image =
            document.createElement("img");

        image.src =
            media.data;

        image.alt =
            media.name ||
            "Uploaded image";

        image.style.maxWidth =
            "100%";

        image.style.maxHeight =
            "320px";

        image.style.display =
            "block";

        image.style.borderRadius =
            "12px";

        bubble.appendChild(image);
    }


    /* VIDEO */

    if (
        media?.type?.startsWith("video/") &&
        media.data
    ) {

        const video =
            document.createElement("video");

        video.src =
            media.data;

        video.controls = true;

        video.playsInline = true;

        video.preload = "metadata";

        video.style.maxWidth =
            "100%";

        video.style.width =
            "100%";

        video.style.maxHeight =
            "320px";

        video.style.borderRadius =
            "12px";

        bubble.appendChild(video);
    }


    content.appendChild(bubble);


    const actions =
        document.createElement(
            "div"
        );

    actions.className =
        "message-actions";


    /* SAVE */

    const saveBtn =
        document.createElement("button");

    saveBtn.type = "button";

    saveBtn.textContent =
        "💾 Save";

    saveBtn.addEventListener(
        "click",
        () => {

            localStorage.setItem(
                "viggoSavedMessage",
                text || ""
            );

            saveBtn.textContent =
                "✓ Saved";

            setTimeout(
                () => {

                    saveBtn.textContent =
                        "💾 Save";

                },
                1200
            );
        }
    );


    /* COPY */

    const copyBtn =
        document.createElement("button");

    copyBtn.type = "button";

    copyBtn.textContent =
        "📋 Copy";

    copyBtn.addEventListener(
        "click",
        async () => {

            try {

                await navigator.clipboard.writeText(
                    text || ""
                );

            } catch {

                const textarea =
                    document.createElement(
                        "textarea"
                    );

                textarea.value =
                    text || "";

                document.body.appendChild(
                    textarea
                );

                textarea.select();

                document.execCommand(
                    "copy"
                );

                textarea.remove();
            }

            copyBtn.textContent =
                "✓ Copied";

            setTimeout(
                () => {

                    copyBtn.textContent =
                        "📋 Copy";

                },
                1200
            );
        }
    );


    /* LIKE */

    const likeBtn =
        document.createElement("button");

    likeBtn.type = "button";

    likeBtn.textContent =
        "👍 Like";

    likeBtn.addEventListener(
        "click",
        () => {

            likeBtn.textContent =
                likeBtn.textContent ===
                "👍 Like"
                    ? "👍 Liked"
                    : "👍 Like";
        }
    );


    /* SPEAKER */

    const speakerBtn =
        document.createElement("button");

    speakerBtn.type = "button";

    speakerBtn.textContent =
        "🔊 Speaker";

    speakerBtn.addEventListener(
        "click",
        () => {

            if (
                window.speechSynthesis?.speaking
            ) {

                stopSpeaker(
                    speakerBtn
                );

            } else {

                speakText(
                    text || "",
                    speakerBtn
                );
            }
        }
    );


    actions.appendChild(saveBtn);

    actions.appendChild(copyBtn);

    actions.appendChild(likeBtn);

    actions.appendChild(speakerBtn);

    content.appendChild(actions);

    wrapper.appendChild(content);

    conversation.appendChild(wrapper);


    requestAnimationFrame(
        () => {

            conversation.scrollTop =
                conversation.scrollHeight;
        }
    );
}


/* =====================================================
   RENDER CONVERSATION
===================================================== */

function renderConversation() {

    if (!conversation) {
        return;
    }

    conversation.innerHTML = "";

    const chat =
        getCurrentChat();

    if (!chat) {
        return;
    }

    chat.messages.forEach(
        msg => {

            addMessageToUI(
                msg.role,
                msg.text,
                msg.media || null
            );
        }
    );


    requestAnimationFrame(
        () => {

            conversation.scrollTop =
                conversation.scrollHeight;
        }
    );
}


/* =====================================================
   ADD MESSAGE
===================================================== */

function addMessage(
    role,
    text,
    media = null
) {

    ensureChat();

    const chat =
        getCurrentChat();

    if (!chat) {
        return;
    }

    const msg = {

        role,

        text: text || "",

        time: Date.now()
    };


    if (media) {

        msg.media = {

            name:
                media.name || "",

            type:
                media.type || "",

            data:
                media.data || ""
        };
    }


    chat.messages.push(msg);


    if (
        role === "user" &&
        chat.title === "New Chat"
    ) {

        const title =
            text ||
            media?.name ||
            "Uploaded file";

        chat.title =
            String(title).substring(
                0,
                30
            );
    }


    saveChats();

    addMessageToUI(
        role,
        text,
        media
    );

    renderHistory();
}


/* =====================================================
   SEND MESSAGE
===================================================== */

async function sendMessage() {

    if (!message) {
        return;
    }

    const text =
        message.value.trim();

    if (!text) {
        return;
    }


    ensureChat();


    addMessage(
        "user",
        text
    );


    message.value = "";


    if (send) {
        send.disabled = true;
    }


    const typing =
        document.createElement(
            "div"
        );

    typing.className =
        "message ai typing-message";

    typing.innerHTML = `
        <div class="message-content">
            <div class="message-bubble">
                Thinking...
            </div>
        </div>
    `;

    conversation?.appendChild(
        typing
    );


    try {

        const selectedLanguage =
            localStorage.getItem(
                "viggoLanguage"
            ) || "en-IN";


        const browserTimezone =
            getBrowserTimezone();


        const languageTimezone =
            getLanguageTimezone();


        const currentDateTime =
            getCurrentDateTime();


        console.log(
            "Sending:",
            {
                language:
                    selectedLanguage,

                browserTimezone,

                languageTimezone,

                currentDateTime
            }
        );


        const response =
            await fetch(
                API_URL,
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
                                selectedLanguage,

                            timezone:
                                languageTimezone,

                            browserTimezone:
                                browserTimezone,

                            currentDateTime:
                                currentDateTime
                        })
                }
            );


        const data =
            await response.json()
                .catch(
                    () => ({})
                );


        console.log(
            "Server response:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.error ||
                `Server error: ${response.status}`
            );
        }


        typing.remove();


        const reply =
            data.reply ||
            data.response ||
            data.text ||
            data.message;


        if (!reply) {

            throw new Error(
                "Empty response from server."
            );
        }


        addMessage(
            "assistant",
            String(reply)
        );


    } catch (error) {

        console.error(
            "Viggo AI Error:",
            error
        );


        typing.remove();


        addMessage(
            "assistant",
            "Sorry friend, I couldn't connect to Viggo AI right now."
        );


    } finally {

        if (send) {
            send.disabled = false;
        }

        message.focus();
    }
}


/* =====================================================
   FILE READER
===================================================== */

function readFileAsDataURL(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();

            reader.onload =
                () => resolve(
                    reader.result
                );

            reader.onerror =
                () => reject(
                    new Error(
                        "Unable to read file."
                    )
                );

            reader.readAsDataURL(file);
        }
    );
}


/* =====================================================
   UPLOAD
===================================================== */

async function sendUploadedFile(
    file,
    type
) {

    if (!file) {
        return;
    }


    ensureChat();


    let mediaData;

    try {

        mediaData =
            await readFileAsDataURL(
                file
            );

    } catch (error) {

        console.error(error);

        alert(
            "Unable to read the selected file."
        );

        return;
    }


    const label =
        type === "photo"
            ? "📷 Photo"
            : type === "video"
                ? "🎥 Video"
                : "📎 File";


    addMessage(
        "user",
        `${label}: ${file.name}`,
        {

            name:
                file.name,

            type:
                file.type,

            data:
                mediaData
        }
    );


    const typing =
        document.createElement(
            "div"
        );

    typing.className =
        "message ai typing-message";

    typing.innerHTML = `
        <div class="message-content">
            <div class="message-bubble">
                Analyzing your upload...
            </div>
        </div>
    `;

    conversation?.appendChild(
        typing
    );


    try {

        const language =
            localStorage.getItem(
                "viggoLanguage"
            ) || "en-IN";


        const timezone =
            getLanguageTimezone();


        const response =
            await fetch(
                API_URL,
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
                                type === "photo"
                                    ? "Please analyze the uploaded photo."
                                    : type === "video"
                                        ? "Please analyze the uploaded video."
                                        : "Please analyze the uploaded file.",

                            language,

                            timezone,

                            file: {

                                name:
                                    file.name,

                                type:
                                    file.type,

                                size:
                                    file.size,

                                data:
                                    mediaData
                            }
                        })
                }
            );


        const data =
            await response.json()
                .catch(
                    () => ({})
                );


        if (!response.ok) {

            throw new Error(
                data.error ||
                `Server error: ${response.status}`
            );
        }


        typing.remove();


        const reply =
            data.reply ||
            data.response ||
            data.text ||
            data.message ||
            "The file was uploaded successfully.";


        addMessage(
            "assistant",
            String(reply)
        );


    } catch (error) {

        console.error(
            "Upload error:",
            error
        );

        typing.remove();

        addMessage(
            "assistant",
            "The upload was successful, but I couldn't get an AI response."
        );
    }
}


/* =====================================================
   MICROPHONE
===================================================== */

function startVoiceRecognition() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        alert(
            "Voice input is not supported in this browser."
        );

        return;
    }


    if (recognition) {

        try {
            recognition.stop();
        } catch {}
    }


    recognition =
        new SpeechRecognition();


    recognition.lang =
        localStorage.getItem(
            "viggoLanguage"
        ) || "en-IN";


    recognition.interimResults =
        false;

    recognition.continuous =
        false;


    recognition.onstart =
        () => {

            mic?.classList.add(
                "active"
            );
        };


    recognition.onresult =
        event => {

            const result =
                event.results[0][0]
                    .transcript;

            if (message) {

                message.value =
                    result;

                message.focus();
            }
        };


    recognition.onerror =
        error => {

            console.error(
                "Voice recognition:",
                error
            );
        };


    recognition.onend =
        () => {

            mic?.classList.remove(
                "active"
            );
        };


    try {

        recognition.start();

    } catch (error) {

        console.error(
            "Recognition start:",
            error
        );
    }
}


/* =====================================================
   VOICE MENU
===================================================== */

function openVoiceSelectionMenu(
    anchorElement
) {

    document.getElementById(
        "viggoVoiceMenu"
    )?.remove();


    const menu =
        document.createElement(
            "div"
        );

    menu.id =
        "viggoVoiceMenu";


    Object.assign(
        menu.style,
        {
            position: "fixed",
            zIndex: "10000",
            background: "#111",
            border: "1px solid #333",
            borderRadius: "12px",
            padding: "8px",
            minWidth: "190px"
        }
    );


    const title =
        document.createElement(
            "div"
        );

    title.textContent =
        "🎙️ Select Voice";

    title.style.color =
        "#fff";

    title.style.fontWeight =
        "600";

    title.style.padding =
        "8px";

    menu.appendChild(title);


    const voices = [

        {
            id: "female",
            name: "👩 Female Voice"
        },

        {
            id: "male",
            name: "👨 Male Voice"
        }
    ];


    const currentVoice =
        localStorage.getItem(
            "viggoVoice"
        ) || "female";


    voices.forEach(
        voice => {

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.textContent =
                voice.name;

            Object.assign(
                button.style,
                {
                    display: "block",
                    width: "100%",
                    padding: "10px",
                    margin: "2px 0",
                    border: "none",
                    borderRadius: "8px",
                    background:
                        voice.id === currentVoice
                            ? "#2563eb"
                            : "transparent",
                    color: "#fff",
                    textAlign: "left",
                    cursor: "pointer"
                }
            );


            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    localStorage.setItem(
                        "viggoVoice",
                        voice.id
                    );

                    menu.remove();
                }
            );


            menu.appendChild(
                button
            );
        }
    );


    document.body.appendChild(menu);


    const rect =
        anchorElement.getBoundingClientRect();


    menu.style.left =
        `${Math.max(
            5,
            Math.min(
                rect.left,
                window.innerWidth - 210
            )
        )}px`;


    menu.style.top =
        `${Math.max(
            5,
            Math.min(
                rect.bottom + 8,
                window.innerHeight - 150
            )
        )}px`;
}


/* =====================================================
   LANGUAGE MENU
===================================================== */

function openLanguageSelectionMenu(
    anchorElement
) {

    document.getElementById(
        "viggoLanguageMenu"
    )?.remove();


    const menu =
        document.createElement(
            "div"
        );

    menu.id =
        "viggoLanguageMenu";


    Object.assign(
        menu.style,
        {
            position: "fixed",
            zIndex: "10000",
            background: "#111",
            border: "1px solid #333",
            borderRadius: "12px",
            padding: "8px",
            minWidth: "220px",
            maxHeight: "300px",
            overflowY: "auto",
            overflowX: "hidden"
        }
    );


    const title =
        document.createElement(
            "div"
        );

    title.textContent =
        "🌐 Select Language";

    Object.assign(
        title.style,
        {
            color: "#fff",
            fontWeight: "600",
            padding: "8px",
            position: "sticky",
            top: "0",
            background: "#111"
        }
    );


    menu.appendChild(title);


    const current =
        localStorage.getItem(
            "viggoLanguage"
        ) || "en-IN";


    languages.forEach(
        language => {

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.textContent =
                language.name;


            Object.assign(
                button.style,
                {
                    display: "block",
                    width: "100%",
                    padding: "10px",
                    margin: "2px 0",
                    border: "none",
                    borderRadius: "8px",
                    background:
                        language.code === current
                            ? "#2563eb"
                            : "transparent",
                    color: "#fff",
                    textAlign: "left",
                    cursor: "pointer"
                }
            );


            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();


                    localStorage.setItem(
                        "viggoLanguage",
                        language.code
                    );


                    /*
                       IMPORTANT:
                       Save timezone for selected language.
                    */

                    localStorage.setItem(
                        "viggoTimezone",
                        language.timezone
                    );


                    console.log(
                        "Language changed:",
                        language.code
                    );

                    console.log(
                        "Timezone:",
                        language.timezone
                    );


                    menu.remove();
                }
            );


            menu.appendChild(button);
        }
    );


    document.body.appendChild(menu);


    const rect =
        anchorElement.getBoundingClientRect();


    let left =
        rect.left;

    let top =
        rect.bottom + 8;


    if (
        left + 230 >
        window.innerWidth
    ) {

        left =
            window.innerWidth - 230;
    }


    if (
        top + 310 >
        window.innerHeight
    ) {

        top =
            rect.top - 310;
    }


    left =
        Math.max(
            5,
            left
        );

    top =
        Math.max(
            5,
            top
        );


    menu.style.left =
        `${left}px`;

    menu.style.top =
        `${top}px`;
}


/* =====================================================
   BUTTON EVENTS
===================================================== */

function setupEvents() {


    /* SIDEBAR */

    openSidebar?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();

            sidebar?.classList.add(
                "open"
            );
        }
    );


    closeSidebar?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();

            sidebar?.classList.remove(
                "open"
            );
        }
    );


    /* NEW CHAT */

    newChat?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            createChat();
        }
    );


    /* SEND */

    send?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            sendMessage();
        }
    );


    /* ENTER */

    message?.addEventListener(
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


    /* SEARCH */

    searchChat?.addEventListener(
        "input",
        () => {

            renderHistory(
                searchChat.value
            );
        }
    );


    /* MIC */

    mic?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();

            startVoiceRecognition();
        }
    );


    /* PLUS */

    plusBtn?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();

            const open =
                plusMenu?.classList.contains(
                    "show"
                );

            plusMenu?.classList.toggle(
                "show",
                !open
            );

            plusMenu?.classList.toggle(
                "open",
                !open
            );
        }
    );


    /* MORE */

    moreBtn?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();

            const open =
                moreMenu?.classList.contains(
                    "show"
                );

            moreMenu?.classList.toggle(
                "show",
                !open
            );

            moreMenu?.classList.toggle(
                "open",
                !open
            );
        }
    );


    /* LANGUAGE */

    languageBtn?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();

            openLanguageSelectionMenu(
                languageBtn
            );
        }
    );


    /* VOICE */

    voiceMenuBtn?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();

            openVoiceSelectionMenu(
                voiceMenuBtn
            );

            moreMenu?.classList.remove(
                "show",
                "open"
            );
        }
    );


    plusVoiceBtn?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();

            openVoiceSelectionMenu(
                plusVoiceBtn
            );

            plusMenu?.classList.remove(
                "show",
                "open"
            );
        }
    );


    /* CLEAR CHAT */

    clearChatBtn?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            const chat =
                getCurrentChat();

            if (!chat) {
                return;
            }

            chat.messages = [];

            chat.title =
                "New Chat";

            saveChats();

            renderHistory();

            renderConversation();

            moreMenu?.classList.remove(
                "show",
                "open"
            );
        }
    );


    /* SAVED */

    savedChatsBtn?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            const saved =
                localStorage.getItem(
                    "viggoSavedMessage"
                );

            alert(
                saved
                    ? "Saved message:\n\n" + saved
                    : "No saved messages."
            );
        }
    );


    /* SELECT */

    selectChatsBtn?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            selectingChats =
                !selectingChats;

            renderHistory();

            moreMenu?.classList.remove(
                "show",
                "open"
            );
        }
    );


    /* DELETE SELECTED */

    deleteSelectedBtn?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            const selected =
                chats.filter(
                    chat =>
                        chat.selected
                );


            if (!selected.length) {

                alert(
                    "No chats selected."
                );

                return;
            }


            const ids =
                selected.map(
                    chat =>
                        String(chat.id)
                );


            chats =
                chats.filter(
                    chat =>
                        !ids.includes(
                            String(chat.id)
                        )
                );


            pinnedChats =
                pinnedChats.filter(
                    id =>
                        !ids.includes(
                            String(id)
                        )
                );


            if (
                currentChatId &&
                ids.includes(
                    String(currentChatId)
                )
            ) {

                currentChatId =
                    chats[0]?.id ||
                    null;
            }


            selectingChats = false;


            saveChats();


            if (!chats.length) {

                createChat();

            } else {

                renderHistory();

                renderConversation();
            }
        }
    );


    /* SHARE */

    shareBtn?.addEventListener(
        "click",
        async event => {

            event.preventDefault();

            const chat =
                getCurrentChat();

            if (
                !chat ||
                !chat.messages.length
            ) {

                alert(
                    "There are no messages to share."
                );

                return;
            }


            const text =
                chat.messages
                    .map(
                        msg =>
                            (
                                msg.role === "user"
                                    ? "You: "
                                    : "Viggo: "
                            ) +
                            msg.text
                    )
                    .join(
                        "\n\n"
                    );


            try {

                if (
                    navigator.share
                ) {

                    await navigator.share({

                        title:
                            chat.title ||
                            "Viggo AI",

                        text
                    });

                } else {

                    await navigator.clipboard.writeText(
                        text
                    );

                    alert(
                        "Chat copied."
                    );
                }

            } catch (error) {

                console.error(
                    "Share error:",
                    error
                );
            }
        }
    );


    /* PLUS MENU ACTIONS */

    document.addEventListener(
        "click",
        event => {

            const target =
                event.target.closest(
                    "[data-action]"
                );

            if (!target) {
                return;
            }


            const action =
                target.dataset.action;


            if (action === "photo") {
                photoInput?.click();
            }


            if (action === "video") {
                videoInput?.click();
            }


            if (action === "file") {
                fileInput?.click();
            }


            if (action === "voice") {

                openVoiceSelectionMenu(
                    target
                );
            }


            if (action === "new-chat") {

                createChat();
            }


            plusMenu?.classList.remove(
                "show",
                "open"
            );
        }
    );


    /* CLOSE MENUS */

    document.addEventListener(
        "click",
        event => {

            if (
                plusMenu &&
                plusBtn &&
                !plusMenu.contains(
                    event.target
                ) &&
                !plusBtn.contains(
                    event.target
                )
            ) {

                plusMenu.classList.remove(
                    "show",
                    "open"
                );
            }


            if (
                moreMenu &&
                moreBtn &&
                !moreMenu.contains(
                    event.target
                ) &&
                !moreBtn.contains(
                    event.target
                )
            ) {

                moreMenu.classList.remove(
                    "show",
                    "open"
                );
            }
        }
    );
}


/* =====================================================
   FILE EVENTS
===================================================== */

function setupFileEvents() {


    photoInput?.addEventListener(
        "change",
        async () => {

            const file =
                photoInput.files[0];

            if (!file) {
                return;
            }

            try {

                await sendUploadedFile(
                    file,
                    "photo"
                );

            } finally {

                photoInput.value = "";
            }
        }
    );


    videoInput?.addEventListener(
        "change",
        async () => {

            const file =
                videoInput.files[0];

            if (!file) {
                return;
            }

            try {

                await sendUploadedFile(
                    file,
                    "video"
                );

            } finally {

                videoInput.value = "";
            }
        }
    );


    fileInput?.addEventListener(
        "change",
        async () => {

            const file =
                fileInput.files[0];

            if (!file) {
                return;
            }

            try {

                await sendUploadedFile(
                    file,
                    "file"
                );

            } finally {

                fileInput.value = "";
            }
        }
    );
}


/* =====================================================
   INITIALIZE
===================================================== */

function initializeViggo() {

    console.log(
        "================================="
    );

    console.log(
        "VIGGO AI SCRIPT LOADED"
    );

    console.log(
        "API:",
        API_URL
    );

    console.log(
        "Language:",
        localStorage.getItem(
            "viggoLanguage"
        ) || "en-IN"
    );

    console.log(
        "Timezone:",
        getLanguageTimezone()
    );

    console.log(
        "Current Date/Time:",
        getCurrentDateTime()
    );

    console.log(
        "Voice:",
        localStorage.getItem(
            "viggoVoice"
        ) || "female"
    );

    console.log(
        "Speech Synthesis:",
        "speechSynthesis" in window
    );

    console.log(
        "Speech Recognition:",
        (
            "SpeechRecognition" in window ||
            "webkitSpeechRecognition" in window
        )
    );

    console.log(
        "================================="
    );


    initializeElements();

    createFileInputs();

    loadStorage();

    fixViewportHeight();

    setupEvents();

    setupFileEvents();


    if (!chats.length) {

        createChat();

    } else {

        if (
            !currentChatId ||
            !getCurrentChat()
        ) {

            currentChatId =
                chats[0].id;

            saveChats();
        }

        renderHistory();

        renderConversation();
    }
}


/* =====================================================
   WINDOW EVENTS
===================================================== */

window.addEventListener(
    "resize",
    fixViewportHeight,
    { passive: true }
);


window.addEventListener(
    "orientationchange",
    () => {

        setTimeout(
            fixViewportHeight,
            100
        );
    },
    { passive: true }
);


if (window.visualViewport) {

    window.visualViewport.addEventListener(
        "resize",
        fixViewportHeight,
        { passive: true }
    );
}


if (window.speechSynthesis) {

    window.speechSynthesis.onvoiceschanged =
        () => {

            window.speechSynthesis.getVoices();
        };
}


/* =====================================================
   START
===================================================== */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeViggo,
        {
            once: true
        }
    );

} else {

    initializeViggo();
}
