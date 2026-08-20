"use strict";

/* =========================================
   VIGGO SERVER
========================================= */

const API_URL =
    "https://ai-tool-2-zpul.onrender.com/chat";


/* =========================================
   STORAGE
========================================= */

const CHAT_KEY =
    "viggo_chats";

const CURRENT_KEY =
    "viggo_current_chat";

let chats =
    JSON.parse(
        localStorage.getItem(CHAT_KEY) || "[]"
    );

let currentChatId =
    localStorage.getItem(CURRENT_KEY);

let selectedLanguage =
    localStorage.getItem("viggo_language") || "en";

let selectedVoice =
    localStorage.getItem("viggo_voice") || "female";


/* =========================================
   ELEMENTS
========================================= */

const $ = id =>
    document.getElementById(id);

const chatArea = $("chatArea");
const messageInput = $("messageInput");
const sendBtn = $("sendBtn");
const newChatBtn = $("newChatBtn");

const recentList = $("recentList");
const recentCount = $("recentCount");

const plusBtn = $("plusBtn");
const plusMenu = $("plusMenu");

const moreBtn = $("moreBtn");
const moreMenu = $("moreMenu");

const languageBtn = $("languageBtn");
const languageMenu = $("languageMenu");

const voiceBtn = $("voiceBtn");
const voiceMenu = $("voiceMenu");

const deleteBtn = $("deleteBtn");
const deleteMenu = $("deleteMenu");

const moreLanguageBtn = $("moreLanguageBtn");
const moreLanguages = $("moreLanguages");

const voiceStatus = $("voiceStatus");


/* =========================================
   STORAGE FUNCTIONS
========================================= */

function saveChats() {

    localStorage.setItem(
        CHAT_KEY,
        JSON.stringify(chats)
    );

}


function getCurrentChat() {

    return chats.find(
        chat =>
            chat.id === currentChatId
    );

}


/* =========================================
   CLOSE ALL POPUPS
========================================= */

function closePopups() {

    plusMenu.classList.remove("show");
    moreMenu.classList.remove("show");
    languageMenu.classList.remove("show");
    voiceMenu.classList.remove("show");
    deleteMenu.classList.remove("show");

}


/* =========================================
   NEW CHAT
========================================= */

function createNewChat() {

    const chat = {

        id: Date.now().toString(),

        title: "New Chat",

        messages: [],

        createdAt: Date.now(),

        updatedAt: Date.now()

    };

    chats.unshift(chat);

    currentChatId = chat.id;

    localStorage.setItem(
        CURRENT_KEY,
        currentChatId
    );

    saveChats();

    renderRecent();

    renderChat(chat);

    messageInput.focus();

}


/* =========================================
   RENDER RECENT
========================================= */

function renderRecent() {

    recentList.innerHTML = "";

    recentCount.textContent =
        chats.length;

    const sorted =
        [...chats].sort(
            (a,b) =>
                b.updatedAt -
                a.updatedAt
        );

    sorted.forEach(chat => {

        const item =
            document.createElement("div");

        item.className =
            "recent-item";

        if (
            chat.id ===
            currentChatId
        ) {

            item.classList.add("active");

        }


        const title =
            document.createElement("div");

        title.className =
            "recent-title-text";

        title.textContent =
            chat.title || "New Chat";


        const more =
            document.createElement("button");

        more.className =
            "recent-more";

        more.textContent =
            "•••";


        more.addEventListener(
            "click",
            function(e) {

                e.stopPropagation();

                openChatOptions(
                    chat,
                    more
                );

            }
        );


        item.appendChild(title);
        item.appendChild(more);


        item.addEventListener(
            "click",
            function() {

                currentChatId =
                    chat.id;

                localStorage.setItem(
                    CURRENT_KEY,
                    currentChatId
                );

                renderRecent();
                renderChat(chat);

            }
        );


        recentList.appendChild(item);

    });

}


/* =========================================
   RECENT CHAT OPTIONS
========================================= */

function openChatOptions(chat, button) {

    document
        .querySelectorAll(".chat-options")
        .forEach(el => el.remove());


    const menu =
        document.createElement("div");

    menu.className =
        "chat-options";

    menu.style.position = "fixed";
    menu.style.background = "#0d1b2c";
    menu.style.border = "1px solid rgba(70,150,255,.2)";
    menu.style.borderRadius = "10px";
    menu.style.padding = "6px";
    menu.style.zIndex = "9999";


    const pin =
        document.createElement("button");

    pin.textContent =
        chat.pinned
            ? "📌 Unpin Chat"
            : "📌 Pin Chat";

    pin.style.display = "block";
    pin.style.width = "100%";
    pin.style.padding = "9px";
    pin.style.border = "0";
    pin.style.background = "transparent";
    pin.style.color = "white";
    pin.style.cursor = "pointer";


    pin.addEventListener(
        "click",
        function() {

            chat.pinned =
                !chat.pinned;

            saveChats();

            menu.remove();

            renderRecent();

        }
    );


    const del =
        document.createElement("button");

    del.textContent =
        "🗑 Delete";

    del.style.display = "block";
    del.style.width = "100%";
    del.style.padding = "9px";
    del.style.border = "0";
    del.style.background = "transparent";
    del.style.color = "#ff8c8c";
    del.style.cursor = "pointer";


    del.addEventListener(
        "click",
        function() {

            deleteSingleChat(chat.id);

            menu.remove();

        }
    );


    menu.appendChild(pin);
    menu.appendChild(del);

    document.body.appendChild(menu);


    const rect =
        button.getBoundingClientRect();

    menu.style.left =
        `${rect.right - 150}px`;

    menu.style.top =
        `${rect.bottom + 5}px`;


    setTimeout(() => {

        document.addEventListener(
            "click",
            function closeMenu(e) {

                if (
                    !menu.contains(e.target)
                ) {

                    menu.remove();

                    document.removeEventListener(
                        "click",
                        closeMenu
                    );

                }

            }
        );

    }, 0);

}


/* =========================================
   DELETE SINGLE CHAT
========================================= */

function deleteSingleChat(id) {

    chats =
        chats.filter(
            chat =>
                chat.id !== id
        );


    if (
        currentChatId === id
    ) {

        currentChatId =
            chats.length
                ? chats[0].id
                : null;


        if (currentChatId) {

            localStorage.setItem(
                CURRENT_KEY,
                currentChatId
            );

        } else {

            localStorage.removeItem(
                CURRENT_KEY
            );

        }

    }


    saveChats();

    renderRecent();


    const current =
        getCurrentChat();

    if (current) {

        renderChat(current);

    } else {

        showWelcome();

    }

}


/* =========================================
   WELCOME
========================================= */

function showWelcome() {

    chatArea.innerHTML = `

        <div class="welcome">

            <div class="welcome-logo">
                V
            </div>

            <h1>
                Hello! I'm Viggo AI
            </h1>

            <p>
                Your friendly AI assistant. Ask me anything.
            </p>

        </div>

    `;

}


/* =========================================
   RENDER CHAT
========================================= */

function renderChat(chat) {

    if (
        !chat ||
        !chat.messages.length
    ) {

        showWelcome();

        return;

    }


    chatArea.innerHTML = "";


    chat.messages.forEach(
        (message, index) => {

            addMessage(
                message,
                index
            );

        }
    );


    scrollBottom();

}


/* =========================================
   ADD MESSAGE
========================================= */

function addMessage(
    message,
    index
) {

    const row =
        document.createElement("div");

    row.className =
        "message-row " +
        (
            message.role === "user"
                ? "user"
                : "ai"
        );


    const wrapper =
        document.createElement("div");

    wrapper.className =
        "message";


    const bubble =
        document.createElement("div");

    bubble.className =
        "message-bubble";

    bubble.textContent =
        message.text;


    wrapper.appendChild(bubble);


    const actions =
        document.createElement("div");

    actions.className =
        "message-actions";


    /* COPY */

    const copy =
        document.createElement("button");

    copy.className =
        "message-action";

    copy.textContent =
        "📋 Copy";


    copy.addEventListener(
        "click",
        async function() {

            try {

                await navigator.clipboard.writeText(
                    message.text
                );

                copy.textContent =
                    "✓ Copied";

                setTimeout(
                    () => {
                        copy.textContent =
                            "📋 Copy";
                    },
                    1200
                );

            } catch {

                alert(
                    "Copy failed."
                );

            }

        }
    );


    /* SHARE */

    const share =
        document.createElement("button");

    share.className =
        "message-action";

    share.textContent =
        "🔗 Share";


    share.addEventListener(
        "click",
        function() {

            shareMessage(
                message.text
            );

        }
    );


    /* LIKE
       PIN REMOVED
    */

    const like =
        document.createElement("button");

    like.className =
        "like-button";

    updateLikeButton(
        like,
        message.liked === true
    );


    like.addEventListener(
        "click",
        function() {

            message.liked =
                !message.liked;

            updateLikeButton(
                like,
                message.liked
            );

            saveChats();

        }
    );


    actions.appendChild(copy);
    actions.appendChild(share);
    actions.appendChild(like);

    wrapper.appendChild(actions);

    row.appendChild(wrapper);

    chatArea.appendChild(row);

}


/* =========================================
   LIKE BUTTON
========================================= */

function updateLikeButton(
    button,
    liked
) {

    if (liked) {

        button.textContent =
            "♥ Liked";

        button.classList.add(
            "liked"
        );

    } else {

        button.textContent =
            "♡ Like";

        button.classList.remove(
            "liked"
        );

    }

}


/* =========================================
   SHARE MESSAGE
========================================= */

async function shareMessage(text) {

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

        } catch {

            console.log(
                "Share cancelled."
            );

        }

        return;

    }


    try {

        await navigator.clipboard.writeText(
            text
        );

        alert(
            "Message copied. You can share it."
        );

    } catch {

        alert(
            text
        );

    }

}


/* =========================================
   TYPING
========================================= */

function showTyping() {

    const row =
        document.createElement("div");

    row.id =
        "typing";

    row.className =
        "message-row ai";


    row.innerHTML = `

        <div class="message">

            <div class="message-bubble">

                <div class="typing">

                    <span></span>
                    <span></span>
                    <span></span>

                </div>

            </div>

        </div>

    `;


    chatArea.appendChild(row);

    scrollBottom();

}


function removeTyping() {

    const typing =
        document.getElementById(
            "typing"
        );

    if (typing) {

        typing.remove();

    }

}


/* =========================================
   SEND API
========================================= */

async function askViggo(message) {

    const chat =
        getCurrentChat();


    const history =
        chat
            ? chat.messages
                .slice(0,-1)
                .map(msg => ({

                    role:
                        msg.role === "ai"
                            ? "assistant"
                            : "user",

                    content:
                        msg.text

                }))
            : [];


    const response =
        await fetch(
            API_URL,
            {

                method: "POST",

                headers: {
                    "Content-Type":
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


    let data;

    try {

        data =
            await response.json();

    } catch {

        throw new Error(
            "Server returned invalid JSON."
        );

    }


    if (!response.ok) {

        throw new Error(
            data.details ||
            data.error ||
            `HTTP ${response.status}`
        );

    }


    if (!data.success) {

        throw new Error(
            data.details ||
            data.error ||
            "Viggo AI error."
        );

    }


    return data.reply;

}


/* =========================================
   SEND MESSAGE
========================================= */

async function sendMessage() {

    const text =
        messageInput.value.trim();


    if (!text) {

        return;

    }


    let chat =
        getCurrentChat();


    if (!chat) {

        createNewChat();

        chat =
            getCurrentChat();

    }


    chat.messages.push({

        role: "user",

        text: text,

        liked: false,

        time: Date.now()

    });


    if (
        chat.title ===
        "New Chat"
    ) {

        chat.title =
            text.substring(0,35);

    }


    chat.updatedAt =
        Date.now();


    messageInput.value =
        "";

    messageInput.style.height =
        "auto";


    saveChats();

    renderChat(chat);

    renderRecent();

    showTyping();


    try {

        const reply =
            await askViggo(text);


        removeTyping();


        chat.messages.push({

            role: "ai",

            text: reply,

            liked: false,

            time: Date.now()

        });


        chat.updatedAt =
            Date.now();


        saveChats();

        renderChat(chat);

        renderRecent();


    } catch(error) {

        console.error(
            "Viggo error:",
            error
        );


        removeTyping();


        chat.messages.push({

            role: "ai",

            text:
                "Sorry friend, I couldn't connect to Viggo AI right now.\n\n" +
                error.message,

            liked: false,

            time: Date.now()

        });


        saveChats();

        renderChat(chat);

    }

}


/* =========================================
   SEND BUTTON
========================================= */

sendBtn.addEventListener(
    "click",
    sendMessage
);


/* =========================================
   ENTER BUTTON
========================================= */

messageInput.addEventListener(
    "keydown",
    function(e) {

        if (
            e.key === "Enter" &&
            !e.shiftKey
        ) {

            e.preventDefault();

            sendMessage();

        }

    }
);


/* =========================================
   NEW CHAT
========================================= */

newChatBtn.addEventListener(
    "click",
    function() {

        createNewChat();

        closePopups();

    }
);


/* =========================================
   PLUS
========================================= */

plusBtn.addEventListener(
    "click",
    function(e) {

        e.stopPropagation();

        const open =
            plusMenu.classList.contains(
                "show"
            );

        closePopups();

        if (!open) {

            plusMenu.classList.add(
                "show"
            );

        }

    }
);


/* =========================================
   MORE
========================================= */

moreBtn.addEventListener(
    "click",
    function(e) {

        e.stopPropagation();

        const open =
            moreMenu.classList.contains(
                "show"
            );

        closePopups();

        if (!open) {

            moreMenu.classList.add(
                "show"
            );

        }

    }
);


/* =========================================
   LANGUAGE
========================================= */

languageBtn.addEventListener(
    "click",
    function(e) {

        e.stopPropagation();

        const open =
            languageMenu.classList.contains(
                "show"
            );

        closePopups();

        if (!open) {

            languageMenu.classList.add(
                "show"
            );

        }

    }
);


/* =========================================
   LANGUAGE OPTIONS
========================================= */

document
    .querySelectorAll(
        "[data-language]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            function() {

                selectedLanguage =
                    this.dataset.language;

                localStorage.setItem(
                    "viggo_language",
                    selectedLanguage
                );

                languageMenu.classList.remove(
                    "show"
                );

            }
        );

    });


/* =========================================
   MORE LANGUAGES
========================================= */

moreLanguageBtn.addEventListener(
    "click",
    function(e) {

        e.stopPropagation();

        moreLanguages.classList.toggle(
            "show"
        );

    }
);


/* =========================================
   VOICE
========================================= */

voiceBtn.addEventListener(
    "click",
    function(e) {

        e.stopPropagation();

        const open =
            voiceMenu.classList.contains(
                "show"
            );

        closePopups();

        if (!open) {

            voiceMenu.classList.add(
                "show"
            );

        }

        updateVoiceStatus();

    }
);


/* VOICE OPTIONS */

voiceMenu
    .querySelectorAll(
        "[data-voice]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            function() {

                selectedVoice =
                    this.dataset.voice;

                localStorage.setItem(
                    "viggo_voice",
                    selectedVoice
                );

                updateVoiceStatus();

            }
        );

    });


function updateVoiceStatus() {

    voiceStatus.textContent =
        selectedVoice === "male"
            ? "👨 Male Voice selected"
            : "👩 Female Voice selected";

}


/* =========================================
   DELETE MENU
========================================= */

deleteBtn.addEventListener(
    "click",
    function(e) {

        e.stopPropagation();

        const open =
            deleteMenu.classList.contains(
                "show"
            );

        closePopups();

        if (!open) {

            deleteMenu.classList.add(
                "show"
            );

        }

    }
);


/* =========================================
   CLEAR ALL
========================================= */

$("clearAllBtn").addEventListener(
    "click",
    function() {

        if (!chats.length) {

            alert(
                "No chats available."
            );

            return;

        }


        const ok =
            confirm(
                "Are you sure you want to clear all chats?"
            );


        if (!ok) {

            return;

        }


        chats = [];

        currentChatId = null;

        localStorage.removeItem(
            CURRENT_KEY
        );

        saveChats();

        renderRecent();

        showWelcome();

        closePopups();

    }
);


/* =========================================
   SELECT DELETE
========================================= */

$("selectDeleteBtn").addEventListener(
    "click",
    function() {

        if (!chats.length) {

            alert(
                "No chats available."
            );

            return;

        }


        const list =
            chats
                .map(
                    (chat,index) =>
                        `${index + 1}. ${chat.title}`
                )
                .join("\n");


        const answer =
            prompt(
                "Select chat number(s) to delete.\n\n" +
                list +
                "\n\nExample: 1 or 1,3"
            );


        if (!answer) {

            return;

        }


        const numbers =
            answer
                .split(",")
                .map(
                    value =>
                        Number(
                            value.trim()
                        )
                )
                .filter(
                    value =>
                        Number.isInteger(value) &&
                        value >= 1 &&
                        value <= chats.length
                );


        if (!numbers.length) {

            alert(
                "Invalid selection."
            );

            return;

        }


        const ids =
            numbers.map(
                number =>
                    chats[number - 1].id
            );


        chats =
            chats.filter(
                chat =>
                    !ids.includes(
                        chat.id
                    )
            );


        if (
            currentChatId &&
            ids.includes(
                currentChatId
            )
        ) {

            currentChatId =
                chats.length
                    ? chats[0].id
                    : null;


            if (currentChatId) {

                localStorage.setItem(
                    CURRENT_KEY,
                    currentChatId
                );

            } else {

                localStorage.removeItem(
                    CURRENT_KEY
                );

            }

        }


        saveChats();

        renderRecent();


        const current =
            getCurrentChat();


        if (current) {

            renderChat(current);

        } else {

            showWelcome();

        }


        closePopups();

    }
);


/* =========================================
   FILE BUTTONS
========================================= */

$("photoBtn").addEventListener(
    "click",
    function() {

        $("photoInput").click();

    }
);


$("videoBtn").addEventListener(
    "click",
    function() {

        $("videoInput").click();

    }
);


$("fileBtn").addEventListener(
    "click",
    function() {

        $("fileInput").click();

    }
);


/* =========================================
   FILE SELECTED
========================================= */

$("photoInput").addEventListener(
    "change",
    function() {

        if (this.files.length) {

            alert(
                this.files.length +
                " photo(s) selected."
            );

        }

    }
);


$("videoInput").addEventListener(
    "change",
    function() {

        if (this.files.length) {

            alert(
                this.files.length +
                " video(s) selected."
            );

        }

    }
);


$("fileInput").addEventListener(
    "change",
    function() {

        if (this.files.length) {

            alert(
                this.files.length +
                " file(s) selected."
            );

        }

    }
);


/* =========================================
   SHARE CHAT
========================================= */

$("shareChatBtn").addEventListener(
    "click",
    function() {

        const chat =
            getCurrentChat();


        if (!chat) {

            alert(
                "Start a chat first."
            );

            return;

        }


        const data =
            JSON.stringify(chat);


        const encoded =
            btoa(
                encodeURIComponent(data)
            );


        const link =
            window.location.origin +
            window.location.pathname +
            "?share=" +
            encodeURIComponent(encoded);


        $("shareLink").value =
            link;


        $("sharePopup")
            .classList.add(
                "show"
            );

    }
);


/* =========================================
   COPY SHARE LINK
========================================= */

$("copyLinkBtn").addEventListener(
    "click",
    async function() {

        const link =
            $("shareLink").value;


        try {

            await navigator.clipboard.writeText(
                link
            );

            this.textContent =
                "✓ Copied";

            setTimeout(
                () => {

                    this.textContent =
                        "📋 Copy Link";

                },
                1200
            );

        } catch {

            $("shareLink").select();

            document.execCommand(
                "copy"
            );

            alert(
                "Link copied."
            );

        }

    }
);


/* =========================================
   NATIVE SHARE
========================================= */

$("nativeShareBtn").addEventListener(
    "click",
    async function() {

        const link =
            $("shareLink").value;


        if (
            navigator.share
        ) {

            try {

                await navigator.share({

                    title:
                        "Viggo AI Chat",

                    text:
                        "Check my Viggo AI chat",

                    url:
                        link

                });

            } catch {

                console.log(
                    "Share cancelled."
                );

            }

        } else {

            try {

                await navigator.clipboard.writeText(
                    link
                );

                alert(
                    "Share link copied."
                );

            } catch {

                alert(
                    link
                );

            }

        }

    }
);


/* =========================================
   CLOSE SHARE
========================================= */

$("closeShareBtn").addEventListener(
    "click",
    function() {

        $("sharePopup")
            .classList.remove(
                "show"
            );

    }
);


/* =========================================
   MOBILE SIDEBAR
========================================= */

$("menuBtn").addEventListener(
    "click",
    function() {

        $("sidebar")
            .classList.add(
                "open"
            );

    }
);


$("closeSidebar").addEventListener(
    "click",
    function() {

        $("sidebar")
            .classList.remove(
                "open"
            );

    }
);


/* =========================================
   AUTO RESIZE
========================================= */

messageInput.addEventListener(
    "input",
    function() {

        this.style.height =
            "auto";

        this.style.height =
            Math.min(
                this.scrollHeight,
                130
            ) + "px";

    }
);


/* =========================================
   VOICE INPUT
========================================= */

$("voiceInputBtn").addEventListener(
    "click",
    function() {

        if (
            !("webkitSpeechRecognition" in window) &&
            !("SpeechRecognition" in window)
        ) {

            alert(
                "Voice input is not supported in this browser."
            );

            return;

        }


        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;


        const recognition =
            new SpeechRecognition();


        recognition.lang =
            selectedLanguage === "ta"
                ? "ta-IN"
                : "en-IN";


        recognition.interimResults =
            false;


        recognition.start();


        recognition.onresult =
            function(event) {

                messageInput.value =
                    event.results[0][0].transcript;

                messageInput.dispatchEvent(
                    new Event("input")
                );

            };


        recognition.onerror =
            function(event) {

                console.error(
                    "Voice error:",
                    event.error
                );

            };

    }
);


/* =========================================
   OUTSIDE CLICK
========================================= */

document.addEventListener(
    "click",
    function(e) {

        if (
            !e.target.closest("#plusBtn") &&
            !e.target.closest("#plusMenu")
        ) {

            plusMenu.classList.remove(
                "show"
            );

        }


        if (
            !e.target.closest("#moreBtn") &&
            !e.target.closest("#moreMenu")
        ) {

            moreMenu.classList.remove(
                "show"
            );

        }


        if (
            !e.target.closest("#languageBtn") &&
            !e.target.closest("#languageMenu")
        ) {

            languageMenu.classList.remove(
                "show"
            );

        }


        if (
            !e.target.closest("#voiceBtn") &&
            !e.target.closest("#voiceMenu")
        ) {

            voiceMenu.classList.remove(
                "show"
            );

        }


        if (
            !e.target.closest("#deleteBtn") &&
            !e.target.closest("#deleteMenu")
        ) {

            deleteMenu.classList.remove(
                "show"
            );

        }

    }
);


/* =========================================
   SCROLL
========================================= */

function scrollBottom() {

    chatArea.scrollTop =
        chatArea.scrollHeight;

}


/* =========================================
   LOAD
========================================= */

function initialize() {

    if (
        currentChatId &&
        getCurrentChat()
    ) {

        renderChat(
            getCurrentChat()
        );

    } else if (
        chats.length
    ) {

        currentChatId =
            chats[0].id;

        localStorage.setItem(
            CURRENT_KEY,
            currentChatId
        );

        renderChat(
            chats[0]
        );

    } else {

        showWelcome();

    }


    renderRecent();

    updateVoiceStatus();

}


initialize();
