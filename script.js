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

document.body.appendChild(photoInput);


const videoInput =
    document.createElement("input");

videoInput.type = "file";
videoInput.accept = "video/*";
videoInput.style.display = "none";

document.body.appendChild(videoInput);


const fileInput =
    document.createElement("input");

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
    localStorage.getItem(
        "viggoCurrentChatId"
    );

let selectingChats = false;

let pinnedChats =
    JSON.parse(
        localStorage.getItem("viggoPinnedChats") || "[]"
    );


/* =====================================================
   SAVE CHAT DATA
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

    localStorage.setItem(
        "viggoPinnedChats",
        JSON.stringify(pinnedChats)
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

    if (message) {

        message.focus();

    }
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
   PIN CHAT
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
   DELETE ONE CHAT
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
            pinnedId =>
                String(pinnedId) !== id
        );

    if (
        String(currentChatId) === id
    ) {

        currentChatId =
            chats[0]?.id || null;

    }

    saveChats();

    renderHistory(
        searchChat?.value || ""
    );

    renderConversation();

}


/* =====================================================
   RENDER HISTORY
===================================================== */

function renderHistory(filter = "") {

    if (!chatHistory) return;

    chatHistory.innerHTML = "";

    const search =
        String(filter)
            .toLowerCase()
            .trim();


    const filtered =
        chats.filter(chat =>
            String(
                chat.title || "New Chat"
            )
            .toLowerCase()
            .includes(search)
        );


    /* =========================================
       PINNED FIRST
    ========================================= */

    filtered.sort(
        (a, b) => {

            const aPinned =
                pinnedChats.includes(
                    String(a.id)
                );

            const bPinned =
                pinnedChats.includes(
                    String(b.id)
                );

            if (aPinned && !bPinned) {
                return -1;
            }

            if (!aPinned && bPinned) {
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

            /* =================================
               HISTORY ITEM
            ================================= */

            const item =
                document.createElement("div");

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


            if (
                selectingChats
            ) {

                item.classList.add(
                    "select-mode"
                );

            }


            /* =================================
               TITLE
            ================================= */

            const title =
                document.createElement("div");

            title.className =
                "history-chat-title";

            title.textContent =
                chat.title ||
                "New Chat";


            /* =================================
               ACTIONS
            ================================= */

            const actions =
                document.createElement("div");

            actions.className =
                "history-actions";


            /* =================================
               SELECT CHECKBOX
            ================================= */

            if (selectingChats) {

                const check =
                    document.createElement("button");

                check.type = "button";

                check.className =
                    "history-action-btn select-btn";

                check.textContent =
                    chat.selected
                        ? "☑"
                        : "☐";

                check.title =
                    "Select chat";

                check.addEventListener(
                    "click",
                    function(event) {

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


            /* =================================
               PIN
            ================================= */

            const pinBtn =
                document.createElement("button");

            pinBtn.type = "button";

            pinBtn.className =
                "history-action-btn";

            const isPinned =
                pinnedChats.includes(
                    String(chat.id)
                );

            pinBtn.textContent =
                isPinned
                    ? "📍"
                    : "📌";

            pinBtn.title =
                isPinned
                    ? "Unpin"
                    : "Pin";

            pinBtn.addEventListener(
                "click",
                function(event) {

                    event.stopPropagation();

                    togglePinChat(
                        chat.id
                    );

                }
            );

            actions.appendChild(
                pinBtn
            );


            /* =================================
               DELETE
            ================================= */

            const deleteBtn =
                document.createElement("button");

            deleteBtn.type = "button";

            deleteBtn.className =
                "history-action-btn";

            deleteBtn.textContent =
                "🗑️";

            deleteBtn.title =
                "Delete chat";

            deleteBtn.addEventListener(
                "click",
                function(event) {

                    event.stopPropagation();

                    deleteChat(
                        chat.id
                    );

                }
            );

            actions.appendChild(
                deleteBtn
            );


            /* =================================
               ADD TO ITEM
            ================================= */

            item.appendChild(title);

            item.appendChild(actions);


            /* =================================
               OPEN CHAT
            ================================= */

            item.addEventListener(
                "click",
                function() {

                    if (
                        selectingChats
                    ) {

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
   ADD MESSAGE UI
===================================================== */

function addMessageToUI(
    role,
    text,
    messageIndex = null
) {

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "message " +
        (
            role === "user"
                ? "user"
                : "ai"
        );


    /* =========================================
       CONTENT
    ========================================= */

    const content =
        document.createElement("div");

    content.className =
        "message-content";


    /* =========================================
       BUBBLE
    ========================================= */

    const bubble =
        document.createElement("div");

    bubble.className =
        "message-bubble";

    bubble.textContent =
        text;


    content.appendChild(
        bubble
    );


    /* =========================================
       SAVE / COPY / LIKE / SPEAKER
       BELOW MESSAGE ONLY
    ========================================= */

    const actions =
        document.createElement("div");

    actions.className =
        "message-actions";


    /* SAVE */

    const saveBtn =
        document.createElement("button");

    saveBtn.type = "button";

    saveBtn.textContent =
        "💾 Save";

    saveBtn.title =
        "Save message";

    saveBtn.addEventListener(
        "click",
        function() {

            localStorage.setItem(
                "viggoSavedMessage",
                text
            );

            alert(
                "Message saved."
            );

        }
    );


    /* COPY */

    const copyBtn =
        document.createElement("button");

    copyBtn.type = "button";

    copyBtn.textContent =
        "📋 Copy";

    copyBtn.title =
        "Copy message";

    copyBtn.addEventListener(
        "click",
        async function() {

            try {

                await navigator.clipboard.writeText(
                    text
                );

                copyBtn.textContent =
                    "✓ Copied";

                setTimeout(
                    () => {

                        copyBtn.textContent =
                            "📋 Copy";

                    },
                    1200
                );

            } catch (error) {

                console.error(
                    error
                );

            }

        }
    );


    /* LIKE */

    const likeBtn =
        document.createElement("button");

    likeBtn.type = "button";

    likeBtn.textContent =
        "👍 Like";

    likeBtn.title =
        "Like message";

    likeBtn.addEventListener(
        "click",
        function() {

            likeBtn.textContent =
                likeBtn.textContent ===
                "👍 Like"
                    ? "👍 Liked"
                    : "👍 Like";

        }
    );


    /* =================================================
       SPEAKER
    ================================================= */

    const speakerBtn =
        document.createElement("button");

    speakerBtn.type = "button";

    speakerBtn.textContent =
        "🔊 Speaker";

    speakerBtn.title =
        "Read message aloud";

    speakerBtn.addEventListener(
        "click",
        function() {

            if (
                "speechSynthesis" in window
            ) {

                window.speechSynthesis.cancel();

                const speech =
                    new SpeechSynthesisUtterance(
                        text
                    );

                speech.lang =
                    "en-IN";

                speech.rate =
                    1;

                speech.pitch =
                    1;

                window.speechSynthesis.speak(
                    speech
                );

            } else {

                alert(
                    "Speaker is not supported in this browser."
                );

            }

        }
    );


    /* =================================================
       BUTTON ORDER
    ================================================= */

    actions.appendChild(
        saveBtn
    );

    actions.appendChild(
        copyBtn
    );

    actions.appendChild(
        likeBtn
    );

    actions.appendChild(
        speakerBtn
    );


    content.appendChild(
        actions
    );


    wrapper.appendChild(
        content
    );


    conversation.appendChild(
        wrapper
    );


    conversation.scrollTop =
        conversation.scrollHeight;
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
        (msg, index) => {

            addMessageToUI(
                msg.role,
                msg.text,
                index
            );

        }
    );

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


    chat.messages.push({

        role: role,

        text: text,

        time: Date.now()

    });


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
        text
    );

    renderHistory();

}


/* =====================================================
   SEND MESSAGE
===================================================== */

async function sendMessage() {

    if (!message)
