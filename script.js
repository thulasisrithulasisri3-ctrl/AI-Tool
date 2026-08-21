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
    JSON.parse(localStorage.getItem("viggoChats") || "[]");

let currentChatId =
    localStorage.getItem("viggoCurrentChatId");

let selectingChats = false;


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
                    item.style.background =
                        "#14284a";
                }
            );

            item.addEventListener(
                "mouseleave",
                () => {
                    item.style.background =
                        "transparent";
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

                    currentChatId = chat.id;

                    saveChats();

                    renderConversation();

                    if (window.innerWidth <= 768) {

                        sidebar.classList.remove("open");

                    }

                }
            );


            chatHistory.appendChild(item);

        });

}


/* =====================================================
   RENDER CONVERSATION
===================================================== */

function renderConversation() {

    if (!conversation) return;

    conversation.innerHTML = "";

    const chat = getCurrentChat();

    if (!chat) return;

    chat.messages.forEach(
        msg => addMessageToUI(
            msg.role,
            msg.text
        )
    );

}


/* =====================================================
   ADD MESSAGE UI
===================================================== */

function addMessageToUI(role, text) {

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "message " +
        (role === "user" ? "user" : "ai");


    const bubble =
        document.createElement("div");

    bubble.className =
        "message-bubble";

    bubble.textContent = text;


    wrapper.appendChild(bubble);

    conversation.appendChild(wrapper);

    conversation.scrollTop =
        conversation.scrollHeight;

}


/* =====================================================
   ADD MESSAGE
===================================================== */

function addMessage(role, text) {

    ensureChat();

    const chat = getCurrentChat();

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
            text.substring(0, 30);

    }


    saveChats();

    addMessageToUI(role, text);

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

    message.style.height = "auto";


    const loading =
        document.createElement("div");

    loading.className =
        "message ai";

    loading.innerHTML =
        '<div class="message-bubble">Thinking...</div>';

    conversation.appendChild(loading);

    conversation.scrollTop =
        conversation.scrollHeight;


    try {

        const response =
            await fetch(API_URL, {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify({

                    message: text,

                    chatId: currentChatId

                })

            });


        if (!response.ok) {

            throw new Error(
                "HTTP " + response.status
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

            this.style.height = "auto";

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

            saveChats();

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

            const selected =
                Array.from(
                    chatHistory.children
                );

            selected.forEach(
                (item, index) => {

                    if (
                        item.dataset.selected ===
                        "true"
                    ) {

                        const chat =
                            chats[index];

                        if (chat) {

                            chats =
                                chats.filter(
                                    c =>
                                        c.id !==
                                        chat.id
                                );

                        }

                    }

                }
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

            recognition.lang = "en-IN";

            recognition.interimResults = false;

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

if (!currentChatId || !getCurrentChat()) {

    if (chats.length === 0) {

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
    "Viggo AI script loaded successfully."
);

console.log(
    "API:",
    API_URL
);
