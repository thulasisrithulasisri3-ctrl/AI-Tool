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
       SAVE / COPY / LIKE
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
        `
        <div class="message-content">
            <div class="message-bubble">
                Thinking...
            </div>
        </div>
        `;

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

                            message: text,

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

send?.addEventListener(
    "click",
    sendMessage
);


/* =====================================================
   ENTER
===================================================== */

message?.addEventListener(
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


message?.addEventListener(
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


/* =====================================================
   PLUS MENU
===================================================== */

plusBtn?.addEventListener(
    "click",
    function(event) {

        event.preventDefault();

        event.stopPropagation();

        if (!plusMenu) return;

        plusMenu.classList.toggle(
            "show"
        );

    }
);


plusMenu?.addEventListener(
    "click",
    function(event) {

        event.stopPropagation();

    }
);


/* =====================================================
   PHOTO BUTTON
===================================================== */

const photoBtn =
    plusMenu?.querySelector(
        "button:nth-child(1)"
    );

photoBtn?.addEventListener(
    "click",
    function() {

        photoInput.click();

    }
);


/* =====================================================
   VIDEO BUTTON
===================================================== */

const videoBtn =
    plusMenu?.querySelector(
        "button:nth-child(2)"
    );

videoBtn?.addEventListener(
    "click",
    function() {

        videoInput.click();

    }
);


/* =====================================================
   FILE BUTTON
===================================================== */

const fileBtn =
    plusMenu?.querySelector(
        "button:nth-child(3)"
    );

fileBtn?.addEventListener(
    "click",
    function() {

        fileInput.click();

    }
);


/* =====================================================
   PLUS VOICE
===================================================== */

plusVoiceBtn?.addEventListener(
    "click",
    function() {

        const modal =
            document.getElementById(
                "voiceModal"
            );

        modal?.classList.add(
            "show"
        );

        plusMenu?.classList.remove(
            "show"
        );

    }
);


/* =====================================================
   PHOTO SELECTED
===================================================== */

photoInput.addEventListener(
    "change",
    function() {

        if (!this.files.length) return;

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

        this.value = "";

    }
);


/* =====================================================
   VIDEO SELECTED
===================================================== */

videoInput.addEventListener(
    "change",
    function() {

        if (!this.files.length) return;

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

        this.value = "";

    }
);


/* =====================================================
   FILE SELECTED
===================================================== */

fileInput.addEventListener(
    "change",
    function() {

        if (!this.files.length) return;

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

        this.value = "";

    }
);


/* =====================================================
   CLOSE PLUS / MORE OUTSIDE
===================================================== */

document.addEventListener(
    "click",
    function() {

        plusMenu?.classList.remove(
            "show"
        );

        moreMenu?.classList.remove(
            "show"
        );

    }
);


/* =====================================================
   SIDEBAR OPEN
===================================================== */

openSidebar?.addEventListener(
    "click",
    function(event) {

        event.stopPropagation();

        sidebar?.classList.add(
            "open"
        );

    }
);


/* =====================================================
   SIDEBAR CLOSE
===================================================== */

closeSidebar?.addEventListener(
    "click",
    function() {

        sidebar?.classList.remove(
            "open"
        );

    }
);


/* =====================================================
   NEW CHAT
===================================================== */

newChat?.addEventListener(
    "click",
    function() {

        createChat();

    }
);


/* =====================================================
   SEARCH
===================================================== */

searchChat?.addEventListener(
    "input",
    function() {

        renderHistory(
            this.value
        );

    }
);


/* =====================================================
   MORE BUTTON
===================================================== */

moreBtn?.addEventListener(
    "click",
    function(event) {

        event.preventDefault();

        event.stopPropagation();

        moreMenu?.classList.toggle(
            "show"
        );

    }
);


/* =====================================================
   MORE MENU
===================================================== */

moreMenu?.addEventListener(
    "click",
    function(event) {

        event.stopPropagation();

    }
);


/* =====================================================
   VOICE MENU
===================================================== */

voiceMenuBtn?.addEventListener(
    "click",
    function() {

        const modal =
            document.getElementById(
                "voiceModal"
            );

        modal?.classList.add(
            "show"
        );

        moreMenu?.classList.remove(
            "show"
        );

    }
);


/* =====================================================
   LANGUAGE
===================================================== */

languageBtn?.addEventListener(
    "click",
    function() {

        const modal =
            document.getElementById(
                "languageModal"
            );

        modal?.classList.add(
            "show"
        );

        moreMenu?.classList.remove(
            "show"
        );

    }
);


/* =====================================================
   CLEAR CURRENT CHAT
===================================================== */

clearChatBtn?.addEventListener(
    "click",
    function() {

        const chat =
            getCurrentChat();

        if (!chat) return;

        chat.messages = [];

        saveChats();

        renderConversation();

        moreMenu?.classList.remove(
            "show"
        );

    }
);


/* =====================================================
   SAVED CHATS
===================================================== */

savedChatsBtn?.addEventListener(
    "click",
    function() {

        renderHistory();

        moreMenu?.classList.remove(
            "show"
        );

    }
);


/* =====================================================
   SELECT CHATS
===================================================== */

selectChatsBtn?.addEventListener(
    "click",
    function() {

        selectingChats =
            !selectingChats;


        if (!selectingChats) {

            chats.forEach(
                chat => {

                    chat.selected =
                        false;

                }
            );

        }


        renderHistory(
            searchChat?.value || ""
        );


        moreMenu?.classList.remove(
            "show"
        );

    }
);


/* =====================================================
   DELETE SELECTED
===================================================== */

deleteSelectedBtn?.addEventListener(
    "click",
    function() {

        if (!selectingChats) {

            alert(
                "First select chats."
            );

            return;

        }


        const selectedIds =
            chats
                .filter(
                    chat =>
                        chat.selected ===
                        true
                )
                .map(
                    chat =>
                        String(chat.id)
                );


        if (
            selectedIds.length === 0
        ) {

            alert(
                "No chats selected."
            );

            return;

        }


        chats =
            chats.filter(
                chat =>
                    !selectedIds.includes(
                        String(chat.id)
                    )
            );


        pinnedChats =
            pinnedChats.filter(
                id =>
                    !selectedIds.includes(
                        String(id)
                    )
            );


        if (
            !getCurrentChat()
        ) {

            currentChatId =
                chats[0]?.id || null;

        }


        chats.forEach(
            chat => {

                chat.selected =
                    false;

            }
        );


        selectingChats =
            false;


        saveChats();

        renderHistory();

        renderConversation();

        moreMenu?.classList.remove(
            "show"
        );

    }
);


/* =====================================================
   CLOSE VOICE
===================================================== */

const closeVoice =
    document.getElementById(
        "closeVoice"
    );

closeVoice?.addEventListener(
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


/* =====================================================
   CLOSE LANGUAGE
===================================================== */

const closeLanguage =
    document.getElementById(
        "closeLanguage"
    );

closeLanguage?.addEventListener(
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


/* =====================================================
   MICROPHONE
===================================================== */

mic?.addEventListener(
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


        recognition.onresult =
            function(event) {

                message.value =
                    event.results[0][0]
                        .transcript;

                message.dispatchEvent(
                    new Event("input")
                );

            };


        recognition.onerror =
            function(error) {

                console.error(
                    "Voice error:",
                    error
                );

            };


        recognition.start();

    }
);


/* =====================================================
   SHARE
===================================================== */

shareBtn?.addEventListener(
    "click",
    async function() {

        const chat =
            getCurrentChat();

        if (
            !chat ||
            chat.messages.length === 0
        ) {

            alert(
                "No messages to share."
            );

            return;

        }


        try {

            const response =
                await fetch(
                    API_URL.replace(
                        "/chat",
                        "/share"
                    ),
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                chat: chat
                            })

                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Share HTTP " +
                    response.status
                );

            }


            const data =
                await response.json();


            if (
                data.success &&
                data.url
            ) {

                await navigator.clipboard.writeText(
                    data.url
                );

                alert(
                    "Share link copied!"
                );

            } else {

                throw new Error(
                    "Share link not created"
                );

            }

        } catch (error) {

            console.error(
                "Share error:",
                error
            );

            alert(
                "Could not create share link."
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


renderHistory();

renderConversation();


console.log(
    "================================="
);

console.log(
    "Viggo AI script loaded successfully."
);

console.log(
    "API:",
    API_URL
);

console.log(
    "================================="
);
