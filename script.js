// =====================================================
// VIGGO AI - FULL SCRIPT
// =====================================================

const SERVER_URL = "https://ai-tool-1-fgmc.onrender.com";

// =====================================================
// ELEMENTS
// =====================================================

const messageInput = document.getElementById("message");
const sendButton = document.getElementById("send");
const micButton = document.getElementById("mic");

const conversation = document.getElementById("conversation");
const currentTitle = document.getElementById("currentTitle");

const newChatButton = document.getElementById("newChat");
const historyButton = document.getElementById("historyButton");
const saveButton = document.getElementById("saveButton");
const voiceToggle = document.getElementById("voiceToggle");
const clearHistoryButton =
    document.getElementById("clearHistory");

const pinnedList =
    document.getElementById("pinnedList");

const recentList =
    document.getElementById("recentList");

const historyModal =
    document.getElementById("historyModal");

const closeHistory =
    document.getElementById("closeHistory");

const historyList =
    document.getElementById("historyList");

const mobileMenu =
    document.getElementById("mobileMenu");

const sidebar =
    document.getElementById("sidebar");


// =====================================================
// STATE
// =====================================================

let messages = [];
let currentChatId = null;
let isSending = false;

let voiceEnabled =
    localStorage.getItem("viggo_voice_enabled") !== "false";

let selectedGender =
    localStorage.getItem("viggo_voice_gender") || "female";

let availableVoices = [];


// =====================================================
// STORAGE
// =====================================================

function getChats() {

    try {

        return JSON.parse(
            localStorage.getItem("viggo_chats") || "[]"
        );

    } catch (error) {

        console.error(error);

        return [];
    }
}


function saveChats(chats) {

    localStorage.setItem(
        "viggo_chats",
        JSON.stringify(chats)
    );
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text || "";

    return div.innerHTML;
}


// =====================================================
// SAVE CURRENT CHAT
// =====================================================

function saveCurrentChat() {

    if (
        !messages ||
        messages.length === 0
    ) {
        return;
    }

    let chats =
        getChats();

    if (!currentChatId) {

        currentChatId =
            Date.now().toString();
    }

    const firstUserMessage =
        messages.find(
            message =>
                message.role === "user"
        );

    const title =
        firstUserMessage
            ? firstUserMessage.content
                .substring(0, 45)
            : "New Chat";

    const existingIndex =
        chats.findIndex(
            chat =>
                chat.id === currentChatId
        );

    const chat = {

        id:
            currentChatId,

        title:
            title,

        messages:
            [...messages],

        pinned:
            existingIndex >= 0
                ? !!chats[existingIndex].pinned
                : false,

        time:
            new Date().toISOString()
    };


    if (existingIndex >= 0) {

        chats[existingIndex] =
            chat;

    } else {

        chats.unshift(chat);
    }


    saveChats(chats);

    currentTitle.textContent =
        title;

    renderHistory();
}


// =====================================================
// LOAD CHAT
// =====================================================

function loadChat(chat) {

    if (!chat) {
        return;
    }

    currentChatId =
        chat.id;

    messages =
        Array.isArray(chat.messages)
            ? [...chat.messages]
            : [];

    conversation.innerHTML =
        "";

    currentTitle.textContent =
        chat.title || "Chat";


    messages.forEach(
        message => {

            addMessage(
                message.role,
                message.content,
                false
            );
        }
    );


    scrollToBottom();
}


// =====================================================
// ADD MESSAGE
// =====================================================

function addMessage(
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
        "message-avatar";

    avatar.textContent =
        role === "user"
            ? "U"
            : "B";


    const content =
        document.createElement("div");


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


    content.appendChild(name);

    content.appendChild(
        textElement
    );


    // ================================================
    // AI BUTTONS
    // ================================================

    if (role === "ai") {

        const actions =
            document.createElement("div");

        actions.style.display =
            "flex";

        actions.style.gap =
            "6px";

        actions.style.marginTop =
            "10px";

        actions.style.flexWrap =
            "wrap";


        // COPY
        const copyButton =
            document.createElement("button");

        copyButton.textContent =
            "📋 Copy";


        copyButton.onclick =
            async function () {

                try {

                    await navigator.clipboard
                        .writeText(text);

                    copyButton.textContent =
                        "✓ Copied";

                    setTimeout(
                        () => {

                            copyButton.textContent =
                                "📋 Copy";

                        },
                        1200
                    );

                } catch {

                    const area =
                        document.createElement(
                            "textarea"
                        );

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
                }
            };


        // SPEAKER
        const speakerButton =
            document.createElement("button");

        speakerButton.textContent =
            "🔊 Speak";


        speakerButton.onclick =
            function () {

                speak(text);
            };


        // LIKE
        const likeButton =
            document.createElement("button");

        likeButton.textContent =
            "👍 Like";


        likeButton.onclick =
            function () {

                likeButton.textContent =
                    "👍 Liked";
            };


        actions.appendChild(
            copyButton
        );

        actions.appendChild(
            speakerButton
        );

        actions.appendChild(
            likeButton
        );


        content.appendChild(
            actions
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


    messages.push({

        role:
            role,

        content:
            text
    });


    if (save) {

        saveCurrentChat();
    }


    scrollToBottom();
}


// =====================================================
// SEND MESSAGE
// =====================================================

async function sendMessage() {

    if (isSending) {
        return;
    }

    const text =
        messageInput.value.trim();

    if (!text) {
        return;
    }


    isSending =
        true;

    sendButton.disabled =
        true;


    messageInput.value =
        "";


    addMessage(
        "user",
        text,
        false
    );


    try {

        const response =
            await fetch(
                SERVER_URL +
                "/api/chat",
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
                                text
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Server error"
            );
        }


        const reply =
            data.reply ||
            data.message ||
            "Sorry friend, I did not receive a response.";


        addMessage(
            "ai",
            reply,
            false
        );


        saveCurrentChat();


        if (voiceEnabled) {

            speak(reply);
        }


    } catch (error) {

        console.error(
            "Viggo error:",
            error
        );


        addMessage(
            "ai",
            "Sorry friend, I couldn't connect to Viggo AI right now.",
            false
        );

    } finally {

        isSending =
            false;

        sendButton.disabled =
            false;

        messageInput.focus();
    }
}


// =====================================================
// SEND BUTTON
// =====================================================

if (sendButton) {

    sendButton.addEventListener(
        "click",
        sendMessage
    );
}


// =====================================================
// ENTER KEY
// =====================================================

if (messageInput) {

    messageInput.addEventListener(
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
}


// =====================================================
// NEW CHAT
// =====================================================

if (newChatButton) {

    newChatButton.addEventListener(
        "click",
        function () {

            // SAVE OLD CHAT FIRST
            saveCurrentChat();


            // NEW CHAT
            messages = [];

            currentChatId =
                null;

            conversation.innerHTML =
                "";

            currentTitle.textContent =
                "New Chat";

            messageInput.value =
                "";

            renderHistory();

            messageInput.focus();
        }
    );
}


// =====================================================
// HISTORY
// =====================================================

function renderHistory() {

    const chats =
        getChats();


    // CLEAR
    if (pinnedList) {
        pinnedList.innerHTML =
            "";
    }

    if (recentList) {
        recentList.innerHTML =
            "";
    }

    if (historyList) {
        historyList.innerHTML =
            "";
    }


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


    // ================================================
    // PINNED
    // ================================================

    if (pinned.length === 0) {

        if (pinnedList) {

            pinnedList.innerHTML =
                `<div class="empty-sidebar">
                    No pinned chats
                </div>`;
        }

    } else {

        pinned.forEach(
            chat => {

                createSidebarChat(
                    chat,
                    pinnedList
                );
            }
        );
    }


    // ================================================
    // RECENT
    // ================================================

    if (recent.length === 0) {

        if (recentList) {

            recentList.innerHTML =
                `<div class="empty-sidebar">
                    No recent chats
                </div>`;
        }

    } else {

        recent.forEach(
            chat => {

                createSidebarChat(
                    chat,
                    recentList
                );
            }
        );
    }


    // ================================================
    // MODAL
    // ================================================

    if (!historyList) {
        return;
    }


    if (chats.length === 0) {

        historyList.innerHTML =
            `<p>No chat history yet.</p>`;

        return;
    }


    chats.forEach(
        chat => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "history-card";


            if (chat.pinned) {

                card.classList.add(
                    "pinned"
                );
            }


            card.innerHTML = `

                <div class="history-card-title">
                    ${escapeHTML(chat.title)}
                </div>

                <div class="history-card-time">
                    ${new Date(chat.time).toLocaleString()}
                </div>

                <div class="history-card-actions">

                    <button class="open-chat">
                        Open
                    </button>

                    <button class="pin-chat">
                        ${
                            chat.pinned
                                ? "📌 Unpin"
                                : "📌 Pin"
                        }
                    </button>

                    <button class="delete-chat">
                        🗑 Delete
                    </button>

                </div>
            `;


            const openButton =
                card.querySelector(
                    ".open-chat"
                );


            const pinButton =
                card.querySelector(
                    ".pin-chat"
                );


            const deleteButton =
                card.querySelector(
                    ".delete-chat"
                );


            openButton.onclick =
                function () {

                    loadChat(chat);

                    historyModal.style.display =
                        "none";
                };


            pinButton.onclick =
                function () {

                    togglePin(
                        chat.id
                    );
                };


            deleteButton.onclick =
                function () {

                    deleteChat(
                        chat.id
                    );
                };


            historyList.appendChild(
                card
            );
        }
    );
}


// =====================================================
// SIDEBAR CHAT
// =====================================================

function createSidebarChat(
    chat,
    container
) {

    if (!container) {
        return;
    }


    const button =
        document.createElement(
            "button"
        );

    button.className =
        "chat-item";


    button.innerHTML = `

        <span class="chat-item-title">
            ${escapeHTML(chat.title)}
        </span>

        ${
            chat.pinned
                ? `<span class="pin-icon">📌</span>`
                : ""
        }

    `;


    button.onclick =
        function () {

            loadChat(chat);
        };


    container.appendChild(
        button
    );
}


// =====================================================
// HISTORY BUTTON
// =====================================================

if (historyButton) {

    historyButton.addEventListener(
        "click",
        function () {

            renderHistory();

            historyModal.style.display =
                "block";
        }
    );
}


// =====================================================
// CLOSE HISTORY
// =====================================================

if (closeHistory) {

    closeHistory.addEventListener(
        "click",
        function () {

            historyModal.style.display =
                "none";
        }
    );
}


// =====================================================
// SAVE BUTTON
// =====================================================

if (saveButton) {

    saveButton.addEventListener(
        "click",
        function () {

            saveCurrentChat();


            saveButton.textContent =
                "✓ Saved";


            setTimeout(
                () => {

                    saveButton.textContent =
                        "💾 Save";

                },
                1500
            );
        }
    );
}


// =====================================================
// PIN
// =====================================================

function togglePin(id) {

    const chats =
        getChats();


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


    saveChats(
        chats
    );


    renderHistory();
}


// =====================================================
// DELETE
// =====================================================

function deleteChat(id) {

    let chats =
        getChats();


    chats =
        chats.filter(
            chat =>
                chat.id !== id
        );


    saveChats(
        chats
    );


    if (
        currentChatId === id
    ) {

        currentChatId =
            null;

        messages = [];

        conversation.innerHTML =
            "";

        currentTitle.textContent =
            "New Chat";
    }


    renderHistory();
}


// =====================================================
// CLEAR ALL HISTORY
// =====================================================

if (clearHistoryButton) {

    clearHistoryButton.addEventListener(
        "click",
        function () {

            localStorage.removeItem(
                "viggo_chats"
            );


            currentChatId =
                null;

            messages = [];


            conversation.innerHTML =
                "";

            currentTitle.textContent =
                "New Chat";


            renderHistory();
        }
    );
}


// =====================================================
// VOICE
// =====================================================

function loadVoices() {

    if (
        !("speechSynthesis" in window)
    ) {
        return;
    }


    availableVoices =
        speechSynthesis.getVoices();
}


if (
    "speechSynthesis" in window
) {

    speechSynthesis.onvoiceschanged =
        loadVoices;

    loadVoices();
}


function speak(text) {

    if (!voiceEnabled) {
        return;
    }


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


    loadVoices();


    let voice =
        availableVoices.find(
            v =>
                v.name
                    .toLowerCase()
                    .includes(
                        selectedGender
                    )
        );


    if (!voice) {

        voice =
            availableVoices.find(
                v =>
                    v.lang &&
                    v.lang
                        .toLowerCase()
                        .startsWith(
                            "en"
                        )
            );
    }


    if (voice) {

        utterance.voice =
            voice;

        utterance.lang =
            voice.lang;
    }


    utterance.rate =
        1;

    utterance.pitch =
        selectedGender === "female"
            ? 1.05
            : 0.95;


    speechSynthesis.speak(
        utterance
    );
}


// =====================================================
// VOICE ON / OFF
// =====================================================

function updateVoiceButton() {

    if (!voiceToggle) {
        return;
    }


    voiceToggle.textContent =
        voiceEnabled
            ? "🔊 Voice ON"
            : "🔇 Voice OFF";
}


if (voiceToggle) {

    voiceToggle.addEventListener(
        "click",
        function () {

            voiceEnabled =
                !voiceEnabled;


            localStorage.setItem(
                "viggo_voice_enabled",
                voiceEnabled
            );


            updateVoiceButton();


            if (!voiceEnabled) {

                if (
                    "speechSynthesis"
                    in window
                ) {

                    speechSynthesis.cancel();
                }
            }
        }
    );
}


// =====================================================
// CHANGE VOICE
// =====================================================

function changeVoice(gender) {

    selectedGender =
        gender;


    localStorage.setItem(
        "viggo_voice_gender",
        gender
    );


    const message =
        gender === "female"
            ? "Okay friend, female voice changed."
            : "Okay friend, male voice changed.";


    voiceEnabled =
        true;


    localStorage.setItem(
        "viggo_voice_enabled",
        "true"
    );


    updateVoiceButton();


    speak(message);
}


// =====================================================
// MICROPHONE
// =====================================================

let recognition = null;


if (
    "SpeechRecognition" in window ||
    "webkitSpeechRecognition" in window
) {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    recognition =
        new SpeechRecognition();


    recognition.lang =
        "en-IN";


    recognition.continuous =
        false;


    recognition.interimResults =
        false;


    recognition.onstart =
        function () {

            if (micButton) {

                micButton.classList.add(
                    "listening"
                );
            }
        };


    recognition.onend =
        function () {

            if (micButton) {

                micButton.classList.remove(
                    "listening"
                );
            }
        };


    recognition.onresult =
        function (event) {

            const text =
                event.results[0][0]
                    .transcript;


            messageInput.value =
                text;


            sendMessage();
        };


    if (micButton) {

        micButton.addEventListener(
            "click",
            function () {

                try {

                    recognition.start();

                } catch {

                    console.log(
                        "Microphone already running."
                    );
                }
            }
        );
    }
}


// =====================================================
// SHARE WHOLE CHAT
// =====================================================

async function shareWholeChat() {

    if (
        !messages ||
        messages.length === 0
    ) {

        return;
    }


    let shareText =
        "Viggo Chat\n\n";


    messages.forEach(
        message => {

            shareText +=
                message.role === "user"
                    ? "You:\n"
                    : "Viggo:\n";

            shareText +=
                message.content +
                "\n\n";
        }
    );


    try {

        if (
            navigator.share
        ) {

            await navigator.share({

                title:
                    "Viggo Chat",

                text:
                    shareText
            });

        } else {

            await navigator.clipboard
                .writeText(
                    shareText
                );
        }

    } catch {

        console.log(
            "Share cancelled"
        );
    }
}


// =====================================================
// MORE MENU
// =====================================================

function createMoreMenu() {

    const topbar =
        document.querySelector(
            ".topbar"
        );


    if (!topbar) {
        return;
    }


    if (
        document.getElementById(
            "viggoMoreButton"
        )
    ) {
        return;
    }


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.style.position =
        "relative";


    wrapper.style.marginLeft =
        "auto";


    const moreButton =
        document.createElement(
            "button"
        );


    moreButton.id =
        "viggoMoreButton";


    moreButton.textContent =
        "⋮";


    moreButton.style.border =
        "0";

    moreButton.style.background =
        "#eee";

    moreButton.style.borderRadius =
        "8px";

    moreButton.style.padding =
        "8px 13px";

    moreButton.style.fontSize =
        "20px";

    moreButton.style.cursor =
        "pointer";


    const menu =
        document.createElement(
            "div"
        );


    menu.style.display =
        "none";

    menu.style.position =
        "absolute";

    menu.style.right =
        "0";

    menu.style.top =
        "45px";

    menu.style.background =
        "white";

    menu.style.border =
        "1px solid #ddd";

    menu.style.borderRadius =
        "10px";

    menu.style.padding =
        "6px";

    menu.style.minWidth =
        "180px";

    menu.style.boxShadow =
        "0 8px 25px rgba(0,0,0,.15)";

    menu.style.zIndex =
        "2000";


    function menuItem(
        text,
        action
    ) {

        const button =
            document.createElement(
                "button"
            );


        button.textContent =
            text;


        button.style.display =
            "block";

        button.style.width =
            "100%";

        button.style.border =
            "0";

        button.style.background =
            "transparent";

        button.style.padding =
            "10px";

        button.style.textAlign =
            "left";

        button.style.cursor =
            "pointer";

        button.style.borderRadius =
            "7px";


        button.onclick =
            function () {

                action();

                menu.style.display =
                    "none";
            };


        menu.appendChild(
            button
        );
    }


    menuItem(
        "💾 Save",
        saveCurrentChat
    );


    menuItem(
        "🕘 History",
        function () {

            renderHistory();

            historyModal.style.display =
                "block";
        }
    );


    menuItem(
        "🔊 Voice ON/OFF",
        function () {

            voiceEnabled =
                !voiceEnabled;

            localStorage.setItem(
                "viggo_voice_enabled",
                voiceEnabled
            );

            updateVoiceButton();
        }
    );


    menuItem(
        "🎙️ Female Voice",
        function () {

            changeVoice(
                "female"
            );
        }
    );


    menuItem(
        "🎙️ Male Voice",
        function () {

            changeVoice(
                "male"
            );
        }
    );


    menuItem(
        "↗️ Share Chat",
        shareWholeChat
    );


    menuItem(
        "🗑️ Clear History",
        function () {

            localStorage.removeItem(
                "viggo_chats"
            );

            messages = [];

            currentChatId =
                null;

            conversation.innerHTML =
                "";

            currentTitle.textContent =
                "New Chat";

            renderHistory();
        }
    );


    moreButton.onclick =
        function (event) {

            event.stopPropagation();

            menu.style.display =
                menu.style.display === "none"
                    ? "block"
                    : "none";
        };


    document.addEventListener(
        "click",
        function () {

            menu.style.display =
                "none";
        }
    );


    wrapper.appendChild(
        moreButton
    );

    wrapper.appendChild(
        menu
    );

    topbar.appendChild(
        wrapper
    );
}


// =====================================================
// MOBILE MENU
// =====================================================

if (mobileMenu) {

    mobileMenu.addEventListener(
        "click",
        function () {

            if (sidebar) {

                sidebar.classList.toggle(
                    "open"
                );
            }
        }
    );
}


// =====================================================
// CLOSE MODAL WHEN CLICK OUTSIDE
// =====================================================

if (historyModal) {

    historyModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                historyModal
            ) {

                historyModal.style.display =
                    "none";
            }
        }
    );
}


// =====================================================
// SCROLL
// =====================================================

function scrollToBottom() {

    const chatArea =
        document.getElementById(
            "chatArea"
        );


    if (chatArea) {

        chatArea.scrollTop =
            chatArea.scrollHeight;
    }
}


// =====================================================
// INITIALIZE
// =====================================================

updateVoiceButton();

renderHistory();

createMoreMenu();

console.log(
    "VIGGO READY"
);

console.log(
    "Server:",
    SERVER_URL
);
