// ======================================================
// VIGGO AI - COMPLETE SCRIPT
// ======================================================

const SERVER_URL = "https://ai-tool-1-fgmc.onrender.com";

// ======================================================
// ELEMENTS
// ======================================================

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

// ======================================================
// STATE
// ======================================================

let messages = [];
let currentChatId = null;
let isSending = false;

let voiceEnabled =
    localStorage.getItem("viggo_voice_enabled") !== "false";

let selectedGender =
    localStorage.getItem("viggo_voice_gender") ||
    "female";

let selectedVoiceName =
    localStorage.getItem("viggo_voice_name") ||
    "";

let availableVoices = [];
let recognition = null;

// ======================================================
// STORAGE
// ======================================================

function getChats() {

    try {

        return JSON.parse(
            localStorage.getItem("viggo_chats") ||
            "[]"
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

// ======================================================
// VOICE SETTINGS
// ======================================================

function saveVoiceSettings() {

    localStorage.setItem(
        "viggo_voice_enabled",
        voiceEnabled
    );

    localStorage.setItem(
        "viggo_voice_gender",
        selectedGender
    );

    localStorage.setItem(
        "viggo_voice_name",
        selectedVoiceName
    );
}

function updateVoiceButton() {

    if (!voiceToggle) return;

    voiceToggle.textContent =
        voiceEnabled
            ? "🔊 Voice ON"
            : "🔇 Voice OFF";
}

// ======================================================
// LOAD VOICES
// ======================================================

function loadVoices() {

    if (!("speechSynthesis" in window)) {
        return;
    }

    availableVoices =
        window.speechSynthesis.getVoices();

    if (!selectedVoiceName) {

        const voice =
            findVoice(selectedGender);

        if (voice) {

            selectedVoiceName =
                voice.name;

            saveVoiceSettings();
        }
    }
}

if ("speechSynthesis" in window) {

    window.speechSynthesis.onvoiceschanged =
        loadVoices;

    setTimeout(loadVoices, 500);
    setTimeout(loadVoices, 1500);
}

// ======================================================
// FIND VOICE
// ======================================================

function findVoice(gender) {

    if (!availableVoices.length) {
        return null;
    }

    const femaleNames = [
        "female",
        "zira",
        "samantha",
        "karen",
        "hazel",
        "aria",
        "jenny",
        "susan",
        "veena",
        "neerja"
    ];

    const maleNames = [
        "male",
        "david",
        "mark",
        "daniel",
        "george",
        "ryan",
        "guy",
        "ravi",
        "hemant"
    ];

    const names =
        gender === "female"
            ? femaleNames
            : maleNames;

    let voice =
        availableVoices.find(v => {

            const name =
                v.name.toLowerCase();

            return names.some(
                word =>
                    name.includes(word)
            );
        });

    if (voice) {
        return voice;
    }

    voice =
        availableVoices.find(v =>
            v.lang &&
            v.lang.toLowerCase() === "en-in"
        );

    if (voice) {
        return voice;
    }

    voice =
        availableVoices.find(v =>
            v.lang &&
            v.lang.toLowerCase().startsWith("en")
        );

    if (voice) {
        return voice;
    }

    return availableVoices[0];
}

// ======================================================
// SPEAK
// ======================================================

function speak(text) {

    if (!voiceEnabled) {
        return;
    }

    if (!("speechSynthesis" in window)) {
        return;
    }

    window.speechSynthesis.cancel();

    loadVoices();

    let voice = null;

    if (selectedVoiceName) {

        voice =
            availableVoices.find(
                v =>
                    v.name === selectedVoiceName
            );
    }

    if (!voice) {

        voice =
            findVoice(selectedGender);
    }

    const speech =
        new SpeechSynthesisUtterance(text);

    if (voice) {

        speech.voice = voice;
        speech.lang =
            voice.lang || "en-IN";

    } else {

        speech.lang = "en-IN";
    }

    speech.rate = 1;
    speech.pitch =
        selectedGender === "female"
            ? 1.05
            : 0.95;

    speech.volume = 1;

    window.speechSynthesis.speak(
        speech
    );
}

// ======================================================
// CHANGE VOICE
// ======================================================

function changeVoice(gender) {

    loadVoices();

    const voice =
        findVoice(gender);

    if (!voice) {

        speak(
            "Sorry friend, a suitable voice was not found."
        );

        return;
    }

    selectedGender = gender;
    selectedVoiceName = voice.name;

    saveVoiceSettings();

    const reply =
        gender === "female"
            ? "Okay friend, female voice changed."
            : "Okay friend, male voice changed.";

    speak(reply);
}

// ======================================================
// VOICE COMMAND
// ======================================================

function handleVoiceCommand(text) {

    const command =
        text.toLowerCase().trim();

    // FEMALE
    if (
        command.includes("female voice") ||
        command.includes("பெண் குரல்") ||
        command.includes("பெண் வாய்ஸ்")
    ) {

        changeVoice("female");

        return true;
    }

    // MALE
    if (
        command.includes("male voice") ||
        command.includes("ஆண் குரல்") ||
        command.includes("ஆண் வாய்ஸ்")
    ) {

        changeVoice("male");

        return true;
    }

    // VOICE OFF
    if (
        command === "voice off" ||
        command.includes("turn off voice") ||
        command.includes("voice off பண்ணு") ||
        command.includes("வாய்ஸ் ஆஃப்")
    ) {

        voiceEnabled = false;

        saveVoiceSettings();

        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }

        updateVoiceButton();

        return true;
    }

    // VOICE ON
    if (
        command === "voice on" ||
        command.includes("turn on voice") ||
        command.includes("voice on பண்ணு") ||
        command.includes("வாய்ஸ் ஆன்")
    ) {

        voiceEnabled = true;

        saveVoiceSettings();

        updateVoiceButton();

        speak(
            "Okay friend, voice is on."
        );

        return true;
    }

    return false;
}

// ======================================================
// CHECK SERVER
// ======================================================

async function checkServer() {

    try {

        const response =
            await fetch(
                SERVER_URL +
                "/api/health",
                {
                    method: "GET"
                }
            );

        if (!response.ok) {
            return false;
        }

        const data =
            await response.json();

        return (
            data &&
            data.status === "online"
        );

    } catch (error) {

        console.error(
            "Server error:",
            error
        );

        return false;
    }
}

// ======================================================
// ASK VIGGO
// ======================================================

async function askViggo(text) {

    const response =
        await fetch(
            SERVER_URL +
            "/api/chat",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    message: text
                })
            }
        );

    let data;

    try {

        data =
            await response.json();

    } catch {

        throw new Error(
            "Invalid server response"
        );
    }

    if (!response.ok) {

        throw new Error(
            data.error ||
            "Chat request failed"
        );
    }

    return (
        data.reply ||
        data.message ||
        "Sorry friend, I didn't get a response."
    );
}

// ======================================================
// ADD MESSAGE
// ======================================================

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
    content.appendChild(textElement);

    // AI ACTIONS
    if (role === "ai") {

        const actions =
            document.createElement("div");

        actions.style.display = "flex";
        actions.style.gap = "6px";
        actions.style.marginTop = "10px";
        actions.style.flexWrap = "wrap";

        // COPY
        const copy =
            document.createElement("button");

        copy.textContent =
            "📋 Copy";

        copy.onclick =
            async function () {

                try {

                    await navigator.clipboard
                        .writeText(text);

                    copy.textContent =
                        "✓ Copied";

                    setTimeout(() => {

                        copy.textContent =
                            "📋 Copy";

                    }, 1200);

                } catch {

                    console.log(
                        "Copy failed"
                    );
                }
            };

        // SPEAKER
        const speaker =
            document.createElement("button");

        speaker.textContent =
            "🔊 Speak";

        speaker.onclick =
            function () {

                if (!voiceEnabled) {

                    voiceEnabled = true;

                    saveVoiceSettings();

                    updateVoiceButton();
                }

                speak(text);
            };

        // LIKE
        const like =
            document.createElement("button");

        like.textContent =
            "👍 Like";

        like.onclick =
            function () {

                like.textContent =
                    "👍 Liked";
            };

        actions.appendChild(copy);
        actions.appendChild(speaker);
        actions.appendChild(like);

        content.appendChild(actions);
    }

    message.appendChild(avatar);
    message.appendChild(content);

    conversation.appendChild(message);

    messages.push({
        role: role,
        content: text
    });

    if (save) {
        saveCurrentChat();
    }

    scrollToBottom();
}

// ======================================================
// SEND MESSAGE
// ======================================================

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

    // VOICE COMMAND
    if (handleVoiceCommand(text)) {

        addMessage(
            "user",
            text,
            true
        );

        isSending = false;
        sendButton.disabled = false;

        return;
    }

    // USER MESSAGE
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

        saveCurrentChat();

    } catch (error) {

        console.error(
            "Viggo chat error:",
            error
        );

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

// ======================================================
// ENTER KEY
// ======================================================

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
// NEW CHAT
// ======================================================

if (newChatButton) {

    newChatButton.addEventListener(
        "click",
        function () {

            messages = [];

            currentChatId = null;

            conversation.innerHTML =
                "";

            currentTitle.textContent =
                "New Chat";

            messageInput.value = "";

            renderHistory();
        }
    );
}

// ======================================================
// SAVE CHAT
// ======================================================

function saveCurrentChat() {

    if (
        !messages ||
        messages.length === 0
    ) {
        return;
    }

    const chats =
        getChats();

    const firstUser =
        messages.find(
            m => m.role === "user"
        );

    const title =
        firstUser
            ? firstUser.content.substring(
                0,
                40
            )
            : "New Chat";

    if (!currentChatId) {

        currentChatId =
            Date.now().toString();
    }

    const oldChat =
        chats.find(
            c =>
                c.id === currentChatId
        );

    const chat = {

        id: currentChatId,

        title: title,

        messages: messages,

        pinned:
            oldChat
                ? oldChat.pinned
                : false,

        time:
            new Date().toISOString()
    };

    const index =
        chats.findIndex(
            c =>
                c.id === currentChatId
        );

    if (index >= 0) {

        chats[index] = chat;

    } else {

        chats.unshift(chat);
    }

    saveChats(chats);

    currentTitle.textContent =
        title;

    renderHistory();
}

// ======================================================
// LOAD CHAT
// ======================================================

function loadChat(chat) {

    currentChatId =
        chat.id;

    messages =
        Array.isArray(chat.messages)
            ? chat.messages
            : [];

    conversation.innerHTML =
        "";

    currentTitle.textContent =
        chat.title ||
        "Chat";

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

// ======================================================
// RENDER HISTORY
// ======================================================

function renderHistory() {

    const chats =
        getChats();

    if (pinnedList) {
        pinnedList.innerHTML = "";
    }

    if (recentList) {
        recentList.innerHTML = "";
    }

    if (historyList) {
        historyList.innerHTML = "";
    }

    const pinned =
        chats.filter(
            chat => chat.pinned
        );

    const recent =
        chats.filter(
            chat => !chat.pinned
        );

    // PINNED
    if (pinned.length === 0) {

        if (pinnedList) {

            pinnedList.innerHTML =
                `<div class="empty-sidebar">
                    No pinned chats
                </div>`;
        }

    } else {

        pinned.forEach(
            chat =>
                createSidebarChat(
                    chat,
                    pinnedList
                )
        );
    }

    // RECENT
    if (recent.length === 0) {

        if (recentList) {

            recentList.innerHTML =
                `<div class="empty-sidebar">
                    No recent chats
                </div>`;
        }

    } else {

        recent.forEach(
            chat =>
                createSidebarChat(
                    chat,
                    recentList
                )
        );
    }

    // MODAL
    if (!historyList) {
        return;
    }

    if (chats.length === 0) {

        historyList.innerHTML =
            "<p>No chat history yet.</p>";

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

        open.onclick =
            function () {

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

        pin.onclick =
            function () {

                togglePin(chat.id);
            };

        // DELETE
        const del =
            document.createElement("button");

        del.className =
            "delete-button";

        del.textContent =
            "🗑 Delete";

        del.onclick =
            function () {

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

// ======================================================
// SIDEBAR CHAT
// ======================================================

function createSidebarChat(
    chat,
    container
) {

    if (!container) {
        return;
    }

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

    button.onclick =
        function () {

            loadChat(chat);
        };

    container.appendChild(button);
}

// ======================================================
// PIN
// ======================================================

function togglePin(id) {

    const chats =
        getChats();

    const chat =
        chats.find(
            c => c.id === id
        );

    if (!chat) {
        return;
    }

    chat.pinned =
        !chat.pinned;

    saveChats(chats);

    renderHistory();
}

// ======================================================
// DELETE
// ======================================================

function deleteChat(id) {

    const chats =
        getChats();

    const updated =
        chats.filter(
            c => c.id !== id
        );

    saveChats(updated);

    if (currentChatId === id) {

        currentChatId = null;

        messages = [];

        conversation.innerHTML =
            "";

        currentTitle.textContent =
            "New Chat";
    }

    renderHistory();
}

// ======================================================
// HISTORY BUTTON
// ======================================================

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

// ======================================================
// CLOSE HISTORY
// ======================================================

if (closeHistory) {

    closeHistory.addEventListener(
        "click",
        function () {

            historyModal.style.display =
                "none";
        }
    );
}

// ======================================================
// SAVE BUTTON
// ======================================================

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

// ======================================================
// CLEAR HISTORY
// ======================================================

if (clearHistoryButton) {

    clearHistoryButton.addEventListener(
        "click",
        function () {

            localStorage.removeItem(
                "viggo_chats"
            );

            currentChatId = null;

            messages = [];

            conversation.innerHTML =
                "";

            currentTitle.textContent =
                "New Chat";

            renderHistory();
        }
    );
}

// ======================================================
// VOICE TOGGLE
// ======================================================

if (voiceToggle) {

    voiceToggle.addEventListener(
        "click",
        function () {

            voiceEnabled =
                !voiceEnabled;

            saveVoiceSettings();

            updateVoiceButton();

            if (!voiceEnabled) {

                if (
                    "speechSynthesis"
                    in window
                ) {

                    window.speechSynthesis
                        .cancel();
                }

            } else {

                speak(
                    "Okay friend, voice is on."
                );
            }
        }
    );
}

// ======================================================
// MICROPHONE
// ======================================================

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

            if (
                handleVoiceCommand(text)
            ) {

                messageInput.value =
                    "";

                return;
            }

            sendMessage();
        };

    recognition.onerror =
        function (event) {

            console.error(
                "Mic error:",
                event.error
            );
        };

    if (micButton) {

        micButton.addEventListener(
            "click",
            function () {

                try {

                    recognition.start();

                } catch {

                    console.log(
                        "Mic already running"
                    );
                }
            }
        );
    }

} else {

    if (micButton) {

        micButton.addEventListener(
            "click",
            function () {

                alert(
                    "Voice input is not supported in this browser."
                );
            }
        );
    }
}

// ======================================================
// SHARE WHOLE CHAT
// ======================================================

async function shareWholeChat() {

    if (!messages.length) {

        alert(
            "No messages to share."
        );

        return;
    }

    let text =
        "Viggo Chat\n\n";

    messages.forEach(
        message => {

            text +=
                message.role === "user"
                    ? "You:\n"
                    : "Viggo:\n";

            text +=
                message.content +
                "\n\n";
        }
    );

    try {

        if (navigator.share) {

            await navigator.share({

                title:
                    "Viggo Chat",

                text:
                    text
            });

        } else {

            await navigator.clipboard
                .writeText(text);

            alert(
                "Whole chat copied."
            );
        }

    } catch {

        console.log(
            "Share cancelled"
        );
    }
}

// ======================================================
// SHARE BUTTON
// ======================================================

function createShareButton() {

    const topbar =
        document.querySelector(
            ".topbar"
        );

    if (!topbar) {
        return;
    }

    if (
        document.getElementById(
            "viggoShareButton"
        )
    ) {
        return;
    }

    const button =
        document.createElement("button");

    button.id =
        "viggoShareButton";

    button.textContent =
        "↗ Share";

    button.style.marginLeft =
        "auto";

    button.style.border =
        "0";

    button.style.borderRadius =
        "8px";

    button.style.padding =
        "8px 12px";

    button.style.cursor =
        "pointer";

    button.onclick =
        shareWholeChat;

    topbar.appendChild(
        button
    );
}

// ======================================================
// MOBILE MENU
// ======================================================

if (mobileMenu) {

    mobileMenu.addEventListener(
        "click",
        function () {

            sidebar.classList.toggle(
                "open"
            );
        }
    );
}

// ======================================================
// SCROLL
// ======================================================

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

// ======================================================
// START
// ======================================================

updateVoiceButton();

loadVoices();

renderHistory();

createShareButton();

console.log(
    "================================"
);

console.log(
    "VIGGO AI READY"
);

console.log(
    "Server:",
    SERVER_URL
);

console.log(
    "Voice:",
    voiceEnabled
);

console.log(
    "================================"
);
