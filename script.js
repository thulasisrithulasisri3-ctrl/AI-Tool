"use strict";

/* =========================================================
   VIGGO AI - FULL SCRIPT
========================================================= */

/* =========================================================
   API
========================================================= */

const API_BASE =
    "https://ai-tool-2-zpul.onrender.com";

const CHAT_API =
    API_BASE + "/chat";


/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEY =
    "viggo_chats";

const SETTINGS_KEY =
    "viggo_settings";


/* =========================================================
   STATE
========================================================= */

let currentChatId = null;

let messages = [];

let currentLanguage = "en";

let isSending = false;

let recognition = null;

let isListening = false;

let selectMode = false;

let selectedChats = new Set();


/* =========================================================
   DOM HELPER
========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadSettings();

        initializeChat();

        setupEvents();

        setupVoice();

    }
);


/* =========================================================
   SETTINGS
========================================================= */

function loadSettings() {

    try {

        const data =
            JSON.parse(
                localStorage.getItem(
                    SETTINGS_KEY
                ) || "{}"
            );

        if (data.language) {
            currentLanguage = data.language;
        }

    } catch (error) {

        console.error(
            "Settings error:",
            error
        );

    }

}


function saveSettings() {

    localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
            language: currentLanguage
        })
    );

}


/* =========================================================
   CHAT STORAGE
========================================================= */

function getChats() {

    try {

        const data =
            JSON.parse(
                localStorage.getItem(
                    STORAGE_KEY
                ) || "[]"
            );

        return Array.isArray(data)
            ? data
            : [];

    } catch (error) {

        console.error(
            "Storage error:",
            error
        );

        return [];

    }

}


function saveChats(chats) {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(chats)
    );

}


/* =========================================================
   CREATE CHAT
========================================================= */

function createChat() {

    return {

        id:
            "chat_" +
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .slice(2, 8),

        title:
            "New Chat",

        messages: [],

        pinned:
            false,

        createdAt:
            Date.now(),

        updatedAt:
            Date.now()

    };

}


/* =========================================================
   INITIALIZE CHAT
========================================================= */

function initializeChat() {

    let chats = getChats();

    if (!chats.length) {

        const chat = createChat();

        chats = [chat];

        saveChats(chats);

    }

    chats.sort(
        (a, b) =>
            (b.updatedAt || 0) -
            (a.updatedAt || 0)
    );

    currentChatId =
        chats[0].id;

    messages =
        Array.isArray(
            chats[0].messages
        )
            ? chats[0].messages
            : [];

    renderMessages();

    updateTitle();

    renderHistory();

}


/* =========================================================
   NEW CHAT
========================================================= */

function newChat() {

    const chat = createChat();

    const chats = getChats();

    chats.unshift(chat);

    saveChats(chats);

    currentChatId =
        chat.id;

    messages = [];

    selectMode = false;

    selectedChats.clear();

    renderMessages();

    updateTitle();

    renderHistory();

    updateSelectionUI();

    closeMore();

    $("messageInput")?.focus();

}


/* =========================================================
   OPEN CHAT
========================================================= */

function openChat(id) {

    if (selectMode) {

        toggleSelectedChat(id);

        return;

    }

    const chats = getChats();

    const chat =
        chats.find(
            item =>
                item.id === id
        );

    if (!chat) return;

    currentChatId =
        chat.id;

    messages =
        Array.isArray(
            chat.messages
        )
            ? chat.messages
            : [];

    renderMessages();

    updateTitle();

    renderHistory();

    $("sidebar")
        ?.classList
        .remove("open");

}


/* =========================================================
   UPDATE CHAT
========================================================= */

function updateChat() {

    const chats = getChats();

    const chat =
        chats.find(
            item =>
                item.id === currentChatId
        );

    if (!chat) return;

    chat.messages = messages;

    chat.updatedAt =
        Date.now();

    const firstUser =
        messages.find(
            item =>
                item.role === "user"
        );

    if (
        firstUser &&
        chat.title === "New Chat"
    ) {

        const title =
            String(
                firstUser.content || ""
            )
                .replace(
                    /\s+/g,
                    " "
                )
                .trim();

        if (title) {

            chat.title =
                title.slice(0, 40);

        }

    }

    saveChats(chats);

    updateTitle();

    renderHistory();

}


/* =========================================================
   UPDATE TITLE
========================================================= */

function updateTitle() {

    const element =
        $("chatTitle");

    if (!element) return;

    const chats = getChats();

    const chat =
        chats.find(
            item =>
                item.id === currentChatId
        );

    element.textContent =
        chat?.title ||
        "New Chat";

}


/* =========================================================
   HISTORY
========================================================= */

function renderHistory() {

    const list =
        $("historyList");

    if (!list) return;

    const chats = getChats();

    list.innerHTML = "";

    const pinned =
        chats.filter(
            chat =>
                chat.pinned
        );

    const recent =
        chats.filter(
            chat =>
                !chat.pinned
        );

    addHistory(
        list,
        "Pinned",
        pinned
    );

    addHistory(
        list,
        "Recent",
        recent
    );

    updateSelectionUI();

}


/* =========================================================
   ADD HISTORY
========================================================= */

function addHistory(
    list,
    sectionTitle,
    chats
) {

    if (!chats.length)
        return;

    const heading =
        document.createElement(
            "div"
        );

    heading.className =
        "history-section-title";

    heading.textContent =
        sectionTitle;

    list.appendChild(
        heading
    );

    chats.forEach(
        chat => {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "history-item";

            if (
                chat.id ===
                currentChatId
            ) {

                row.classList.add(
                    "active"
                );

            }

            if (selectMode) {

                row.classList.add(
                    "select-mode"
                );

            }

            /* SELECT CHECKBOX */

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
                    selectedChats.has(
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

                        toggleSelectedChat(
                            chat.id
                        );

                    }
                );

                row.appendChild(
                    checkbox
                );

            }

            /* TITLE */

            const titleEl =
                document.createElement(
                    "div"
                );

            titleEl.className =
                "history-title";

            titleEl.textContent =
                chat.title ||
                "New Chat";

            row.appendChild(
                titleEl
            );

            /* ACTIONS */

            if (!selectMode) {

                const actions =
                    document.createElement(
                        "div"
                    );

                actions.className =
                    "history-actions";

                /* PIN */

                const pin =
                    document.createElement(
                        "button"
                    );

                pin.type =
                    "button";

                pin.className =
                    "history-action";

                pin.title =
                    chat.pinned
                        ? "Unpin chat"
                        : "Pin chat";

                pin.textContent =
                    chat.pinned
                        ? "📌"
                        : "📍";

                pin.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();

                        togglePin(
                            chat.id
                        );

                    }
                );

                /* DELETE */

                const del =
                    document.createElement(
                        "button"
                    );

                del.type =
                    "button";

                del.className =
                    "history-action delete";

                del.title =
                    "Delete chat";

                del.textContent =
                    "🗑";

                del.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();

                        deleteChat(
                            chat.id
                        );

                    }
                );

                actions.appendChild(
                    pin
                );

                actions.appendChild(
                    del
                );

                row.appendChild(
                    actions
                );

            }

            /* ROW CLICK */

            row.addEventListener(
                "click",
                () => {

                    if (selectMode) {

                        toggleSelectedChat(
                            chat.id
                        );

                    } else {

                        openChat(
                            chat.id
                        );

                    }

                }
            );

            list.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   PIN CHAT
========================================================= */

function togglePin(id) {

    const chats = getChats();

    const chat =
        chats.find(
            item =>
                item.id === id
        );

    if (!chat) return;

    chat.pinned =
        !chat.pinned;

    chat.updatedAt =
        Date.now();

    saveChats(chats);

    renderHistory();

    showToast(
        chat.pinned
            ? "📌 Chat pinned"
            : "Chat unpinned"
    );

}


/* =========================================================
   DELETE CHAT
========================================================= */

function deleteChat(id) {

    const chats = getChats();

    const chat =
        chats.find(
            item =>
                item.id === id
        );

    if (!chat) return;

    const confirmed =
        confirm(
            `Delete "${chat.title || "New Chat"}"?`
        );

    if (!confirmed)
        return;

    let updated =
        chats.filter(
            item =>
                item.id !== id
        );

    if (!updated.length) {

        updated = [
            createChat()
        ];

    }

    saveChats(updated);

    if (
        currentChatId === id
    ) {

        currentChatId =
            updated[0].id;

        messages =
            updated[0].messages || [];

        renderMessages();

        updateTitle();

    }

    selectedChats.delete(id);

    renderHistory();

    showToast(
        "🗑 Chat deleted"
    );

}


/* =========================================================
   SELECT CHATS MODE
========================================================= */

function toggleSelectMode() {

    selectMode =
        !selectMode;

    selectedChats.clear();

    renderHistory();

    updateSelectionUI();

    if (selectMode) {

        showToast(
            "Select chats to delete"
        );

    }

}


/* =========================================================
   SELECT ONE CHAT
========================================================= */

function toggleSelectedChat(id) {

    if (
        selectedChats.has(id)
    ) {

        selectedChats.delete(id);

    } else {

        selectedChats.add(id);

    }

    renderHistory();

    updateSelectionUI();

}


/* =========================================================
   DELETE SELECTED
========================================================= */

function deleteSelectedChats() {

    if (
        !selectedChats.size
    ) {

        showToast(
            "Select at least one chat"
        );

        return;

    }

    const count =
        selectedChats.size;

    const confirmed =
        confirm(
            `Delete ${count} selected chat${count > 1 ? "s" : ""}?`
        );

    if (!confirmed)
        return;

    let chats =
        getChats();

    chats =
        chats.filter(
            chat =>
                !selectedChats.has(
                    chat.id
                )
        );

    if (!chats.length) {

        chats = [
            createChat()
        ];
