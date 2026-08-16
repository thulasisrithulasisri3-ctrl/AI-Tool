// ======================================================
// VIGGO AI - SCRIPT.JS
// ======================================================

const API_URL =
    "https://ai-tool-1-fgmc.onrender.com";


// ======================================================
// ELEMENTS
// ======================================================

const sidebar =
    document.getElementById("sidebar");

const conversation =
    document.getElementById("conversation");

const messageInput =
    document.getElementById("message");

const sendButton =
    document.getElementById("send");

const micButton =
    document.getElementById("mic");

const currentTitle =
    document.getElementById("currentTitle");

const newChatButton =
    document.getElementById("newChat");

const pinnedList =
    document.getElementById("pinnedList");

const recentList =
    document.getElementById("recentList");

const moreButton =
    document.getElementById("moreButton");

const moreMenu =
    document.getElementById("moreMenu");

const saveButton =
    document.getElementById("saveButton");

const historyButton =
    document.getElementById("historyButton");

const clearHistoryButton =
    document.getElementById("clearHistory");

const shareChatButton =
    document.getElementById("shareChat");

const historyModal =
    document.getElementById("historyModal");

const historyList =
    document.getElementById("historyList");

const closeHistory =
    document.getElementById("closeHistory");

const globalVoiceToggle =
    document.getElementById(
        "globalVoiceToggle"
    );

const mobileMenu =
    document.getElementById("mobileMenu");


// ======================================================
// VARIABLES
// ======================================================

let chatMessages = [];

let currentChatId =
    Date.now().toString();

let voiceEnabled = true;

let recognition = null;

let voices = [];


// ======================================================
// TOAST
// ======================================================

function toast(message) {

    const element =
        document.getElementById(
            "viggoToast"
        );

    if (!element) return;

    element.textContent =
        message;

    element.style.display =
        "block";

    clearTimeout(
        element.timer
    );

    element.timer =
        setTimeout(() => {

            element.style.display =
                "none";

        }, 1600);
}


// ======================================================
// ESCAPE
// ======================================================

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text;

    return div.innerHTML;
}


// ======================================================
// SCROLL
// ======================================================

function scrollBottom() {

    const area =
        document.getElementById(
            "chatArea"
        );

    if (!area) return;

    setTimeout(() => {

        area.scrollTop =
            area.scrollHeight;

    }, 50);
}


// ======================================================
// REMOVE WELCOME
// ======================================================

function removeWelcome() {

    const welcome =
        document.querySelector(
            ".welcome"
        );

    if (welcome) {
        welcome.remove();
    }
}


// ======================================================
// ADD MESSAGE
// ======================================================

function addMessage(
    role,
    text,
    saveMemory = true
) {

    removeWelcome();


    const message =
        document.createElement("div");

    message.className =
        "message " + role;


    const avatar =
        document.createElement("div");

    avatar.className =
        "avatar";

    avatar.textContent =
        role === "user"
            ? "U"
            : "B";


    const content =
        document.createElement("div");

    content.className =
        "message-content";


    const name =
        document.createElement("div");

    name.className =
        "message-name";

    name.textContent =
        role === "user"
            ? "You"
            : "Viggo";


    const textElement =
        document.createElement("div");

    textElement.className =
        "message-text";

    textElement.textContent =
        text;


    content.appendChild(
        name
    );

    content.appendChild(
        textElement
    );


    // ==================================================
    // AI ACTIONS
    // ==================================================

    if (role === "ai") {

        const actions =
            document.createElement("div");

        actions.className =
            "message-actions";


        // COPY

        const copy =
            document.createElement("button");

        copy.className =
            "msg-btn";

        copy.textContent =
            "📋 Copy";

        copy.onclick =
            async () => {

                try {

                    await navigator
                        .clipboard
                        .writeText(text);

                    copy.textContent =
                        "✓ Copied";

                    setTimeout(() => {

                        copy.textContent =
                            "📋 Copy";

                    }, 1200);

                } catch {}

            };


        // SPEAK

        const speak =
            document.createElement("button");

        speak.className =
            "msg-btn";

        speak.textContent =
            "🔊 Speak";

        speak.onclick =
            () => {

                if (
                    speechSynthesis.speaking
                ) {

                    speechSynthesis.cancel();

                    speak.textContent =
                        "🔊 Speak";

                } else {

                    speakText(text);

                    speak.textContent =
                        "🔇 Stop";

                }

            };


        // LIKE

        const like =
            document.createElement("button");

        like.className =
            "msg-btn";

        like.textContent =
            "👍";

        like.onclick =
            () => {

                like.classList.toggle(
                    "active"
                );

                dislike.classList.remove(
                    "active"
                );

            };


        // DISLIKE

        const dislike =
            document.createElement("button");

        dislike.className =
            "msg-btn";

        dislike.textContent =
            "👎";

        dislike.onclick =
            () => {

                dislike.classList.toggle(
                    "active"
                );

                like.classList.remove(
                    "active"
                );

            };


        actions.appendChild(copy);
        actions.appendChild(speak);
        actions.appendChild(like);
        actions.appendChild(dislike);

        content.appendChild(actions);


        // ==================================================
        // VOICE CONTROL UNDER ANSWER
        // ==================================================

        const voiceControl =
            document.createElement("div");

        voiceControl.className =
            "message-voice-control";


        const voiceButton =
            document.createElement("button");

        voiceButton.className =
            "message-voice-btn";


        voiceButton.textContent =
            voiceEnabled
                ? "🔊 Voice ON"
                : "🔇 Voice OFF";


        voiceButton.onclick =
            () => {

                voiceEnabled =
                    !voiceEnabled;


                if (!voiceEnabled) {

                    speechSynthesis.cancel();

                }


                updateVoiceButtons();


                voiceButton.textContent =
                    voiceEnabled
                        ? "🔊 Voice ON"
                        : "🔇 Voice OFF";

            };


        voiceControl.appendChild(
            voiceButton
        );

        content.appendChild(
            voiceControl
        );
    }


    message.appendChild(
        avatar
    );

    message.appendChild(
        content
    );

    conversation.appendChild(
        message
    );


    scrollBottom();


    if (saveMemory) {

        chatMessages.push({

            role,
            content: text

        });

    }
}


// ======================================================
// UPDATE VOICE BUTTONS
// ======================================================

function updateVoiceButtons() {

    if (!globalVoiceToggle) {
        return;
    }

    globalVoiceToggle.textContent =
        voiceEnabled
            ? "🔊 Voice ON"
            : "🔇 Voice OFF";
}


// ======================================================
// VOICE ON / OFF
// ======================================================

if (globalVoiceToggle) {

    globalVoiceToggle.onclick =
        () => {

            voiceEnabled =
                !voiceEnabled;


            if (!voiceEnabled) {

                speechSynthesis.cancel();

            }


            updateVoiceButtons();


            document
                .querySelectorAll(
                    ".message-voice-btn"
                )
                .forEach(button => {

                    button.textContent =
                        voiceEnabled
                            ? "🔊 Voice ON"
                            : "🔇 Voice OFF";

                });

        };
}


// ======================================================
// SPEECH
// ======================================================

function loadVoices() {

    voices =
        speechSynthesis.getVoices();
}


if (
    "speechSynthesis" in window
) {

    speechSynthesis.onvoiceschanged =
        loadVoices;

    loadVoices();

}


function speakText(text) {

    if (
        !("speechSynthesis" in window)
    ) {

        return;
    }


    speechSynthesis.cancel();


    const utterance =
        new SpeechSynthesisUtterance(
            text
        );


    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;


    speechSynthesis.speak(
        utterance
    );
}


// ======================================================
// SEND MESSAGE
// ======================================================

async function sendMessage() {

    const text =
        messageInput.value.trim();


    if (!text) {
        return;
    }


    addMessage(
        "user",
        text
    );


    messageInput.value =
        "";

    messageInput.style.height =
        "auto";


    sendButton.disabled =
        true;


    if (
        chatMessages.length === 1
    ) {

        currentTitle.textContent =
            text.length > 35
                ? text.substring(0, 35) + "..."
                : text;

    }


    // ==================================================
    // LOADING
    // ==================================================

    const loading =
        document.createElement("div");

    loading.className =
        "message ai";

    loading.innerHTML = `

        <div class="avatar">
            B
        </div>

        <div class="message-content">

            <div class="message-name">
                Viggo
            </div>

            <div class="message-text">
                Thinking...
            </div>

        </div>

    `;

    conversation.appendChild(
        loading
    );

    scrollBottom();


    try {

        const response =
            await fetch(
                API_URL + "/api/chat",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            message: text,

                            history:
                                chatMessages

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


        loading.remove();


        const reply =
            data.reply ||
            "Viggo could not generate a response.";


        addMessage(
            "ai",
            reply
        );


        if (voiceEnabled) {

            speakText(reply);

        }


        saveCurrentChat();


    } catch (error) {

        console.error(error);


        loading.remove();


        addMessage(
            "ai",
            "Viggo server is not connected. Please start the server and try again."
        );

    }


    sendButton.disabled =
        false;
}


// ======================================================
// SEND
// ======================================================

sendButton.addEventListener(
    "click",
    sendMessage
);


// ======================================================
// ENTER
// ======================================================

messageInput.addEventListener(
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


// ======================================================
// TEXTAREA SIZE
// ======================================================

messageInput.addEventListener(
    "input",
    function () {

        this.style.height =
            "auto";

        this.style.height =
            Math.min(
                this.scrollHeight,
                150
            ) + "px";

    }
);


// ======================================================
// MICROPHONE
// ======================================================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


if (SpeechRecognition) {

    recognition =
        new SpeechRecognition();


    recognition.lang =
        "en-IN";

    recognition.continuous =
        false;

    recognition.interimResults =
        false;


    micButton.onclick =
        () => {

            try {

                recognition.start();

                micButton.classList.add(
                    "listening"
                );

                micButton.textContent =
                    "🔴";

            } catch {}

        };


    recognition.onresult =
        event => {

            messageInput.value =
                event.results[0][0]
                    .transcript;


            messageInput.dispatchEvent(
                new Event("input")
            );

        };


    recognition.onend =
        () => {

            micButton.classList.remove(
                "listening"
            );

            micButton.textContent =
                "🎤";

        };


    recognition.onerror =
        () => {

            micButton.classList.remove(
                "listening"
            );

            micButton.textContent =
                "🎤";

        };

} else {

    micButton.onclick =
        () => {};

}


// ======================================================
// MORE MENU
// ======================================================

moreButton.addEventListener(
    "click",
    event => {

        event.stopPropagation();

        moreMenu.classList.toggle(
            "show"
        );

    }
);


document.addEventListener(
    "click",
    event => {

        if (
            !moreMenu.contains(event.target) &&
            event.target !== moreButton
        ) {

            moreMenu.classList.remove(
                "show"
            );

        }

    }
);


// ======================================================
// SAVE CHAT
// ======================================================

function saveCurrentChat() {

    if (
        chatMessages.length === 0
    ) {

        return;
    }


    let chats =
        JSON.parse(
            localStorage.getItem(
                "viggoChats"
            ) || "[]"
        );


    const old =
        chats.find(
            chat =>
                chat.id ===
                currentChatId
        );


    const firstUser =
        chatMessages.find(
            item =>
                item.role === "user"
        );


    const chat = {

        id:
            currentChatId,

        title:
            firstUser
                ? firstUser.content.substring(
                    0,
                    45
                )
                : "New Chat",

        messages:
            chatMessages,

        time:
            new Date().toLocaleString(),

        pinned:
            old
                ? old.pinned
                : false

    };


    const index =
        chats.findIndex(
            chat =>
                chat.id ===
                currentChatId
        );


    if (index >= 0) {

        chats[index] =
            chat;

    } else {

        chats.unshift(
            chat
        );

    }


    localStorage.setItem(
        "viggoChats",
        JSON.stringify(chats)
    );


    renderSidebar();
}


saveButton.addEventListener(
    "click",
    () => {

        saveCurrentChat();

        moreMenu.classList.remove(
            "show"
        );

    }
);


// ======================================================
// SIDEBAR
// ======================================================

function renderSidebar() {

    const chats =
        JSON.parse(
            localStorage.getItem(
                "viggoChats"
            ) || "[]"
        );


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


    renderChatList(
        pinnedList,
        pinned
    );

    renderChatList(
        recentList,
        recent
    );
}


// ======================================================
// CHAT LIST
// ======================================================

function renderChatList(
    container,
    chats
) {

    container.innerHTML =
        "";


    if (
        chats.length === 0
    ) {

        const empty =
            document.createElement("div");

        empty.className =
            "empty-sidebar";

        empty.textContent =
            "No chats";

        container.appendChild(
            empty
        );

        return;
    }


    chats.forEach(
        chat => {

            const row =
                document.createElement("div");

            row.className =
                "chat-row";


            const button =
                document.createElement("button");

            button.className =
                "chat-item";


            if (
                chat.id ===
                currentChatId
            ) {

                button.classList.add(
                    "active"
                );

            }


            button.innerHTML =
                `
                <span class="chat-item-title">
                    ${escapeHtml(chat.title)}
                </span>
                `;


            button.onclick =
                () => {

                    loadChat(
                        chat.id
                    );

                };


            // PIN

            const pin =
                document.createElement("button");

            pin.className =
                "small-action";

            pin.textContent =
                chat.pinned
                    ? "📌"
                    : "📍";

            pin.title =
                chat.pinned
                    ? "Unpin"
                    : "Pin";


            pin.onclick =
                event => {

                    event.stopPropagation();

                    togglePin(
                        chat.id
                    );

                };


            // DELETE

            const del =
                document.createElement("button");

            del.className =
                "small-action delete-action";

            del.textContent =
                "🗑";

            del.title =
                "Delete";


            del.onclick =
                event => {

                    event.stopPropagation();

                    deleteChat(
                        chat.id
                    );

                };


            row.appendChild(
                button
            );

            row.appendChild(
                pin
            );

            row.appendChild(
                del
            );


            container.appendChild(
                row
            );

        }
    );
}


// ======================================================
// PIN
// ======================================================

function togglePin(id) {

    let chats =
        JSON.parse(
            localStorage.getItem(
                "viggoChats"
            ) || "[]"
        );


    const chat =
        chats.find(
            item =>
                item.id === id
        );


    if (!chat) {
        return;
    }


    chat.pinned =
        !chat.pinned;


    localStorage.setItem(
        "viggoChats",
        JSON.stringify(chats)
    );


    renderSidebar();

    renderHistory();
}


// ======================================================
// DELETE - NO CONFIRMATION
// ======================================================

function deleteChat(id) {

    let chats =
        JSON.parse(
            localStorage.getItem(
                "viggoChats"
            ) || "[]"
        );


    chats =
        chats.filter(
            chat =>
                chat.id !== id
        );


    localStorage.setItem(
        "viggoChats",
        JSON.stringify(chats)
    );


    if (
        currentChatId === id
    ) {

        startNewChat();

    }


    renderSidebar();

    renderHistory();
}


// ======================================================
// LOAD CHAT
// ======================================================

function loadChat(id) {

    const chats =
        JSON.parse(
            localStorage.getItem(
                "viggoChats"
            ) || "[]"
        );


    const chat =
        chats.find(
            item =>
                item.id === id
        );


    if (!chat) {
        return;
    }


    currentChatId =
        chat.id;


    chatMessages =
        [];


    conversation.innerHTML =
        "";


    chat.messages.forEach(
        item => {

            addMessage(
                item.role,
                item.content
            );

        }
    );


    currentTitle.textContent =
        chat.title;


    renderSidebar();


    historyModal.style.display =
        "none";


    if (sidebar) {

        sidebar.classList.remove(
            "open"
        );

    }

}


// ======================================================
// NEW CHAT
// ======================================================

function startNewChat() {

    speechSynthesis.cancel();


    currentChatId =
        Date.now().toString();


    chatMessages =
        [];


    currentTitle.textContent =
        "New Chat";


    conversation.innerHTML = `

        <div class="welcome">

            <div>

                <div class="welcome-b">
                    B
                </div>

                <h1>
                    Welcome to Viggo
                </h1>

                <p>
                    Your AI assistant is ready.
                </p>

            </div>

        </div>

    `;


    messageInput.value =
        "";

    messageInput.style.height =
        "auto";


    renderSidebar();
}


newChatButton.addEventListener(
    "click",
    startNewChat
);


// ======================================================
// HISTORY
// ======================================================

historyButton.addEventListener(
    "click",
    () => {

        renderHistory();

        historyModal.style.display =
            "block";

        moreMenu.classList.remove(
            "show"
        );

    }
);


// ======================================================
// RENDER HISTORY
// ======================================================

function renderHistory() {

    historyList.innerHTML =
        "";


    const chats =
        JSON.parse(
            localStorage.getItem(
                "viggoChats"
            ) || "[]"
        );


    if (
        chats.length === 0
    ) {

        historyList.innerHTML = `

            <div style="
                text-align:center;
                padding:40px;
                color:#66819c;
            ">
                No saved chats yet.
            </div>

        `;

        return;
    }


    chats.forEach(
        chat => {

            const card =
                document.createElement("div");

            card.className =
                "history-card";


            if (chat.pinned) {

                card.classList.add(
                    "pinned"
                );

            }


            card.innerHTML = `

                <div class="history-card-title">
                    ${chat.pinned ? "📌 " : ""}
                    ${escapeHtml(chat.title)}
                </div>

                <div class="history-card-time">
                    ${escapeHtml(chat.time || "")}
                </div>

            `;


            const actions =
                document.createElement("div");

            actions.className =
                "history-card-actions";


            // OPEN

            const open =
                document.createElement("button");

            open.textContent =
                "Open";

            open.onclick =
                () => {

                    loadChat(
                        chat.id
                    );

                };


            // PIN

            const pin =
                document.createElement("button");

            pin.textContent =
                chat.pinned
                    ? "📌 Unpin"
                    : "📍 Pin";


            pin.onclick =
                () => {

                    togglePin(
                        chat.id
                    );

                };


            // DELETE

            const del =
                document.createElement("button");

            del.className =
                "history-delete";

            del.textContent =
                "🗑 Delete";


            del.onclick =
                () => {

                    deleteChat(
                        chat.id
                    );

                };


            actions.appendChild(
                open
            );

            actions.appendChild(
                pin
            );

            actions.appendChild(
                del
            );


            card.appendChild(
                actions
            );


            historyList.appendChild(
                card
            );

        }
    );
}


// ======================================================
// CLOSE HISTORY
// ======================================================

closeHistory.addEventListener(
    "click",
    () => {

        historyModal.style.display =
            "none";

    }
);


historyModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            historyModal
        ) {

            historyModal.style.display =
                "none";

        }

    }
);


// ======================================================
// CLEAR HISTORY
// ======================================================

clearHistoryButton.addEventListener(
    "click",
    () => {

        localStorage.removeItem(
            "viggoChats"
        );


        startNewChat();


        renderSidebar();

        renderHistory();


        moreMenu.classList.remove(
            "show"
        );

    }
);


// ======================================================
// SHARE COMPLETE CHAT
// ======================================================

shareChatButton.addEventListener(
    "click",
    async () => {

        moreMenu.classList.remove(
            "show"
        );


        if (
            chatMessages.length === 0
        ) {

            return;
        }


        let text =
            "Viggo AI Chat\n\n";


        chatMessages.forEach(
            item => {

                text +=
                    (
                        item.role === "user"
                            ? "You"
                            : "Viggo"
                    ) +
                    ":\n" +
                    item.content +
                    "\n\n";

            }
        );


        if (
            navigator.share
        ) {

            try {

                await navigator.share({

                    title:
                        "Viggo AI Chat",

                    text

                });

            } catch {}

        } else {

            try {

                await navigator
                    .clipboard
                    .writeText(text);

            } catch {}

        }

    }
);


// ======================================================
// MOBILE
// ======================================================

mobileMenu.addEventListener(
    "click",
    () => {

        sidebar.classList.toggle(
            "open"
        );

    }
);


// ======================================================
// SERVER CHECK
// ======================================================

async function checkServer() {

    try {

        const response =
            await fetch(
                API_URL +
                "/api/health"
            );


        console.log(
            response.ok
                ? "Viggo server connected."
                : "Viggo server error."
        );

    } catch {

        console.log(
            "Viggo server unavailable."
        );

    }

}


// ======================================================
// INITIAL
// ======================================================

updateVoiceButtons();

renderSidebar();

checkServer();
