"use strict";

/* =====================================================
   VIGGO AI - FULL SCRIPT
===================================================== */


/* =====================================================
   API
===================================================== */

const API_URL = "https://ai-tool-2-zpul.onrender.com/chat";


/* =====================================================
   ELEMENTS
===================================================== */

const sidebar = document.getElementById("sidebar");

const openSidebar =
    document.getElementById("openSidebar");

const closeSidebar =
    document.getElementById("closeSidebar");

const newChat =
    document.getElementById("newChat");

const searchChat =
    document.getElementById("searchChat");

const chatHistory =
    document.getElementById("chatHistory");

const conversation =
    document.getElementById("conversation");

const message =
    document.getElementById("message");

const send =
    document.getElementById("send");

const mic =
    document.getElementById("mic");

const plusBtn =
    document.getElementById("plusBtn");

const plusMenu =
    document.getElementById("plusMenu");

const shareBtn =
    document.getElementById("shareBtn");

const moreBtn =
    document.getElementById("moreBtn");

const moreMenu =
    document.getElementById("moreMenu");

const voiceMenuBtn =
    document.getElementById("voiceMenuBtn");

const languageBtn =
    document.getElementById("languageBtn");

const clearChatBtn =
    document.getElementById("clearChatBtn");

const showHistoryBtn =
    document.getElementById("showHistoryBtn");

const savedChatsBtn =
    document.getElementById("savedChatsBtn");

const selectChatsBtn =
    document.getElementById("selectChatsBtn");

const deleteSelectedBtn =
    document.getElementById("deleteSelectedBtn");

const plusVoiceBtn =
    document.getElementById("plusVoiceBtn");


/* =====================================================
   FILE INPUTS
===================================================== */

const photoInput = document.createElement("input");

photoInput.type = "file";
photoInput.accept = "image/*";
photoInput.style.display = "none";

document.body.appendChild(photoInput);


const videoInput = document.createElement("input");

videoInput.type = "file";
videoInput.accept = "video/*";
videoInput.style.display = "none";

document.body.appendChild(videoInput);


const fileInput = document.createElement("input");

fileInput.type = "file";
fileInput.style.display = "none";

document.body.appendChild(fileInput);


/* =====================================================
   CHAT DATA
===================================================== */

let chats =
    JSON.parse(
        localStorage.getItem("viggoChats") || "[]"
    );

let currentChatId =
    localStorage.getItem("viggoCurrentChatId");

let selectingChats = false;


/* =====================================================
   SAVED / LIKED DATA
===================================================== */

let savedMessages =
    JSON.parse(
        localStorage.getItem("viggoSavedMessages") || "[]"
    );


function saveSavedMessages() {

    localStorage.setItem(
        "viggoSavedMessages",
        JSON.stringify(savedMessages)
    );

}


/* =====================================================
   CREATE CHAT
===================================================== */

function createChat() {

    const id =
        Date.now().toString();

    const chat = {

        id: id,

        title: "New Chat",

        messages: [],

        createdAt: Date.now()

    };

    chats.unshift(chat);

    currentChatId = id;

    saveChats();

    renderHistory();

    renderConversation();

}


/* =====================================================
   SAVE CHATS
===================================================== */

function saveChats() {

    localStorage.setItem(
        "viggoChats",
        JSON.stringify(chats)
    );

    if (currentChatId) {

        localStorage.setItem(
            "viggoCurrentChatId",
            currentChatId
        );

    }

}


/* =====================================================
   CURRENT CHAT
===================================================== */

function getCurrentChat() {

    return chats.find(
        chat => chat.id === currentChatId
    );

}


/* =====================================================
   ENSURE CHAT
===================================================== */

function ensureChat() {

    if (!currentChatId || !getCurrentChat()) {

        createChat();

    }

}


/* =====================================================
   RENDER HISTORY
===================================================== */

function renderHistory(filter = "") {

    if (!chatHistory) return;

    chatHistory.innerHTML = "";

    chats
        .filter(chat =>
            chat.title
                .toLowerCase()
                .includes(filter.toLowerCase())
        )
        .forEach(chat => {

            const item =
                document.createElement("div");

            item.className = "history-item";

            item.style.padding = "10px";
            item.style.marginBottom = "5px";
            item.style.borderRadius = "8px";
            item.style.cursor = "pointer";
            item.style.color = "white";

            item.textContent =
                chat.title || "New Chat";


            item.addEventListener(
                "mouseenter",
                () => {

                    if (
                        item.dataset.selected !==
                        "true"
                    ) {

                        item.style.background =
                            "#14284a";

                    }

                }
            );


            item.addEventListener(
                "mouseleave",
                () => {

                    if (
                        item.dataset.selected !==
                        "true"
                    ) {

                        item.style.background =
                            "transparent";

                    }

                }
            );


            item.addEventListener(
                "click",
                () => {

                    if (selectingChats) {

                        item.dataset.selected =
                            item.dataset.selected === "true"
                                ? "false"
                                : "true";

                        item.style.background =
                            item.dataset.selected === "true"
                                ? "#17479a"
                                : "transparent";

                        return;

                    }


                    currentChatId =
                        chat.id;

                    saveChats();

                    renderConversation();


                    if (window.innerWidth <= 768) {

                        sidebar.classList.remove(
                            "open"
                        );

                    }

                }
            );


            chatHistory.appendChild(item);

        });

}


/* =====================================================
   MESSAGE ACTIONS
===================================================== */

function saveMessage(messageData) {

    const exists =
        savedMessages.some(
            item =>
                item.chatId === messageData.chatId &&
                item.messageId === messageData.messageId
        );

    if (!exists) {

        savedMessages.push(messageData);

        saveSavedMessages();

        alert("Message saved.");

    } else {

        savedMessages =
            savedMessages.filter(
                item =>
                    !(
                        item.chatId === messageData.chatId &&
                        item.messageId === messageData.messageId
                    )
            );

        saveSavedMessages();

        alert("Message removed from saved.");

    }

}


/* =====================================================
   COPY MESSAGE
===================================================== */

async function copyMessage(text) {

    try {

        await navigator.clipboard.writeText(text);

        alert("Message copied.");

    } catch (error) {

        console.error(
            "Copy error:",
            error
        );

        const textarea =
            document.createElement("textarea");

        textarea.value = text;

        document.body.appendChild(textarea);

        textarea.select();

        document.execCommand("copy");

        textarea.remove();

        alert("Message copied.");

    }

}


/* =====================================================
   LIKE MESSAGE
===================================================== */

function toggleLike(chatId, messageId) {

    const chat =
        chats.find(
            item => item.id === chatId
        );

    if (!chat) return;

    const msg =
        chat.messages.find(
            item => item.id === messageId
        );

    if (!msg) return;

    msg.liked =
        !Boolean(msg.liked);

    saveChats();

    renderConversation();

}


/* =====================================================
   DELETE MESSAGE
===================================================== */

function deleteMessage(chatId, messageId) {

    const chat =
        chats.find(
            item => item.id === chatId
        );

    if (!chat) return;


    chat.messages =
        chat.messages.filter(
            item =>
                item.id !== messageId
        );


    savedMessages =
        savedMessages.filter(
            item =>
                !(
                    item.chatId === chatId &&
                    item.messageId === messageId
                )
        );


    saveChats();

    saveSavedMessages();

    renderConversation();

}


/* =====================================================
   PIN MESSAGE
===================================================== */

function togglePin(chatId, messageId) {

    const chat =
        chats.find(
            item => item.id === chatId
        );

    if (!chat) return;


    const msg =
        chat.messages.find(
            item => item.id === messageId
        );

    if (!msg) return;


    msg.pinned =
        !Boolean(msg.pinned);


    saveChats();

    renderConversation();

}


/* =====================================================
   CREATE MESSAGE ACTION BUTTON
===================================================== */

function createActionButton(
    text,
    title,
    clickHandler
) {

    const button =
        document.createElement("button");

    button.type = "button";

    button.textContent = text;

    button.title = title;

    button.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            event.stopPropagation();

            clickHandler();

        }
    );

    return button;

}


/* =====================================================
   RENDER CONVERSATION
===================================================== */

function renderConversation() {

    if (!conversation) return;

    conversation.innerHTML = "";

    const chat = getCurrentChat();

    if (!chat) return;


    /* -----------------------------------------
       PINNED MESSAGES FIRST
    ----------------------------------------- */

    const messages = [
        ...chat.messages.filter(
            msg => msg.pinned
        ),
        ...chat.messages.filter(
            msg => !msg.pinned
        )
    ];


    messages.forEach(
        msg => {

            addMessageToUI(
                msg.role,
                msg.text,
                msg
            );

        }
    );

}


/* =====================================================
   ADD MESSAGE UI
===================================================== */

function addMessageToUI(
    role,
    text,
    messageData = null
) {

    const wrapper =
        document.createElement("div");


    wrapper.className =
        "message " +
        (role === "user" ? "user" : "ai");


    if (
        messageData?.pinned
    ) {

        wrapper.classList.add(
            "pinned"
        );

    }


    /* -----------------------------------------
       MESSAGE ROW
    ----------------------------------------- */

    const row =
        document.createElement("div");

    row.className =
        "message-row";


    /* -----------------------------------------
       CONTENT
    ----------------------------------------- */

    const content =
        document.createElement("div");

    content.className =
        "message-content";


    /* -----------------------------------------
       BUBBLE
    ----------------------------------------- */

    const bubble =
        document.createElement("div");

    bubble.className =
        "message-bubble";

    bubble.textContent = text;


    content.appendChild(
        bubble
    );


    /* -----------------------------------------
       ACTIONS
       SAVE / COPY / LIKE
    ----------------------------------------- */

    if (messageData) {

        const actions =
            document.createElement("div");

        actions.className =
            "message-actions";


        const saveBtn =
            createActionButton(
                "💾 Save",
                "Save message",
                function () {

                    saveMessage({

                        chatId:
                            currentChatId,

                        messageId:
                            messageData.id,

                        role:
                            messageData.role,

                        text:
                            messageData.text,

                        savedAt:
                            Date.now()

                    });

                }
            );


        const copyBtn =
            createActionButton(
                "📋 Copy",
                "Copy message",
                function () {

                    copyMessage(
                        messageData.text
                    );

                }
            );


        const likeBtn =
            createActionButton(
                messageData.liked
                    ? "❤️ Liked"
                    : "👍 Like",

                "Like message",

                function () {

                    toggleLike(
                        currentChatId,
                        messageData.id
                    );

                }
            );


        actions.appendChild(
            saveBtn
        );

        actions.appendChild(
            copyBtn
        );

        actions.appendChild(
            likeBtn
        );


        content.appendChild(
            actions
        );

    }


    /* -----------------------------------------
       SIDE ACTIONS
       DELETE / PIN
    ----------------------------------------- */

    if (messageData) {

        const sideActions =
            document.createElement("div");

        sideActions.className =
            "message-side-actions";


        const deleteBtn =
            createActionButton(
                "🗑",
                "Delete message",
                function () {

                    deleteMessage(
                        currentChatId,
                        messageData.id
                    );

                }
            );


        const pinBtn =
            createActionButton(
                messageData.pinned
                    ? "📌"
                    : "📍",

                messageData.pinned
                    ? "Unpin message"
                    : "Pin message",

                function () {

                    togglePin(
                        currentChatId,
                        messageData.id
                    );

                }
            );


        sideActions.appendChild(
            deleteBtn
        );

        sideActions.appendChild(
            pinBtn
        );


        row.appendChild(
            content
        );

        row.appendChild(
            sideActions
        );

    } else {

        row.appendChild(
            content
        );

    }


    wrapper.appendChild(
        row
    );

    conversation.appendChild(
        wrapper
    );


    conversation.scrollTop =
        conversation.scrollHeight;

}


/* =====================================================
   ADD MESSAGE
===================================================== */

function addMessage(
    role,
    text
) {

    ensureChat();

    const chat =
        getCurrentChat();

    if (!chat) return;


    const newMessage = {

        id:
            Date.now().toString() +
            "-" +
            Math.random()
                .toString(36)
                .substring(2, 8),

        role:
            role,

        text:
            text,

        time:
            Date.now(),

        liked:
            false,

        pinned:
            false

    };


    chat.messages.push(
        newMessage
    );


    if (
        role === "user" &&
        chat.title === "New Chat"
    ) {

        chat.title =
            text.substring(0, 30);

    }


    saveChats();

    addMessageToUI(
        role,
        text,
        newMessage
    );

    renderHistory();

}


/* =====================================================
   SEND MESSAGE
===================================================== */

async function sendMessage() {

    if (!message) return;


    const text =
        message.value.trim();

    if (!text) return;


    ensureChat();


    addMessage(
        "user",
        text
    );


    message.value = "";

    message.style.height =
        "auto";


    const loading =
        document.createElement("div");

    loading.className =
        "message ai";


    loading.innerHTML =
        '<div class="message-bubble">Thinking...</div>';


    conversation.appendChild(
        loading
    );


    conversation.scrollTop =
        conversation.scrollHeight;


    try {

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
                                text,

                            chatId:
                                currentChatId

                        })

                }
            );


        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status
            );

        }


        const data =
            await response.json();


        loading.remove();


        const reply =
            data.reply ||
            data.response ||
            data.message ||
            data.text ||
            "Sorry, I couldn't get a response.";


        addMessage(
            "assistant",
            reply
        );


    } catch (error) {

        console.error(
            "Viggo API Error:",
            error
        );


        loading.remove();


        addMessage(
            "assistant",
            "Sorry friend, I couldn't connect to Viggo AI right now."
        );

    }

}


/* =====================================================
   SEND BUTTON
===================================================== */

if (send) {

    send.addEventListener(
        "click",
        sendMessage
    );

}


/* =====================================================
   ENTER KEY
===================================================== */

if (message) {

    message.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();

            }

        }
    );


    message.addEventListener(
        "input",
        function () {

            this.style.height =
                "auto";

            this.style.height =
                Math.min(
                    this.scrollHeight,
                    130
                ) + "px";

        }
    );

}


/* =====================================================
   PLUS MENU
===================================================== */

if (plusBtn && plusMenu) {

    plusBtn.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            event.stopPropagation();

            plusMenu.classList.toggle(
                "show"
            );

        }
    );


    plusMenu.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

        }
    );

}


/* =====================================================
   PHOTO BUTTON
===================================================== */

const photoBtn =
    plusMenu?.querySelector(
        "button:nth-child(1)"
    );


if (photoBtn) {

    photoBtn.addEventListener(
        "click",
        function () {

            photoInput.click();

        }
    );

}


/* =====================================================
   VIDEO BUTTON
===================================================== */

const videoBtn =
    plusMenu?.querySelector(
        "button:nth-child(2)"
    );


if (videoBtn) {

    videoBtn.addEventListener(
        "click",
        function () {

            videoInput.click();

        }
    );

}


/* =====================================================
   FILE BUTTON
===================================================== */

const fileBtn =
    plusMenu?.querySelector(
        "button:nth-child(3)"
    );


if (fileBtn) {

    fileBtn.addEventListener(
        "click",
        function () {

            fileInput.click();

        }
    );

}


/* =====================================================
   PHOTO SELECTED
===================================================== */

photoInput.addEventListener(
    "change",
    function () {

        if (!this.files.length) return;


        const file =
            this.files[0];


        addMessage(
            "user",
            "📷 Photo selected: " +
            file.name
        );


        plusMenu.classList.remove(
            "show"
        );

    }
);


/* =====================================================
   VIDEO SELECTED
===================================================== */

videoInput.addEventListener(
    "change",
    function () {

        if (!this.files.length) return;


        const file =
            this.files[0];


        addMessage(
            "user",
            "🎥 Video selected: " +
            file.name
        );


        plusMenu.classList.remove(
            "show"
        );

    }
);


/* =====================================================
   FILE SELECTED
===================================================== */

fileInput.addEventListener(
    "change",
    function () {

        if (!this.files.length) return;


        const file =
            this.files[0];


        addMessage(
            "user",
            "📎 File selected: " +
            file.name
        );


        plusMenu.classList.remove(
            "show"
        );

    }
);


/* =====================================================
   PLUS VOICE
===================================================== */

if (plusVoiceBtn) {

    plusVoiceBtn.addEventListener(
        "click",
        function () {

            const modal =
                document.getElementById(
                    "voiceModal"
                );


            if (modal) {

                modal.classList.add(
                    "show"
                );

            }


            plusMenu.classList.remove(
                "show"
            );

        }
    );

}


/* =====================================================
   CLOSE PLUS MENU
===================================================== */

document.addEventListener(
    "click",
    function () {

        if (plusMenu) {

            plusMenu.classList.remove(
                "show"
            );

        }

    }
);


/* =====================================================
   SIDEBAR OPEN
===================================================== */

if (openSidebar) {

    openSidebar.addEventListener(
        "click",
        function () {

            sidebar.classList.add(
                "open"
            );

        }
    );

}


/* =====================================================
   SIDEBAR CLOSE
===================================================== */

if (closeSidebar) {

    closeSidebar.addEventListener(
        "click",
        function () {

            sidebar.classList.remove(
                "open"
            );

        }
    );

}


/* =====================================================
   NEW CHAT
===================================================== */

if (newChat) {

    newChat.addEventListener(
        "click",
        function () {

            createChat();

        }
    );

}


/* =====================================================
   SEARCH CHAT
===================================================== */

if (searchChat) {

    searchChat.addEventListener(
        "input",
        function () {

            renderHistory(
                this.value
            );

        }
    );

}


/* =====================================================
   MORE BUTTON
===================================================== */

if (moreBtn && moreMenu) {

    moreBtn.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

            moreMenu.classList.toggle(
                "show"
            );

        }
    );


    moreMenu.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

        }
    );

}


/* =====================================================
   VOICE MENU
===================================================== */

if (voiceMenuBtn) {

    voiceMenuBtn.addEventListener(
        "click",
        function () {

            const modal =
                document.getElementById(
                    "voiceModal"
                );


            if (modal) {

                modal.classList.add(
                    "show"
                );

            }


            moreMenu.classList.remove(
                "show"
            );

        }
    );

}


/* =====================================================
   LANGUAGE
===================================================== */

if (languageBtn) {

    languageBtn.addEventListener(
        "click",
        function () {

            const modal =
                document.getElementById(
                    "languageModal"
                );


            if (modal) {

                modal.classList.add(
                    "show"
                );

            }


            moreMenu.classList.remove(
                "show"
            );

        }
    );

}


/* =====================================================
   CLEAR CHAT
===================================================== */

if (clearChatBtn) {

    clearChatBtn.addEventListener(
        "click",
        function () {

            const chat =
                getCurrentChat();


            if (!chat) return;


            chat.messages = [];


            savedMessages =
                savedMessages.filter(
                    item =>
                        item.chatId !==
                        currentChatId
                );


            saveChats();

            saveSavedMessages();

            renderConversation();


            moreMenu.classList.remove(
                "show"
            );

        }
    );

}


/* =====================================================
   SHOW HISTORY
===================================================== */

if (showHistoryBtn) {

    showHistoryBtn.addEventListener(
        "click",
        function () {

            renderHistory();

            moreMenu.classList.remove(
                "show"
            );

        }
    );

}


/* =====================================================
   SAVED CHATS
===================================================== */

if (savedChatsBtn) {

    savedChatsBtn.addEventListener(
        "click",
        function () {

            renderHistory();

            moreMenu.classList.remove(
                "show"
            );

        }
    );

}


/* =====================================================
   SELECT CHATS
===================================================== */

if (selectChatsBtn) {

    selectChatsBtn.addEventListener(
        "click",
        function () {

            selectingChats =
                !selectingChats;

            moreMenu.classList.remove(
                "show"
            );

            renderHistory();

        }
    );

}


/* =====================================================
   DELETE SELECTED
===================================================== */

if (deleteSelectedBtn) {

    deleteSelectedBtn.addEventListener(
        "click",
        function () {

            if (!selectingChats) {

                return;

            }


            const selectedIds = [];


            Array.from(
                chatHistory.children
            ).forEach(
                item => {

                    if (
                        item.dataset.selected ===
                        "true"
                    ) {

                        const title =
                            item.textContent;

                        const chat =
                            chats.find(
                                c =>
                                    c.title ===
                                    title
                            );

                        if (chat) {

                            selectedIds.push(
                                chat.id
                            );

                        }

                    }

                }
            );


            chats =
                chats.filter(
                    chat =>
                        !selectedIds.includes(
                            chat.id
                        )
                );


            if (!getCurrentChat()) {

                currentChatId =
                    chats[0]?.id || null;

            }


            selectingChats = false;


            saveChats();

            renderHistory();

            renderConversation();

        }
    );

}


/* =====================================================
   CLOSE MODALS
===================================================== */

const closeVoice =
    document.getElementById(
        "closeVoice"
    );

const closeLanguage =
    document.getElementById(
        "closeLanguage"
    );


if (closeVoice) {

    closeVoice.addEventListener(
        "click",
        function () {

            const modal =
                document.getElementById(
                    "voiceModal"
                );


            modal?.classList.remove(
                "show"
            );

        }
    );

}


if (closeLanguage) {

    closeLanguage.addEventListener(
        "click",
        function () {

            const modal =
                document.getElementById(
                    "languageModal"
                );


            modal?.classList.remove(
                "show"
            );

        }
    );

}


/* =====================================================
   MICROPHONE
===================================================== */

if (mic) {

    mic.addEventListener(
        "click",
        function () {

            const SpeechRecognition =
                window.SpeechRecognition ||
                window.webkitSpeechRecognition;


            if (!SpeechRecognition) {

                alert(
                    "Voice input is not supported in this browser."
                );

                return;

            }


            const recognition =
                new SpeechRecognition();


            recognition.lang =
                "en-IN";


            recognition.interimResults =
                false;


            recognition.start();


            recognition.onresult =
                function (event) {

                    message.value =
                        event.results[0][0]
                            .transcript;

                };


            recognition.onerror =
                function (error) {

                    console.error(
                        "Voice error:",
                        error
                    );

                };

        }
    );

}


/* =====================================================
   SHARE
===================================================== */

if (shareBtn) {

    shareBtn.addEventListener(
        "click",
        async function () {

            const chat =
                getCurrentChat();


            if (!chat) return;


            const shareText =
                chat.messages
                    .map(
                        m =>
                            (
                                m.role === "user"
                                    ? "You: "
                                    : "Viggo AI: "
                            ) +
                            m.text
                    )
                    .join("\n\n");


            try {

                await navigator.clipboard.writeText(
                    shareText
                );


                alert(
                    "Chat copied to clipboard."
                );


            } catch (error) {

                console.error(
                    "Share error:",
                    error
                );

            }

        }
    );

}


/* =====================================================
   CLOSE MORE MENU OUTSIDE
===================================================== */

document.addEventListener(
    "click",
    function () {

        if (moreMenu) {

            moreMenu.classList.remove(
                "show"
            );

        }

    }
);


/* =====================================================
   INITIALIZE
===================================================== */

if (
    !currentChatId ||
    !getCurrentChat()
) {

    if (chats.length === 0) {

        createChat();

    } else {

        currentChatId =
            chats[0].id;

        saveChats();

    }

}


/* =====================================================
   OLD MESSAGE COMPATIBILITY
===================================================== */

chats.forEach(
    chat => {

        chat.messages.forEach(
            msg => {

                if (!msg.id) {

                    msg.id =
                        Date.now().toString() +
                        "-" +
                        Math.random()
                            .toString(36)
                            .substring(2, 8);

                }

                if (
                    typeof msg.liked !==
                    "boolean"
                ) {

                    msg.liked = false;

                }

                if (
                    typeof msg.pinned !==
                    "boolean"
                ) {

                    msg.pinned = false;

                }

            }
        );

    }
);


saveChats();

renderHistory();

renderConversation();


console.log(
    "Viggo AI script loaded successfully."
);

console.log(
    "API:",
    API_URL
);
