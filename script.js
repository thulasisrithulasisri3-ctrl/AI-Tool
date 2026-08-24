"use strict";

/* =====================================================
   VIGGO AI - FULL SCRIPT
   ONLY REQUIRED FIXES
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
   MOBILE / FULL SCREEN FIX
===================================================== */

function fixViewportHeight() {

    const root =
        document.documentElement;

    const height =
        window.visualViewport
            ? window.visualViewport.height
            : window.innerHeight;

    root.style.setProperty(
        "--app-height",
        `${height}px`
    );
}


fixViewportHeight();


window.addEventListener(
    "resize",
    fixViewportHeight,
    { passive: true }
);


window.addEventListener(
    "orientationchange",
    () => {

        setTimeout(
            fixViewportHeight,
            100
        );
    },
    { passive: true }
);


if (window.visualViewport) {

    window.visualViewport.addEventListener(
        "resize",
        fixViewportHeight,
        { passive: true }
    );
}


/* =====================================================
   FILE INPUTS
===================================================== */

const photoInput =
    document.createElement("input");

photoInput.type = "file";
photoInput.accept = "image/*";
photoInput.style.display = "none";

document.body.appendChild(
    photoInput
);


const videoInput =
    document.createElement("input");

videoInput.type = "file";
videoInput.accept = "video/*";
videoInput.style.display = "none";

document.body.appendChild(
    videoInput
);


const fileInput =
    document.createElement("input");

fileInput.type = "file";
fileInput.accept = "*/*";
fileInput.style.display = "none";

document.body.appendChild(
    fileInput
);


/* =====================================================
   CHAT DATA
===================================================== */

let chats = [];

try {

    chats =
        JSON.parse(
            localStorage.getItem(
                "viggoChats"
            ) || "[]"
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
   SPEAKER
===================================================== */

let speakerEnabled = true;


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

        pinnedChats.splice(
            index,
            1
        );
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
                chat.title ||
                "New Chat"
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
                Number(
                    b.createdAt || 0
                ) -
                Number(
                    a.createdAt || 0
                )
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

            item.classList.add(
                "active"
            );
        }


        const title =
            document.createElement("div");


        title.className =
            "history-chat-title";


        title.textContent =
            chat.title ||
            "New Chat";


        const actions =
            document.createElement("div");


        actions.className =
            "history-actions";


        if (selectingChats) {

            const check =
                document.createElement(
                    "button"
                );


            check.type =
                "button";


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


            actions.appendChild(
                check
            );
        }


        const pinBtn =
            document.createElement(
                "button"
            );


        pinBtn.type =
            "button";


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

                togglePinChat(
                    chat.id
                );
            }
        );


        actions.appendChild(
            pinBtn
        );


        const deleteBtn =
            document.createElement(
                "button"
            );


        deleteBtn.type =
            "button";


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

                deleteChat(
                    chat.id
                );
            }
        );


        actions.appendChild(
            deleteBtn
        );


        item.appendChild(
            title
        );

        item.appendChild(
            actions
        );


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


        chatHistory.appendChild(
            item
        );
    });
}


/* =====================================================
   SPEAKER
===================================================== */

function speakText(
    text,
    button
) {

    if (!speakerEnabled) {
        return;
    }


    if (
        !window.speechSynthesis ||
        !window.SpeechSynthesisUtterance
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


    const selectedLanguage =
        localStorage.getItem(
            "viggoLanguage"
        ) || "en-IN";


    speech.lang =
        selectedLanguage;


    speech.rate = 1;

    speech.pitch = 1;

    speech.volume = 1;


    if (button) {

        button.textContent =
            "🔊 Speaking...";
    }


    speech.onstart = () => {

        if (button) {

            button.textContent =
                "🔊 Stop";
        }
    };


    speech.onend = () => {

        if (button) {

            button.textContent =
                "🔊 Speaker";
        }
    };


    speech.onerror = error => {

        console.error(
            "Speech error:",
            error
        );


        if (button) {

            button.textContent =
                "🔊 Speaker";
        }
    };


    window.speechSynthesis.speak(
        speech
    );
}


/* =====================================================
   SPEAKER STOP
===================================================== */

function stopSpeaker(button) {

    if (
        window.speechSynthesis
    ) {

        window.speechSynthesis.cancel();
    }


    if (button) {

        button.textContent =
            "🔇 Speaker OFF";
    }
}


/* =====================================================
   ADD MESSAGE UI
===================================================== */

function addMessageToUI(
    role,
    text,
    media = null
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


    if (text) {

        bubble.textContent =
            text;
    }


    /* =================================================
       MEDIA PREVIEW
    ================================================= */

    if (media) {

        if (
            media.type &&
            media.type.startsWith(
                "image/"
            ) &&
            media.data
        ) {

            const image =
                document.createElement(
                    "img"
                );


            image.src =
                media.data;


            image.alt =
                media.name ||
                "Uploaded photo";


            image.style.maxWidth =
                "100%";


            image.style.width =
                "auto";


            image.style.maxHeight =
                "320px";


            image.style.display =
                "block";


            image.style.borderRadius =
                "12px";


            image.style.marginBottom =
                text
                    ? "10px"
                    : "0";


            bubble.appendChild(
                image
            );
        }


        if (
            media.type &&
            media.type.startsWith(
                "video/"
            ) &&
            media.data
        ) {

            const video =
                document.createElement(
                    "video"
                );


            video.src =
                media.data;


            video.controls =
                true;


            video.playsInline =
                true;


            video.preload =
                "metadata";


            video.style.maxWidth =
                "100%";


            video.style.width =
                "100%";


            video.style.maxHeight =
                "320px";


            video.style.display =
                "block";


            video.style.borderRadius =
                "12px";


            video.style.marginBottom =
                text
                    ? "10px"
                    : "0";


            bubble.appendChild(
                video
            );
        }
    }


    content.appendChild(
        bubble
    );


    const actions =
        document.createElement("div");


    actions.className =
        "message-actions";


    /* SAVE */

    const saveBtn =
        document.createElement(
            "button"
        );


    saveBtn.type =
        "button";


    saveBtn.textContent =
        "💾 Save";


    saveBtn.addEventListener(
        "click",
        () => {

            localStorage.setItem(
                "viggoSavedMessage",
                text || ""
            );


            alert(
                "Message saved."
            );
        }
    );


    /* COPY */

    const copyBtn =
        document.createElement(
            "button"
        );


    copyBtn.type =
        "button";


    copyBtn.textContent =
        "📋 Copy";


    copyBtn.addEventListener(
        "click",
        async () => {

            try {

                await navigator.clipboard.writeText(
                    text || ""
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


                temp.value =
                    text || "";


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
        document.createElement(
            "button"
        );


    likeBtn.type =
        "button";


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


    /* SPEAKER */

    const speakerBtn =
        document.createElement(
            "button"
        );


    speakerBtn.type =
        "button";


    speakerBtn.textContent =
        "🔊 Speaker";


    speakerBtn.title =
        "Read this message aloud";


    speakerBtn.addEventListener(
        "click",
        () => {

            if (
                window.speechSynthesis &&
                window.speechSynthesis.speaking
            ) {

                stopSpeaker(
                    speakerBtn
                );

                return;
            }


            if (!speakerEnabled) {

                speakerEnabled =
                    true;


                speakerBtn.textContent =
                    "🔊 Speaker";
            }


            speakText(
                text || "",
                speakerBtn
            );
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


    requestAnimationFrame(
        () => {

            conversation.scrollTop =
                conversation.scrollHeight;
        }
    );
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
        msg => {

            addMessageToUI(
                msg.role,
                msg.text,
                msg.media || null
            );
        }
    );


    requestAnimationFrame(
        () => {

            conversation.scrollTop =
                conversation.scrollHeight;
        }
    );
}


/* =====================================================
   ADD MESSAGE
===================================================== */

function addMessage(
    role,
    text,
    media = null
) {

    ensureChat();


    const chat =
        getCurrentChat();


    if (!chat) return;


    const msg = {

        role: role,

        text: text || "",

        time: Date.now()
    };


    if (media) {

        msg.media = {

            name:
                media.name || "",

            type:
                media.type || "",

            data:
                media.data || ""
        };
    }


    chat.messages.push(
        msg
    );


    if (
        role === "user" &&
        chat.title === "New Chat"
    ) {

        const titleText =
            text ||
            media?.name ||
            "Uploaded file";


        chat.title =
            titleText.substring(
                0,
                30
            );
    }


    saveChats();


    addMessageToUI(
        role,
        text,
        media
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


    if (send) {

        send.disabled =
            true;
    }


    const typing =
        document.createElement(
            "div"
        );


    typing.className =
        "message ai typing-message";


    typing.innerHTML =
        '<div class="message-content">' +
        '<div class="message-bubble">Thinking...</div>' +
        '</div>';


    conversation?.appendChild(
        typing
    );


    requestAnimationFrame(
        () => {

            if (conversation) {

                conversation.scrollTop =
                    conversation.scrollHeight;
            }
        }
    );


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

            send.disabled =
                false;
        }


        message.focus();
    }
}


/* =====================================================
   SEND FILE TO AI
===================================================== */

async function sendUploadedFile(
    file,
    type
) {

    if (!file) return;


    ensureChat();


    const mediaData =
        await readFileAsDataURL(
            file
        );


    const label =
        type === "photo"
            ? "📷 Photo"
            : type === "video"
                ? "🎥 Video"
                : "📎 File";


    addMessage(
        "user",
        `${label}: ${file.name}`,
        {
            name:
                file.name,

            type:
                file.type,

            data:
                mediaData
        }
    );


    const typing =
        document.createElement(
            "div"
        );


    typing.className =
        "message ai typing-message";


    typing.innerHTML =
        '<div class="message-content">' +
        '<div class="message-bubble">Analyzing your upload...</div>' +
        '</div>';


    conversation?.appendChild(
        typing
    );


    requestAnimationFrame(
        () => {

            if (conversation) {

                conversation.scrollTop =
                    conversation.scrollHeight;
            }
        }
    );


    try {

        /*
         * Send both the text information and
         * base64 file data.
         *
         * server.js must support these fields
         * for actual AI image/video analysis.
         */

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

                            message:
                                type === "photo"
                                    ? "Please analyze the uploaded photo and tell me what you can see."
                                    : type === "video"
                                        ? "Please analyze the uploaded video and tell me what you can see."
                                        : "Please analyze the uploaded file and tell me what you can determine.",

                            file: {

                                name:
                                    file.name,

                                type:
                                    file.type,

                                size:
                                    file.size,

                                data:
                                    mediaData
                            }
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
            "The file was uploaded successfully, but the AI did not return a response.";


        addMessage(
            "assistant",
            String(reply)
        );


    } catch (error) {

        console.error(
            "Upload error:",
            error
        );


        typing.remove();


        addMessage(
            "assistant",
            "The upload was successful, but I couldn't get an AI response. Please check the server file-upload support."
        );

    }
}


/* =====================================================
   READ FILE AS DATA URL
===================================================== */

function readFileAsDataURL(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();


            reader.onload =
                () => {

                    resolve(
                        reader.result
                    );
                };


            reader.onerror =
                () => {

                    reject(
                        new Error(
                            "Unable to read file."
                        )
                    );
                };


            reader.readAsDataURL(
                file
            );
        }
    );
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
            !plusMenu.contains(
                event.target
            ) &&
            !plusBtn.contains(
                event.target
            )
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
            !moreMenu.contains(
                event.target
            ) &&
            !moreBtn.contains(
                event.target
            )
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
    async () => {

        const file =
            photoInput.files[0];


        if (!file) return;


        try {

            await sendUploadedFile(
                file,
                "photo"
            );

        } catch (error) {

            console.error(
                "Photo upload error:",
                error
            );

        } finally {

            photoInput.value = "";
        }
    }
);


/* =====================================================
   VIDEO
===================================================== */

videoInput.addEventListener(
    "change",
    async () => {

        const file =
            videoInput.files[0];


        if (!file) return;


        try {

            await sendUploadedFile(
                file,
                "video"
            );

        } catch (error) {

            console.error(
                "Video upload error:",
                error
            );

        } finally {

            videoInput.value = "";
        }
    }
);


/* =====================================================
   FILE
===================================================== */

fileInput.addEventListener(
    "change",
    async () => {

        const file =
            fileInput.files[0];


        if (!file) return;


        try {

            await sendUploadedFile(
                file,
                "file"
            );

        } catch (error) {

            console.error(
                "File upload error:",
                error
            );

        } finally {

            fileInput.value = "";
        }
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


    recognition.lang =
        localStorage.getItem(
            "viggoLanguage"
        ) || "en-IN";


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
                event.results[0][0]
                    .transcript;


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
                languages.indexOf(
                    current
                );


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
                "Language: " +
                next
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
                    chats[0]?.id ||
                    null;
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
                    .join(
                        "\n\n"
                    );


            try {

                if (
                    navigator.share
                ) {

                    await navigator.share({

                        title:
                            chat.title ||
                            "Viggo AI",

                        text:
                            text
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

    fixViewportHeight();


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


/* =====================================================
   CONSOLE
===================================================== */

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
    "Speech Synthesis:",
    "speechSynthesis" in window
);

console.log(
    "File Upload:",
    "FileReader" in window
);

console.log(
    "================================="
);
