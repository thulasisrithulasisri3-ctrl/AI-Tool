"use strict";

/* =========================================================
   VIGGO AI - COMPLETE SCRIPT
   ========================================================= */

const VIGGO_SERVER =
    "https://ai-tool-2-zpul.onrender.com";

const CHAT_ENDPOINT =
    VIGGO_SERVER + "/chat";


/* =========================================================
   STORAGE KEYS
   ========================================================= */

const STORAGE_CHATS =
    "viggo_chats_v3";

const STORAGE_DELETED =
    "viggo_deleted_chats_v3";

const STORAGE_LANGUAGE =
    "viggo_language_v3";

const STORAGE_VOICE =
    "viggo_voice_v3";


/* =========================================================
   STATE
   ========================================================= */

let chats = [];

let deletedChats = [];

let currentChatId = null;

let selectMode = false;

let selectedChatIds = new Set();

let selectedLanguage =
    localStorage.getItem(STORAGE_LANGUAGE) || "en";

let voiceEnabled =
    localStorage.getItem(STORAGE_VOICE) === "true";


/* =========================================================
   DOM
   ========================================================= */

const $ = id =>
    document.getElementById(id);


const sidebar =
    $("sidebar");

const historyContainer =
    $("historyContainer");

const deletedChatsContainer =
    $("deletedChatsContainer");

const messageContainer =
    $("messageContainer");

const welcomeScreen =
    $("welcomeScreen");

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

const mobileMenuButton =
    $("mobileMenuButton");

const languageButton =
    $("languageButton");

const clearAllButton =
    $("clearAllButton");


/* =========================================================
   UTILITY
   ========================================================= */

function uid(prefix = "id") {

    return (
        prefix +
        "_" +
        Date.now().toString(36) +
        "_" +
        Math.random()
            .toString(36)
            .slice(2, 9)
    );
}


function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value ?? "");

    return div.innerHTML;
}


/* =========================================================
   LOCAL STORAGE
   ========================================================= */

function saveChats() {

    localStorage.setItem(
        STORAGE_CHATS,
        JSON.stringify(chats)
    );
}


function saveDeletedChats() {

    localStorage.setItem(
        STORAGE_DELETED,
        JSON.stringify(deletedChats)
    );
}


function loadStorage() {

    try {

        const savedChats =
            localStorage.getItem(
                STORAGE_CHATS
            );

        const savedDeleted =
            localStorage.getItem(
                STORAGE_DELETED
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
            "Storage load error:",
            error
        );

        chats = [];
        deletedChats = [];
    }
}


/* =========================================================
   CHAT CREATION
   ========================================================= */

function createNewChat() {

    const chat = {

        id: uid("chat"),

        title: "New Chat",

        pinned: false,

        createdAt:
            Date.now(),

        updatedAt:
            Date.now(),

        messages: []

    };


    chats.unshift(chat);

    currentChatId =
        chat.id;

    saveChats();

    renderHistory();

    renderMessages();

    messageInput.focus();
}


/* =========================================================
   CURRENT CHAT
   ========================================================= */

function getCurrentChat() {

    return chats.find(
        chat =>
            chat.id === currentChatId
    );
}


/* =========================================================
   CHAT TITLE
   ========================================================= */

function updateChatTitle(
    chat,
    text
) {

    if (
        !chat ||
        !text
    ) {
        return;
    }


    if (
        chat.title === "New Chat"
    ) {

        chat.title =
            text
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 45);

    }


    chat.updatedAt =
        Date.now();
}


/* =========================================================
   SORT CHATS
   PINNED FIRST
   ========================================================= */

function sortedChats() {

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


/* =========================================================
   RENDER HISTORY
   ========================================================= */

function renderHistory() {

    if (!historyContainer) {
        console.error(
            "Viggo: history container not found."
        );
        return;
    }


    historyContainer.innerHTML =
        "";


    sortedChats().forEach(
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


            const pin =
                document.createElement(
                    "button"
                );

            pin.type =
                "button";

            pin.className =
                "pin-button";


            if (chat.pinned) {

                pin.classList.add(
                    "pinned"
                );

            }


            pin.textContent =
                chat.pinned
                    ? "📌"
                    : "📍";


            pin.title =
                chat.pinned
                    ? "Unpin chat"
                    : "Pin chat";


            pin.addEventListener(
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
                pin
            );


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


            if (!selectMode) {

                const more =
                    document.createElement(
                        "button"
                    );

                more.type =
                    "button";

                more.className =
                    "history-more";

                more.textContent =
                    "⋮";

                more.title =
                    "Delete chat";


                more.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();

                        moveChatToDeleted(
                            chat.id
                        );
                    }
                );


                item.appendChild(
                    more
                );
            }


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

                    closeMenus();
                }
            );


            historyContainer.appendChild(
                item
            );
        }
    );


    updateDeleteButton();
}


/* =========================================================
   RENDER DELETED CHATS
   ========================================================= */

function renderDeletedChats() {

    if (
        !deletedChatsContainer
    ) {
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
            "padding:10px;color:#8996a9;font-size:12px;";

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
                "Delete forever";


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


/* =========================================================
   MOVE CHAT TO DELETED
   ========================================================= */

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
                ? sortedChats()[0].id
                : null;
    }


    saveChats();

    saveDeletedChats();

    renderHistory();

    renderDeletedChats();

    renderMessages();


    if (!currentChatId) {

        createNewChat();
    }
}


/* =========================================================
   RESTORE
   ========================================================= */

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


    saveChats();

    saveDeletedChats();

    renderHistory();

    renderDeletedChats();
}


/* =========================================================
   DELETE FOREVER
   ========================================================= */

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


/* =========================================================
   SELECT MODE
   ========================================================= */

function toggleSelectMode() {

    selectMode =
        !selectMode;


    if (!selectMode) {

        selectedChatIds.clear();

    }


    if (
        selectChatsButton
    ) {

        selectChatsButton.textContent =
            selectMode
                ? "✓ Done"
                : "☑ Select Chats";
    }


    renderHistory();

    updateDeleteButton();
}


/* =========================================================
   DELETE SELECTED
   ========================================================= */

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


    if (
        selectChatsButton
    ) {

        selectChatsButton.textContent =
            "☑ Select Chats";
    }


    if (
        !chats.some(
            chat =>
                chat.id === currentChatId
        )
    ) {

        currentChatId =
            chats.length
                ? sortedChats()[0].id
                : null;
    }


    saveChats();

    saveDeletedChats();

    renderHistory();

    renderDeletedChats();

    renderMessages();

    updateDeleteButton();


    if (!currentChatId) {

        createNewChat();
    }
}


/* =========================================================
   DELETE BUTTON
   ========================================================= */

function updateDeleteButton() {

    if (
        !deleteSelectedButton
    ) {
        return;
    }


    const count =
        selectedChatIds.size;


    deleteSelectedButton.disabled =
        count === 0;


    deleteSelectedButton.textContent =
        count > 0
            ? `🗑 Delete Selected (${count})`
            : "🗑 Delete Selected";
}


/* =========================================================
   RENDER MESSAGES
   ========================================================= */

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
        !Array.isArray(
            chat.messages
        ) ||
        chat.messages.length === 0
    ) {

        const welcome =
            document.createElement(
                "div"
            );

        welcome.className =
            "welcome";

        welcome.innerHTML = `
            <div class="welcome-logo">V</div>
            <h2>How can I help you?</h2>
            <p>Ask Viggo AI anything.</p>
        `;

        messageContainer.appendChild(
            welcome
        );

        return;
    }


    chat.messages.forEach(
        (message, index) => {

            renderOneMessage(
                message,
                index
            );
        }
    );


    scrollMessagesToBottom();
}


/* =========================================================
   RENDER ONE MESSAGE
   ========================================================= */

function renderOneMessage(
    message,
    index
) {

    const row =
        document.createElement(
            "div"
        );


    row.className =
        "message-row " +
        (
            message.role === "user"
                ? "user"
                : "ai"
        );


    const wrapper =
        document.createElement(
            "div"
        );


    const bubble =
        document.createElement(
            "div"
        );


    bubble.className =
        "message " +
        (
            message.role === "user"
                ? "user-message"
                : "ai-message"
        );


    bubble.textContent =
        message.content || "";


    wrapper.appendChild(
        bubble
    );


    if (
        message.role === "assistant"
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


        if (message.liked) {

            like.classList.add(
                "liked"
            );
        }


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

                } catch (error) {

                    console.error(
                        "Copy failed:",
                        error
                    );
                }
            }
        );


        actions.appendChild(
            copy
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

                shareMessage(
                    message.content || ""
                );
            }
        );


        actions.appendChild(
            share
        );


        /* PIN MESSAGE */

        const pin =
            document.createElement(
                "button"
            );

        pin.type =
            "button";

        pin.textContent =
            "📌";

        pin.title =
            "Pin chat";


        pin.addEventListener(
            "click",
            () => {

                const chat =
                    getCurrentChat();

                if (!chat) {
                    return;
                }

                chat.pinned =
                    !chat.pinned;

                chat.updatedAt =
                    Date.now();

                saveChats();

                renderHistory();
            }
        );


        actions.appendChild(
            pin
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


/* =========================================================
   SEND MESSAGE
   ========================================================= */

async function sendMessage() {

    const text =
        messageInput
            ?.value
            ?.trim();


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


    updateChatTitle(
        chat,
        text
    );


    chat.messages.push({

        role: "user",

        content: text,

        createdAt:
            Date.now()

    });


    messageInput.value =
        "";

    autoResizeTextarea();

    saveChats();

    renderHistory();

    renderMessages();


    setLoading(
        true
    );


    try {

        const history =
            chat.messages
                .slice(0, -1)
                .slice(-14)
                .map(
                    message => ({

                        role:
                            message.role,

                        content:
                            message.content

                    })
                );


        const response =
            await fetch(
                CHAT_ENDPOINT,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            message: text,

                            language:
                                selectedLanguage,

                            history:
                                history

                        })

                }
            );


        const raw =
            await response.text();


        let data = null;


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
            !data ||
            !data.success ||
            typeof data.reply !==
                "string"
        ) {

            throw new Error(
                data?.details ||
                data?.error ||
                "Server returned an invalid response."
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

        renderHistory();

        renderMessages();


        if (voiceEnabled) {

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


/* =========================================================
   LOADING
   ========================================================= */

function setLoading(
    loading
) {

    if (!sendButton) {
        return;
    }


    sendButton.disabled =
        loading;


    sendButton.textContent =
        loading
            ? "•••"
            : "➤";


    if (messageInput) {

        messageInput.disabled =
            loading;
    }
}


/* =========================================================
   SHARE
   ========================================================= */

async function shareMessage(
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

            return;
        }


        await navigator.clipboard.writeText(
            text
        );


        alert(
            "Share text copied to clipboard."
        );

    } catch (error) {

        console.error(
            "Share failed:",
            error
        );
    }
}


/* =========================================================
   VOICE INPUT
   ========================================================= */

let recognition = null;

let listening = false;


function setupVoiceInput() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (
        !SpeechRecognition
    ) {

        if (voiceInputButton) {

            voiceInputButton.title =
                "Voice input is not supported in this browser.";
        }

        return;
    }


    recognition =
        new SpeechRecognition();


    recognition.continuous =
        false;

    recognition.interimResults =
        false;

    recognition.lang =
        languageToSpeech(
            selectedLanguage
        );


    recognition.onstart =
        () => {

            listening =
                true;

            voiceInputButton.textContent =
                "🔴";
        };


    recognition.onresult =
        event => {

            const text =
                event
                    .results[0][0]
                    .transcript;


            messageInput.value +=
                (
                    messageInput.value
                        ? " "
                        : ""
                ) + text;


            autoResizeTextarea();
        };


    recognition.onend =
        () => {

            listening =
                false;

            voiceInputButton.textContent =
                "🎤";
        };


    recognition.onerror =
        error => {

            console.error(
                "Voice recognition error:",
                error
            );

            listening =
                false;

            voiceInputButton.textContent =
                "🎤";
        };
}


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
            languageToSpeech(
                selectedLanguage
            );

        recognition.start();
    }
}


/* =========================================================
   TEXT TO SPEECH
   ========================================================= */

function languageToSpeech(
    language
) {

    const map = {

        en: "en-US",

        ta: "ta-IN",

        hi: "hi-IN",

        ml: "ml-IN",

        te: "te-IN",

        kn: "kn-IN"

    };


    return (
        map[language] ||
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
        languageToSpeech(
            selectedLanguage
        );


    utterance.rate =
        0.95;


    speechSynthesis.speak(
        utterance
    );
}


/* =========================================================
   VOICE TOGGLE
   ========================================================= */

function toggleVoiceEnabled() {

    voiceEnabled =
        !voiceEnabled;


    localStorage.setItem(
        STORAGE_VOICE,
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


function updateVoiceButton() {

    if (!voiceInputButton) {
        return;
    }


    voiceInputButton.title =
        voiceEnabled
            ? "Voice ON"
            : "Voice OFF";
}


/* =========================================================
   LANGUAGE
   ========================================================= */

function openLanguageModal() {

    const modal =
        $("languageModal");


    if (!modal) {
        return;
    }


    const select =
        $("languageSelect");


    if (select) {

        select.value =
            selectedLanguage;
    }


    modal.classList.add(
        "show"
    );
}


function closeLanguageModal() {

    const modal =
        $("languageModal");


    if (modal) {

        modal.classList.remove(
            "show"
        );
    }
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
        STORAGE_LANGUAGE,
        selectedLanguage
    );


    closeLanguageModal();

    alert(
        "Language saved."
    );
}


/* =========================================================
   CLEAR ALL
   ========================================================= */

function clearAllChats() {

    if (
        chats.length === 0
    ) {

        alert(
            "There are no chats to clear."
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


    saveChats();

    saveDeletedChats();

    selectedChatIds.clear();

    selectMode =
        false;


    renderHistory();

    renderDeletedChats();

    renderMessages();


    createNewChat();
}


/* =========================================================
   PLUS MENU
   ========================================================= */

function togglePlusMenu() {

    plusMenu?.classList.toggle(
        "show"
    );

    moreMenu?.classList.remove(
        "show"
    );
}


/* =========================================================
   MORE MENU
   ========================================================= */

function toggleMoreMenu() {

    moreMenu?.classList.toggle(
        "show"
    );

    plusMenu?.classList.remove(
        "show"
    );
}


/* =========================================================
   CLOSE MENUS
   ========================================================= */

function closeMenus() {

    plusMenu?.classList.remove(
        "show"
    );

    moreMenu?.classList.remove(
        "show"
    );
}


/* =========================================================
   FILE INPUT
   ========================================================= */

function setupFileButtons() {

    $("photoButton")
        ?.addEventListener(
            "click",
            () => {

                $("photoInput")
                    ?.click();

                closeMenus();
            }
        );


    $("videoButton")
        ?.addEventListener(
            "click",
            () => {

                $("videoInput")
                    ?.click();

                closeMenus();
            }
        );


    $("fileButton")
        ?.addEventListener(
            "click",
            () => {

                $("fileInput")
                    ?.click();

                closeMenus();
            }
        );


    $("photoInput")
        ?.addEventListener(
            "change",
            event => {

                handleSelectedFile(
                    event.target.files?.[0]
                );
            }
        );


    $("videoInput")
        ?.addEventListener(
            "change",
            event => {

                handleSelectedFile(
                    event.target.files?.[0]
                );
            }
        );


    $("fileInput")
        ?.addEventListener(
            "change",
            event => {

                handleSelectedFile(
                    event.target.files?.[0]
                );
            }
        );
}


function handleSelectedFile(
    file
) {

    if (!file) {
        return;
    }


    messageInput.value =
        `📎 ${file.name}`;


    messageInput.focus();

    autoResizeTextarea();
}


/* =========================================================
   TEXTAREA
   ========================================================= */

function autoResizeTextarea() {

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


/* =========================================================
   SCROLL
   ========================================================= */

function scrollMessagesToBottom() {

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


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function setupEvents() {

    newChatButton?.addEventListener(
        "click",
        () => {

            createNewChat();

            closeMenus();
        }
    );


    sendButton?.addEventListener(
        "click",
        sendMessage
    );


    messageInput?.addEventListener(
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


    messageInput?.addEventListener(
        "input",
        autoResizeTextarea
    );


    plusButton?.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            togglePlusMenu();
        }
    );


    moreButton?.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            toggleMoreMenu();
        }
    );


    selectChatsButton?.addEventListener(
        "click",
        toggleSelectMode
    );


    deleteSelectedButton?.addEventListener(
        "click",
        deleteSelectedChats
    );


    deletedChatsButton?.addEventListener(
        "click",
        () => {

            deletedChatsContainer?.classList.toggle(
                "show"
            );

            renderDeletedChats();
        }
    );


    voiceInputButton?.addEventListener(
        "click",
        () => {

            if (eventIsVoiceToggleMode()) {

                toggleVoiceEnabled();

            } else {

                toggleVoiceInput();
            }
        }
    );


    languageButton?.addEventListener(
        "click",
        () => {

            openLanguageModal();

            closeMenus();
        }
    );


    clearAllButton?.addEventListener(
        "click",
        () => {

            clearAllChats();

            closeMenus();
        }
    );


    mobileMenuButton?.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            sidebar?.classList.toggle(
                "open"
            );
        }
    );


    $("closeLanguageModal")
        ?.addEventListener(
            "click",
            closeLanguageModal
        );


    $("saveLanguageButton")
        ?.addEventListener(
            "click",
            saveLanguage
        );


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

    setupVoiceInput();
}


/* =========================================================
   VOICE BUTTON MODE
   ========================================================= */

function eventIsVoiceToggleMode() {

    /*
       Single click = voice input.

       Voice ON/OFF is controlled
       from More -> Voice.
    */

    return false;
}


/* =========================================================
   INITIALIZE
   ========================================================= */

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
    }


    renderDeletedChats();

    updateVoiceButton();

    setupEvents();


    console.log(
        "✓ Viggo AI script ready."
    );

    console.log(
        "✓ Server:",
        VIGGO_SERVER
    );

    console.log(
        "✓ Language:",
        selectedLanguage
    );

    console.log(
        "✓ Voice:",
        voiceEnabled
            ? "ON"
            : "OFF"
    );
}


/* =========================================================
   START
   ========================================================= */

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
