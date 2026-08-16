// ============================================
// VIGGO AI - FRONTEND
// ============================================

const SERVER_URL =
    "https://ai-tool-1-fgmc.onrender.com";


// ============================================
// ELEMENTS
// ============================================

const messageInput =
    document.getElementById("message");

const sendButton =
    document.getElementById("send");

const micButton =
    document.getElementById("mic");

const conversation =
    document.getElementById("conversation");

const currentTitle =
    document.getElementById("currentTitle");

const newChatButton =
    document.getElementById("newChat");

const historyButton =
    document.getElementById("historyButton");

const saveButton =
    document.getElementById("saveButton");

const clearHistoryButton =
    document.getElementById("clearHistory");

const historyModal =
    document.getElementById("historyModal");

const closeHistory =
    document.getElementById("closeHistory");

const historyList =
    document.getElementById("historyList");

const pinnedList =
    document.getElementById("pinnedList");

const recentList =
    document.getElementById("recentList");

const mobileMenu =
    document.getElementById("mobileMenu");

const sidebar =
    document.getElementById("sidebar");


// ============================================
// STATE
// ============================================

let messages = [];

let voiceEnabled = true;

let currentChatId = null;

let isSending = false;

let recognition = null;


// ============================================
// LOCAL STORAGE
// ============================================

function getChats() {

    try {

        return JSON.parse(
            localStorage.getItem("viggo_chats") || "[]"
        );

    } catch {

        return [];

    }
}


function saveChats(chats) {

    localStorage.setItem(
        "viggo_chats",
        JSON.stringify(chats)
    );

}


// ============================================
// SERVER CHECK
// ============================================

async function checkServer() {

    try {

        const response = await fetch(
            `${SERVER_URL}/api/health`,
            {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const data =
            await response.json();

        console.log(
            "Viggo server:",
            data
        );

        return true;

    } catch (error) {

        console.error(
            "Server connection failed:",
            error
        );

        return false;

    }
}


// ============================================
// SEND MESSAGE TO SERVER
// ============================================

async function askViggo(text) {

    const response = await fetch(
        `${SERVER_URL}/api/chat`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },

            body: JSON.stringify({
                message: text
            })
        }
    );

    const data =
        await response.json();

    if (!response.ok) {

        throw new Error(
            data.error ||
            "Viggo server error"
        );

    }

    return data.reply;

}


// ============================================
// ADD MESSAGE
// ============================================

function addMessage(
    role,
    text,
    save = true
) {

    const messageDiv =
        document.createElement("div");

    messageDiv.className =
        `message ${role}`;

    const avatar =
        document.createElement("div");

    avatar.className =
        "message-avatar";

    avatar.textContent =
        role === "user" ? "U" : "B";

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

    const textDiv =
        document.createElement("div");

    textDiv.className =
        "message-text";

    textDiv.textContent = text;

    content.appendChild(name);
    content.appendChild(textDiv);

    // ----------------------------------------
    // ACTION BUTTONS
    // ----------------------------------------

    if (role === "ai") {

        const actions =
            document.createElement("div");

        actions.style.display = "flex";
        actions.style.gap = "6px";
        actions.style.marginTop = "10px";
        actions.style.flexWrap = "wrap";

        // COPY
        const copyButton =
            document.createElement("button");

        copyButton.textContent =
            "📋 Copy";

        copyButton.onclick = async () => {

            await navigator.clipboard.writeText(text);

            copyButton.textContent =
                "✓ Copied";

            setTimeout(() => {

                copyButton.textContent =
                    "📋 Copy";

            }, 1500);

        };

        // SPEAKER
        const speakerButton =
            document.createElement("button");

        speakerButton.textContent =
            voiceEnabled
                ? "🔊 Speak"
                : "🔇 Voice Off";

        speakerButton.onclick = () => {

            if (voiceEnabled) {

                speak(text);

            } else {

                window.speechSynthesis.cancel();

            }

        };

        // LIKE
        const likeButton =
            document.createElement("button");

        likeButton.textContent =
            "👍 Like";

        likeButton.onclick = () => {

            likeButton.textContent =
                "👍 Liked";

        };

        actions.appendChild(copyButton);
        actions.appendChild(speakerButton);
        actions.appendChild(likeButton);

        content.appendChild(actions);
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);

    conversation.appendChild(messageDiv);

    // ----------------------------------------
    // STORE MESSAGE
    // ----------------------------------------

    messages.push({
        role: role,
        content: text
    });

    if (save) {
        saveCurrentChat();
    }

    scrollToBottom();
}


// ============================================
// SPEAKER
// ============================================

function speak(text) {

    if (!voiceEnabled) {
        return;
    }

    if (
        !("speechSynthesis" in window)
    ) {

        alert(
            "Voice is not supported in this browser."
        );

        return;

    }

    window.speechSynthesis.cancel();

    const speech =
        new SpeechSynthesisUtterance(text);

    speech.rate = 1;
    speech.pitch = 1;
    speech.volume = 1;

    window.speechSynthesis.speak(
        speech
    );
}


// ============================================
// SEND
// ============================================

async function sendMessage() {

    if (isSending) {
        return;
    }

    const text =
        messageInput.value.trim();

    if (!text) {
        return;
    }

    isSending = true;

    sendButton.disabled = true;

    messageInput.value = "";

    addMessage(
        "user",
        text,
        false
    );

    try {

        const online =
            await checkServer();

        if (!online) {

            addMessage(
                "ai",
                "Viggo server is not connected. Please start the server and try again.",
                false
            );

            return;
        }

        const reply =
            await askViggo(text);

        addMessage(
            "ai",
            reply,
            false
        );

        if (voiceEnabled) {
            speak(reply);
        }

    } catch (error) {

        console.error(error);

        addMessage(
            "ai",
            "Sorry friend, I couldn't connect to Viggo AI right now.",
            false
        );

    } finally {

        isSending = false;

        sendButton.disabled = false;

        messageInput.focus();

    }
}


// ============================================
// ENTER BUTTON
// ============================================

messageInput.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();

        }

    }
);


// ============================================
// SEND BUTTON
// ============================================

sendButton.addEventListener(
    "click",
    sendMessage
);


// ============================================
// NEW CHAT
// ============================================

newChatButton.addEventListener(
    "click",
    () => {

        messages = [];

        currentChatId = null;

        conversation.innerHTML = "";

        currentTitle.textContent =
            "New Chat";

        messageInput.value = "";

        renderHistory();

    }
);


// ============================================
// SAVE CURRENT CHAT
// ============================================

function saveCurrentChat() {

    if (messages.length === 0) {
        return;
    }

    const chats =
        getChats();

    const firstUserMessage =
        messages.find(
            item => item.role === "user"
        );

    const title =
        firstUserMessage
            ? firstUserMessage.content.slice(0, 40)
            : "New Chat";

    if (!currentChatId) {

        currentChatId =
            Date.now().toString();

    }

    const existingIndex =
        chats.findIndex(
            chat =>
                chat.id === currentChatId
        );

    const chat = {

        id: currentChatId,

        title: title,

        messages: messages,

        pinned:
            existingIndex >= 0
                ? chats[existingIndex].pinned
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


// ============================================
// LOAD CHAT
// ============================================

function loadChat(chat) {

    currentChatId =
        chat.id;

    messages =
        Array.isArray(chat.messages)
            ? chat.messages
            : [];

    conversation.innerHTML = "";

    currentTitle.textContent =
        chat.title || "Chat";

    messages.forEach(item => {

        addMessage(
            item.role,
            item.content,
            false
        );

    });

    scrollToBottom();

}


// ============================================
// HISTORY
// ============================================

function renderHistory() {

    const chats =
        getChats();

    pinnedList.innerHTML = "";
    recentList.innerHTML = "";
    historyList.innerHTML = "";

    const pinned =
        chats.filter(
            chat => chat.pinned
        );

    const recent =
        chats.filter(
            chat => !chat.pinned
        );

    if (pinned.length === 0) {

        pinnedList.innerHTML =
            `<div class="empty-sidebar">
                No pinned chats
            </div>`;

    }

    pinned.forEach(
        chat =>
            createSidebarChat(
                chat,
                pinnedList
            )
    );

    if (recent.length === 0) {

        recentList.innerHTML =
            `<div class="empty-sidebar">
                No recent chats
            </div>`;

    }

    recent.forEach(
        chat =>
            createSidebarChat(
                chat,
                recentList
            )
    );

    // HISTORY WINDOW

    if (chats.length === 0) {

        historyList.innerHTML =
            `<p>No chat history.</p>`;

        return;

    }

    chats.forEach(chat => {

        const card =
            document.createElement("div");

        card.className =
            "history-card";

        if (chat.pinned) {
            card.classList.add("pinned");
        }

        const title =
            document.createElement("div");

        title.className =
            "history-card-title";

        title.textContent =
            chat.title;

        const time =
            document.createElement("div");

        time.className =
            "history-card-time";

        time.textContent =
            new Date(
                chat.time
            ).toLocaleString();

        const actions =
            document.createElement("div");

        actions.className =
            "history-card-actions";

        // OPEN
        const open =
            document.createElement("button");

        open.textContent =
            "Open";

        open.onclick = () => {

            loadChat(chat);

            historyModal.style.display =
                "none";

        };

        // PIN
        const pin =
            document.createElement("button");

        pin.className =
            "pin-button";

        pin.textContent =
            chat.pinned
                ? "📌 Unpin"
                : "📌 Pin";

        pin.onclick = () => {

            togglePin(chat.id);

        };

        // DELETE
        const del =
            document.createElement("button");

        del.className =
            "delete-button";

        del.textContent =
            "🗑 Delete";

        del.onclick = () => {

            deleteChat(chat.id);

        };

        actions.appendChild(open);
        actions.appendChild(pin);
        actions.appendChild(del);

        card.appendChild(title);
        card.appendChild(time);
        card.appendChild(actions);

        historyList.appendChild(card);

    });

}


// ============================================
// SIDEBAR CHAT
// ============================================

function createSidebarChat(
    chat,
    container
) {

    const button =
        document.createElement("button");

    button.className =
        "chat-item";

    const title =
        document.createElement("span");

    title.className =
        "chat-item-title";

    title.textContent =
        chat.title;

    const pin =
        document.createElement("span");

    pin.className =
        "pin-icon";

    pin.textContent =
        chat.pinned
            ? "📌"
            : "";

    button.appendChild(title);
    button.appendChild(pin);

    button.onclick = () => {

        loadChat(chat);

    };

    container.appendChild(button);

}


// ============================================
// PIN
// ============================================

function togglePin(id) {

    const chats =
        getChats();

    const chat =
        chats.find(
            item => item.id === id
        );

    if (!chat) {
        return;
    }

    chat.pinned =
        !chat.pinned;

    saveChats(chats);

    renderHistory();

}


// ============================================
// DELETE CHAT
// ============================================

function deleteChat(id) {

    const chats =
        getChats();

    const updated =
        chats.filter(
            chat => chat.id !== id
        );

    saveChats(updated);

    if (currentChatId === id) {

        currentChatId = null;

        messages = [];

        conversation.innerHTML = "";

        currentTitle.textContent =
            "New Chat";

    }

    renderHistory();

}


// ============================================
// HISTORY BUTTON
// ============================================

historyButton.addEventListener(
    "click",
    () => {

        renderHistory();

        historyModal.style.display =
            "block";

    }
);


// ============================================
// CLOSE HISTORY
// ============================================

closeHistory.addEventListener(
    "click",
    () => {

        historyModal.style.display =
            "none";

    }
);


// ============================================
// SAVE BUTTON
// ============================================

saveButton.addEventListener(
    "click",
    () => {

        saveCurrentChat();

        saveButton.textContent =
            "✓ Saved";

        setTimeout(() => {

            saveButton.textContent =
                "💾 Save";

        }, 1500);

    }
);


// ============================================
// CLEAR HISTORY
// ============================================

clearHistoryButton.addEventListener(
    "click",
    () => {

        localStorage.removeItem(
            "viggo_chats"
        );

        currentChatId = null;

        messages = [];

        conversation.innerHTML = "";

        currentTitle.textContent =
            "New Chat";

        renderHistory();

    }
);


// ============================================
// MOBILE MENU
// ============================================

if (mobileMenu) {

    mobileMenu.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "open"
            );

        }
    );

}


// ============================================
// MICROPHONE
// ============================================

if (
    "webkitSpeechRecognition"
    in window ||
    "SpeechRecognition"
    in window
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

    recognition.onstart = () => {

        micButton.classList.add(
            "listening"
        );

    };

    recognition.onend = () => {

        micButton.classList.remove(
            "listening"
        );

    };

    recognition.onresult =
        (event) => {

            const text =
                event.results[0][0].transcript;

            messageInput.value =
                text;

            messageInput.focus();

        };

    recognition.onerror =
        (event) => {

            console.error(
                "Microphone error:",
                event.error
            );

        };

    micButton.addEventListener(
        "click",
        () => {

            try {

                recognition.start();

            } catch (error) {

                console.log(
                    "Recognition already running."
                );

            }

        }
    );

} else {

    micButton.addEventListener(
        "click",
        () => {

            alert(
                "Voice input is not supported in this browser."
            );

        }
    );

}


// ============================================
// VOICE TOGGLE
// ============================================

// Sidebar voice button may exist
const voiceToggle =
    document.getElementById(
        "voiceToggle"
    );

if (voiceToggle) {

    voiceToggle.addEventListener(
        "click",
        () => {

            voiceEnabled =
                !voiceEnabled;

            if (!voiceEnabled) {

                window.speechSynthesis.cancel();

                voiceToggle.textContent =
                    "🔇 Voice OFF";

            } else {

                voiceToggle.textContent =
                    "🔊 Voice ON";

            }

        }
    );

}


// ============================================
// SHARE WHOLE CHAT
// ============================================

async function shareWholeChat() {

    if (messages.length === 0) {

        alert(
            "No messages to share."
        );

        return;

    }

    let text =
        "Viggo Chat\n\n";

    messages.forEach(item => {

        text +=
            `${item.role === "user" ? "You" : "Viggo"}:\n`;

        text +=
            `${item.content}\n\n`;

    });

    try {

        if (
            navigator.share
        ) {

            await navigator.share({
                title: "Viggo Chat",
                text: text
            });

        } else {

            await navigator.clipboard.writeText(
                text
            );

            alert(
                "Whole chat copied."
            );

        }

    } catch (error) {

        console.log(
            "Share cancelled."
        );

    }

}


// ============================================
// CREATE SHARE BUTTON IN TOPBAR
// ============================================

function createShareButton() {

    const topbar =
        document.querySelector(
            ".topbar"
        );

    if (!topbar) {
        return;
    }

    const share =
        document.createElement("button");

    share.textContent =
        "↗ Share";

    share.style.marginLeft =
        "auto";

    share.style.border =
        "0";

    share.style.borderRadius =
        "8px";

    share.style.padding =
        "8px 12px";

    share.style.cursor =
        "pointer";

    share.onclick =
        shareWholeChat;

    topbar.appendChild(
        share
    );

}


// ============================================
// SCROLL
// ============================================

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


// ============================================
// INITIALIZE
// ============================================

renderHistory();

createShareButton();

checkServer();

console.log(
    "================================"
);

console.log(
    "VIGGO FRONTEND STARTED"
);

console.log(
    "Server:",
    SERVER_URL
);

console.log(
    "================================"
);
