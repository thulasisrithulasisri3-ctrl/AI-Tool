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

const recentList =
    document.getElementById("recentList");

const plusMenu =
    document.getElementById("plusMenu");

const sidebarMoreMenu =
    document.getElementById("sidebarMoreMenu");

const languageOverlay =
    document.getElementById("languageOverlay");

const voiceOverlay =
    document.getElementById("voiceOverlay");

const deleteOverlay =
    document.getElementById("deleteOverlay");

const selectDeleteOverlay =
    document.getElementById("selectDeleteOverlay");

const shareOverlay =
    document.getElementById("shareOverlay");

const selectChatList =
    document.getElementById("selectChatList");

const photoInput =
    document.getElementById("photoInput");

const videoInput =
    document.getElementById("videoInput");

const fileInput =
    document.getElementById("fileInput");


/* =========================================
   STORAGE
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
   STORAGE FUNCTIONS
========================================= */

function saveChats() {

    localStorage.setItem(
        "viggoChats",
        JSON.stringify(chats)
    );

}


function getCurrentChat() {

    return chats.find(
        chat =>
            String(chat.id) ===
            String(currentChatId)
    );

}


/* =========================================
   SIDEBAR
========================================= */

function toggleSidebar() {

    sidebar.classList.toggle("open");

}


/* =========================================
   MORE
========================================= */

function toggleMoreMenu() {

    sidebarMoreMenu.classList.toggle(
        "show"
    );

}


/* =========================================
   NEW CHAT
========================================= */

function createNewChat() {

    if (
        currentChatId &&
        getCurrentChat() &&
        getCurrentChat().messages.length === 0
    ) {

        closeMore();

        chatInput.focus();

        return;

    }


    if (
        chats.length > 0 &&
        currentChatId &&
        getCurrentChat()
    ) {

        const confirmNew =
            confirm(
                "Start a new chat?"
            );

        if (!confirmNew) return;

    }


    const newChat = {

        id: Date.now(),

        title: "New Chat",

        messages: [],

        pinned: false,

        updatedAt: Date.now()

    };


    chats.unshift(
        newChat
    );


    currentChatId =
        String(newChat.id);


    localStorage.setItem(
        "viggoCurrentChat",
        currentChatId
    );


    saveChats();

    renderRecent();

    renderChat(
        newChat
    );

    chatInput.focus();

}


/* =========================================
   RECENT
========================================= */

function renderRecent(
    list = null
) {

    recentList.innerHTML = "";


    const source =
        list ||
        chats;


    source.forEach(
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


            const main =
                document.createElement(
                    "div"
                );


            main.className =
                "history-main";


            const title =
                document.createElement(
                    "div"
                );


            title.className =
                "history-title";


            title.textContent =
                (
                    chat.pinned
                        ? "📌 "
                        : ""
                ) +
                (
                    chat.title ||
                    "New Chat"
                );


            const time =
                document.createElement(
                    "div"
                );


            time.className =
                "history-time";


            time.textContent =
                formatTime(
                    chat.updatedAt
                );


            main.appendChild(
                title
            );

            main.appendChild(
                time
            );


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


            pin.textContent =
                chat.pinned
                    ? "📌"
                    : "☆";


            pin.title =
                "Pin";


            pin.onclick =
                function(event) {

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


            del.textContent =
                "🗑️";


            del.title =
                "Delete";


            del.onclick =
                function(event) {

                    event.stopPropagation();

                    deleteOneChat(
                        chat.id
                    );

                };


            actions.appendChild(
                pin
            );

            actions.appendChild(
                del
            );


            item.appendChild(
                main
            );

            item.appendChild(
                actions
            );


            item.onclick =
                function() {

                    openChat(
                        chat.id
                    );

                };


            recentList.appendChild(
                item
            );

        }
    );

}


/* =========================================
   OPEN CHAT
========================================= */

function openChat(id) {

    const chat =
        chats.find(
            c =>
                String(c.id) ===
                String(id)
        );


    if (!chat) return;


    currentChatId =
        String(chat.id);


    localStorage.setItem(
        "viggoCurrentChat",
        currentChatId
    );


    renderChat(
        chat
    );

    renderRecent();

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
                message.text
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

        <div class="welcome">

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
        chat.title ===
        "New Chat"
    ) {

        chat.title =
            text.substring(
                0,
                35
            );

    }


    chat.messages.push({

        role: "user",

        text: text,

        time: Date.now()

    });


    chat.updatedAt =
        Date.now();


    chatInput.value = "";

    autoResize();

    saveChats();

    renderChat(chat);

    renderRecent();


    showTyping();


    try {

        const response =
            await fetch(
                "https://ai-tool-2-zpul.onrender.com/api/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            message: text
                        })
                }
            );


        if (!response.ok) {

            throw new Error(
                "API error"
            );

        }


        const data =
            await response.json();


        removeTyping();


        const answer =
            data.reply ||
            data.response ||
            data.message ||
            "Sorry, I couldn't generate a response.";


        chat.messages.push({

            role: "ai",

            text: answer,

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
                "Sorry friend, I couldn't connect to Viggo AI right now.",

            time: Date.now()

        });


        saveChats();

        renderChat(chat);

        renderRecent();

    }

}


/* =========================================
   MESSAGE SCREEN
========================================= */

function addMessageToScreen(
    role,
    text
) {

    const message =
        document.createElement(
            "div"
        );


    message.className =
        "message " + role;


    const avatar =
        document.createElement(
            "div"
        );


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
        "bubble " +
        (
            role === "ai"
                ? "ai-bubble"
                : "user-bubble"
        );


    bubble.textContent =
        text;


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


    copy.textContent =
        "📋 Copy";


    copy.onclick =
        () => copyText(text);


    /* SHARE */

    const share =
        document.createElement(
            "button"
        );


    share.textContent =
        "🔗 Share";


    share.onclick =
        () => createShareLink();


    /* PIN */

    const pin =
        document.createElement(
            "button"
        );


    pin.textContent =
        "📌 Pin";


    pin.onclick =
        () => pinCurrentChat();


    actions.appendChild(
        copy
    );

    actions.appendChild(
        share
    );

    actions.appendChild(
        pin
    );


    content.appendChild(
        bubble
    );

    content.appendChild(
        actions
    );


    if (
        role === "ai"
    ) {

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

}


/* =========================================
   TYPING
========================================= */

function showTyping() {

    removeTyping();


    const typing =
        document.createElement(
            "div"
        );


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
   INPUT
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
   PLUS
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


/* PHOTO */

function selectPhoto() {

    closePlusMenu();

    photoInput.click();

}


/* VIDEO */

function selectVideo() {

    closePlusMenu();

    videoInput.click();

}


/* FILE */

function selectFile() {

    closePlusMenu();

    fileInput.click();

}


/* =========================================
   FILE EVENTS
========================================= */

photoInput.addEventListener(
    "change",
    function() {

        if (!this.files.length) return;

        chatInput.value =
            "📷 " +
            this.files[0].name;

        autoResize();

    }
);


videoInput.addEventListener(
    "change",
    function() {

        if (!this.files.length) return;

        chatInput.value =
            "🎥 " +
            this.files[0].name;

        autoResize();

    }
);


fileInput.addEventListener(
    "change",
    function() {

        if (!this.files.length) return;

        chatInput.value =
            "📎 " +
            this.files[0].name;

        autoResize();

    }
);


/* =========================================
   LANGUAGE
========================================= */

function openLanguage() {

    closeMore();

    closeModals();

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


/* =========================================
   VOICE
========================================= */

function openVoice() {

    closeMore();

    closeModals();

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

function openDelete() {

    closeMore();

    closeModals();

    deleteOverlay.classList.add(
        "show"
    );

}


/* =========================================
   CLEAR CURRENT
========================================= */

function clearCurrentChat() {

    const chat =
        getCurrentChat();


    if (!chat) {

        closeModals();

        return;

    }


    chat.messages = [];

    chat.title =
        "New Chat";

    chat.updatedAt =
        Date.now();


    saveChats();

    renderChat(chat);

    renderRecent();

    closeModals();

}


/* =========================================
   CLEAR ALL
========================================= */

function clearAllChats() {

    if (
        chats.length === 0
    ) {

        closeModals();

        return;

    }


    const ok =
        confirm(
            "Clear all chats?"
        );


    if (!ok) return;


    chats =
        chats.map(
            chat => ({

                ...chat,

                messages: [],

                title: "New Chat",

                pinned: false,

                updatedAt: Date.now()

            })
        );


    saveChats();

    renderRecent();


    const current =
        getCurrentChat();


    if (current) {

        renderChat(current);

    }


    closeModals();

}


/* =========================================
   SELECTIVE DELETE
========================================= */

function openSelectDelete() {

    closeModals();

    selectDeleteOverlay.classList.add(
        "show"
    );


    selectChatList.innerHTML = "";


    if (
        chats.length === 0
    ) {

        selectChatList.innerHTML =
            `
            <p style="
                color:#64748b;
                padding:15px;
                text-align:center;
            ">
                No chats available
            </p>
            `;

        return;

    }


    chats.forEach(
        chat => {

            const row =
                document.createElement(
                    "label"
                );


            row.className =
                "select-chat";


            row.innerHTML = `

                <input
                    type="checkbox"
                    value="${chat.id}"
                    class="chat-checkbox"
                >

                <span>
                    ${escapeHTML(
                        chat.title ||
                        "New Chat"
                    )}
                </span>

            `;


            selectChatList.appendChild(
                row
            );

        }
    );

}


/* =========================================
   DELETE SELECTED
========================================= */

function deleteSelectedChats() {

    const checked =
        document.querySelectorAll(
            ".chat-checkbox:checked"
        );


    if (
        checked.length === 0
    ) {

        alert(
            "Please select at least one chat."
        );

        return;

    }


    const ids =
        Array.from(
            checked
        ).map(
            box =>
                String(box.value)
        );


    chats =
        chats.filter(
            chat =>
                !ids.includes(
                    String(chat.id)
                )
        );


    if (
        !chats.some(
            chat =>
                String(chat.id) ===
                String(currentChatId)
        )
    ) {

        currentChatId =
            chats.length
                ? String(chats[0].id)
                : null;


        if (currentChatId) {

            localStorage.setItem(
                "viggoCurrentChat",
                currentChatId
            );

        } else {

            localStorage.removeItem(
                "viggoCurrentChat"
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


    closeModals();

}


/* =========================================
   DELETE ONE CHAT
========================================= */

function deleteOneChat(id) {

    const ok =
        confirm(
            "Delete this chat?"
        );


    if (!ok) return;


    chats =
        chats.filter(
            chat =>
                String(chat.id) !==
                String(id)
        );


    if (
        String(currentChatId) ===
        String(id)
    ) {

        currentChatId =
            chats.length
                ? String(chats[0].id)
                : null;


        if (currentChatId) {

            localStorage.setItem(
                "viggoCurrentChat",
                currentChatId
            );

        } else {

            localStorage.removeItem(
                "viggoCurrentChat"
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
   PIN
========================================= */

function togglePin(id) {

    const chat =
        chats.find(
            c =>
                String(c.id) ===
                String(id)
        );


    if (!chat) return;


    chat.pinned =
        !chat.pinned;


    chat.updatedAt =
        Date.now();


    saveChats();

    renderRecent();

}


function pinCurrentChat() {

    const chat =
        getCurrentChat();


    if (!chat) return;


    chat.pinned = true;

    chat.updatedAt =
        Date.now();


    saveChats();

    renderRecent();

}


/* =========================================
   SEARCH
========================================= */

function searchChats() {

    const query =
        document.getElementById(
            "searchInput"
        ).value
            .trim()
            .toLowerCase();


    if (!query) {

        renderRecent();

        return;

    }


    const filtered =
        chats.filter(
            chat =>
                (
                    chat.title ||
                    ""
                )
                .toLowerCase()
                .includes(query)
        );


    renderRecent(
        filtered
    );

}


/* =========================================
   SHARE LINK
========================================= */

function createShareLink() {

    const chat =
        getCurrentChat();


    if (
        !chat ||
        chat.messages.length === 0
    ) {

        alert(
            "There is no chat to share."
        );

        return;

    }


    /*
      Frontend share link.

      For a real public share page,
      connect this to your Render backend.
    */

    const shareId =
        btoa(
            String(chat.id)
        )
        .replace(
            /[^a-zA-Z0-9]/g,
            ""
        );


    const link =
        window.location.origin +
        window.location.pathname +
        "?share=" +
        shareId;


    document.getElementById(
        "shareLink"
    ).value =
        link;


    shareOverlay.classList.add(
        "show"
    );

}


/* =========================================
   COPY SHARE LINK
========================================= */

async function copyShareLink() {

    const input =
        document.getElementById(
            "shareLink"
        );


    try {

        await navigator.clipboard.writeText(
            input.value
        );

        alert(
            "Share link copied!"
        );

    } catch {

        input.select();

        document.execCommand(
            "copy"
        );

        alert(
            "Share link copied!"
        );

    }

}


/* =========================================
   COPY MESSAGE
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

        const temp =
            document.createElement(
                "textarea"
            );

        temp.value =
            text;

        document.body.appendChild(
            temp
        );

        temp.select();

        document.execCommand(
            "copy"
        );

        temp.remove();

        alert(
            "Copied!"
        );

    }

}


/* =========================================
   CLOSE
========================================= */

function closeMore() {

    sidebarMoreMenu.classList.remove(
        "show"
    );

}


function closeModals() {

    languageOverlay.classList.remove(
        "show"
    );

    voiceOverlay.classList.remove(
        "show"
    );

    deleteOverlay.classList.remove(
        "show"
    );

    selectDeleteOverlay.classList.remove(
        "show"
    );

    shareOverlay.classList.remove(
        "show"
    );

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

            closePlusMenu();

        }


        if (
            !event.target.closest(
                ".more-sidebar"
            ) &&
            !event.target.closest(
                ".sidebar-more-menu"
            )
        ) {

            closeMore();

        }

    }
);


/* =========================================
   ESCAPE
========================================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape"
        ) {

            closeModals();

            closeMore();

            closePlusMenu();

        }

    }
);


/* =========================================
   SCROLL
========================================= */

function scrollBottom() {

    setTimeout(
        function() {

            chatArea.scrollTop =
                chatArea.scrollHeight;

        },
        40
    );

}


/* =========================================
   TYPING
========================================= */

function removeTyping() {

    const typing =
        document.getElementById(
            "typingMessage"
        );


    if (typing) {

        typing.remove();

    }

}


function showTyping() {

    removeTyping();


    const typing =
        document.createElement(
            "div"
        );


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


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHTML(text) {

    return String(text)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

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
   INITIALIZE
========================================= */

function initialize() {

    renderRecent();


    let current =
        getCurrentChat();


    if (!current) {

        current =
            chats.find(
                chat => true
            );


        if (current) {

            currentChatId =
                String(current.id);


            localStorage.setItem(
                "viggoCurrentChat",
                currentChatId
            );

        }

    }


    if (current) {

        renderChat(current);

    } else {

        showWelcome();

    }

}


initialize();
