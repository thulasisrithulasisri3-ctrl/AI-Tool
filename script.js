"use strict";

/* =====================================================
   VIGGO AI - FULL SCRIPT
===================================================== */


/* =====================================================
   API
===================================================== */

const API_URL =
    "https://ai-tool-2-zpul.onrender.com/chat";


/* =====================================================
   ELEMENTS
===================================================== */

const sidebar =
    document.getElementById("sidebar");

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

const photoInput =
    document.createElement("input");

photoInput.type = "file";
photoInput.accept = "image/*";
photoInput.style.display = "none";

document.body.appendChild(
    photoInput
);


const videoInput =
    document.createElement("input");

videoInput.type = "file";
videoInput.accept = "video/*";
videoInput.style.display = "none";

document.body.appendChild(
    videoInput
);


const fileInput =
    document.createElement("input");

fileInput.type = "file";
fileInput.style.display = "none";

document.body.appendChild(
    fileInput
);


/* =====================================================
   CHAT DATA
===================================================== */

let chats =
    JSON.parse(
        localStorage.getItem(
            "viggoChats"
        ) || "[]"
    );


let currentChatId =
    localStorage.getItem(
        "viggoCurrentChatId"
    );


let selectingChats = false;


/* =====================================================
   SAVED MESSAGES
===================================================== */

let savedMessages =
    JSON.parse(
        localStorage.getItem(
            "viggoSavedMessages"
        ) || "[]"
    );


function saveSavedMessages() {

    localStorage.setItem(
        "viggoSavedMessages",
        JSON.stringify(
            savedMessages
        )
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

        createdAt: Date.now(),

        pinned: false

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

    } else {

        localStorage.removeItem(
            "viggoCurrentChatId"
        );

    }

}


/* =====================================================
   CURRENT CHAT
===================================================== */

function getCurrentChat() {

    return chats.find(
        chat =>
            chat.id ===
            currentChatId
    );

}


/* =====================================================
   ENSURE CHAT
===================================================== */

function ensureChat() {

    if (
        !currentChatId ||
        !getCurrentChat()
    ) {

        createChat();

    }

}


/* =====================================================
   DELETE CHAT FROM SIDEBAR
===================================================== */

function deleteChat(chatId) {

    const index =
        chats.findIndex(
            chat =>
                chat.id === chatId
        );


    if (index === -1) return;


    chats.splice(
        index,
        1
    );


    /* -----------------------------------------
       DELETE SAVED MESSAGES OF THIS CHAT
    ----------------------------------------- */

    savedMessages =
        savedMessages.filter(
            item =>
                item.chatId !==
                chatId
        );


    /* -----------------------------------------
       CURRENT CHAT DELETED
    ----------------------------------------- */

    if (
        currentChatId === chatId
    ) {

        if (
            chats.length > 0
        ) {

            currentChatId =
                chats[0].id;

        } else {

            currentChatId = null;

        }

    }


    saveChats();

    saveSavedMessages();


    /* -----------------------------------------
       CREATE NEW CHAT IF EMPTY
    ----------------------------------------- */

    if (
        chats.length === 0
    ) {

        createChat();

        return;

    }


    renderHistory();

    renderConversation();

}


/* =====================================================
   PIN / UNPIN CHAT
===================================================== */

function toggleChatPin(chatId) {

    const chat =
        chats.find(
            item =>
                item.id === chatId
        );


    if (!chat) return;


    chat.pinned =
        !Boolean(chat.pinned);


    saveChats();


    renderHistory(
        searchChat?.value || ""
    );

}


/* =====================================================
   RENDER HISTORY
===================================================== */

function renderHistory(
    filter = ""
) {

    if (!chatHistory) return;


    chatHistory.innerHTML = "";


    const filteredChats =
        chats.filter(
            chat => {

                const title =
                    chat.title ||
                    "New Chat";

                return title
                    .toLowerCase()
                    .includes(
                        filter.toLowerCase()
                    );

            }
        );


    /* -----------------------------------------
       PINNED CHATS FIRST
    ----------------------------------------- */

    filteredChats.sort(
        (a, b) => {

            return (
                Number(
                    Boolean(
                        b.pinned
                    )
                ) -
                Number(
                    Boolean(
                        a.pinned
                    )
                )
            );

        }
    );


    filteredChats.forEach(
        chat => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "history-item";


            item.dataset.chatId =
                chat.id;


            /* =================================
               TITLE
            ================================= */

            const title =
                document.createElement(
                    "span"
                );


            title.className =
                "history-chat-title";


            title.textContent =
                chat.title ||
                "New Chat";


            /* =================================
               ACTIONS
            ================================= */

            const actions =
                document.createElement(
                    "div"
                );


            actions.className =
                "history-actions";


            /* =================================
               PIN BUTTON
            ================================= */

            const pinButton =
                document.createElement(
                    "button"
                );


            pinButton.type =
                "button";


            pinButton.className =
                "history-action-btn";


            pinButton.textContent =
                chat.pinned
                    ? "📌"
                    : "📍";


            pinButton.title =
                chat.pinned
                    ? "Unpin chat"
                    : "Pin chat";


            pinButton.addEventListener(
                "click",
                function(event) {

                    event.preventDefault();

                    event.stopPropagation();


                    toggleChatPin(
                        chat.id
                    );

                }
            );


            /* =================================
               DELETE BUTTON
            ================================= */

            const deleteButton =
                document.createElement(
                    "button"
                );


            deleteButton.type =
                "button";


            deleteButton.className =
                "history-action-btn";


            deleteButton.textContent =
                "🗑";


            deleteButton.title =
                "Delete chat";


            deleteButton.addEventListener(
                "click",
                function(event) {

                    event.preventDefault();

                    event.stopPropagation();


                    deleteChat(
                        chat.id
                    );

                }
            );


            actions.appendChild(
                pinButton
            );


            actions.appendChild(
                deleteButton
            );


            item.appendChild(
                title
            );


            item.appendChild(
                actions
            );


            /* =================================
               SELECT / OPEN CHAT
            ================================= */

            item.addEventListener(
                "click",
                function() {

                    if (
                        selectingChats
                    ) {

                        item.classList.toggle(
                            "selected"
                        );


                        item.dataset.selected =
                            item.classList.contains(
                                "selected"
                            )
                                ? "true"
                                : "false";


                        return;

                    }


                    currentChatId =
                        chat.id;


                    saveChats();


                    renderConversation();


                    if (
                        window.innerWidth <=
                        768
                    ) {

                        sidebar?.classList.remove(
                            "open"
                        );

                    }

                }
            );


            chatHistory.appendChild(
                item
            );

        }
    );

}


/* =====================================================
   MESSAGE SAVE
===================================================== */

function saveMessage(
    messageData
) {

    const exists =
        savedMessages.some(
            item =>
                item.chatId ===
                    messageData.chatId &&
                item.messageId ===
                    messageData.messageId
        );


    if (!exists) {

        savedMessages.push(
            messageData
        );


        saveSavedMessages();


        alert(
            "Message saved."
        );

    } else {

        savedMessages =
            savedMessages.filter(
                item =>
                    !(
                        item.chatId ===
                            messageData.chatId &&
                        item.messageId ===
                            messageData.messageId
                    )
            );


        saveSavedMessages();


        alert(
            "Message removed from saved."
        );

    }

}


/* =====================================================
   COPY MESSAGE
===================================================== */

async function copyMessage(
    text
) {

    try {

        await navigator.clipboard.writeText(
            text
        );


        alert(
            "Message copied."
        );


    } catch (error) {

        console.error(
            "Copy error:",
            error
        );


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


        alert(
            "Message copied."
        );

    }

}


/* =====================================================
   LIKE MESSAGE
===================================================== */

function toggleLike(
    chatId,
    messageId
) {

    const chat =
        chats.find(
            item =>
                item.id === chatId
        );


    if (!chat) return;


    const msg =
        chat.messages.find(
            item =>
                item.id === messageId
        );


    if (!msg) return;


    msg.liked =
        !Boolean(
            msg.liked
        );


    saveChats();


    renderConversation();

}


/* =====================================================
   CREATE ACTION BUTTON
===================================================== */

function createActionButton(
    text,
    title,
    clickHandler
) {

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.textContent =
        text;


    button.title =
        title;


    button.addEventListener(
        "click",
        function(event) {

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


    const chat =
        getCurrentChat();


    if (!chat) return;


    chat.messages.forEach(
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


    /* =========================================
       ROW
    ========================================= */

    const row =
        document.createElement(
            "div"
        );


    row.className =
        "message-row";


    /* =========================================
       CONTENT
    ========================================= */

    const content =
        document.createElement(
            "div"
        );


    content.className =
        "message-content";


    /* =========================================
       BUBBLE
    ========================================= */

    const bubble =
        document.createElement(
            "div"
        );


    bubble.className =
        "message-bubble";


    bubble.textContent =
        text;


    content.appendChild(
        bubble
    );


    /* =========================================
       SAVE / COPY / LIKE
    ========================================= */

    if (messageData) {

        const actions =
            document.createElement(
                "div"
            );


        actions.className =
            "message-actions";


        const saveBtn =
            createActionButton(
                "💾 Save",
                "Save message",
                function() {

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
                function() {

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

                function() {

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


    /* =========================================
       IMPORTANT
       
       NO PIN BUTTON
       NO DELETE BUTTON
       
       Pin/Delete are ONLY in sidebar.
    ========================================= */


    row.appendChild(
        content
    );


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
            false

    };


    chat.messages.push(
        newMessage
    );


    /* -----------------------------------------
       CHAT TITLE
    ----------------------------------------- */

    if (
        role === "user" &&
        chat.title === "New Chat"
    ) {

        chat.title =
            text.substring(
                0,
                30
            );

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
        document.createElement(
            "div"
        );


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

                    method:
                        "POST",

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


    message.addEventListener(
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

}


/* =====================================================
   PLUS MENU
===================================================== */

if (
    plusBtn &&
    plusMenu
) {

    plusBtn.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            event.stopPropagation();


            plusMenu.classList.toggle(
                "show"
            );

        }
    );


    plusMenu.addEventListener(
        "click",
        function(event) {

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
        function() {

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
        function() {

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
        function() {

            fileInput.click();

        }
    );

}


/* =====================================================
   PHOTO SELECTED
===================================================== */

photoInput.addEventListener(
    "change",
    function() {

        if (
            !this.files.length
        ) return;


        const file =
            this.files[0];


        addMessage(
            "user",
            "📷 Photo selected: " +
            file.name
        );


        plusMenu?.classList.remove(
            "show"
        );

    }
);


/* =====================================================
   VIDEO SELECTED
===================================================== */

videoInput.addEventListener(
    "change",
    function() {

        if (
            !this.files.length
        ) return;


        const file =
            this.files[0];


        addMessage(
            "user",
            "🎥 Video selected: " +
            file.name
        );


        plusMenu?.classList.remove(
            "show"
        );

    }
);


/* =====================================================
   FILE SELECTED
===================================================== */

fileInput.addEventListener(
    "change",
    function() {

        if (
            !this.files.length
        ) return;


        const file =
            this.files[0];


        addMessage(
            "user",
            "📎 File selected: " +
            file.name
        );


        plusMenu?.classList.remove(
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
        function() {

            const modal =
                document.getElementById(
                    "voiceModal"
                );


            if (modal) {

                modal.classList.add(
                    "show"
                );

            }


            plusMenu?.classList.remove(
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
    function() {

        plusMenu?.classList.remove(
            "show"
        );

    }
);


/* =====================================================
   SIDEBAR OPEN
===================================================== */

if (openSidebar) {

    openSidebar.addEventListener(
        "click",
        function() {

            sidebar?.classList.add(
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
        function() {

            sidebar?.classList.remove(
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
        function() {

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
        function() {

            renderHistory(
                this.value
            );

        }
    );

}


/* =====================================================
   MORE BUTTON
===================================================== */

if (
    moreBtn &&
    moreMenu
) {

    moreBtn.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            event.stopPropagation();


            moreMenu.classList.toggle(
                "show"
            );

        }
    );


    moreMenu.addEventListener(
        "click",
        function(event) {

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
        function() {

            const modal =
                document.getElementById(
                    "voiceModal"
                );


            if (modal) {

                modal.classList.add(
                    "show"
                );

            }


            moreMenu?.classList.remove(
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
        function() {

            const modal =
                document.getElementById(
                    "languageModal"
                );


            if (modal) {

                modal.classList.add(
                    "show"
                );

            }


            moreMenu?.classList.remove(
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
        function() {

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


            moreMenu?.classList.remove(
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
        function() {

            renderHistory();


            moreMenu?.classList.remove(
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
        function() {

            selectingChats =
                !selectingChats;


            moreMenu?.classList.remove(
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
        function() {

            const selectedItems =
                Array.from(
                    chatHistory?.querySelectorAll(
                        ".history-item.selected"
                    ) || []
                );


            if (
                selectedItems.length === 0
            ) {

                alert(
                    "Please select chats first."
                );

                return;

            }


            const selectedIds =
                selectedItems.map(
                    item =>
                        item.dataset.chatId
                );


            chats =
                chats.filter(
                    chat =>
                        !selectedIds.includes(
                            chat.id
                        )
                );


            /* --------------------------------
               REMOVE SAVED MESSAGES
            -------------------------------- */

            savedMessages =
                savedMessages.filter(
                    item =>
                        !selectedIds.includes(
                            item.chatId
                        )
                );


            /* --------------------------------
               CURRENT CHAT
            -------------------------------- */

            if (
                !getCurrentChat()
            ) {

                currentChatId =
                    chats.length > 0
                        ? chats[0].id
                        : null;

            }


            selectingChats =
                false;


            saveChats();

            saveSavedMessages();

            renderHistory();

            renderConversation();


            moreMenu?.classList.remove(
                "show"
            );

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
        function() {

            document
                .getElementById(
                    "voiceModal"
                )
                ?.classList.remove(
                    "show"
                );

        }
    );

}


if (closeLanguage) {

    closeLanguage.addEventListener(
        "click",
        function() {

            document
                .getElementById(
                    "languageModal"
                )
                ?.classList.remove(
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
        function() {

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
                function(event) {

                    if (!message) return;


                    message.value =
                        event
                            .results[0][0]
                            .transcript;

                };


            recognition.onerror =
                function(error) {

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
        async function() {

            const chat =
                getCurrentChat();


            if (!chat) return;


            const shareText =
                chat.messages
                    .map(
                        m =>
                            (
                                m.role ===
                                "user"
                                    ? "You: "
                                    : "Viggo AI: "
                            ) +
                            m.text
                    )
                    .join(
                        "\n\n"
                    );


            try {

                await navigator
                    .clipboard
                    .writeText(
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
    function() {

        moreMenu?.classList.remove(
            "show"
        );

    }
);


/* =====================================================
   OLD MESSAGE COMPATIBILITY
===================================================== */

chats.forEach(
    chat => {

        if (
            typeof chat.pinned !==
            "boolean"
        ) {

            chat.pinned =
                false;

        }


        chat.messages.forEach(
            msg => {

                if (!msg.id) {

                    msg.id =
                        Date.now()
                            .toString() +
                        "-" +
                        Math.random()
                            .toString(36)
                            .substring(2, 8);

                }


                if (
                    typeof msg.liked !==
                    "boolean"
                ) {

                    msg.liked =
                        false;

                }

            }
        );

    }
);


/* =====================================================
   INITIALIZE
===================================================== */

if (
    !currentChatId ||
    !getCurrentChat()
) {

    if (
        chats.length === 0
    ) {

        createChat();

    } else {

        currentChatId =
            chats[0].id;

        saveChats();

    }

}


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
