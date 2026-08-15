// ======================================================
// VIGGO AI - SCRIPT.JS
// ======================================================

const API_URL = "https://ai-tool-1-fgmc.onrender.com";


// ======================================================
// ELEMENTS
// ======================================================

const sidebar = document.getElementById("sidebar");
const conversation = document.getElementById("conversation");
const messageInput = document.getElementById("message");
const sendButton = document.getElementById("send");
const micButton = document.getElementById("mic");
const currentTitle = document.getElementById("currentTitle");

const voiceToggle = document.getElementById("voiceToggle");
const voicePanel = document.getElementById("voicePanel");
const voiceSelect = document.getElementById("voiceSelect");

const pinnedList = document.getElementById("pinnedList");
const recentList = document.getElementById("recentList");

const newChatButton = document.getElementById("newChat");
const saveButton = document.getElementById("saveButton");
const historyButton = document.getElementById("historyButton");
const clearHistoryButton = document.getElementById("clearHistory");

const shareChatButton = document.getElementById("shareChat");
const voiceSettingsButton = document.getElementById("voiceSettings");

const mobileMenu = document.getElementById("mobileMenu");


// ======================================================
// VARIABLES
// ======================================================

let chatMessages = [];

let voiceEnabled = true;

let currentChatId = Date.now().toString();

let recognition = null;

let voices = [];


// ======================================================
// TOAST
// ======================================================

function showToast(message) {

    let toast = document.getElementById("viggoToast");

    if (!toast) {

        toast = document.createElement("div");

        toast.id = "viggoToast";

        toast.style.position = "fixed";
        toast.style.bottom = "25px";
        toast.style.left = "50%";
        toast.style.transform = "translateX(-50%)";

        toast.style.background = "#071a35";
        toast.style.color = "#ffffff";

        toast.style.border = "1px solid #238cff";

        toast.style.padding = "11px 20px";

        toast.style.borderRadius = "10px";

        toast.style.boxShadow =
            "0 0 20px rgba(20,130,255,.35)";

        toast.style.zIndex = "99999";

        toast.style.fontSize = "14px";

        document.body.appendChild(toast);
    }

    toast.textContent = message;

    toast.style.display = "block";

    clearTimeout(toast.timer);

    toast.timer = setTimeout(() => {

        toast.style.display = "none";

    }, 2200);
}


// ======================================================
// REMOVE WELCOME
// ======================================================

function removeWelcome() {

    const welcome =
        document.querySelector(".welcome");

    if (welcome) {
        welcome.remove();
    }
}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


// ======================================================
// ADD MESSAGE
// ======================================================

function addMessage(
    role,
    text,
    saveToMemory = true
) {

    removeWelcome();

    const message =
        document.createElement("div");

    message.className =
        "message " + role;


    // ==================================================
    // AVATAR
    // ==================================================

    const avatar =
        document.createElement("div");

    avatar.className = "avatar";

    avatar.textContent =
        role === "user"
            ? "U"
            : "B";


    // ==================================================
    // CONTENT
    // ==================================================

    const content =
        document.createElement("div");

    content.className =
        "message-content";


    // ==================================================
    // NAME
    // ==================================================

    const name =
        document.createElement("div");

    name.className =
        "message-name";

    name.textContent =
        role === "user"
            ? "You"
            : "Viggo";


    // ==================================================
    // TEXT
    // ==================================================

    const textElement =
        document.createElement("div");

    textElement.className =
        "message-text";

    textElement.textContent =
        text;


    content.appendChild(name);
    content.appendChild(textElement);


    // ==================================================
    // AI ACTION BUTTONS
    // ==================================================

    if (role === "ai") {

        const actions =
            document.createElement("div");

        actions.className =
            "message-actions";


        // ----------------------------------------------
        // COPY
        // ----------------------------------------------

        const copyButton =
            document.createElement("button");

        copyButton.className =
            "msg-btn";

        copyButton.innerHTML =
            "📋 Copy";


        copyButton.onclick =
            async () => {

                try {

                    await navigator.clipboard.writeText(
                        text
                    );

                    copyButton.innerHTML =
                        "✓ Copied";

                    setTimeout(() => {

                        copyButton.innerHTML =
                            "📋 Copy";

                    }, 1500);

                } catch {

                    showToast(
                        "Copy failed"
                    );

                }

            };


        // ----------------------------------------------
        // SPEAKER
        // ----------------------------------------------

        const speakerButton =
            document.createElement("button");

        speakerButton.className =
            "msg-btn";

        speakerButton.innerHTML =
            "🔊 Speak";


        speakerButton.onclick =
            () => {

                if (
                    speechSynthesis.speaking
                ) {

                    speechSynthesis.cancel();

                    speakerButton.innerHTML =
                        "🔊 Speak";

                    return;
                }


                speakText(text);

                speakerButton.innerHTML =
                    "🔇 Stop";

            };


        // ----------------------------------------------
        // LIKE
        // ----------------------------------------------

        const likeButton =
            document.createElement("button");

        likeButton.className =
            "msg-btn";

        likeButton.innerHTML =
            "👍";


        likeButton.onclick =
            () => {

                likeButton.classList.toggle(
                    "active"
                );

                dislikeButton.classList.remove(
                    "active"
                );

                if (
                    likeButton.classList.contains(
                        "active"
                    )
                ) {

                    showToast(
                        "Thanks for your feedback 👍"
                    );
                }

            };


        // ----------------------------------------------
        // DISLIKE
        // ----------------------------------------------

        const dislikeButton =
            document.createElement("button");

        dislikeButton.className =
            "msg-btn";

        dislikeButton.innerHTML =
            "👎";


        dislikeButton.onclick =
            () => {

                dislikeButton.classList.toggle(
                    "active"
                );

                likeButton.classList.remove(
                    "active"
                );

                if (
                    dislikeButton.classList.contains(
                        "active"
                    )
                ) {

                    showToast(
                        "Thanks for your feedback 👎"
                    );
                }

            };


        actions.appendChild(copyButton);
        actions.appendChild(speakerButton);
        actions.appendChild(likeButton);
        actions.appendChild(dislikeButton);

        content.appendChild(actions);
    }


    message.appendChild(avatar);
    message.appendChild(content);

    conversation.appendChild(message);

    scrollToBottom();


    if (saveToMemory) {

        chatMessages.push({

            role: role,

            content: text

        });
    }
}


// ======================================================
// SCROLL
// ======================================================

function scrollToBottom() {

    const chatArea =
        document.querySelector(".chat-area");

    if (!chatArea) return;

    setTimeout(() => {

        chatArea.scrollTop =
            chatArea.scrollHeight;

    }, 50);
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


    messageInput.value = "";

    messageInput.style.height =
        "auto";


    sendButton.disabled = true;


    // ==================================================
    // CHAT TITLE
    // ==================================================

    if (chatMessages.length === 1) {

        currentTitle.textContent =
            text.length > 32
                ? text.substring(0, 32) + "..."
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


    conversation.appendChild(loading);

    scrollToBottom();


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

                    body: JSON.stringify({

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
            data.message ||
            "Sorry, Viggo could not generate a response.";


        addMessage(
            "ai",
            reply
        );


        if (voiceEnabled) {

            speakText(reply);

        }


        saveCurrentChat();


    } catch (error) {

        console.error(
            "Viggo Error:",
            error
        );


        loading.remove();


        addMessage(
            "ai",
            "Viggo server is not connected. Please start the server and try again."
        );

    }


    sendButton.disabled = false;
}


// ======================================================
// SEND BUTTON
// ======================================================

if (sendButton) {

    sendButton.addEventListener(
        "click",
        sendMessage
    );

}


// ======================================================
// ENTER TO SEND
// SHIFT + ENTER = NEW LINE
// ======================================================

if (messageInput) {

    messageInput.addEventListener(
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


    // ==================================================
    // AUTO TEXTAREA HEIGHT
    // ==================================================

    messageInput.addEventListener(
        "input",
        function() {

            this.style.height =
                "auto";

            this.style.height =
                Math.min(
                    this.scrollHeight,
                    150
                ) + "px";

        }
    );

}


// ======================================================
// VOICE ON / OFF
// ======================================================

if (voiceToggle) {

    voiceToggle.addEventListener(
        "click",
        () => {

            voiceEnabled =
                !voiceEnabled;


            if (!voiceEnabled) {

                speechSynthesis.cancel();

                voiceToggle.textContent =
                    "🔇 Voice OFF";

                showToast(
                    "Viggo voice OFF"
                );

            } else {

                voiceToggle.textContent =
                    "🔊 Voice ON";

                showToast(
                    "Viggo voice ON"
                );

            }

        }
    );

}


// ======================================================
// TEXT TO SPEECH
// ======================================================

function speakText(text) {

    if (
        !("speechSynthesis" in window)
    ) {

        showToast(
            "Voice is not supported"
        );

        return;
    }


    speechSynthesis.cancel();


    const utterance =
        new SpeechSynthesisUtterance(
            text
        );


    const selectedName =
        voiceSelect
            ? voiceSelect.value
            : "";


    if (selectedName) {

        const selectedVoice =
            voices.find(
                voice =>
                    voice.name ===
                    selectedName
            );


        if (selectedVoice) {

            utterance.voice =
                selectedVoice;
        }

    }


    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;


    speechSynthesis.speak(
        utterance
    );
}


// ======================================================
// LOAD VOICES
// ======================================================

function loadVoices() {

    if (!("speechSynthesis" in window)) {
        return;
    }


    voices =
        speechSynthesis.getVoices();


    if (!voiceSelect) {
        return;
    }


    voiceSelect.innerHTML = "";


    const defaultOption =
        document.createElement("option");

    defaultOption.value = "";

    defaultOption.textContent =
        "Default Voice";

    voiceSelect.appendChild(
        defaultOption
    );


    voices.forEach(
        voice => {

            const option =
                document.createElement("option");

            option.value =
                voice.name;

            option.textContent =
                voice.name +
                " (" +
                voice.lang +
                ")";


            voiceSelect.appendChild(
                option
            );

        }
    );
}


if (
    "speechSynthesis" in window
) {

    speechSynthesis.onvoiceschanged =
        loadVoices;

    loadVoices();
}


// ======================================================
// VOICE SETTINGS
// ======================================================

if (voiceSettingsButton) {

    voiceSettingsButton.onclick =
        () => {

            if (voicePanel) {

                voicePanel.classList.toggle(
                    "show"
                );

            }

        };
}


// ======================================================
// TEST VOICE
// ======================================================

const testVoice =
    document.getElementById(
        "testVoice"
    );


if (testVoice) {

    testVoice.onclick =
        () => {

            speakText(
                "Hello friend! I am Viggo, your AI assistant."
            );

        };
}


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


    if (micButton) {

        micButton.onclick =
            () => {

                try {

                    recognition.start();

                    micButton.textContent =
                        "🔴";

                } catch {

                    console.log(
                        "Recognition already running"
                    );

                }

            };

    }


    recognition.onresult =
        event => {

            const transcript =
                event.results[0][0].transcript;


            messageInput.value =
                transcript;


            messageInput.dispatchEvent(
                new Event("input")
            );


            if (micButton) {

                micButton.textContent =
                    "🎤";

            }

        };


    recognition.onerror =
        event => {

            console.log(
                "Speech Error:",
                event.error
            );


            if (micButton) {

                micButton.textContent =
                    "🎤";

            }

        };


    recognition.onend =
        () => {

            if (micButton) {

                micButton.textContent =
                    "🎤";

            }

        };

} else {

    if (micButton) {

        micButton.onclick =
            () => {

                showToast(
                    "Voice input is not supported in this browser"
                );

            };

    }

}


// ======================================================
// SHARE COMPLETE CHAT
// ======================================================

if (shareChatButton) {

    shareChatButton.onclick =
        async () => {

            if (
                chatMessages.length === 0
            ) {

                showToast(
                    "No chat available to share"
                );

                return;
            }


            let shareText =
                "Viggo AI Chat\n\n";


            chatMessages.forEach(
                item => {

                    shareText +=
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

                        text:
                            shareText

                    });

                } catch {

                    console.log(
                        "Share cancelled"
                    );

                }

                return;
            }


            try {

                await navigator.clipboard.writeText(
                    shareText
                );

                showToast(
                    "Complete chat copied!"
                );

            } catch {

                showToast(
                    "Sharing not supported"
                );

            }

        };
}


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


    const firstUserMessage =
        chatMessages.find(
            item =>
                item.role === "user"
        );


    const title =
        firstUserMessage
            ? firstUserMessage.content
            : "New Chat";


    const oldChat =
        chats.find(
            chat =>
                chat.id ===
                currentChatId
        );


    const chat = {

        id:
            currentChatId,

        title:
            title.substring(0, 40),

        messages:
            chatMessages,

        time:
            new Date().toLocaleString(),

        pinned:
            oldChat
                ? oldChat.pinned
                : false

    };


    const index =
        chats.findIndex(
            item =>
                item.id ===
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


// ======================================================
// SAVE BUTTON
// ======================================================

if (saveButton) {

    saveButton.onclick =
        () => {

            if (
                chatMessages.length === 0
            ) {

                showToast(
                    "No chat to save"
                );

                return;
            }


            saveCurrentChat();


            showToast(
                "Chat saved successfully 💾"
            );

        };

}


// ======================================================
// RENDER SIDEBAR
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
                chat.pinned === true
        );


    const recent =
        chats.filter(
            chat =>
                chat.pinned !== true
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
// RENDER CHAT LIST
// ======================================================

function renderChatList(
    container,
    chats
) {

    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        chats.length === 0
    ) {

        const empty =
            document.createElement("div");

        empty.style.color =
            "#506b8e";

        empty.style.fontSize =
            "12px";

        empty.style.padding =
            "8px";

        empty.textContent =
            "No chats";


        container.appendChild(
            empty
        );

        return;
    }


    chats.forEach(
        chat => {

            // ==================================================
            // CHAT ROW
            // ==================================================

            const row =
                document.createElement("div");

            row.style.display =
                "flex";

            row.style.alignItems =
                "center";

            row.style.gap =
                "4px";

            row.style.marginBottom =
                "4px";


            // ==================================================
            // CHAT BUTTON
            // ==================================================

            const chatButton =
                document.createElement("button");

            chatButton.className =
                "chat-item";

            chatButton.style.flex =
                "1";


            if (
                chat.id ===
                currentChatId
            ) {

                chatButton.classList.add(
                    "active"
                );

            }


            chatButton.innerHTML =
                `
                <span class="chat-item-title">
                    ${escapeHtml(chat.title)}
                </span>
                `;


            chatButton.onclick =
                () => {

                    loadChat(
                        chat.id
                    );

                };


            // ==================================================
            // PIN BUTTON
            // ==================================================

            const pinButton =
                document.createElement("button");

            pinButton.style.border =
                "none";

            pinButton.style.background =
                "transparent";

            pinButton.style.color =
                "#7fb8ff";

            pinButton.style.cursor =
                "pointer";

            pinButton.style.padding =
                "7px";

            pinButton.title =
                chat.pinned
                    ? "Unpin chat"
                    : "Pin chat";


            pinButton.textContent =
                chat.pinned
                    ? "📌"
                    : "📍";


            pinButton.onclick =
                event => {

                    event.stopPropagation();

                    togglePinChat(
                        chat.id
                    );

                };


            // ==================================================
            // DELETE BUTTON
            // ==================================================

            const deleteButton =
                document.createElement("button");

            deleteButton.style.border =
                "none";

            deleteButton.style.background =
                "transparent";

            deleteButton.style.color =
                "#ff7777";

            deleteButton.style.cursor =
                "pointer";

            deleteButton.style.padding =
                "7px";

            deleteButton.title =
                "Delete chat";

            deleteButton.textContent =
                "🗑";


            deleteButton.onclick =
                event => {

                    event.stopPropagation();

                    deleteChat(
                        chat.id
                    );

                };


            row.appendChild(
                chatButton
            );

            row.appendChild(
                pinButton
            );

            row.appendChild(
                deleteButton
            );


            container.appendChild(
                row
            );

        }
    );
}


// ======================================================
// PIN / UNPIN CHAT
// ======================================================

function togglePinChat(id) {

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


    if (chat.pinned) {

        showToast(
            "Chat pinned 📌"
        );

    } else {

        showToast(
            "Chat unpinned"
        );

    }
}


// ======================================================
// DELETE CHAT
// ======================================================

function deleteChat(id) {

    const confirmDelete =
        confirm(
            "Delete this chat?"
        );


    if (!confirmDelete) {

        return;
    }


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


    // ==================================================
    // IF CURRENT CHAT DELETED
    // ==================================================

    if (
        currentChatId === id
    ) {

        startNewChat();

    }


    renderSidebar();


    showToast(
        "Chat deleted 🗑"
    );
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


    if (sidebar) {

        sidebar.classList.remove(
            "open"
        );

    }


    showToast(
        "Chat loaded"
    );
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


    conversation.innerHTML =
        `

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


// ======================================================
// NEW CHAT BUTTON
// ======================================================

if (newChatButton) {

    newChatButton.onclick =
        startNewChat;

}


// ======================================================
// HISTORY
// ======================================================

if (historyButton) {

    historyButton.onclick =
        () => {

            const chats =
                JSON.parse(
                    localStorage.getItem(
                        "viggoChats"
                    ) || "[]"
                );


            if (
                chats.length === 0
            ) {

                showToast(
                    "No saved chats"
                );

                return;
            }


            let historyText =
                "Viggo Chat History\n\n";


            chats.forEach(
                (chat, index) => {

                    historyText +=
                        `${index + 1}. ` +
                        chat.title +
                        (
                            chat.pinned
                                ? " 📌"
                                : ""
                        ) +
                        "\n";

                }
            );


            alert(
                historyText
            );

        };
}


// ======================================================
// CLEAR HISTORY
// ======================================================

if (clearHistoryButton) {

    clearHistoryButton.onclick =
        () => {

            const confirmClear =
                confirm(
                    "Delete ALL saved chats?"
                );


            if (!confirmClear) {

                return;
            }


            localStorage.removeItem(
                "viggoChats"
            );


            startNewChat();


            renderSidebar();


            showToast(
                "All chat history cleared"
            );

        };
}


// ======================================================
// MOBILE MENU
// ======================================================

if (mobileMenu) {

    mobileMenu.onclick =
        () => {

            sidebar.classList.toggle(
                "open"
            );

        };
}


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


        if (response.ok) {

            console.log(
                "✓ Viggo server connected"
            );

        } else {

            console.log(
                "✕ Viggo server error"
            );

        }

    } catch (error) {

        console.log(
            "✕ Viggo server is not connected"
        );

    }
}


// ======================================================
// START
// ======================================================

renderSidebar();

checkServer();
