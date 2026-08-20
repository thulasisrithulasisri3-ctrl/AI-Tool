/* =========================================
   VIGGO AI - SCRIPT.JS
========================================= */

"use strict";


/* =========================================
   ELEMENTS
========================================= */

const sidebar =
    document.getElementById("sidebar");

const chatArea =
    document.getElementById("chatArea");

const chatInput =
    document.getElementById("chatInput");

const historyList =
    document.getElementById("historyList");

const plusMenu =
    document.getElementById("plusMenu");

const moreMenu =
    document.getElementById("moreMenu");

const languageOverlay =
    document.getElementById("languageOverlay");

const voiceOverlay =
    document.getElementById("voiceOverlay");

const deleteOverlay =
    document.getElementById("deleteOverlay");

const photoInput =
    document.getElementById("photoInput");

const videoInput =
    document.getElementById("videoInput");

const fileInput =
    document.getElementById("fileInput");


/* =========================================
   DATA
========================================= */

let chats =
    JSON.parse(
        localStorage.getItem("viggoChats") || "[]"
    );

let currentChatId =
    localStorage.getItem("viggoCurrentChat");

let selectedLanguage =
    localStorage.getItem("viggoLanguage") ||
    "English";

let selectedVoice =
    localStorage.getItem("viggoVoice") ||
    "Female";


/* =========================================
   SAVE DATA
========================================= */

function saveChats() {

    localStorage.setItem(
        "viggoChats",
        JSON.stringify(chats)
    );

}


function getCurrentChat() {

    return chats.find(
        chat => String(chat.id) === String(currentChatId)
    );

}


/* =========================================
   SIDEBAR
========================================= */

function toggleSidebar() {

    sidebar.classList.toggle("open");

}


/* =========================================
   NEW CHAT
========================================= */

function createNewChat() {

    const chat = {

        id: Date.now(),

        title: "New Chat",

        messages: [],

        pinned: false,

        deleted: false,

        updatedAt: Date.now()

    };


    chats.unshift(chat);

    currentChatId =
        String(chat.id);

    localStorage.setItem(
        "viggoCurrentChat",
        currentChatId
    );


    saveChats();

    renderHistory();

    clearChatScreen();

    chatInput.focus();

}


/* =========================================
   RENDER HISTORY
========================================= */

function renderHistory(list = null) {

    historyList.innerHTML = "";


    const source =
        list ||
        chats.filter(
            chat => !chat.deleted
        );


    source.forEach(chat => {

        const item =
            document.createElement("div");

        item.className =
            "history-item";


        if (
            String(chat.id) ===
            String(currentChatId)
        ) {

            item.classList.add("active");

        }


        const main =
            document.createElement("div");

        main.className =
            "history-main";


        const title =
            document.createElement("div");

        title.className =
            "history-title";

        title.textContent =
            (chat.pinned ? "📌 " : "") +
            (chat.title || "New Chat");


        const time =
            document.createElement("div");

        time.className =
            "history-time";

        time.textContent =
            formatTime(chat.updatedAt);


        main.appendChild(title);

        main.appendChild(time);


        const actions =
            document.createElement("div");

        actions.className =
            "history-actions";


        const pinBtn =
            document.createElement("button");

        pinBtn.innerHTML =
            chat.pinned ? "📌" : "☆";

        pinBtn.title =
            "Pin";


        pinBtn.onclick =
            function(event) {

                event.stopPropagation();

                togglePinChat(chat.id);

            };


        const deleteBtn =
            document.createElement("button");

        deleteBtn.innerHTML =
            "🗑️";

        deleteBtn.title =
            "Delete";


        deleteBtn.onclick =
            function(event) {

                event.stopPropagation();

                softDeleteChat(chat.id);

            };


        actions.appendChild(pinBtn);

        actions.appendChild(deleteBtn);


        item.appendChild(main);

        item.appendChild(actions);


        item.onclick =
            function() {

                openChat(chat.id);

            };


        historyList.appendChild(item);

    });

}


/* =========================================
   TIME
========================================= */

function formatTime(time) {

    if (!time) return "";

    const date =
        new Date(time);

    return date.toLocaleDateString(
        [],
        {
            day: "2-digit",
            month: "short"
        }
    );

}


/* =========================================
   OPEN CHAT
========================================= */

function openChat(id) {

    const chat =
        chats.find(
            c => String(c.id) === String(id)
        );


    if (!chat) return;


    if (chat.deleted) return;


    currentChatId =
        String(chat.id);


    localStorage.setItem(
        "viggoCurrentChat",
        currentChatId
    );


    renderChat(chat);

    renderHistory();

}


/* =========================================
   RENDER CHAT
========================================= */

function renderChat(chat) {

    chatArea.innerHTML = "";


    if (
        !chat.messages ||
        chat.messages.length === 0
    ) {

        showWelcome();

        return;

    }


    chat.messages.forEach(
        message => {

            addMessageToScreen(
                message.role,
                message.text,
                false
            );

        }
    );


    scrollBottom();

}


/* =========================================
   WELCOME
========================================= */

function showWelcome() {

    chatArea.innerHTML = `

        <div class="welcome" id="welcome">

            <div class="welcome-logo">
                V
            </div>

            <h1>
                Welcome to Viggo AI
            </h1>

            <p>
                Ask me anything. I'm here to help.
            </p>

        </div>

    `;

}


/* =========================================
   CLEAR SCREEN
========================================= */

function clearChatScreen() {

    showWelcome();

}


/* =========================================
   SEND MESSAGE
========================================= */

async function sendMessage() {

    const text =
        chatInput.value.trim();


    if (!text) return;


    let chat =
        getCurrentChat();


    if (!chat) {

        createNewChat();

        chat =
            getCurrentChat();

    }


    if (!chat) return;


    if (
        chat.title === "New Chat"
    ) {

        chat.title =
            text.substring(0, 35);

    }


    const userMessage = {

        role: "user",

        text: text,

        time: Date.now()

    };


    chat.messages.push(
        userMessage
    );


    chat.updatedAt =
        Date.now();


    chatInput.value = "";

    autoResize();


    renderChat(chat);

    saveChats();

    renderHistory();


    showTyping();


    try {

        /*
         * Your Render backend
         */

        const response =
            await fetch(
                "https://ai-tool-2-zpul.onrender.com/api/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        message: text
                    })
                }
            );


        if (!response.ok) {

            throw new Error(
                "Server error"
            );

        }


        const data =
            await response.json();


        removeTyping();


        const answer =
            data.reply ||
            data.message ||
            data.response ||
            "Sorry, I could not generate a response.";


        const aiMessage = {

            role: "ai",

            text: answer,

            time: Date.now()

        };


        chat.messages.push(
            aiMessage
        );


        chat.updatedAt =
            Date.now();


        saveChats();

        renderChat(chat);

        renderHistory();


    } catch (error) {

        removeTyping();


        const errorMessage = {

            role: "ai",

            text:
                "Sorry friend, I couldn't connect to Viggo AI right now.",

            time: Date.now()

        };


        chat.messages.push(
            errorMessage
        );


        saveChats();

        renderChat(chat);

        renderHistory();


        console.error(
            "Viggo API Error:",
            error
        );

    }

}


/* =========================================
   ADD MESSAGE
========================================= */

function addMessageToScreen(
    role,
    text,
    save = true
) {

    const message =
        document.createElement("div");

    message.className =
        "message " + role;


    const avatar =
        document.createElement("div");

    avatar.className =
        "avatar " +
        (
            role === "ai"
                ? "ai-avatar"
                : "user-avatar"
        );


    avatar.textContent =
        role === "ai"
            ? "V"
            : "👤";


    const content =
        document.createElement("div");

    content.className =
        "message-content";


    const bubble =
        document.createElement("div");

    bubble.className =
        "bubble " +
        (
            role === "ai"
                ? "ai-bubble"
                : "user-bubble"
        );


    bubble.textContent =
        text;


    const actions =
        document.createElement("div");

    actions.className =
        "message-actions";


    /* COPY */

    const copyBtn =
        document.createElement("button");

    copyBtn.innerHTML =
        "📋 Copy";

    copyBtn.onclick =
        function() {

            copyText(text);

        };


    /* SHARE */

    const shareBtn =
        document.createElement("button");

    shareBtn.innerHTML =
        "🔗 Share";

    shareBtn.onclick =
        function() {

            shareText(text);

        };


    /* PIN */

    const pinBtn =
        document.createElement("button");

    pinBtn.innerHTML =
        "📌 Pin";

    pinBtn.onclick =
        function() {

            pinCurrentChat();

        };


    actions.appendChild(
        copyBtn
    );

    actions.appendChild(
        shareBtn
    );

    actions.appendChild(
        pinBtn
    );


    content.appendChild(
        bubble
    );

    content.appendChild(
        actions
    );


    if (role === "ai") {

        message.appendChild(
            avatar
        );

        message.appendChild(
            content
        );

    } else {

        message.appendChild(
            content
        );

        message.appendChild(
            avatar
        );

    }


    chatArea.appendChild(
        message
    );


    if (save) {

        scrollBottom();

    }

}


/* =========================================
   TYPING
========================================= */

function showTyping() {

    removeTyping();


    const typing =
        document.createElement("div");

    typing.id =
        "typingMessage";

    typing.className =
        "message ai";


    typing.innerHTML = `

        <div class="avatar ai-avatar">
            V
        </div>

        <div class="message-content">

            <div class="bubble ai-bubble">
                Viggo is typing...
            </div>

        </div>

    `;


    chatArea.appendChild(
        typing
    );


    scrollBottom();

}


function removeTyping() {

    const typing =
        document.getElementById(
            "typingMessage"
        );


    if (typing) {

        typing.remove();

    }

}


/* =========================================
   SCROLL
========================================= */

function scrollBottom() {

    setTimeout(
        () => {

            chatArea.scrollTop =
                chatArea.scrollHeight;

        },
        50
    );

}


/* =========================================
   ENTER SEND
========================================= */

chatInput.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();

        }

    }
);


/* =========================================
   AUTO RESIZE
========================================= */

chatInput.addEventListener(
    "input",
    autoResize
);


function autoResize() {

    chatInput.style.height =
        "auto";

    chatInput.style.height =
        Math.min(
            chatInput.scrollHeight,
            150
        ) + "px";

}


/* =========================================
   PLUS MENU
========================================= */

function togglePlusMenu() {

    plusMenu.classList.toggle(
        "show"
    );

}


function closePlusMenu() {

    plusMenu.classList.remove(
        "show"
    );

}


/* =========================================
   PHOTOS
========================================= */

function choosePhoto() {

    closePlusMenu();

    photoInput.click();

}


/* =========================================
   VIDEOS
========================================= */

function chooseVideo() {

    closePlusMenu();

    videoInput.click();

}


/* =========================================
   FILES
========================================= */

function chooseFile() {

    closePlusMenu();

    fileInput.click();

}


/* =========================================
   FILE SELECT
========================================= */

photoInput.addEventListener(
    "change",
    function() {

        if (!this.files.length) return;

        const file =
            this.files[0];

        chatInput.value =
            "📷 " + file.name;

        autoResize();

    }
);


videoInput.addEventListener(
    "change",
    function() {

        if (!this.files.length) return;

        const file =
            this.files[0];

        chatInput.value =
            "🎥 " + file.name;

        autoResize();

    }
);


fileInput.addEventListener(
    "change",
    function() {

        if (!this.files.length) return;

        const file =
            this.files[0];

        chatInput.value =
            "📎 " + file.name;

        autoResize();

    }
);


/* =========================================
   MORE MENU
========================================= */

function toggleMoreMenu() {

    moreMenu.classList.toggle(
        "show"
    );

}


/* =========================================
   LANGUAGE
========================================= */

function openLanguageMenu() {

    closeAllPopups();

    moreMenu.classList.remove(
        "show"
    );

    languageOverlay.classList.add(
        "show"
    );


    document.getElementById(
        "selectedLanguage"
    ).textContent =
        "Selected: " +
        selectedLanguage;

}


function selectLanguage(language) {

    selectedLanguage =
        language;


    localStorage.setItem(
        "viggoLanguage",
        language
    );


    document.getElementById(
        "selectedLanguage"
    ).textContent =
        "Selected: " +
        language;

}


function openVoiceMenu() {

    closeAllPopups();

    moreMenu.classList.remove(
        "show"
    );

    voiceOverlay.classList.add(
        "show"
    );


    document.getElementById(
        "selectedVoice"
    ).textContent =
        "Selected: " +
        selectedVoice;

}


function selectVoice(voice) {

    selectedVoice =
        voice;


    localStorage.setItem(
        "viggoVoice",
        voice
    );


    document.getElementById(
        "selectedVoice"
    ).textContent =
        "Selected: " +
        voice;

}


/* =========================================
   DELETE MENU
========================================= */

function openDeleteMenu() {

    moreMenu.classList.remove(
        "show"
    );

    deleteOverlay.classList.add(
        "show"
    );

}


/* =========================================
   CLEAR CURRENT CHAT
========================================= */

function clearCurrentChat() {

    const chat =
        getCurrentChat();


    if (!chat) {

        closeAllPopups();

        return;

    }


    chat.messages = [];

    chat.updatedAt =
        Date.now();


    saveChats();

    renderChat(chat);

    renderHistory();

    closeAllPopups();

}


/* =========================================
   CLEAR ALL HISTORY
========================================= */

function clearHistory() {

    const confirmed =
        confirm(
            "Clear all chat history?"
        );


    if (!confirmed) return;


    chats.forEach(
        chat => {

            chat.messages = [];

            chat.deleted = false;

            chat.updatedAt =
                Date.now();

        }
    );


    saveChats();

    renderHistory();

    const current =
        getCurrentChat();


    if (current) {

        renderChat(current);

    } else {

        showWelcome();

    }


    closeAllPopups();

}


/* =========================================
   DELETE SELECTED
========================================= */

function deleteSelectedChat() {

    const chat =
        getCurrentChat();


    if (!chat) {

        closeAllPopups();

        return;

    }


    softDeleteChat(
        chat.id
    );


    closeAllPopups();

}


/* =========================================
   SOFT DELETE
========================================= */

function softDeleteChat(id) {

    const chat =
        chats.find(
            c => String(c.id) === String(id)
        );


    if (!chat) return;


    chat.deleted = true;

    chat.updatedAt =
        Date.now();


    saveChats();


    if (
        String(currentChatId) ===
        String(id)
    ) {

        currentChatId = null;

        localStorage.removeItem(
            "viggoCurrentChat"
        );

        showWelcome();

    }


    renderHistory();

}


/* =========================================
   PIN CHAT
========================================= */

function togglePinChat(id) {

    const chat =
        chats.find(
            c => String(c.id) === String(id)
        );


    if (!chat) return;


    chat.pinned =
        !chat.pinned;


    chat.updatedAt =
        Date.now();


    saveChats();

    renderHistory();

}


/* =========================================
   PIN CURRENT
========================================= */

function pinCurrentChat() {

    const chat =
        getCurrentChat();


    if (!chat) return;


    chat.pinned = true;

    chat.updatedAt =
        Date.now();


    saveChats();

    renderHistory();

}


/* =========================================
   PINNED CHATS
========================================= */

function showPinnedChats() {

    const pinned =
        chats.filter(
            chat =>
                chat.pinned &&
                !chat.deleted
        );


    renderHistory(
        pinned
    );

}


/* =========================================
   DELETED CHATS
========================================= */

function showDeletedChats() {

    historyList.innerHTML = "";


    const deleted =
        chats.filter(
            chat => chat.deleted
        );


    deleted.forEach(
        chat => {

            const item =
                document.createElement("div");

            item.className =
                "history-item";


            const main =
                document.createElement("div");

            main.className =
                "history-main";


            const title =
                document.createElement("div");

            title.className =
                "history-title";

            title.textContent =
                "🗑️ " +
                chat.title;


            main.appendChild(
                title
            );


            const actions =
                document.createElement("div");

            actions.className =
                "history-actions";


            const restore =
                document.createElement("button");

            restore.textContent =
                "↩️";

            restore.title =
                "Restore";


            restore.onclick =
                function(event) {

                    event.stopPropagation();

                    restoreChat(chat.id);

                };


            const permanent =
                document.createElement("button");

            permanent.textContent =
                "❌";

            permanent.title =
                "Delete permanently";


            permanent.onclick =
                function(event) {

                    event.stopPropagation();

                    permanentlyDeleteChat(
                        chat.id
                    );

                };


            actions.appendChild(
                restore
            );

            actions.appendChild(
                permanent
            );


            item.appendChild(
                main
            );

            item.appendChild(
                actions
            );


            historyList.appendChild(
                item
            );

        }
    );

}


/* =========================================
   RESTORE
========================================= */

function restoreChat(id) {

    const chat =
        chats.find(
            c => String(c.id) === String(id)
        );


    if (!chat) return;


    chat.deleted = false;

    chat.updatedAt =
        Date.now();


    saveChats();

    renderHistory();

}


/* =========================================
   PERMANENT DELETE
========================================= */

function permanentlyDeleteChat(id) {

    chats =
        chats.filter(
            chat =>
                String(chat.id) !== String(id)
        );


    saveChats();

    renderHistory();

}


/* =========================================
   SEARCH
========================================= */

function searchChats() {

    const input =
        document.getElementById(
            "historySearch"
        );


    const query =
        input.value
            .trim()
            .toLowerCase();


    const filtered =
        chats.filter(
            chat =>
                !chat.deleted &&
                (
                    chat.title
                        .toLowerCase()
                        .includes(query)
                )
        );


    renderHistory(
        filtered
    );

}


/* =========================================
   COPY
========================================= */

async function copyText(text) {

    try {

        await navigator.clipboard.writeText(
            text
        );

        alert(
            "Copied!"
        );

    } catch {

        const area =
            document.createElement("textarea");

        area.value =
            text;

        document.body.appendChild(
            area
        );

        area.select();

        document.execCommand(
            "copy"
        );

        area.remove();

        alert(
            "Copied!"
        );

    }

}


/* =========================================
   SHARE TEXT
========================================= */

async function shareText(text) {

    if (
        navigator.share
    ) {

        try {

            await navigator.share({
                title: "Viggo AI",
                text: text
            });

        } catch {

            // User cancelled share

        }

    } else {

        await copyText(text);

        alert(
            "Share is not supported here. Text copied instead."
        );

    }

}


/* =========================================
   SHARE CURRENT CHAT
========================================= */

async function shareCurrentChat() {

    const chat =
        getCurrentChat();


    if (
        !chat ||
        !chat.messages.length
    ) {

        alert(
            "No messages to share."
        );

        return;

    }


    const text =
        chat.messages
            .map(
                message =>
                    (
                        message.role === "user"
                            ? "You: "
                            : "Viggo AI: "
                    ) +
                    message.text
            )
            .join("\n\n");


    shareText(text);

}


/* =========================================
   CLOSE POPUPS
========================================= */

function closeAllPopups() {

    plusMenu.classList.remove(
        "show"
    );

    moreMenu.classList.remove(
        "show"
    );

    languageOverlay.classList.remove(
        "show"
    );

    voiceOverlay.classList.remove(
        "show"
    );

    deleteOverlay.classList.remove(
        "show"
    );

}


function closePopups(event) {

    if (
        event.target.classList.contains(
            "overlay"
        )
    ) {

        closeAllPopups();

    }

}


/* =========================================
   OUTSIDE CLICK
========================================= */

document.addEventListener(
    "click",
    function(event) {

        if (
            !event.target.closest(
                ".plus-button"
            ) &&
            !event.target.closest(
                ".plus-menu"
            )
        ) {

            plusMenu.classList.remove(
                "show"
            );

        }


        if (
            !event.target.closest(
                ".top-icon"
            ) &&
            !event.target.closest(
                ".more-menu"
            )
        ) {

            moreMenu.classList.remove(
                "show"
            );

        }

    }
);


/* =========================================
   INITIAL LOAD
========================================= */

function initialize() {

    renderHistory();


    let chat =
        getCurrentChat();


    if (
        !chat ||
        chat.deleted
    ) {

        chat =
            chats.find(
                c => !c.deleted
            );


        if (chat) {

            currentChatId =
                String(chat.id);

            localStorage.setItem(
                "viggoCurrentChat",
                currentChatId
            );

        }

    }


    if (chat) {

        renderChat(chat);

        renderHistory();

    } else {

        showWelcome();

    }

}


initialize();
