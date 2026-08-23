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

const sidebar = document.getElementById("sidebar");
const openSidebar = document.getElementById("openSidebar");
const closeSidebar = document.getElementById("closeSidebar");

const newChat = document.getElementById("newChat");
const searchChat = document.getElementById("searchChat");
const chatHistory = document.getElementById("chatHistory");

const conversation = document.getElementById("conversation");
const message = document.getElementById("message");
const send = document.getElementById("send");
const mic = document.getElementById("mic");

const plusBtn = document.getElementById("plusBtn");
const plusMenu = document.getElementById("plusMenu");

const shareBtn = document.getElementById("shareBtn");

const moreBtn = document.getElementById("moreBtn");
const moreMenu = document.getElementById("moreMenu");

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
fileInput.accept = "*/*";
fileInput.style.display = "none";
document.body.appendChild(fileInput);


/* =====================================================
   CHAT DATA
===================================================== */

let chats = [];

try {

    chats =
        JSON.parse(
            localStorage.getItem("viggoChats") || "[]"
        );

} catch (error) {

    console.error(
        "Chat storage error:",
        error
    );

    chats = [];
}


let currentChatId =
    localStorage.getItem(
        "viggoCurrentChatId"
    );


let selectingChats = false;


let pinnedChats = [];

try {

    pinnedChats =
        JSON.parse(
            localStorage.getItem(
                "viggoPinnedChats"
            ) || "[]"
        );

} catch (error) {

    pinnedChats = [];
}


/* =====================================================
   SPEAKER STATE
===================================================== */

let speakerEnabled =
    localStorage.getItem(
        "viggoSpeakerEnabled"
    ) !== "false";

let currentSpeakingButton = null;


/* =====================================================
   SAVE
===================================================== */

function saveChats() {

    localStorage.setItem(
        "viggoChats",
        JSON.stringify(chats)
    );


    if (currentChatId) {

        localStorage.setItem(
            "viggoCurrentChatId",
            String(currentChatId)
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

        createdAt: Date.now(),

        selected: false
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
   DELETE CHAT
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
            chats.length
                ? chats[0].id
                : null;
    }


    saveChats();

    renderHistory();

    renderConversation();
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


    filtered.forEach(chat => {

        const item =
            document.createElement("div");


        item.className =
            "history-item";


        if (
            String(chat.id) ===
            String(currentChatId)
        ) {

            item.classList.add("active");
        }


        const title =
            document.createElement("div");


        title.className =
            "history-chat-title";


        title.textContent =
            chat.title || "New Chat";


        const actions =
            document.createElement("div");


        actions.className =
            "history-actions";


        /* SELECT */

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


            check.addEventListener(
                "click",
                event => {

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


        /* PIN */

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
            event => {

                event.stopPropagation();

                togglePinChat(chat.id);
            }
        );


        actions.appendChild(pinBtn);


        /* DELETE */

        const deleteBtn =
            document.createElement("button");


        deleteBtn.type = "button";


        deleteBtn.className =
            "history-action-btn";


        deleteBtn.textContent =
            "🗑️";


        deleteBtn.title =
            "Delete";


        deleteBtn.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                deleteChat(chat.id);
            }
        );


        actions.appendChild(deleteBtn);


        item.appendChild(title);

        item.appendChild(actions);


        /* OPEN CHAT */

        item.addEventListener(
            "click",
            () => {

                if (selectingChats) {

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
                    window.innerWidth <= 768
                ) {

                    sidebar?.classList.remove(
                        "open"
                    );
                }
            }
        );


        chatHistory.appendChild(item);
    });
}


/* =====================================================
   SPEAKER FUNCTION
===================================================== */

function speakText(
    text,
    button = null
) {

    if (!speakerEnabled) return;


    if (
        !("speechSynthesis" in window)
    ) {

        alert(
            "Speaker is not supported in this browser."
        );

        return;
    }


    window.speechSynthesis.cancel();


    const speech =
        new SpeechSynthesisUtterance(
            text
        );


    const language =
        localStorage.getItem(
            "viggoLanguage"
        ) || "en-IN";


    speech.lang = language;

    speech.rate = 1;

    speech.pitch = 1;

    speech.volume = 1;


    currentSpeakingButton =
        button;


    if (button) {

        button.textContent =
            "🔊 Speaking...";
    }


    speech.onend =
        () => {

            if (button) {

                button.textContent =
                    speakerEnabled
                        ? "🔊 Speaker ON"
                        : "🔇 Speaker OFF";
            }


            currentSpeakingButton =
                null;
        };


    speech.onerror =
        () => {

            if (button) {

                button.textContent =
                    speakerEnabled
                        ? "🔊 Speaker ON"
                        : "🔇 Speaker OFF";
            }


            currentSpeakingButton =
                null;
        };


    window.speechSynthesis.speak(
        speech
    );
}


/* =====================================================
   TOGGLE SPEAKER
===================================================== */

function toggleSpeaker(
    text,
    button
) {

    if (
        !("speechSynthesis" in window)
    ) {

        alert(
            "Speaker is not supported in this browser."
        );

        return;
    }


    /* SPEAKER ON */

    if (!speakerEnabled) {

        speakerEnabled = true;


        localStorage.setItem(
            "viggoSpeakerEnabled",
            "true"
        );


        button.textContent =
            "🔊 Speaker ON";


        speakText(
            text,
            button
        );


        return;
    }


    /* STOP CURRENT SPEECH */

    if (
        window.speechSynthesis.speaking ||
        window.speechSynthesis.pending
    ) {

        window.speechSynthesis.cancel();


        speakerEnabled = false;


        localStorage.setItem(
            "viggoSpeakerEnabled",
            "false"
        );


        button.textContent =
            "🔇 Speaker OFF";


        return;
    }


    /* SPEAK */

    speakText(
        text,
        button
    );
}


/* =====================================================
   ADD MESSAGE UI
===================================================== */

function addMessageToUI(
    role,
    text
) {

    if (!conversation) return;


    const wrapper =
        document.createElement("div");


    wrapper.className =
        "message " +
        (
            role === "user"
                ? "user"
                : "ai"
        );


    const content =
        document.createElement("div");


    content.className =
        "message-content";


    const bubble =
        document.createElement("div");


    bubble.className =
        "message-bubble";


    bubble.textContent =
        text;


    content.appendChild(bubble);


    /* =================================================
       ACTIONS
    ================================================= */

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


    saveBtn.addEventListener(
        "click",
        () => {

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


    copyBtn.addEventListener(
        "click",
        async () => {

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

                const temp =
                    document.createElement(
                        "textarea"
                    );


                temp.value = text;


                document.body.appendChild(
                    temp
                );


                temp.select();


                document.execCommand(
                    "copy"
                );


                temp.remove();


                copyBtn.textContent =
                    "✓ Copied";


                setTimeout(
                    () => {

                        copyBtn.textContent =
                            "📋 Copy";

                    },
                    1200
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


    likeBtn.addEventListener(
        "click",
        () => {

            likeBtn.textContent =
                likeBtn.textContent ===
                "👍 Like"
                    ? "👍 Liked"
                    : "👍 Like";
        }
    );


    /* =================================================
       SPEAKER ON / OFF
    ================================================= */

    const speakerBtn =
        document.createElement("button");


    speakerBtn.type = "button";


    speakerBtn.textContent =
        speakerEnabled
            ? "🔊 Speaker ON"
            : "🔇 Speaker OFF";


    speakerBtn.addEventListener(
        "click",
        () => {

            toggleSpeaker(
                text,
                speakerBtn
            );
        }
    );


    actions.appendChild(saveBtn);

    actions.appendChild(copyBtn);

    actions.appendChild(likeBtn);

    actions.appendChild(speakerBtn);


    content.appendChild(actions);

    wrapper.appendChild(content);


    conversation.appendChild(wrapper);


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


    chat.messages.forEach(msg => {

        addMessageToUI(
            msg.role,
            msg.text
        );
    });
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
            text.substring(0, 30);
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


    /* USER MESSAGE */

    addMessage(
        "user",
        text
    );


    message.value = "";


    /* DISABLE SEND */

    if (send) {

        send.disabled = true;
    }


    /* TYPING */

    const typing =
        document.createElement("div");


    typing.className =
        "message ai typing-message";


    typing.innerHTML =
        '<div class="message-content">' +
        '<div class="message-bubble">Thinking...</div>' +
        '</div>';


    conversation?.appendChild(
        typing
    );


    if (conversation) {

        conversation.scrollTop =
            conversation.scrollHeight;
    }


    try {

        console.log(
            "Viggo AI Request:",
            text
        );


        const response =
            await fetch(
                API_URL,
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


        if (!response.ok) {

            throw new Error(
                "Server error: " +
                response.status
            );
        }


        const data =
            await response.json();


        typing.remove();


        const reply =
            data.reply ||
            data.response ||
            data.text ||
            data.message ||
            "Sorry, I couldn't get a response.";


        addMessage(
            "assistant",
            String(reply)
        );


    } catch (error) {

        console.error(
            "Viggo AI Error:",
            error
        );


        typing.remove();


        addMessage(
            "assistant",
            "Sorry friend, I couldn't connect to Viggo AI right now."
        );

    } finally {

        if (send) {

            send.disabled = false;
        }


        message.focus();
    }
}


/* =====================================================
   SIDEBAR
===================================================== */

if (openSidebar) {

    openSidebar.addEventListener(
        "click",
        event => {

            event.stopPropagation();


            sidebar?.classList.add(
                "open"
            );
        }
    );
}


if (closeSidebar) {

    closeSidebar.addEventListener(
        "click",
        event => {

            event.stopPropagation();


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
        event => {

            event.preventDefault();


            createChat();
        }
    );
}


/* =====================================================
   SEND BUTTON
===================================================== */

if (send) {

    send.addEventListener(
        "click",
        event => {

            event.preventDefault();


            sendMessage();
        }
    );
}


/* =====================================================
   ENTER TO SEND
===================================================== */

if (message) {

    message.addEventListener(
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
}


/* =====================================================
   SEARCH
===================================================== */

if (searchChat) {

    searchChat.addEventListener(
        "input",
        () => {

            renderHistory(
                searchChat.value
            );
        }
    );
}


/* =====================================================
   PLUS BUTTON
===================================================== */

if (plusBtn) {

    plusBtn.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();


            if (!plusMenu) return;


            const isOpen =
                plusMenu.classList.contains(
                    "show"
                );


            plusMenu.classList.toggle(
                "show",
                !isOpen
            );


            plusMenu.classList.toggle(
                "open",
                !isOpen
            );
        }
    );
}


/* =====================================================
   MORE BUTTON
===================================================== */

if (moreBtn) {

    moreBtn.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();


            if (!moreMenu) return;


            const isOpen =
                moreMenu.classList.contains(
                    "show"
                );


            moreMenu.classList.toggle(
                "show",
                !isOpen
            );


            moreMenu.classList.toggle(
                "open",
                !isOpen
            );
        }
    );
}


/* =====================================================
   CLOSE MENUS
===================================================== */

document.addEventListener(
    "click",
    event => {

        if (
            plusMenu &&
            plusBtn &&
            !plusMenu.contains(event.target) &&
            !plusBtn.contains(event.target)
        ) {

            plusMenu.classList.remove(
                "show"
            );

            plusMenu.classList.remove(
                "open"
            );
        }


        if (
            moreMenu &&
            moreBtn &&
            !moreMenu.contains(event.target) &&
            !moreBtn.contains(event.target)
        ) {

            moreMenu.classList.remove(
                "show"
            );

            moreMenu.classList.remove(
                "open"
            );
        }
    }
);


/* =====================================================
   PHOTO
===================================================== */

photoInput.addEventListener(
    "change",
    () => {

        const file =
            photoInput.files[0];


        if (!file) return;


        addMessage(
            "user",
            "📷 Photo selected: " +
            file.name
        );


        photoInput.value = "";
    }
);


/* =====================================================
   VIDEO
===================================================== */

videoInput.addEventListener(
    "change",
    () => {

        const file =
            videoInput.files[0];


        if (!file) return;


        addMessage(
            "user",
            "🎥 Video selected: " +
            file.name
        );


        videoInput.value = "";
    }
);


/* =====================================================
   FILE
===================================================== */

fileInput.addEventListener(
    "change",
    () => {

        const file =
            fileInput.files[0];


        if (!file) return;


        addMessage(
            "user",
            "📎 File selected: " +
            file.name
        );


        fileInput.value = "";
    }
);


/* =====================================================
   PLUS MENU ACTIONS
===================================================== */

document.addEventListener(
    "click",
    event => {

        const target =
            event.target.closest(
                "[data-action]"
            );


        if (!target) return;


        const action =
            target.dataset.action;


        if (action === "photo") {

            photoInput.click();
        }


        if (action === "video") {

            videoInput.click();
        }


        if (action === "file") {

            fileInput.click();
        }


        if (action === "voice") {

            startVoiceRecognition();
        }


        if (action === "new-chat") {

            createChat();
        }


        plusMenu?.classList.remove(
            "show"
        );


        plusMenu?.classList.remove(
            "open"
        );
    }
);


/* =====================================================
   VOICE RECOGNITION
===================================================== */

let recognition = null;


function startVoiceRecognition() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        alert(
            "Voice input is not supported in this browser."
        );

        return;
    }


    recognition =
        new SpeechRecognition();


    const language =
        localStorage.getItem(
            "viggoLanguage"
        ) || "en-IN";


    recognition.lang =
        language;


    recognition.interimResults =
        false;


    recognition.continuous =
        false;


    recognition.onstart =
        () => {

            if (mic) {

                mic.classList.add(
                    "active"
                );
            }
        };


    recognition.onresult =
        event => {

            const result =
                event.results[0][0].transcript;


            if (message) {

                message.value =
                    result;


                message.focus();
            }
        };


    recognition.onerror =
        error => {

            console.error(
                "Voice error:",
                error
            );
        };


    recognition.onend =
        () => {

            if (mic) {

                mic.classList.remove(
                    "active"
                );
            }
        };


    recognition.start();
}


/* =====================================================
   MIC BUTTON
===================================================== */

if (mic) {

    mic.addEventListener(
        "click",
        event => {

            event.preventDefault();


            startVoiceRecognition();
        }
    );
}


/* =====================================================
   PLUS VOICE
===================================================== */

if (plusVoiceBtn) {

    plusVoiceBtn.addEventListener(
        "click",
        event => {

            event.preventDefault();


            startVoiceRecognition();
        }
    );
}


/* =====================================================
   MORE MENU
===================================================== */

if (voiceMenuBtn) {

    voiceMenuBtn.addEventListener(
        "click",
        () => {

            startVoiceRecognition();


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
        () => {

            const languages = [
                "en-IN",
                "ta-IN",
                "hi-IN"
            ];


            const current =
                localStorage.getItem(
                    "viggoLanguage"
                ) || "en-IN";


            const index =
                languages.indexOf(current);


            const next =
                languages[
                    (index + 1) %
                    languages.length
                ];


            localStorage.setItem(
                "viggoLanguage",
                next
            );


            alert(
                "Language: " + next
            );
        }
    );
}


/* =====================================================
   CLEAR CURRENT CHAT
===================================================== */

if (clearChatBtn) {

    clearChatBtn.addEventListener(
        "click",
        () => {

            const chat =
                getCurrentChat();


            if (!chat) return;


            chat.messages = [];


            chat.title =
                "New Chat";


            saveChats();


            renderHistory();


            renderConversation();


            moreMenu?.classList.remove(
                "show"
            );
        }
    );
}


/* =====================================================
   SAVED MESSAGE
===================================================== */

if (savedChatsBtn) {

    savedChatsBtn.addEventListener(
        "click",
        () => {

            const saved =
                localStorage.getItem(
                    "viggoSavedMessage"
                );


            if (saved) {

                alert(
                    "Saved message:\n\n" +
                    saved
                );

            } else {

                alert(
                    "No saved messages."
                );
            }
        }
    );
}


/* =====================================================
   SELECT CHATS
===================================================== */

if (selectChatsBtn) {

    selectChatsBtn.addEventListener(
        "click",
        () => {

            selectingChats =
                !selectingChats;


            renderHistory();


            moreMenu?.classList.remove(
                "show"
            );
        }
    );
}


/* =====================================================
   DELETE SELECTED
===================================================== */

if (deleteSelectedBtn) {

    deleteSelectedBtn.addEventListener(
        "click",
        () => {

            const selected =
                chats.filter(
                    chat =>
                        chat.selected
                );


            if (!selected.length) {

                alert(
                    "No chats selected."
                );


                return;
            }


            const selectedIds =
                selected.map(
                    chat =>
                        String(chat.id)
                );


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
                currentChatId &&
                selectedIds.includes(
                    String(currentChatId)
                )
            ) {

                currentChatId =
                    chats[0]?.id || null;
            }


            chats.forEach(
                chat => {

                    chat.selected = false;
                }
            );


            selectingChats = false;


            saveChats();


            renderHistory();


            renderConversation();
        }
    );
}


/* =====================================================
   SHARE
===================================================== */

if (shareBtn) {

    shareBtn.addEventListener(
        "click",
        async () => {

            const chat =
                getCurrentChat();


            if (!chat) {

                alert(
                    "No chat to share."
                );


                return;
            }


            const text =
                chat.messages
                    .map(
                        msg =>
                            (
                                msg.role === "user"
                                    ? "You: "
                                    : "Viggo: "
                            ) +
                            msg.text
                    )
                    .join("\n\n");


            try {

                if (
                    navigator.share
                ) {

                    await navigator.share({

                        title:
                            chat.title ||
                            "Viggo AI",

                        text: text
                    });

                } else {

                    await navigator.clipboard.writeText(
                        text
                    );


                    alert(
                        "Chat copied. You can share it now."
                    );
                }

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
   INITIALIZE
===================================================== */

function initializeViggo() {

    if (!chats.length) {

        createChat();

    } else {

        if (
            !currentChatId ||
            !getCurrentChat()
        ) {

            currentChatId =
                chats[0].id;


            saveChats();
        }


        renderHistory();


        renderConversation();
    }
}


/* =====================================================
   START
===================================================== */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeViggo
    );

} else {

    initializeViggo();
}


console.log(
    "================================="
);


console.log(
    "VIGGO AI SCRIPT LOADED"
);


console.log(
    "API:",
    API_URL
);


console.log(
    "================================="
);
