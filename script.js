// ======================================================
// VIGGO AI - FULL SCRIPT
// Server + Chat + Voice + Female/Male Voice + History
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
const clearHistoryButton = document.getElementById("clearHistory");

const historyModal = document.getElementById("historyModal");
const closeHistory = document.getElementById("closeHistory");
const historyList = document.getElementById("historyList");

const pinnedList = document.getElementById("pinnedList");
const recentList = document.getElementById("recentList");

const mobileMenu = document.getElementById("mobileMenu");
const sidebar = document.getElementById("sidebar");

const voiceToggle = document.getElementById("voiceToggle");

// ======================================================
// STATE
// ======================================================

let messages = [];
let currentChatId = null;
let isSending = false;

let voiceEnabled =
    localStorage.getItem("viggo_voice_enabled") !== "false";

let selectedVoiceName =
    localStorage.getItem("viggo_voice_name") || "";

let selectedGender =
    localStorage.getItem("viggo_voice_gender") || "female";

let recognition = null;

let availableVoices = [];

// ======================================================
// STORAGE
// ======================================================

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

// ======================================================
// VOICE STORAGE
// ======================================================

function saveVoiceSettings() {
    localStorage.setItem(
        "viggo_voice_enabled",
        voiceEnabled
    );

    localStorage.setItem(
        "viggo_voice_name",
        selectedVoiceName
    );

    localStorage.setItem(
        "viggo_voice_gender",
        selectedGender
    );
}

// ======================================================
// LOAD BROWSER VOICES
// ======================================================

function loadVoices() {

    if (!("speechSynthesis" in window)) {
        return;
    }

    availableVoices =
        window.speechSynthesis.getVoices();

    console.log(
        "Viggo voices:",
        availableVoices
    );

    if (!selectedVoiceName) {

        const preferred =
            findVoiceByGender(
                selectedGender
            );

        if (preferred) {

            selectedVoiceName =
                preferred.name;

            saveVoiceSettings();
        }
    }
}

// Some browsers load voices later
if ("speechSynthesis" in window) {

    window.speechSynthesis.onvoiceschanged =
        loadVoices;

    setTimeout(
        loadVoices,
        500
    );

    setTimeout(
        loadVoices,
        1500
    );
}

// ======================================================
// FIND FEMALE / MALE VOICE
// ======================================================

function findVoiceByGender(gender) {

    if (!availableVoices.length) {
        return null;
    }

    const femaleWords = [
        "female",
        "woman",
        "girl",
        "zira",
        "samantha",
        "susan",
        "karen",
        "hazel",
        "aria",
        "jenny",
        "sonia",
        "neerja",
        "heera",
        "veena"
    ];

    const maleWords = [
        "male",
        "man",
        "boy",
        "david",
        "mark",
        "daniel",
        "george",
        "ryan",
        "guy",
        "roger",
        "ravi",
        "hemant"
    ];

    const words =
        gender === "female"
            ? femaleWords
            : maleWords;

    // First try matching name
    let voice =
        availableVoices.find(v => {

            const name =
                v.name.toLowerCase();

            return words.some(
                word =>
                    name.includes(word)
            );

        });

    if (voice) {
        return voice;
    }

    // Prefer English India
    voice =
        availableVoices.find(v =>
            v.lang.toLowerCase() === "en-in"
        );

    if (voice) {
        return voice;
    }

    // English voice
    voice =
        availableVoices.find(v =>
            v.lang.toLowerCase().startsWith("en")
        );

    if (voice) {
        return voice;
    }

    return availableVoices[0];
}

// ======================================================
// CHANGE VOICE
// ======================================================

function changeVoice(gender) {

    loadVoices();

    const voice =
        findVoiceByGender(gender);

    if (!voice) {

        speak(
            "Sorry friend, this device does not have a suitable voice."
        );

        return false;
    }

    selectedGender = gender;
    selectedVoiceName = voice.name;

    saveVoiceSettings();

    const message =
        gender === "female"
            ? "Okay friend, female voice changed."
            : "Okay friend, male voice changed.";

    speak(message);

    return true;
}

// ======================================================
// SPEAK
// ======================================================

function speak(text) {

    if (!voiceEnabled) {
        return;
    }

    if (!("speechSynthesis" in window)) {

        console.log(
            "Speech synthesis not supported."
        );

        return;
    }

    window.speechSynthesis.cancel();

    loadVoices();

    let voice = null;

    // Selected exact voice
    if (selectedVoiceName) {

        voice =
            availableVoices.find(
                v =>
                    v.name === selectedVoiceName
            );
    }

    // Fallback
    if (!voice) {

        voice =
            findVoiceByGender(
                selectedGender
            );
    }

    const speech =
        new SpeechSynthesisUtterance(text);

    if (voice) {
        speech.voice = voice;
    }

    // Language
    if (
        voice &&
        voice.lang
    ) {

        speech.lang =
            voice.lang;

    } else {

        speech.lang =
            "en-IN";

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
// VOICE COMMAND DETECTOR
// ======================================================

function handleVoiceCommand(text) {

    const command =
        text
            .toLowerCase()
            .trim();

    // ------------------------------------------
    // FEMALE VOICE
    // ------------------------------------------

    const femaleCommands = [
        "female voice",
        "change to female voice",
        "switch to female voice",
        "female voice please",
        "female voice change",
        "பெண் குரல்",
        "பெண் வாய்ஸ்",
        "பெண் voice",
        "female voice க்கு change பண்ணு",
        "female voice க்கு மாற்று"
    ];

    if (
        femaleCommands.some(
            item =>
                command.includes(
                    item.toLowerCase()
                )
        )
    ) {

        changeVoice("female");

        return true;
    }

    // ------------------------------------------
    // MALE VOICE
    // ------------------------------------------

    const maleCommands = [
        "male voice",
        "change to male voice",
        "switch to male voice",
        "male voice please",
        "male voice change",
        "ஆண் குரல்",
        "ஆண் வாய்ஸ்",
        "ஆண் voice",
        "male voice க்கு change பண்ணு",
        "male voice க்கு மாற்று"
    ];

    if (
        maleCommands.some(
            item =>
                command.includes(
                    item.toLowerCase()
                )
        )
    ) {

        changeVoice("male");

        return true;
    }

    // ------------------------------------------
    // VOICE OFF
    // ------------------------------------------

    const offCommands = [
        "voice off",
        "turn off voice",
        "switch off voice",
        "stop voice",
        "mute voice",
        "voice disable",
        "வாய்ஸ் ஆஃப்",
        "வாய்ஸ் off",
        "voice off பண்ணு"
    ];

    if (
        offCommands.some(
            item =>
                command.includes(
                    item.toLowerCase()
                )
        )
    ) {

        voiceEnabled = false;

        saveVoiceSettings();

        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }

        return true;
    }

    // ------------------------------------------
    // VOICE ON
    // ------------------------------------------

    const onCommands = [
        "voice on",
        "turn on voice",
        "switch on voice",
        "enable voice",
        "start voice",
        "வாய்ஸ் ஆன்",
        "வாய்ஸ் on",
        "voice on பண்ணு"
    ];

    if (
        onCommands.some(
            item =>
                command.includes(
                    item.toLowerCase()
                )
        )
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
// VOICE BUTTON UPDATE
// ======================================================

function updateVoiceButton() {

    if (!voiceToggle) {
        return;
    }

    voiceToggle.textContent =
        voiceEnabled
            ? "🔊 Voice ON"
            : "🔇 Voice OFF";
}

updateVoiceButton();

// ======================================================
// CHECK SERVER
// ======================================================

async function checkServer() {

    try {

        const response =
            await fetch(
                `${SERVER_URL}/api/health`,
                {
                    method: "GET",
                    headers: {
                        "Accept":
                            "application/json"
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
            "Server connection error:",
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
            `${SERVER_URL}/api/chat`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    "Accept":
                        "application/json"
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

// ======================================================
// ADD MESSAGE
// ======================================================

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

    const textDiv =
        document.createElement("div");

    textDiv.className =
        "message-text";

    textDiv.textContent =
        text;

    content.appendChild(name);
    content.appendChild(textDiv);

    // ==================================================
    // AI BUTTONS
    // ==================================================

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

        // ----------------------------------------------
        // COPY
        // ----------------------------------------------

        const copyButton =
            document.createElement("button");

        copyButton.textContent =
            "📋 Copy";

        copyButton.style.cursor =
            "pointer";

        copyButton.onclick =
            async () => {

                try {

                    await navigator.clipboard
                        .writeText(text);

                    copyButton.textContent =
                        "✓ Copied";

                    setTimeout(() => {

                        copyButton.textContent =
                            "📋 Copy";

                    }, 1500);

                } catch {

                    console.log(
                        "Copy failed"
                    );

                }
            };

        // ----------------------------------------------
        // SPEAKER
        // ----------------------------------------------

        const speakerButton =
            document.createElement("button");

        speakerButton.textContent =
            voiceEnabled
                ? "🔊 Speak"
                : "🔇 Voice OFF";

        speakerButton.style.cursor =
            "pointer";

        speakerButton.onclick =
            () => {

                if (!voiceEnabled) {

                    voiceEnabled =
                        true;

                    saveVoiceSettings();

                    updateVoiceButton();
                }

                speak(text);
            };

        // ----------------------------------------------
        // LIKE
        // ----------------------------------------------

        const likeButton =
            document.createElement("button");

        likeButton.textContent =
            "👍 Like";

        likeButton.style.cursor =
            "pointer";

        likeButton.onclick =
            () => {

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

    messageDiv.appendChild(
        avatar
    );

    messageDiv.appendChild(
        content
    );

    conversation.appendChild(
        messageDiv
    );

    // Save in state
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

    // ----------------------------------------------
    // Check voice commands FIRST
    // ----------------------------------------------

    const isVoiceCommand =
        handleVoiceCommand(text);

    if (isVoiceCommand) {

        addMessage(
            "user",
            text,
            false
        );

        // Don't send voice command to AI
        isSending = false;

        sendButton.disabled = false;

        return;
    }

    // ----------------------------------------------
    // Normal user message
    // ----------------------------------------------

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

        isSending = false;

        sendButton.disabled = false;

        messageInput.focus();
    }
}

// ======================================================
// ENTER KEY
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
// SEND BUTTON
// ======================================================

sendButton.addEventListener(
    "click",
    sendMessage
);

// ======================================================
// NEW CHAT
// ======================================================

newChatButton.addEventListener(
    "click",
    () => {

        messages = [];

        currentChatId = null;

        conversation.innerHTML =
            "";

        currentTitle.textContent =
            "New Chat";

        messageInput.value =
            "";

        renderHistory();
    }
);

// ======================================================
// SAVE CHAT
// ======================================================

function saveCurrentChat() {

    if (!messages.length) {
        return;
    }

    const chats =
        getChats();

    const firstUser =
        messages.find(
            item =>
                item.role === "user"
        );

    const title =
        firstUser
            ? firstUser.content.slice(
                0,
                40
            )
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
        chat.title || "Chat";

    messages.forEach(
        item => {

            addMessage(
                item.role,
                item.content,
                false
            );
        }
    );

    scrollToBottom();
}

// ======================================================
// HISTORY
// ======================================================

function renderHistory() {

    const chats =
        getChats();

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
            chat => chat.pinned
        );

    const recent =
        chats.filter(
            chat => !chat.pinned
        );

    if (
        pinnedList &&
        pinned.length === 0
    ) {

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

    if (
        recentList &&
        recent.length === 0
    ) {

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

    if (!historyList) {
        return;
    }

    if (!chats.length) {

        historyList.innerHTML =
            "<p>No chat history.</p>";

        return;
    }

    chats.forEach(chat => {

        const card =
            document.createElement("div");

        card.className =
            "history-card";

        if (chat.pinned) {
            card.classList.add(
                "pinned"
            );
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

        // Open
        const open =
            document.createElement("button");

        open.textContent =
            "Open";

        open.onclick =
            () => {

                loadChat(chat);

                historyModal.style.display =
                    "none";
            };

        // Pin
        const pin =
            document.createElement("button");

        pin.className =
            "pin-button";

        pin.textContent =
            chat.pinned
                ? "📌 Unpin"
                : "📌 Pin";

        pin.onclick =
            () => {

                togglePin(
                    chat.id
                );
            };

        // Delete
        const del =
            document.createElement("button");

        del.className =
            "delete-button";

        del.textContent =
            "🗑 Delete";

        del.onclick =
            () => {

                deleteChat(
                    chat.id
                );
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
        () => {

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
            item =>
                item.id === id
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
            chat =>
                chat.id !== id
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

historyButton.addEventListener(
    "click",
    () => {

        renderHistory();

        historyModal.style.display =
            "block";
    }
);

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

// ======================================================
// SAVE BUTTON
// ======================================================

saveButton.addEventListener(
    "click",
    () => {

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

// ======================================================
// CLEAR HISTORY
// ======================================================

clearHistoryButton.addEventListener(
    "click",
    () => {

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

// ======================================================
// VOICE TOGGLE BUTTON
// ======================================================

if (voiceToggle) {

    voiceToggle.addEventListener(
        "click",
        () => {

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
// MOBILE MENU
// ======================================================

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
        () => {

            micButton.classList.add(
                "listening"
            );
        };

    recognition.onend =
        () => {

            micButton.classList.remove(
                "listening"
            );
        };

    recognition.onresult =
        event => {

            const text =
                event
                    .results[0][0]
                    .transcript;

            messageInput.value =
                text;

            messageInput.focus();

            // Automatically process voice command
            if (
                handleVoiceCommand(
                    text
                )
            ) {

                messageInput.value =
                    "";

                return;
            }

            sendMessage();
        };

    recognition.onerror =
        event => {

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

            } catch {

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

    messages.forEach(item => {

        text +=
            `${
                item.role === "user"
                    ? "You"
                    : "Viggo"
            }:\n`;

        text +=
            `${item.content}\n\n`;
    });

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
            "Share cancelled."
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

    // Don't create twice
    if (
        document.getElementById(
            "viggoShareButton"
        )
    ) {
        return;
    }

    const share =
        document.createElement("button");

    share.id =
        "viggoShareButton";

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

renderHistory();

createShareButton();

loadVoices();

checkServer();

console.log(
    "================================"
);

console.log(
    "VIGGO AI FRONTEND READY"
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
    "Gender:",
    selectedGender
);

console.log(
    "================================"
);
