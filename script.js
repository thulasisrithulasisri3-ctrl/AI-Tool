"use strict";

/* =====================================================
   VIGGO AI - COMPLETE SCRIPT
   ===================================================== */

/* 🔴 CHANGE ONLY THIS URL */
const API_URL =
    "https://YOUR-RENDER-SERVICE.onrender.com";


/* =====================================================
   STORAGE
   ===================================================== */

const STORAGE_KEYS = {
    chats: "viggo_chats",
    currentChat: "viggo_current_chat",
    language: "viggo_language",
    voice: "viggo_voice"
};


/* =====================================================
   STATE
   ===================================================== */

let chats =
    JSON.parse(
        localStorage.getItem(
            STORAGE_KEYS.chats
        ) || "[]"
    );

let currentChatId =
    localStorage.getItem(
        STORAGE_KEYS.currentChat
    );

let selectedLanguage =
    localStorage.getItem(
        STORAGE_KEYS.language
    ) || "en";

let selectedVoice =
    localStorage.getItem(
        STORAGE_KEYS.voice
    ) || "female";

let isSending = false;


/* =====================================================
   HELPERS
   ===================================================== */

function $(selector) {
    return document.querySelector(selector);
}

function $all(selector) {
    return [...document.querySelectorAll(selector)];
}

function saveChats() {
    localStorage.setItem(
        STORAGE_KEYS.chats,
        JSON.stringify(chats)
    );
}

function saveCurrentChat() {
    if (currentChatId) {
        localStorage.setItem(
            STORAGE_KEYS.currentChat,
            currentChatId
        );
    }
}

function createId() {
    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .substring(2, 9)
    );
}

function escapeHTML(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =====================================================
   CHAT CREATION
   ===================================================== */

function createChat() {

    const chat = {
        id: createId(),

        title: "New Chat",

        createdAt:
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString(),

        messages: []
    };

    chats.unshift(chat);

    currentChatId =
        chat.id;

    saveChats();
    saveCurrentChat();

    renderHistory();
    renderMessages();

    return chat;
}


function getCurrentChat() {

    let chat =
        chats.find(
            item =>
                item.id ===
                currentChatId
        );

    if (!chat) {
        chat = createChat();
    }

    return chat;
}


/* =====================================================
   NEW CHAT
   ===================================================== */

function newChat() {

    createChat();

    const input =
        getMessageInput();

    if (input) {
        input.value = "";
        input.focus();
    }
}


/* =====================================================
   MESSAGE INPUT
   ===================================================== */

function getMessageInput() {

    return (
        document.querySelector(
            "#messageInput"
        ) ||

        document.querySelector(
            "#chatInput"
        ) ||

        document.querySelector(
            "textarea[placeholder*='Message']"
        ) ||

        document.querySelector(
            "textarea"
        ) ||

        document.querySelector(
            "input[type='text']"
        )
    );
}


/* =====================================================
   SEND MESSAGE
   ===================================================== */

async function sendMessage() {

    if (isSending) {
        return;
    }

    const input =
        getMessageInput();

    if (!input) {
        console.error(
            "Message input not found."
        );
        return;
    }

    const message =
        input.value.trim();

    if (!message) {
        return;
    }


    const chat =
        getCurrentChat();


    /* USER MESSAGE */

    chat.messages.push({

        id: createId(),

        role: "user",

        content: message,

        time:
            new Date().toISOString()

    });


    if (
        chat.title ===
        "New Chat"
    ) {

        chat.title =
            message.length > 35
                ? message.substring(
                    0,
                    35
                ) + "..."
                : message;

    }


    chat.updatedAt =
        new Date().toISOString();


    input.value = "";

    saveChats();

    renderMessages();
    renderHistory();


    /* LOADING */

    isSending = true;

    const loadingId =
        createId();

    addLoadingMessage(
        loadingId
    );


    try {

        const history =
            chat.messages
                .filter(
                    item =>
                        item.role ===
                            "user" ||
                        item.role ===
                            "assistant"
                )
                .slice(-12)
                .map(item => ({

                    role:
                        item.role,

                    content:
                        item.content

                }));


        const response =
            await fetch(
                API_URL + "/chat",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            message:
                                message,

                            language:
                                selectedLanguage,

                            history:
                                history

                        })

                }
            );


        let data = null;

        try {
            data =
                await response.json();
        } catch {
            data = null;
        }


        removeLoadingMessage(
            loadingId
        );


        if (
            !response.ok ||
            !data ||
            !data.success
        ) {

            const errorMessage =
                data?.details ||
                data?.error ||
                `Server error (${response.status})`;

            addAssistantMessage(
                "Sorry friend, " +
                errorMessage
            );

            return;
        }


        const reply =
            String(
                data.reply || ""
            ).trim();


        if (!reply) {

            addAssistantMessage(
                "Sorry friend, Viggo returned an empty response."
            );

            return;
        }


        /* SAVE AI MESSAGE */

        chat.messages.push({

            id: createId(),

            role: "assistant",

            content: reply,

            time:
                new Date().toISOString(),

            liked: false

        });


        chat.updatedAt =
            new Date().toISOString();


        saveChats();

        renderMessages();
        renderHistory();

    }


    catch (error) {

        console.error(
            "Viggo connection error:",
            error
        );


        removeLoadingMessage(
            loadingId
        );


        addAssistantMessage(
            "Sorry friend, I couldn't connect to Viggo AI right now."
        );

    }


    finally {

        isSending = false;

    }
}


/* =====================================================
   ASSISTANT ERROR MESSAGE
   ===================================================== */

function addAssistantMessage(
    text
) {

    const chat =
        getCurrentChat();

    chat.messages.push({

        id: createId(),

        role: "assistant",

        content: text,

        time:
            new Date().toISOString()

    });

    saveChats();

    renderMessages();

}


/* =====================================================
   ENTER KEY
   ===================================================== */

function handleInputKeydown(event) {

    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {

        event.preventDefault();

        sendMessage();

    }
}


/* =====================================================
   RENDER MESSAGES
   ===================================================== */

function renderMessages() {

    const container =
        document.querySelector(
            "#messages"
        ) ||

        document.querySelector(
            "#chatMessages"
        ) ||

        document.querySelector(
            ".messages"
        ) ||

        document.querySelector(
            ".chat-messages"
        );


    if (!container) {
        return;
    }


    const chat =
        getCurrentChat();


    container.innerHTML = "";


    if (
        chat.messages.length === 0
    ) {

        container.innerHTML = `
            <div class="welcome-message">
                <h2>Hi, I'm Viggo AI 👋</h2>
                <p>How can I help you today?</p>
            </div>
        `;

        return;
    }


    chat.messages.forEach(
        message => {

            const wrapper =
                document.createElement(
                    "div"
                );

            wrapper.className =
                "message-row " +
                (
                    message.role ===
                    "user"
                        ? "user-message"
                        : "assistant-message"
                );


            const bubble =
                document.createElement(
                    "div"
                );

            bubble.className =
                "message-bubble";


            bubble.innerHTML = `
                <div class="message-content">
                    ${formatMessage(
                        message.content
                    )}
                </div>

                ${
                    message.role ===
                    "assistant"
                    ? `
                    <div class="message-actions">

                        <button
                            class="msg-action copy-btn"
                            data-id="${message.id}"
                            title="Copy">
                            📋
                        </button>

                        <button
                            class="msg-action share-btn"
                            data-id="${message.id}"
                            title="Share">
                            🔗
                        </button>

                        <button
                            class="msg-action like-btn ${
                                message.liked
                                    ? "active"
                                    : ""
                            }"
                            data-id="${message.id}"
                            title="Like">
                            ❤️
                        </button>

                        <button
                            class="msg-action speaker-btn"
                            data-id="${message.id}"
                            title="Read aloud">
                            🔊
                        </button>

                    </div>
                    `
                    : ""
                }
            `;


            wrapper.appendChild(
                bubble
            );

            container.appendChild(
                wrapper
            );

        }
    );


    container.scrollTop =
        container.scrollHeight;


    attachMessageActions();
}


/* =====================================================
   FORMAT MESSAGE
   ===================================================== */

function formatMessage(text) {

    return escapeHTML(text)
        .replace(
            /\n/g,
            "<br>"
        );
}


/* =====================================================
   MESSAGE ACTIONS
   ===================================================== */

function attachMessageActions() {

    $all(".copy-btn")
        .forEach(button => {

            button.onclick =
                () => {

                    const id =
                        button.dataset.id;

                    copyMessage(id);

                };

        });


    $all(".share-btn")
        .forEach(button => {

            button.onclick =
                () => {

                    const id =
                        button.dataset.id;

                    shareMessage(id);

                };

        });


    $all(".like-btn")
        .forEach(button => {

            button.onclick =
                () => {

                    const id =
                        button.dataset.id;

                    likeMessage(id);

                };

        });


    $all(".speaker-btn")
        .forEach(button => {

            button.onclick =
                () => {

                    const id =
                        button.dataset.id;

                    speakMessage(id);

                };

        });

}


/* =====================================================
   COPY
   ===================================================== */

async function copyMessage(id) {

    const chat =
        getCurrentChat();

    const message =
        chat.messages.find(
            item =>
                item.id === id
        );

    if (!message) {
        return;
    }


    try {

        await navigator.clipboard.writeText(
            message.content
        );

        showToast(
            "Copied ✓"
        );

    }

    catch {

        showToast(
            "Copy failed"
        );

    }

}


/* =====================================================
   LIKE
   ===================================================== */

function likeMessage(id) {

    const chat =
        getCurrentChat();

    const message =
        chat.messages.find(
            item =>
                item.id === id
        );

    if (!message) {
        return;
    }


    message.liked =
        !message.liked;


    saveChats();

    renderMessages();

}


/* =====================================================
   SPEAKER / VOICE
   ===================================================== */

function speakMessage(id) {

    if (
        !("speechSynthesis" in window)
    ) {

        showToast(
            "Voice is not supported"
        );

        return;

    }


    const chat =
        getCurrentChat();

    const message =
        chat.messages.find(
            item =>
                item.id === id
        );

    if (!message) {
        return;
    }


    window.speechSynthesis.cancel();


    const utterance =
        new SpeechSynthesisUtterance(
            message.content
        );


    utterance.lang =
        getSpeechLanguage(
            selectedLanguage
        );


    const voices =
        window.speechSynthesis
            .getVoices();


    const matchingVoices =
        voices.filter(
            voice =>
                voice.lang
                    ?.toLowerCase()
                    .startsWith(
                        utterance.lang
                            .split("-")[0]
                    )
        );


    if (
        selectedVoice ===
        "female"
    ) {

        const female =
            matchingVoices.find(
                voice =>
                    /female|zira|samantha|google.*female|microsoft.*zira/i
                        .test(
                            voice.name
                        )
            );

        if (female) {
            utterance.voice =
                female;
        }

    } else {

        const male =
            matchingVoices.find(
                voice =>
                    /male|david|alex|google.*male/i
                        .test(
                            voice.name
                        )
            );

        if (male) {
            utterance.voice =
                male;
        }

    }


    window.speechSynthesis.speak(
        utterance
    );

}


function getSpeechLanguage(
    language
) {

    const map = {

        en: "en-US",

        ta: "ta-IN",

        hi: "hi-IN",

        ml: "ml-IN",

        te: "te-IN",

        kn: "kn-IN",

        bn: "bn-IN",

        mr: "mr-IN",

        gu: "gu-IN",

        pa: "pa-IN",

        ur: "ur-IN",

        es: "es-ES",

        fr: "fr-FR",

        de: "de-DE",

        ja: "ja-JP",

        ko: "ko-KR",

        zh: "zh-CN",

        ar: "ar-SA"

    };

    return (
        map[language] ||
        "en-US"
    );

}


/* =====================================================
   SHARE CHAT
   ===================================================== */

async function shareMessage(id) {

    const chat =
        getCurrentChat();

    const message =
        chat.messages.find(
            item =>
                item.id === id
        );

    if (!message) {
        return;
    }


    const shareText =
        `Viggo AI\n\n${message.content}`;


    if (
        navigator.share
    ) {

        try {

            await navigator.share({

                title:
                    "Viggo AI",

                text:
                    shareText

            });

        }

        catch {
            /* User cancelled */
        }

        return;
    }


    try {

        await navigator.clipboard.writeText(
            shareText
        );

        showToast(
            "Share text copied ✓"
        );

    }

    catch {

        showToast(
            "Share unavailable"
        );

    }

}


/* =====================================================
   CHAT SHARE LINK
   ===================================================== */

async function shareCurrentChat() {

    const chat =
        getCurrentChat();

    const encoded =
        btoa(
            unescape(
                encodeURIComponent(
                    JSON.stringify(chat)
                )
            )
        );


    const url =
        location.origin +
        location.pathname +
        "?shared=" +
        encodeURIComponent(
            encoded
        );


    if (
        navigator.share
    ) {

        try {

            await navigator.share({

                title:
                    "Viggo AI Chat",

                text:
                    "Shared Viggo AI chat",

                url:
                    url

            });

            return;

        }

        catch {
            /* cancelled */
        }

    }


    try {

        await navigator.clipboard.writeText(
            url
        );

        showToast(
            "Share link copied ✓"
        );

    }

    catch {

        showToast(
            "Unable to create share link"
        );

    }

}


/* =====================================================
   HISTORY
   ===================================================== */

function renderHistory() {

    const container =
        document.querySelector(
            "#chatHistory"
        ) ||

        document.querySelector(
            "#history"
        ) ||

        document.querySelector(
            ".chat-history"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    chats
        .sort(
            (a, b) =>
                new Date(b.updatedAt) -
                new Date(a.updatedAt)
        )
        .forEach(chat => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "history-item " +
                (
                    chat.id ===
                    currentChatId
                        ? "active"
                        : ""
                );


            item.innerHTML = `

                <button
                    class="history-chat-button"
                    data-id="${chat.id}">

                    <span class="history-icon">
                        💬
                    </span>

                    <span class="history-title">
                        ${escapeHTML(
                            chat.title
                        )}
                    </span>

                </button>

                <button
                    class="history-more"
                    data-id="${chat.id}"
                    title="More">
                    ⋯
                </button>

            `;


            container.appendChild(
                item
            );

        });


    attachHistoryActions();
}


/* =====================================================
   HISTORY ACTIONS
   ===================================================== */

function attachHistoryActions() {

    $all(
        ".history-chat-button"
    )
    .forEach(button => {

        button.onclick =
            () => {

                openChat(
                    button.dataset.id
                );

            };

    });


    $all(
        ".history-more"
    )
    .forEach(button => {

        button.onclick =
            event => {

                event.stopPropagation();

                showChatMenu(
                    button.dataset.id,
                    button
                );

            };

    });

}


/* =====================================================
   OPEN CHAT
   ===================================================== */

function openChat(id) {

    const exists =
        chats.some(
            chat =>
                chat.id === id
        );

    if (!exists) {
        return;
    }


    currentChatId =
        id;

    saveCurrentChat();

    renderHistory();
    renderMessages();

}


/* =====================================================
   DELETE SELECTED CHAT
   ===================================================== */

function deleteChat(id) {

    chats =
        chats.filter(
            chat =>
                chat.id !== id
        );


    if (
        currentChatId === id
    ) {

        if (
            chats.length > 0
        ) {

            currentChatId =
                chats[0].id;

        } else {

            currentChatId = null;

        }

    }


    saveChats();


    if (currentChatId) {
        saveCurrentChat();
    } else {
        localStorage.removeItem(
            STORAGE_KEYS.currentChat
        );
        createChat();
    }


    renderHistory();
    renderMessages();

}


/* =====================================================
   CLEAR ALL CHAT
   ===================================================== */

function clearAllChats() {

    const confirmed =
        confirm(
            "Delete all chats?"
        );

    if (!confirmed) {
        return;
    }


    chats = [];

    localStorage.removeItem(
        STORAGE_KEYS.chats
    );

    currentChatId =
        null;

    createChat();

}


/* =====================================================
   MORE MENU
   ===================================================== */

function showChatMenu(
    chatId,
    button
) {

    closeAllMenus();


    const menu =
        document.createElement(
            "div"
        );


    menu.className =
        "viggo-chat-menu";


    menu.innerHTML = `

        <button
            data-action="select">
            ☑ Select
        </button>

        <button
            data-action="delete">
            🗑 Delete
        </button>

        <button
            data-action="share">
            🔗 Share
        </button>

    `;


    document.body.appendChild(
        menu
    );


    const rect =
        button.getBoundingClientRect();


    menu.style.position =
        "fixed";

    menu.style.top =
        `${rect.bottom + 5}px`;

    menu.style.left =
        `${Math.max(
            10,
            rect.left - 100
        )}px`;


    menu.querySelector(
        '[data-action="delete"]'
    ).onclick =
        () => {

            deleteChat(
                chatId
            );

            menu.remove();

        };


    menu.querySelector(
        '[data-action="share"]'
    ).onclick =
        () => {

            openChat(
                chatId
            );

            shareCurrentChat();

            menu.remove();

        };


    menu.querySelector(
        '[data-action="select"]'
    ).onclick =
        () => {

            selectChat(
                chatId
            );

            menu.remove();

        };


    setTimeout(() => {

        document.addEventListener(
            "click",
            closeMenuOnOutside,
            {
                once: true
            }
        );

    }, 0);

}


function closeMenuOnOutside(
    event
) {

    if (
        !event.target.closest(
            ".viggo-chat-menu"
        )
    ) {

        closeAllMenus();

    }

}


function closeAllMenus() {

    $all(
        ".viggo-chat-menu"
    )
    .forEach(
        menu =>
            menu.remove()
    );

}


/* =====================================================
   SELECT CHAT
   ===================================================== */

function selectChat(id) {

    const chat =
        chats.find(
            item =>
                item.id === id
        );

    if (!chat) {
        return;
    }


    const checked =
        confirm(
            `Select "${chat.title}" for deletion?`
        );


    if (checked) {

        deleteChat(id);

    }

}


/* =====================================================
   PLUS MENU
   ===================================================== */

function openPlusMenu() {

    closeAllMenus();


    const existing =
        document.querySelector(
            ".viggo-plus-menu"
        );


    if (existing) {

        existing.remove();

        return;

    }


    const menu =
        document.createElement(
            "div"
        );


    menu.className =
        "viggo-plus-menu";


    menu.innerHTML = `

        <button
            data-type="photo">
            📷 Photos
        </button>

        <button
            data-type="video">
            🎥 Videos
        </button>

        <button
            data-type="file">
            📎 Files
        </button>

    `;


    document.body.appendChild(
        menu
    );


    menu.querySelector(
        '[data-type="photo"]'
    ).onclick =
        () => {

            openFilePicker(
                "image/*",
                "photo"
            );

            menu.remove();

        };


    menu.querySelector(
        '[data-type="video"]'
    ).onclick =
        () => {

            openFilePicker(
                "video/*",
                "video"
            );

            menu.remove();

        };


    menu.querySelector(
        '[data-type="file"]'
    ).onclick =
        () => {

            openFilePicker(
                "*/*",
                "file"
            );

            menu.remove();

        };

}


/* =====================================================
   FILE PICKER
   ===================================================== */

function openFilePicker(
    accept,
    type
) {

    const input =
        document.createElement(
            "input"
        );

    input.type =
        "file";

    input.accept =
        accept;

    input.multiple =
        true;


    input.onchange =
        () => {

            if (
                !input.files.length
            ) {
                return;
            }


            const names =
                [...input.files]
                    .map(
                        file =>
                            file.name
                    )
                    .join("\n");


            showToast(
                `${type}: ${names}`
            );

        };


    input.click();

}


/* =====================================================
   LANGUAGE MENU
   ===================================================== */

function setLanguage(
    language
) {

    selectedLanguage =
        language;

    localStorage.setItem(
        STORAGE_KEYS.language,
        language
    );


    showToast(
        "Language changed ✓"
    );

}


/* =====================================================
   VOICE MENU
   ===================================================== */

function setVoice(
    voice
) {

    selectedVoice =
        voice;

    localStorage.setItem(
        STORAGE_KEYS.voice,
        voice
    );


    showToast(
        voice === "female"
            ? "Female voice selected ✓"
            : "Male voice selected ✓"
    );

}


/* =====================================================
   VOICE ON / OFF
   ===================================================== */

let voiceEnabled = true;


function toggleVoice() {

    voiceEnabled =
        !voiceEnabled;


    if (!voiceEnabled) {

        window.speechSynthesis?.cancel();

    }


    showToast(
        voiceEnabled
            ? "Voice ON 🔊"
            : "Voice OFF 🔇"
    );

}


/* =====================================================
   TOAST
   ===================================================== */

function showToast(
    message
) {

    let toast =
        document.querySelector(
            ".viggo-toast"
        );


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );

        toast.className =
            "viggo-toast";

        document.body.appendChild(
            toast
        );

    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toast._timer
    );


    toast._timer =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 1800);

}


/* =====================================================
   LOADING
   ===================================================== */

function addLoadingMessage(
    id
) {

    const container =
        document.querySelector(
            "#messages"
        ) ||

        document.querySelector(
            "#chatMessages"
        ) ||

        document.querySelector(
            ".messages"
        );


    if (!container) {
        return;
    }


    const div =
        document.createElement(
            "div"
        );


    div.id =
        "loading-" + id;

    div.className =
        "message-row assistant-message";


    div.innerHTML = `

        <div class="message-bubble">
            <div class="typing">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>

    `;


    container.appendChild(
        div
    );


    container.scrollTop =
        container.scrollHeight;

}


function removeLoadingMessage(
    id
) {

    const element =
        document.getElementById(
            "loading-" + id
        );

    if (element) {
        element.remove();
    }

}


/* =====================================================
   DOM READY
   ===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /* Create first chat */

        if (
            chats.length === 0
        ) {

            createChat();

        } else {

            if (
                !currentChatId ||
                !chats.some(
                    chat =>
                        chat.id ===
                        currentChatId
                )
            ) {

                currentChatId =
                    chats[0].id;

                saveCurrentChat();

            }

        }


        renderHistory();
        renderMessages();


        /* SEND BUTTON */

        const sendButton =
            document.querySelector(
                "#sendButton"
            ) ||

            document.querySelector(
                "#sendBtn"
            ) ||

            document.querySelector(
                ".send-button"
            ) ||

            document.querySelector(
                ".send-btn"
            );


        if (sendButton) {

            sendButton.addEventListener(
                "click",
                sendMessage
            );

        }


        /* INPUT */

        const input =
            getMessageInput();


        if (input) {

            input.addEventListener(
                "keydown",
                handleInputKeydown
            );

        }


        /* PLUS */

        const plusButton =
            document.querySelector(
                "#plusButton"
            ) ||

            document.querySelector(
                "#plusBtn"
            ) ||

            document.querySelector(
                ".plus-button"
            ) ||

            document.querySelector(
                ".plus-btn"
            );


        if (plusButton) {

            plusButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    openPlusMenu();

                }
            );

        }


        /* NEW CHAT */

        const newChatButton =
            document.querySelector(
                "#newChat"
            ) ||

            document.querySelector(
                "#newChatButton"
            ) ||

            document.querySelector(
                ".new-chat"
            );


        if (newChatButton) {

            newChatButton.addEventListener(
                "click",
                newChat
            );

        }


        /* SHARE */

        const shareButton =
            document.querySelector(
                "#shareButton"
            ) ||

            document.querySelector(
                "#shareChat"
            ) ||

            document.querySelector(
                ".share-chat"
            );


        if (shareButton) {

            shareButton.addEventListener(
                "click",
                shareCurrentChat
            );

        }


        /* CLEAR */

        const clearButton =
            document.querySelector(
                "#clearHistory"
            ) ||

            document.querySelector(
                "#clearChats"
            );


        if (clearButton) {

            clearButton.addEventListener(
                "click",
                clearAllChats
            );

        }


        /* VOICE */

        const voiceButton =
            document.querySelector(
                "#voiceButton"
            ) ||

            document.querySelector(
                "#voiceToggle"
            ) ||

            document.querySelector(
                ".voice-button"
            );


        if (voiceButton) {

            voiceButton.addEventListener(
                "click",
                toggleVoice
            );

        }


        /* SPEECH VOICES */

        if (
            "speechSynthesis" in window
        ) {

            speechSynthesis.onvoiceschanged =
                () => {
                    speechSynthesis.getVoices();
                };

        }

    }
);


/* =====================================================
   GLOBAL FUNCTIONS
   For inline HTML onclick=""
   ===================================================== */

window.sendMessage =
    sendMessage;

window.newChat =
    newChat;

window.openPlusMenu =
    openPlusMenu;

window.shareCurrentChat =
    shareCurrentChat;

window.clearAllChats =
    clearAllChats;

window.setLanguage =
    setLanguage;

window.setVoice =
    setVoice;

window.toggleVoice =
    toggleVoice;

window.openChat =
    openChat;

window.deleteChat =
    deleteChat;
