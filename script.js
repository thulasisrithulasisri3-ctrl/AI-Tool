"use strict";

/* =====================================================
   VIGGO AI CONFIG
===================================================== */

const VIGGO_SERVER =
    "https://ai-tool-2-zpul.onrender.com";

const CHAT_ENDPOINT =
    VIGGO_SERVER + "/chat";


/* =====================================================
   STORAGE
===================================================== */

const CHAT_KEY =
    "viggo_chats_v4";

const DELETED_KEY =
    "viggo_deleted_chats_v4";

const LANGUAGE_KEY =
    "viggo_language_v4";

const VOICE_KEY =
    "viggo_voice_v4";


/* =====================================================
   STATE
===================================================== */

let chats = [];
let deletedChats = [];

let currentChatId = null;

let selectMode = false;

let selectedChatIds = new Set();

let selectedLanguage =
    localStorage.getItem(LANGUAGE_KEY) || "en";

let voiceEnabled =
    localStorage.getItem(VOICE_KEY) !== "false";

let recognition = null;
let listening = false;


/* =====================================================
   DOM HELPER
===================================================== */

const $ = id =>
    document.getElementById(id);


/* =====================================================
   DOM ELEMENTS
===================================================== */

const sidebar =
    $("sidebar");

const historyContainer =
    $("historyContainer");

const deletedChatsContainer =
    $("deletedChatsContainer");

const messageContainer =
    $("messageContainer");

const messageInput =
    $("messageInput");

const sendButton =
    $("sendButton");

const newChatButton =
    $("newChatButton");

const plusButton =
    $("plusButton");

const plusMenu =
    $("plusMenu");

const moreButton =
    $("moreButton");

const moreMenu =
    $("moreMenu");

const selectChatsButton =
    $("selectChatsButton");

const deleteSelectedButton =
    $("deleteSelectedButton");

const deletedChatsButton =
    $("deletedChatsButton");

const voiceInputButton =
    $("voiceInputButton");

const voiceToggleButton =
    $("voiceToggleButton");

const mobileMenuButton =
    $("mobileMenuButton");

const closeSidebarButton =
    $("closeSidebarButton");

const languageButton =
    $("languageButton");

const clearAllButton =
    $("clearAllButton");

const historySearchInput =
    $("historySearchInput");

const currentChatTitle =
    $("currentChatTitle");


/* =====================================================
   ID
===================================================== */

function createId() {

    return (
        "chat_" +
        Date.now().toString(36) +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 9)
    );
}


/* =====================================================
   STORAGE LOAD
===================================================== */

function loadStorage() {

    try {

        const savedChats =
            localStorage.getItem(
                CHAT_KEY
            );

        const savedDeleted =
            localStorage.getItem(
                DELETED_KEY
            );


        chats =
            savedChats
                ? JSON.parse(savedChats)
                : [];


        deletedChats =
            savedDeleted
                ? JSON.parse(savedDeleted)
                : [];


        if (!Array.isArray(chats)) {
            chats = [];
        }

        if (!Array.isArray(deletedChats)) {
            deletedChats = [];
        }


    } catch (error) {

        console.error(
            "Viggo storage error:",
            error
        );

        chats = [];
        deletedChats = [];
    }
}


/* =====================================================
   SAVE
===================================================== */

function saveChats() {

    localStorage.setItem(
        CHAT_KEY,
        JSON.stringify(chats)
    );
}


function saveDeletedChats() {

    localStorage.setItem(
        DELETED_KEY,
        JSON.stringify(deletedChats)
    );
}


/* =====================================================
   CREATE CHAT
===================================================== */

function createNewChat() {

    const chat = {

        id:
            createId(),

        title:
            "New Chat",

        pinned:
            false,

        createdAt:
            Date.now(),

        updatedAt:
            Date.now(),

        messages:
            []

    };


    chats.unshift(chat);

    currentChatId =
        chat.id;


    saveChats();

    renderHistory();

    renderMessages();

    updateCurrentTitle();

    closeMenus();

    messageInput?.focus();
}


/* =====================================================
   GET CURRENT CHAT
===================================================== */

function getCurrentChat() {

    return chats.find(
        chat =>
            chat.id ===
            currentChatId
    );
}


/* =====================================================
   SORT CHAT
===================================================== */

function getSortedChats() {

    return [...chats].sort(
        (a, b) => {

            if (
                Boolean(a.pinned) !==
                Boolean(b.pinned)
            ) {

                return a.pinned
                    ? -1
                    : 1;
            }


            return (
                (b.updatedAt || 0) -
                (a.updatedAt || 0)
            );
        }
    );
}


/* =====================================================
   SEARCH
===================================================== */

function getSearchText() {

    return (
        historySearchInput
            ?.value
            ?.trim()
            ?.toLowerCase() || ""
    );
}


/* =====================================================
   RENDER HISTORY
===================================================== */

function renderHistory() {

    if (!historyContainer) {

        console.error(
            "Viggo: history container not found."
        );

        return;
    }


    historyContainer.innerHTML =
        "";


    const search =
        getSearchText();


    const sorted =
        getSortedChats();


    const filtered =
        sorted.filter(
            chat => {

                if (!search) {
                    return true;
                }


                return (
                    chat.title
                        ?.toLowerCase()
                        .includes(search)
                );
            }
        );


    if (filtered.length === 0) {

        const empty =
            document.createElement(
                "div"
            );

        empty.style.cssText =
            `
            padding:20px 10px;
            text-align:center;
            color:#788396;
            font-size:13px;
            `;

        empty.textContent =
            search
                ? "No chats found."
                : "No chats yet.";


        historyContainer.appendChild(
            empty
        );

        updateDeleteButton();

        return;
    }


    filtered.forEach(
        chat => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "history-item";


            if (
                chat.id ===
                currentChatId
            ) {

                item.classList.add(
                    "active"
                );
            }


            /* =========================================
               SELECT CHECKBOX
            ========================================= */

            if (selectMode) {

                const checkbox =
                    document.createElement(
                        "input"
                    );


                checkbox.type =
                    "checkbox";


                checkbox.className =
                    "chat-checkbox";


                checkbox.checked =
                    selectedChatIds.has(
                        chat.id
                    );


                checkbox.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();
                    }
                );


                checkbox.addEventListener(
                    "change",
                    () => {

                        if (
                            checkbox.checked
                        ) {

                            selectedChatIds.add(
                                chat.id
                            );

                        } else {

                            selectedChatIds.delete(
                                chat.id
                            );
                        }


                        updateDeleteButton();
                    }
                );


                item.appendChild(
                    checkbox
                );
            }


            /* =========================================
               PIN BUTTON
            ========================================= */

            const pinButton =
                document.createElement(
                    "button"
                );


            pinButton.type =
                "button";


            pinButton.className =
                "pin-button";


            pinButton.textContent =
                chat.pinned
                    ? "📌"
                    : "📍";


            pinButton.title =
                chat.pinned
                    ? "Unpin"
                    : "Pin";


            pinButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    chat.pinned =
                        !chat.pinned;


                    chat.updatedAt =
                        Date.now();


                    saveChats();

                    renderHistory();
                }
            );


            item.appendChild(
                pinButton
            );


            /* =========================================
               TITLE
            ========================================= */

            const title =
                document.createElement(
                    "div"
                );


            title.className =
                "history-text";


            title.textContent =
                chat.title ||
                "New Chat";


            item.appendChild(
                title
            );


            /* =========================================
               X DELETE BUTTON
            ========================================= */

            const deleteButton =
                document.createElement(
                    "button"
                );


            deleteButton.type =
                "button";


            deleteButton.className =
                "chat-delete-button";


            deleteButton.textContent =
                "✕";


            deleteButton.title =
                "Delete Chat";


            deleteButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    moveChatToDeleted(
                        chat.id
                    );
                }
            );


            item.appendChild(
                deleteButton
            );


            /* =========================================
               OPEN CHAT
            ========================================= */

            item.addEventListener(
                "click",
                () => {

                    if (selectMode) {

                        if (
                            selectedChatIds.has(
                                chat.id
                            )
                        ) {

                            selectedChatIds.delete(
                                chat.id
                            );

                        } else {

                            selectedChatIds.add(
                                chat.id
                            );
                        }


                        renderHistory();

                        updateDeleteButton();

                        return;
                    }


                    currentChatId =
                        chat.id;


                    renderHistory();

                    renderMessages();

                    updateCurrentTitle();

                    closeMenus();


                    if (
                        window.innerWidth <= 800
                    ) {

                        sidebar?.classList.remove(
                            "open"
                        );
                    }
                }
            );


            historyContainer.appendChild(
                item
            );
        }
    );


    updateDeleteButton();
}


/* =====================================================
   CURRENT TITLE
===================================================== */

function updateCurrentTitle() {

    const chat =
        getCurrentChat();


    if (currentChatTitle) {

        currentChatTitle.textContent =
            chat?.title ||
            "Viggo AI";
    }
}


/* =====================================================
   MOVE TO DELETED
===================================================== */

function moveChatToDeleted(
    chatId
) {

    const index =
        chats.findIndex(
            chat =>
                chat.id === chatId
        );


    if (index === -1) {
        return;
    }


    const chat =
        chats[index];


    const confirmed =
        confirm(
            `"${chat.title}"\n\nMove this chat to Deleted Chats?`
        );


    if (!confirmed) {
        return;
    }


    chats.splice(
        index,
        1
    );


    chat.deletedAt =
        Date.now();


    deletedChats.unshift(
        chat
    );


    if (
        currentChatId ===
        chatId
    ) {

        currentChatId =
            chats.length
                ? getSortedChats()[0].id
                : null;
    }


    saveChats();

    saveDeletedChats();

    renderHistory();

    renderDeletedChats();

    renderMessages();

    updateCurrentTitle();


    if (!currentChatId) {

        createNewChat();
    }
}


/* =====================================================
   RENDER DELETED
===================================================== */

function renderDeletedChats() {

    if (!deletedChatsContainer) {
        return;
    }


    deletedChatsContainer.innerHTML =
        "";


    if (
        deletedChats.length === 0
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.style.cssText =
            `
            padding:12px;
            color:#788396;
            font-size:12px;
            `;


        empty.textContent =
            "No deleted chats.";


        deletedChatsContainer.appendChild(
            empty
        );


        return;
    }


    deletedChats.forEach(
        chat => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "deleted-chat-item";


            const title =
                document.createElement(
                    "div"
                );


            title.className =
                "deleted-chat-title";


            title.textContent =
                chat.title ||
                "Deleted Chat";


            row.appendChild(
                title
            );


            /* RESTORE */

            const restore =
                document.createElement(
                    "button"
                );


            restore.type =
                "button";


            restore.className =
                "restore-button";


            restore.textContent =
                "♻";


            restore.title =
                "Restore";


            restore.addEventListener(
                "click",
                () => {

                    restoreChat(
                        chat.id
                    );
                }
            );


            row.appendChild(
                restore
            );


            /* DELETE FOREVER */

            const forever =
                document.createElement(
                    "button"
                );


            forever.type =
                "button";


            forever.className =
                "forever-delete-button";


            forever.textContent =
                "×";


            forever.title =
                "Delete Forever";


            forever.addEventListener(
                "click",
                () => {

                    deleteForever(
                        chat.id
                    );
                }
            );


            row.appendChild(
                forever
            );


            deletedChatsContainer.appendChild(
                row
            );
        }
    );
}


/* =====================================================
   RESTORE
===================================================== */

function restoreChat(
    chatId
) {

    const index =
        deletedChats.findIndex(
            chat =>
                chat.id === chatId
        );


    if (index === -1) {
        return;
    }


    const chat =
        deletedChats[index];


    deletedChats.splice(
        index,
        1
    );


    delete chat.deletedAt;


    chat.updatedAt =
        Date.now();


    chats.unshift(
        chat
    );


    currentChatId =
        chat.id;


    saveChats();

    saveDeletedChats();

    renderHistory();

    renderDeletedChats();

    renderMessages();

    updateCurrentTitle();
}


/* =====================================================
   DELETE FOREVER
===================================================== */

function deleteForever(
    chatId
) {

    const confirmed =
        confirm(
            "Delete this chat permanently?"
        );


    if (!confirmed) {
        return;
    }


    deletedChats =
        deletedChats.filter(
            chat =>
                chat.id !== chatId
        );


    saveDeletedChats();

    renderDeletedChats();
}


/* =====================================================
   SELECT MODE
===================================================== */

function toggleSelectMode() {

    selectMode =
        !selectMode;


    selectedChatIds.clear();


    if (selectChatsButton) {

        selectChatsButton.textContent =
            selectMode
                ? "✓ Done"
                : "☑ Select";
    }


    renderHistory();

    updateDeleteButton();
}


/* =====================================================
   DELETE SELECTED
===================================================== */

function deleteSelectedChats() {

    if (
        selectedChatIds.size === 0
    ) {

        return;
    }


    const count =
        selectedChatIds.size;


    const confirmed =
        confirm(
            `Move ${count} selected chat(s) to Deleted Chats?`
        );


    if (!confirmed) {
        return;
    }


    const moving =
        chats.filter(
            chat =>
                selectedChatIds.has(
                    chat.id
                )
        );


    moving.forEach(
        chat => {

            chat.deletedAt =
                Date.now();
        }
    );


    deletedChats.unshift(
        ...moving
    );


    chats =
        chats.filter(
            chat =>
                !selectedChatIds.has(
                    chat.id
                )
        );


    selectedChatIds.clear();

    selectMode =
        false;


    if (selectChatsButton) {

        selectChatsButton.textContent =
            "☑ Select";
    }


    if (
        !chats.some(
            chat =>
                chat.id === currentChatId
        )
    ) {

        currentChatId =
            chats.length
                ? getSortedChats()[0].id
                : null;
    }


    saveChats();

    saveDeletedChats();

    renderHistory();

    renderDeletedChats();

    renderMessages();

    updateCurrentTitle();


    if (!currentChatId) {

        createNewChat();
    }
}


/* =====================================================
   DELETE BUTTON UPDATE
===================================================== */

function updateDeleteButton() {

    if (!deleteSelectedButton) {
        return;
    }


    const count =
        selectedChatIds.size;


    deleteSelectedButton.disabled =
        count === 0;


    deleteSelectedButton.textContent =
        count
            ? `🗑 Delete Selected (${count})`
            : "🗑 Delete Selected";
}


/* =====================================================
   RENDER MESSAGES
===================================================== */

function renderMessages() {

    if (!messageContainer) {

        console.error(
            "Viggo: message container not found."
        );

        return;
    }


    const chat =
        getCurrentChat();


    messageContainer.innerHTML =
        "";


    if (
        !chat ||
        !chat.messages ||
        chat.messages.length === 0
    ) {

        const welcome =
            document.createElement(
                "div"
            );


        welcome.className =
            "welcome-screen";


        welcome.innerHTML =
            `
            <div class="welcome-logo">
                V
            </div>

            <h1>
                Hello, I'm Viggo AI
            </h1>

            <p>
                How can I help you today?
            </p>
            `;


        messageContainer.appendChild(
            welcome
        );


        return;
    }


    chat.messages.forEach(
        (message, index) => {

            renderMessage(
                message,
                index
            );
        }
    );


    scrollBottom();
}


/* =====================================================
   RENDER MESSAGE
===================================================== */

function renderMessage(
    message,
    index
) {

    const row =
        document.createElement(
            "div"
        );


    row.className =
        message.role === "user"
            ? "message-row user"
            : "message-row ai";


    const wrapper =
        document.createElement(
            "div"
        );


    const bubble =
        document.createElement(
            "div"
        );


    bubble.className =
        message.role === "user"
            ? "message user-message"
            : "message ai-message";


    bubble.textContent =
        message.content || "";


    wrapper.appendChild(
        bubble
    );


    if (
        message.role ===
        "assistant"
    ) {

        const actions =
            document.createElement(
                "div"
            );


        actions.className =
            "message-actions";


        /* LIKE */

        const like =
            document.createElement(
                "button"
            );


        like.type =
            "button";


        like.textContent =
            message.liked
                ? "💙"
                : "👍";


        like.title =
            "Like";


        like.addEventListener(
            "click",
            () => {

                message.liked =
                    !message.liked;


                saveChats();

                renderMessages();
            }
        );


        actions.appendChild(
            like
        );


        /* COPY */

        const copy =
            document.createElement(
                "button"
            );


        copy.type =
            "button";


        copy.textContent =
            "📋";


        copy.title =
            "Copy";


        copy.addEventListener(
            "click",
            async () => {

                try {

                    await navigator.clipboard.writeText(
                        message.content || ""
                    );


                    copy.textContent =
                        "✓";


                    setTimeout(
                        () => {

                            copy.textContent =
                                "📋";

                        },
                        1000
                    );

                } catch {

                    alert(
                        "Copy failed."
                    );
                }
            }
        );


        actions.appendChild(
            copy
        );


        /* SPEAKER */

        const speaker =
            document.createElement(
                "button"
            );


        speaker.type =
            "button";


        speaker.textContent =
            "🔊";


        speaker.title =
            "Read aloud";


        speaker.addEventListener(
            "click",
            () => {

                speakText(
                    message.content || ""
                );
            }
        );


        actions.appendChild(
            speaker
        );


        /* SHARE */

        const share =
            document.createElement(
                "button"
            );


        share.type =
            "button";


        share.textContent =
            "🔗";


        share.title =
            "Share";


        share.addEventListener(
            "click",
            () => {

                shareText(
                    message.content || ""
                );
            }
        );


        actions.appendChild(
            share
        );


        wrapper.appendChild(
            actions
        );
    }


    row.appendChild(
        wrapper
    );


    messageContainer.appendChild(
        row
    );
}


/* =====================================================
   SEND MESSAGE
===================================================== */

async function sendMessage() {

    if (!messageInput) {
        return;
    }


    const text =
        messageInput.value.trim();


    if (!text) {
        return;
    }


    let chat =
        getCurrentChat();


    if (!chat) {

        createNewChat();

        chat =
            getCurrentChat();
    }


    if (
        chat.title ===
        "New Chat"
    ) {

        chat.title =
            text
                .replace(/\s+/g, " ")
                .slice(0, 45);
    }


    chat.messages.push({

        role:
            "user",

        content:
            text,

        createdAt:
            Date.now()

    });


    chat.updatedAt =
        Date.now();


    messageInput.value =
        "";


    autoResize();


    saveChats();

    renderHistory();

    renderMessages();

    updateCurrentTitle();


    setLoading(
        true
    );


    try {

        const history =
            chat.messages
                .slice(0, -1)
                .slice(-14)
                .map(
                    item => ({

                        role:
                            item.role,

                        content:
                            item.content

                    })
                );


        const response =
            await fetch(
                CHAT_ENDPOINT,
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
                                text,

                            language:
                                selectedLanguage,

                            history:
                                history

                        })

                }
            );


        const raw =
            await response.text();


        let data;


        try {

            data =
                JSON.parse(raw);

        } catch {

            throw new Error(
                `Server invalid response (${response.status}).`
            );
        }


        if (!response.ok) {

            throw new Error(
                data?.details ||
                data?.error ||
                `Server error ${response.status}`
            );
        }


        if (
            !data?.success ||
            typeof data.reply !==
                "string"
        ) {

            throw new Error(
                data?.details ||
                data?.error ||
                "Invalid server response."
            );
        }


        chat.messages.push({

            role:
                "assistant",

            content:
                data.reply,

            liked:
                false,

            createdAt:
                Date.now()

        });


        chat.updatedAt =
            Date.now();


        saveChats();

        renderMessages();

        renderHistory();


        if (
            voiceEnabled
        ) {

            speakText(
                data.reply
            );
        }


    } catch (error) {

        console.error(
            "Viggo error:",
            error
        );


        chat.messages.push({

            role:
                "assistant",

            content:
                "Sorry friend, I couldn't connect to Viggo AI right now.\n\n" +
                error.message,

            error:
                true,

            createdAt:
                Date.now()

        });


        saveChats();

        renderMessages();


    } finally {

        setLoading(
            false
        );
    }
}


/* =====================================================
   LOADING
===================================================== */

function setLoading(
    loading
) {

    if (sendButton) {

        sendButton.disabled =
            loading;


        sendButton.textContent =
            loading
                ? "..."
                : "➤";
    }


    if (messageInput) {

        messageInput.disabled =
            loading;
    }
}


/* =====================================================
   VOICE INPUT
===================================================== */

function setupVoiceRecognition() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        console.warn(
            "Speech recognition not supported."
        );

        return;
    }


    recognition =
        new SpeechRecognition();


    recognition.continuous =
        false;


    recognition.interimResults =
        false;


    recognition.lang =
        speechLanguage(
            selectedLanguage
        );


    recognition.onstart =
        () => {

            listening =
                true;


            if (voiceInputButton) {

                voiceInputButton.textContent =
                    "🔴";
            }
        };


    recognition.onresult =
        event => {

            const text =
                event.results[0][0]
                    .transcript;


            if (messageInput) {

                messageInput.value +=
                    (
                        messageInput.value
                            ? " "
                            : ""
                    ) + text;


                autoResize();
            }
        };


    recognition.onerror =
        error => {

            console.error(
                "Voice error:",
                error
            );

            listening =
                false;


            if (voiceInputButton) {

                voiceInputButton.textContent =
                    "🎤";
            }
        };


    recognition.onend =
        () => {

            listening =
                false;


            if (voiceInputButton) {

                voiceInputButton.textContent =
                    "🎤";
            }
        };
}


/* =====================================================
   VOICE BUTTON
===================================================== */

function toggleVoiceInput() {

    if (!recognition) {

        alert(
            "Voice input is not supported in this browser."
        );

        return;
    }


    if (listening) {

        recognition.stop();

    } else {

        recognition.lang =
            speechLanguage(
                selectedLanguage
            );


        try {

            recognition.start();

        } catch (error) {

            console.error(
                error
            );
        }
    }
}


/* =====================================================
   VOICE ON / OFF
===================================================== */

function updateVoiceButton() {

    if (!voiceToggleButton) {
        return;
    }


    voiceToggleButton.textContent =
        voiceEnabled
            ? "🔊 Voice ON"
            : "🔇 Voice OFF";
}


function toggleVoiceEnabled() {

    voiceEnabled =
        !voiceEnabled;


    localStorage.setItem(
        VOICE_KEY,
        String(
            voiceEnabled
        )
    );


    updateVoiceButton();


    if (
        !voiceEnabled &&
        "speechSynthesis" in window
    ) {

        speechSynthesis.cancel();
    }
}


/* =====================================================
   TEXT TO SPEECH
===================================================== */

function speechLanguage(
    language
) {

    const languages = {

        en:
            "en-US",

        ta:
            "ta-IN",

        hi:
            "hi-IN",

        ml:
            "ml-IN",

        te:
            "te-IN",

        kn:
            "kn-IN"

    };


    return (
        languages[language] ||
        "en-US"
    );
}


function speakText(
    text
) {

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


    utterance.lang =
        speechLanguage(
            selectedLanguage
        );


    utterance.rate =
        0.95;


    speechSynthesis.speak(
        utterance
    );
}


/* =====================================================
   SHARE
===================================================== */

async function shareText(
    text
) {

    try {

        if (
            navigator.share
        ) {

            await navigator.share({

                title:
                    "Viggo AI",

                text:
                    text

            });

        } else {

            await navigator.clipboard.writeText(
                text
            );


            alert(
                "Text copied to clipboard."
            );
        }

    } catch (error) {

        console.error(
            "Share error:",
            error
        );
    }
}


/* =====================================================
   LANGUAGE
===================================================== */

function openLanguageModal() {

    const modal =
        $("languageModal");


    const select =
        $("languageSelect");


    if (select) {

        select.value =
            selectedLanguage;
    }


    modal?.classList.add(
        "show"
    );
}


function closeLanguageModal() {

    $("languageModal")
        ?.classList.remove(
            "show"
        );
}


function saveLanguage() {

    const select =
        $("languageSelect");


    if (!select) {
        return;
    }


    selectedLanguage =
        select.value;


    localStorage.setItem(
        LANGUAGE_KEY,
        selectedLanguage
    );


    closeLanguageModal();


    if (recognition) {

        recognition.lang =
            speechLanguage(
                selectedLanguage
            );
    }
}


/* =====================================================
   CLEAR ALL
===================================================== */

function clearAllChats() {

    if (
        chats.length === 0
    ) {

        alert(
            "No chats to delete."
        );

        return;
    }


    const confirmed =
        confirm(
            "Move all chats to Deleted Chats?"
        );


    if (!confirmed) {
        return;
    }


    chats.forEach(
        chat => {

            chat.deletedAt =
                Date.now();
        }
    );


    deletedChats.unshift(
        ...chats
    );


    chats = [];


    currentChatId =
        null;


    selectedChatIds.clear();

    selectMode =
        false;


    saveChats();

    saveDeletedChats();


    renderHistory();

    renderDeletedChats();

    renderMessages();


    createNewChat();
}


/* =====================================================
   AUTO RESIZE
===================================================== */

function autoResize() {

    if (!messageInput) {
        return;
    }


    messageInput.style.height =
        "auto";


    messageInput.style.height =
        Math.min(
            messageInput.scrollHeight,
            150
        ) + "px";
}


/* =====================================================
   SCROLL
===================================================== */

function scrollBottom() {

    if (!messageContainer) {
        return;
    }


    requestAnimationFrame(
        () => {

            messageContainer.scrollTop =
                messageContainer.scrollHeight;
        }
    );
}


/* =====================================================
   PLUS MENU
===================================================== */

function togglePlusMenu() {

    plusMenu?.classList.toggle(
        "show"
    );


    moreMenu?.classList.remove(
        "show"
    );
}


/* =====================================================
   MORE MENU
===================================================== */

function toggleMoreMenu() {

    moreMenu?.classList.toggle(
        "show"
    );


    plusMenu?.classList.remove(
        "show"
    );
}


/* =====================================================
   CLOSE MENUS
===================================================== */

function closeMenus() {

    plusMenu?.classList.remove(
        "show"
    );


    moreMenu?.classList.remove(
        "show"
    );
}


/* =====================================================
   FILE BUTTONS
===================================================== */

function setupFileButtons() {

    $("photoButton")
        ?.addEventListener(
            "click",
            () => {

                $("photoInput")?.click();

                closeMenus();
            }
        );


    $("videoButton")
        ?.addEventListener(
            "click",
            () => {

                $("videoInput")?.click();

                closeMenus();
            }
        );


    $("fileButton")
        ?.addEventListener(
            "click",
            () => {

                $("fileInput")?.click();

                closeMenus();
            }
        );


    $("photoInput")
        ?.addEventListener(
            "change",
            handleFile
        );


    $("videoInput")
        ?.addEventListener(
            "change",
            handleFile
        );


    $("fileInput")
        ?.addEventListener(
            "change",
            handleFile
        );
}


function handleFile(
    event
) {

    const file =
        event.target.files?.[0];


    if (!file) {
        return;
    }


    if (messageInput) {

        messageInput.value =
            `📎 ${file.name}`;


        autoResize();

        messageInput.focus();
    }


    event.target.value =
        "";
}


/* =====================================================
   EVENTS
===================================================== */

function setupEvents() {

    /* NEW CHAT */

    newChatButton?.addEventListener(
        "click",
        createNewChat
    );


    /* SEND */

    sendButton?.addEventListener(
        "click",
        sendMessage
    );


    /* ENTER */

    messageInput?.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                    "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();
            }
        }
    );


    /* INPUT */

    messageInput?.addEventListener(
        "input",
        autoResize
    );


    /* PLUS */

    plusButton?.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            togglePlusMenu();
        }
    );


    /* MORE */

    moreButton?.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            toggleMoreMenu();
        }
    );


    /* SELECT */

    selectChatsButton?.addEventListener(
        "click",
        toggleSelectMode
    );


    /* DELETE SELECTED */

    deleteSelectedButton?.addEventListener(
        "click",
        deleteSelectedChats
    );


    /* DELETED CHATS */

    deletedChatsButton?.addEventListener(
        "click",
        () => {

            deletedChatsContainer
                ?.classList.toggle(
                    "show"
                );

            renderDeletedChats();
        }
    );


    /* VOICE INPUT */

    voiceInputButton?.addEventListener(
        "click",
        toggleVoiceInput
    );


    /* VOICE ON/OFF */

    voiceToggleButton?.addEventListener(
        "click",
        () => {

            toggleVoiceEnabled();

            closeMenus();
        }
    );


    /* LANGUAGE */

    languageButton?.addEventListener(
        "click",
        () => {

            openLanguageModal();

            closeMenus();
        }
    );


    /* SAVE LANGUAGE */

    $("saveLanguageButton")
        ?.addEventListener(
            "click",
            saveLanguage
        );


    /* CLOSE LANGUAGE */

    $("closeLanguageModal")
        ?.addEventListener(
            "click",
            closeLanguageModal
        );


    /* CLEAR */

    clearAllButton?.addEventListener(
        "click",
        () => {

            clearAllChats();

            closeMenus();
        }
    );


    /* MOBILE OPEN SIDEBAR */

    mobileMenuButton?.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            sidebar?.classList.add(
                "open"
            );
        }
    );


    /* SIDEBAR CLOSE */

    closeSidebarButton?.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            sidebar?.classList.remove(
                "open"
            );
        }
    );


    /* SEARCH */

    historySearchInput?.addEventListener(
        "input",
        renderHistory
    );


    /* OUTSIDE CLICK */

    document.addEventListener(
        "click",
        event => {

            if (
                !plusMenu?.contains(
                    event.target
                ) &&
                event.target !==
                    plusButton
            ) {

                plusMenu?.classList.remove(
                    "show"
                );
            }


            if (
                !moreMenu?.contains(
                    event.target
                ) &&
                event.target !==
                    moreButton
            ) {

                moreMenu?.classList.remove(
                    "show"
                );
            }
        }
    );


    setupFileButtons();
}


/* =====================================================
   INIT
===================================================== */

function initViggo() {

    loadStorage();


    if (
        chats.length === 0
    ) {

        createNewChat();

    } else {

        currentChatId =
            chats[0].id;

        renderHistory();

        renderMessages();

        updateCurrentTitle();
    }


    renderDeletedChats();

    updateVoiceButton();

    setupVoiceRecognition();

    setupEvents();


    console.log(
        "✓ Viggo AI script loaded."
    );


    console.log(
        "✓ Server:",
        VIGGO_SERVER
    );


    console.log(
        "✓ Current chat:",
        currentChatId
    );
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
        initViggo
    );

} else {

    initViggo();
}
