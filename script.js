"use strict";

(function () {

    /* =====================================================
       VIGGO AI - CLEAN FULL SCRIPT
       USER = RIGHT
       AI   = LEFT
       API  = RENDER
    ===================================================== */

    const API_URL =
        "https://ai-tool-2-zpul.onrender.com/chat";


    /* =====================================================
       ELEMENT HELPER
    ===================================================== */

    function get(id) {
        return document.getElementById(id);
    }


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const sidebar = get("sidebar");
    const openSidebar = get("openSidebar");
    const closeSidebar = get("closeSidebar");

    const newChat = get("newChat");
    const searchChat = get("searchChat");
    const chatHistory = get("chatHistory");

    const moreBtn = get("moreBtn");
    const moreMenu = get("moreMenu");

    const voiceMenuBtn = get("voiceMenuBtn");
    const languageBtn = get("languageBtn");

    const selectChatsBtn = get("selectChatsBtn");
    const deleteSelectedBtn = get("deleteSelectedBtn");
    const clearChatBtn = get("clearChatBtn");

    const shareBtn = get("shareBtn");

    const conversation = get("conversation");

    const plusBtn = get("plusBtn");
    const plusMenu = get("plusMenu");

    const cameraBtn = get("cameraBtn");
    const photoBtn = get("photoBtn");
    const videoBtn = get("videoBtn");
    const fileBtn = get("fileBtn");

    const cameraInput = get("cameraInput");
    const photoInput = get("photoInput");
    const videoInput = get("videoInput");
    const fileInput = get("fileInput");

    const messageInput = get("message");
    const micBtn = get("mic");
    const sendBtn = get("send");

    const voiceModal = get("voiceModal");
    const closeVoice = get("closeVoice");
    const startVoice = get("startVoice");
    const voiceSelect = get("voiceSelect");
    const voiceGender = get("voiceGender");

    const languageModal = get("languageModal");
    const closeLanguage = get("closeLanguage");
    const languageSelect = get("languageSelect");
    const saveLanguage = get("saveLanguage");


    /* =====================================================
       STATE
    ===================================================== */

    let chats = [];
    let currentChatId = null;

    let selectedChats = new Set();
    let selectMode = false;

    let pendingMedia = null;

    let recognition = null;
    let isListening = false;

    let speakerEnabled =
        localStorage.getItem("viggoSpeakerEnabled") !== "false";

    let selectedLanguage =
        localStorage.getItem("viggoLanguage") || "en-IN";


    /* =====================================================
       MOBILE HEIGHT
    ===================================================== */

    function fixViewportHeight() {

        const height =
            window.visualViewport
                ? window.visualViewport.height
                : window.innerHeight;

        document.documentElement.style.setProperty(
            "--app-height",
            height + "px"
        );
    }

    fixViewportHeight();

    window.addEventListener(
        "resize",
        fixViewportHeight
    );

    window.addEventListener(
        "orientationchange",
        fixViewportHeight
    );

    if (window.visualViewport) {

        window.visualViewport.addEventListener(
            "resize",
            fixViewportHeight
        );
    }


    /* =====================================================
       STORAGE
    ===================================================== */

    function saveChats() {

        try {

            localStorage.setItem(
                "viggoChats",
                JSON.stringify(chats)
            );

        } catch (error) {

            console.error(
                "Storage error:",
                error
            );
        }
    }


    function loadChats() {

        try {

            const saved =
                localStorage.getItem(
                    "viggoChats"
                );

            if (!saved) {

                chats = [];

                return;
            }

            const parsed =
                JSON.parse(saved);

            chats =
                Array.isArray(parsed)
                    ? parsed
                    : [];

        } catch (error) {

            console.error(
                "Load error:",
                error
            );

            chats = [];
        }
    }


    /* =====================================================
       CHAT CREATION
    ===================================================== */

    function createChat() {

        return {

            id:
                Date.now().toString() +
                Math.random()
                    .toString(36)
                    .substring(2),

            title:
                "New Chat",

            pinned:
                false,

            createdAt:
                Date.now(),

            messages:
                []
        };
    }


    function getCurrentChat() {

        return chats.find(
            function (chat) {

                return chat.id === currentChatId;
            }
        );
    }


    function ensureChat() {

        if (!chats.length) {

            const chat =
                createChat();

            chats.push(chat);

            currentChatId =
                chat.id;

            saveChats();

            return;
        }

        if (!currentChatId) {

            currentChatId =
                chats[0].id;
        }
    }


    /* =====================================================
       NEW CHAT
    ===================================================== */

    function createNewChat() {

        const chat =
            createChat();

        chats.unshift(chat);

        currentChatId =
            chat.id;

        pendingMedia = null;

        saveChats();

        renderHistory();

        renderConversation();

        closeSidebarMobile();

        if (messageInput) {

            messageInput.value = "";

            messageInput.focus();
        }
    }


    if (newChat) {

        newChat.addEventListener(
            "click",
            createNewChat
        );
    }


    /* =====================================================
       SIDEBAR
    ===================================================== */

    function openSidebarMobile() {

        if (sidebar) {

            sidebar.classList.add(
                "open",
                "active",
                "show"
            );
        }
    }


    function closeSidebarMobile() {

        if (sidebar) {

            sidebar.classList.remove(
                "open",
                "active",
                "show"
            );
        }
    }


    if (openSidebar) {

        openSidebar.addEventListener(
            "click",
            openSidebarMobile
        );
    }


    if (closeSidebar) {

        closeSidebar.addEventListener(
            "click",
            closeSidebarMobile
        );
    }


    /* =====================================================
       HISTORY
    ===================================================== */

    function renderHistory() {

        if (!chatHistory) return;

        chatHistory.innerHTML = "";

        const search =
            searchChat
                ? searchChat.value
                    .trim()
                    .toLowerCase()
                : "";

        let filtered =
            chats.slice();

        if (search) {

            filtered =
                filtered.filter(
                    function (chat) {

                        return (
                            chat.title ||
                            "New Chat"
                        )
                            .toLowerCase()
                            .includes(search);
                    }
                );
        }

        filtered.sort(
            function (a, b) {

                if (
                    a.pinned &&
                    !b.pinned
                ) {
                    return -1;
                }

                if (
                    !a.pinned &&
                    b.pinned
                ) {
                    return 1;
                }

                return (
                    (b.createdAt || 0) -
                    (a.createdAt || 0)
                );
            }
        );


        filtered.forEach(
            function (chat) {

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

                    item.classList.add(
                        "selectable"
                    );
                }


                if (
                    selectedChats.has(
                        chat.id
                    )
                ) {

                    item.classList.add(
                        "selected"
                    );
                }


                /* CHECKBOX */

                if (selectMode) {

                    const checkbox =
                        document.createElement(
                            "input"
                        );

                    checkbox.type =
                        "checkbox";

                    checkbox.className =
                        "select-checkbox";

                    checkbox.checked =
                        selectedChats.has(
                            chat.id
                        );

                    checkbox.addEventListener(
                        "click",
                        function (event) {

                            event.stopPropagation();
                        }
                    );

                    checkbox.addEventListener(
                        "change",
                        function () {

                            toggleSelectedChat(
                                chat.id
                            );
                        }
                    );

                    item.appendChild(
                        checkbox
                    );
                }


                /* TITLE */

                const title =
                    document.createElement(
                        "div"
                    );

                title.className =
                    "history-chat-title";

                title.textContent =
                    chat.pinned
                        ? "📌 " +
                          (
                              chat.title ||
                              "New Chat"
                          )
                        : (
                              chat.title ||
                              "New Chat"
                          );

                title.title =
                    chat.title ||
                    "New Chat";


                /* ACTIONS */

                const actions =
                    document.createElement(
                        "div"
                    );

                actions.className =
                    "history-actions";


                /* PIN */

                const pinBtn =
                    document.createElement(
                        "button"
                    );

                pinBtn.type =
                    "button";

                pinBtn.className =
                    "history-action-btn pin-btn";

                pinBtn.textContent =
                    chat.pinned
                        ? "📌"
                        : "📍";

                pinBtn.title =
                    chat.pinned
                        ? "Unpin"
                        : "Pin";

                pinBtn.addEventListener(
                    "click",
                    function (event) {

                        event.stopPropagation();

                        chat.pinned =
                            !chat.pinned;

                        saveChats();

                        renderHistory();
                    }
                );


                /* DELETE */

                const deleteBtn =
                    document.createElement(
                        "button"
                    );

                deleteBtn.type =
                    "button";

                deleteBtn.className =
                    "history-action-btn delete-btn";

                deleteBtn.textContent =
                    "🗑️";

                deleteBtn.title =
                    "Delete";

                deleteBtn.addEventListener(
                    "click",
                    function (event) {

                        event.stopPropagation();

                        deleteChat(
                            chat.id
                        );
                    }
                );


                actions.appendChild(
                    pinBtn
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


                /* OPEN */

                item.addEventListener(
                    "click",
                    function () {

                        if (selectMode) {

                            toggleSelectedChat(
                                chat.id
                            );

                            return;
                        }

                        currentChatId =
                            chat.id;

                        saveChats();

                        renderHistory();

                        renderConversation();

                        closeSidebarMobile();
                    }
                );


                chatHistory.appendChild(
                    item
                );
            }
        );
    }


    if (searchChat) {

        searchChat.addEventListener(
            "input",
            renderHistory
        );
    }


    /* =====================================================
       DELETE CHAT
    ===================================================== */

    function deleteChat(id) {

        chats =
            chats.filter(
                function (chat) {

                    return chat.id !== id;
                }
            );

        selectedChats.delete(id);


        if (
            currentChatId === id
        ) {

            if (chats.length) {

                currentChatId =
                    chats[0].id;

            } else {

                const chat =
                    createChat();

                chats.push(chat);

                currentChatId =
                    chat.id;
            }
        }


        saveChats();

        renderHistory();

        renderConversation();
    }


    /* =====================================================
       SELECT CHAT
    ===================================================== */

    function toggleSelectedChat(id) {

        if (
            selectedChats.has(id)
        ) {

            selectedChats.delete(id);

        } else {

            selectedChats.add(id);
        }

        renderHistory();
    }


    if (selectChatsBtn) {

        selectChatsBtn.addEventListener(
            "click",
            function () {

                selectMode =
                    !selectMode;

                selectedChats.clear();

                renderHistory();
            }
        );
    }


    /* =====================================================
       DELETE SELECTED
    ===================================================== */

    if (deleteSelectedBtn) {

        deleteSelectedBtn.addEventListener(
            "click",
            function () {

                if (
                    !selectedChats.size
                ) {

                    alert(
                        "Please select at least one chat."
                    );

                    return;
                }

                chats =
                    chats.filter(
                        function (chat) {

                            return !selectedChats.has(
                                chat.id
                            );
                        }
                    );

                selectedChats.clear();

                selectMode = false;


                if (!chats.length) {

                    const chat =
                        createChat();

                    chats.push(chat);
                }


                if (
                    !chats.some(
                        function (chat) {

                            return (
                                chat.id ===
                                currentChatId
                            );
                        }
                    )
                ) {

                    currentChatId =
                        chats[0].id;
                }


                saveChats();

                renderHistory();

                renderConversation();
            }
        );
    }


    /* =====================================================
       CLEAR CHAT
    ===================================================== */

    if (clearChatBtn) {

        clearChatBtn.addEventListener(
            "click",
            function () {

                const chat =
                    getCurrentChat();

                if (!chat) return;

                chat.messages = [];

                chat.title =
                    "New Chat";

                saveChats();

                renderHistory();

                renderConversation();

                if (moreMenu) {

                    moreMenu.classList.remove(
                        "show",
                        "active"
                    );
                }
            }
        );
    }


    /* =====================================================
       MESSAGE UI
    ===================================================== */

    function addMessageToUI(
        role,
        text,
        media,
        messageObject
    ) {

        const wrapper =
            document.createElement(
                "div"
            );

        wrapper.className =
            "message " +
            (
                role === "user"
                    ? "user"
                    : "ai"
            );


        const content =
            document.createElement(
                "div"
            );

        content.className =
            "message-content";


        const bubble =
            document.createElement(
                "div"
            );

        bubble.className =
            "message-bubble";


        /* MEDIA */

        if (
            media &&
            media.data &&
            media.type
        ) {

            if (
                media.type.startsWith(
                    "image/"
                )
            ) {

                const img =
                    document.createElement(
                        "img"
                    );

                img.src =
                    media.data;

                img.alt =
                    media.name ||
                    "Image";

                img.style.maxWidth =
                    "100%";

                img.style.maxHeight =
                    "320px";

                img.style.objectFit =
                    "contain";

                img.style.borderRadius =
                    "12px";

                bubble.appendChild(
                    img
                );

            } else if (
                media.type.startsWith(
                    "video/"
                )
            ) {

                const video =
                    document.createElement(
                        "video"
                    );

                video.src =
                    media.data;

                video.controls =
                    true;

                video.style.maxWidth =
                    "100%";

                video.style.maxHeight =
                    "320px";

                video.style.borderRadius =
                    "12px";

                bubble.appendChild(
                    video
                );

            } else {

                const fileBox =
                    document.createElement(
                        "div"
                    );

                fileBox.className =
                    "uploaded-file";

                fileBox.textContent =
                    "📎 " +
                    (
                        media.name ||
                        "Uploaded file"
                    );

                bubble.appendChild(
                    fileBox
                );
            }
        }


        /* TEXT */

        if (
            text &&
            text.trim()
        ) {

            const textElement =
                document.createElement(
                    "div"
                );

            textElement.className =
                "message-text";

            textElement.textContent =
                text;

            bubble.appendChild(
                textElement
            );
        }


        content.appendChild(
            bubble
        );


        /* AI ACTIONS */

        if (
            role === "assistant"
        ) {

            const actions =
                document.createElement(
                    "div"
                );

            actions.className =
                "message-actions";


            /* COPY */

            const copyBtn =
                createActionButton(
                    "📋",
                    "Copy"
                );

            copyBtn.addEventListener(
                "click",
                function () {

                    copyText(
                        text || ""
                    );

                    copyBtn.textContent =
                        "✓";

                    setTimeout(
                        function () {

                            copyBtn.textContent =
                                "📋";
                        },
                        1000
                    );
                }
            );


            /* SAVE */

            const saveBtn =
                createActionButton(
                    "💾",
                    "Save"
                );

            saveBtn.addEventListener(
                "click",
                function () {

                    saveMessage(
                        text || ""
                    );

                    saveBtn.textContent =
                        "✓";

                    setTimeout(
                        function () {

                            saveBtn.textContent =
                                "💾";
                        },
                        1000
                    );
                }
            );


            /* LIKE */

            const likeBtn =
                createActionButton(
                    "👍",
                    "Like"
                );

            likeBtn.addEventListener(
                "click",
                function () {

                    likeBtn.classList.toggle(
                        "liked"
                    );
                }
            );


            /* SPEAKER */

            const speakerBtn =
                createActionButton(
                    speakerEnabled
                        ? "🔊"
                        : "🔇",
                    "Speaker"
                );

            speakerBtn.addEventListener(
                "click",
                function () {

                    if (
                        !speakerEnabled
                    ) {

                        speakerEnabled =
                            true;

                        localStorage.setItem(
                            "viggoSpeakerEnabled",
                            "true"
                        );

                        speakText(
                            text || ""
                        );

                        speakerBtn.textContent =
                            "🔊";

                        return;
                    }


                    speakerEnabled =
                        false;

                    localStorage.setItem(
                        "viggoSpeakerEnabled",
                        "false"
                    );

                    window.speechSynthesis.cancel();

                    speakerBtn.textContent =
                        "🔇";
                }
            );


            actions.appendChild(
                copyBtn
            );

            actions.appendChild(
                saveBtn
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
        }


        wrapper.appendChild(
            content
        );

        conversation.appendChild(
            wrapper
        );
    }


    function createActionButton(
        icon,
        title
    ) {

        const button =
            document.createElement(
                "button"
            );

        button.type =
            "button";

        button.className =
            "message-action-btn";

        button.textContent =
            icon;

        button.title =
            title;

        return button;
    }


    /* =====================================================
       COPY
    ===================================================== */

    async function copyText(text) {

        try {

            await navigator.clipboard.writeText(
                text
            );

        } catch (error) {

            const textarea =
                document.createElement(
                    "textarea"
                );

            textarea.value =
                text;

            document.body.appendChild(
                textarea
            );

            textarea.select();

            document.execCommand(
                "copy"
            );

            textarea.remove();
        }
    }


    /* =====================================================
       SAVE MESSAGE
    ===================================================== */

    function saveMessage(text) {

        let saved = [];

        try {

            saved =
                JSON.parse(
                    localStorage.getItem(
                        "viggoSavedMessages"
                    ) || "[]"
                );

        } catch (error) {

            saved = [];
        }

        saved.push({
            text: text,
            savedAt: Date.now()
        });

        localStorage.setItem(
            "viggoSavedMessages",
            JSON.stringify(saved)
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

        if (
            !Array.isArray(
                chat.messages
            )
        ) {

            chat.messages = [];
        }


        chat.messages.forEach(
            function (msg) {

                addMessageToUI(
                    msg.role,
                    msg.text,
                    msg.media,
                    msg
                );
            }
        );

        scrollToBottom();
    }


    function scrollToBottom() {

        if (!conversation) return;

        requestAnimationFrame(
            function () {

                conversation.scrollTop =
                    conversation.scrollHeight;
            }
        );
    }


    /* =====================================================
       CHAT TITLE
    ===================================================== */

    function updateChatTitle(
        chat,
        text
    ) {

        if (!chat) return;

        if (
            chat.title !==
            "New Chat"
        ) {
            return;
        }

        const clean =
            String(text || "")
                .replace(
                    /\s+/g,
                    " "
                )
                .trim();

        if (!clean) return;

        chat.title =
            clean.length > 35
                ? clean.substring(0, 35) +
                  "..."
                : clean;
    }


    /* =====================================================
       ADD MESSAGE
    ===================================================== */

    function addMessageToChat(
        role,
        text,
        media
    ) {

        const chat =
            getCurrentChat();

        if (!chat) return null;

        if (
            !Array.isArray(
                chat.messages
            )
        ) {

            chat.messages = [];
        }


        const msg = {

            id:
                Date.now().toString() +
                Math.random()
                    .toString(36)
                    .substring(2),

            role:
                role,

            text:
                text || "",

            media:
                media || null,

            createdAt:
                Date.now()
        };


        chat.messages.push(
            msg
        );

        return msg;
    }


    /* =====================================================
       HISTORY FOR API
    ===================================================== */

    function buildHistory() {

        const chat =
            getCurrentChat();

        if (!chat) return [];

        return chat.messages
            .slice(-30)
            .map(
                function (msg) {

                    return {

                        role:
                            msg.role ===
                            "assistant"
                                ? "model"
                                : "user",

                        parts: [
                            {
                                text:
                                    msg.text ||
                                    ""
                            }
                        ]
                    };
                }
            );
    }


    /* =====================================================
       TYPING
    ===================================================== */

    function showTyping() {

        if (!conversation) {
            return null;
        }

        const wrapper =
            document.createElement(
                "div"
            );

        wrapper.className =
            "message ai typing-message";


        const content =
            document.createElement(
                "div"
            );

        content.className =
            "message-content";


        const bubble =
            document.createElement(
                "div"
            );

        bubble.className =
            "message-bubble";

        bubble.textContent =
            "Viggo AI is typing...";


        content.appendChild(
            bubble
        );

        wrapper.appendChild(
            content
        );

        conversation.appendChild(
            wrapper
        );

        scrollToBottom();

        return wrapper;
    }


    function removeTyping(
        element
    ) {

        if (
            element &&
            element.parentNode
        ) {

            element.remove();
        }
    }


    /* =====================================================
       API RESPONSE
    ===================================================== */

    function extractResponse(data) {

        if (
            typeof data ===
            "string"
        ) {

            return data;
        }

        if (!data) return "";


        const fields = [

            "reply",
            "response",
            "message",
            "text",
            "answer",
            "output",
            "content"
        ];


        for (
            let i = 0;
            i < fields.length;
            i++
        ) {

            const value =
                data[fields[i]];

            if (
                typeof value ===
                    "string" &&
                value.trim()
            ) {

                return value;
            }
        }


        /* Gemini response */

        if (
            data.candidates &&
            Array.isArray(
                data.candidates
            )
        ) {

            const candidate =
                data.candidates[0];

            if (
                candidate &&
                candidate.content &&
                Array.isArray(
                    candidate.content.parts
                )
            ) {

                return candidate.content.parts
                    .map(
                        function (part) {

                            return part.text || "";
                        }
                    )
                    .join("")
                    .trim();
            }
        }


        return "";
    }


    /* =====================================================
       REQUEST AI
    ===================================================== */

    async function requestAI(
        userText,
        media
    ) {

        const payload = {

            message:
                userText || "",

            originalMessage:
                userText || "",

            conversationHistory:
                buildHistory(),

            language:
                selectedLanguage,

            browserTimezone:
                getTimezone(),

            currentDateTime:
                new Date().toString()
        };


        if (
            media &&
            media.data
        ) {

            payload.file = {

                name:
                    media.name || "file",

                type:
                    media.type ||
                    "application/octet-stream",

                data:
                    media.data
            };
        }


        const response =
            await fetch(
                API_URL,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        if (!response.ok) {

            let errorText = "";

            try {

                errorText =
                    await response.text();

            } catch (error) {

                errorText = "";
            }


            throw new Error(
                "HTTP " +
                response.status +
                (
                    errorText
                        ? " - " +
                          errorText
                        : ""
                )
            );
        }


        const data =
            await response.json();


        const answer =
            extractResponse(
                data
            );


        if (!answer) {

            throw new Error(
                "Empty AI response"
            );
        }


        return answer;
    }


    /* =====================================================
       SEND
    ===================================================== */

    async function sendMessage() {

        if (!messageInput) return;

        const userText =
            messageInput.value.trim();


        if (
            !userText &&
            !pendingMedia
        ) {

            return;
        }


        ensureChat();


        const chat =
            getCurrentChat();

        if (!chat) return;


        const media =
            pendingMedia;


        messageInput.value = "";

        pendingMedia = null;

        resizeMessageBox();


        addMessageToChat(
            "user",
            userText,
            media
        );


        updateChatTitle(
            chat,
            userText ||
                (
                    media
                        ? media.name
                        : "New Chat"
                )
        );


        saveChats();

        renderHistory();

        renderConversation();


        const typing =
            showTyping();


        try {

            const answer =
                await requestAI(
                    userText,
                    media
                );


            removeTyping(
                typing
            );


            addMessageToChat(
                "assistant",
                answer,
                null
            );


            saveChats();

            renderHistory();

            renderConversation();


        } catch (error) {

            console.error(
                "Viggo AI:",
                error
            );


            removeTyping(
                typing
            );


            addMessageToChat(
                "assistant",
                "Sorry, I couldn't connect to Viggo AI right now. Please try again.",
                null
            );


            saveChats();

            renderConversation();
        }
    }


    if (sendBtn) {

        sendBtn.addEventListener(
            "click",
            sendMessage
        );
    }


    /* =====================================================
       ENTER
    ===================================================== */

    if (messageInput) {

        messageInput.addEventListener(
            "keydown",
            function (event) {

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


        messageInput.addEventListener(
            "input",
            resizeMessageBox
        );
    }


    function resizeMessageBox() {

        if (!messageInput) return;

        messageInput.style.height =
            "auto";

        messageInput.style.height =
            Math.min(
                messageInput.scrollHeight,
                150
            ) + "px";
    }


    /* =====================================================
       PLUS MENU
    ===================================================== */

    if (plusBtn) {

        plusBtn.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                if (!plusMenu) return;

                plusMenu.classList.toggle(
                    "show"
                );
            }
        );
    }


    document.addEventListener(
        "click",
        function (event) {

            if (
                plusMenu &&
                !plusMenu.contains(
                    event.target
                ) &&
                event.target !== plusBtn
            ) {

                plusMenu.classList.remove(
                    "show"
                );
            }


            if (
                moreMenu &&
                !moreMenu.contains(
                    event.target
                ) &&
                event.target !== moreBtn
            ) {

                moreMenu.classList.remove(
                    "show"
                );
            }
        }
    );


    /* =====================================================
       FILE BUTTONS
    ===================================================== */

    if (cameraBtn) {

        cameraBtn.addEventListener(
            "click",
            function () {

                if (cameraInput) {

                    cameraInput.click();
                }

                closePlusMenu();
            }
        );
    }


    if (photoBtn) {

        photoBtn.addEventListener(
            "click",
            function () {

                if (photoInput) {

                    photoInput.click();
                }

                closePlusMenu();
            }
        );
    }


    if (videoBtn) {

        videoBtn.addEventListener(
            "click",
            function () {

                if (videoInput) {

                    videoInput.click();
                }

                closePlusMenu();
            }
        );
    }


    if (fileBtn) {

        fileBtn.addEventListener(
            "click",
            function () {

                if (fileInput) {

                    fileInput.click();
                }

                closePlusMenu();
            }
        );
    }


    function closePlusMenu() {

        if (plusMenu) {

            plusMenu.classList.remove(
                "show"
            );
        }
    }


    /* =====================================================
       FILE READER
    ===================================================== */

    function handleFile(
        file
    ) {

        if (!file) return;


        /* 50 MB FRONTEND LIMIT */

        const maxSize =
            50 * 1024 * 1024;

        if (
            file.size >
            maxSize
        ) {

            alert(
                "File is too large. Maximum size is 50 MB."
            );

            return;
        }


        const reader =
            new FileReader();


        reader.onload =
            function (event) {

                pendingMedia = {

                    name:
                        file.name,

                    type:
                        file.type ||
                        "application/octet-stream",

                    data:
                        event.target.result
                };


                if (messageInput) {

                    messageInput.focus();
                }


                alert(
                    file.name +
                    " attached. Now press Send."
                );
            };


        reader.onerror =
            function () {

                alert(
                    "Could not read this file."
                );
            };


        reader.readAsDataURL(
            file
        );
    }


    function connectFileInput(
        input
    ) {

        if (!input) return;

        input.addEventListener(
            "change",
            function () {

                const file =
                    input.files &&
                    input.files[0];

                if (file) {

                    handleFile(file);
                }

                input.value = "";
            }
        );
    }


    connectFileInput(
        cameraInput
    );

    connectFileInput(
        photoInput
    );

    connectFileInput(
        videoInput
    );

    connectFileInput(
        fileInput
    );


    /* =====================================================
       MORE MENU
    ===================================================== */

    if (moreBtn) {

        moreBtn.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                if (!moreMenu) return;

                moreMenu.classList.toggle(
                    "show"
                );
            }
        );
    }


    /* =====================================================
       SPEECH RECOGNITION
    ===================================================== */

    function setupRecognition() {

        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;


        if (!SpeechRecognition) {

            recognition = null;

            return;
        }


        recognition =
            new SpeechRecognition();


        recognition.continuous =
            false;

        recognition.interimResults =
            true;

        recognition.lang =
            selectedLanguage;


        recognition.onstart =
            function () {

                isListening =
                    true;

                if (micBtn) {

                    micBtn.textContent =
                        "🛑";
                }
            };


        recognition.onresult =
            function (event) {

                let transcript =
                    "";


                for (
                    let i = 0;
                    i <
                    event.results.length;
                    i++
                ) {

                    transcript +=
                        event.results[i][0]
                            .transcript;
                }


                if (messageInput) {

                    messageInput.value =
                        transcript;

                    resizeMessageBox();
                }
            };


        recognition.onerror =
            function (event) {

                console.error(
                    "Speech error:",
                    event.error
                );

                isListening =
                    false;

                if (micBtn) {

                    micBtn.textContent =
                        "🎤";
                }
            };


        recognition.onend =
            function () {

                isListening =
                    false;

                if (micBtn) {

                    micBtn.textContent =
                        "🎤";
                }
            };
    }


    if (micBtn) {

        micBtn.addEventListener(
            "click",
            function () {

                if (!recognition) {

                    setupRecognition();
                }


                if (!recognition) {

                    alert(
                        "Voice input is not supported in this browser."
                    );

                    return;
                }


                if (isListening) {

                    recognition.stop();

                    return;
                }


                recognition.lang =
                    selectedLanguage;


                try {

                    recognition.start();

                } catch (error) {

                    console.error(
                        error
                    );
                }
            }
        );
    }


    /* =====================================================
       SPEAKER
    ===================================================== */

    function speakText(text) {

        if (!text) return;

        if (
            !("speechSynthesis" in window)
        ) {

            alert(
                "Text-to-speech is not supported in this browser."
            );

            return;
        }


        window.speechSynthesis.cancel();


        const utterance =
            new SpeechSynthesisUtterance(
                text
            );


        utterance.lang =
            selectedLanguage;


        const voices =
            window.speechSynthesis
                .getVoices();


        if (
            voices &&
            voices.length
        ) {

            let matching =
                voices.find(
                    function (voice) {

                        return (
                            voice.lang &&
                            voice.lang
                                .toLowerCase()
                                .startsWith(
                                    selectedLanguage
                                        .split("-")[0]
                                        .toLowerCase()
                                )
                        );
                    }
                );


            if (
                voiceGender &&
                voiceGender.value
            ) {

                const gender =
                    voiceGender.value
                        .toLowerCase();


                const genderVoice =
                    voices.find(
                        function (voice) {

                            const name =
                                (
                                    voice.name ||
                                    ""
                                ).toLowerCase();

                            return (
                                name.includes(
                                    gender
                                ) &&
                                voice.lang &&
                                voice.lang
                                    .toLowerCase()
                                    .startsWith(
                                        selectedLanguage
                                            .split("-")[0]
                                            .toLowerCase()
                                    )
                            );
                        }
                    );


                if (genderVoice) {

                    matching =
                        genderVoice;
                }
            }


            if (matching) {

                utterance.voice =
                    matching;
            }
        }


        window.speechSynthesis.speak(
            utterance
        );
    }


    /* =====================================================
       VOICE MODAL
    ===================================================== */

    if (voiceMenuBtn) {

        voiceMenuBtn.addEventListener(
            "click",
            function () {

                closeMoreMenu();

                if (voiceModal) {

                    voiceModal.classList.add(
                        "show"
                    );
                }
            }
        );
    }


    if (closeVoice) {

        closeVoice.addEventListener(
            "click",
            function () {

                if (voiceModal) {

                    voiceModal.classList.remove(
                        "show"
                    );
                }
            }
        );
    }


    if (startVoice) {

        startVoice.addEventListener(
            "click",
            function () {

                speakerEnabled =
                    true;

                localStorage.setItem(
                    "viggoSpeakerEnabled",
                    "true"
                );


                if (voiceSelect) {

                    selectedLanguage =
                        voiceSelect.value ||
                        selectedLanguage;
                }


                localStorage.setItem(
                    "viggoLanguage",
                    selectedLanguage
                );


                setupRecognition();


                if (voiceModal) {

                    voiceModal.classList.remove(
                        "show"
                    );
                }


                speakText(
                    "Hello. Voice is ready."
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
            function () {

                closeMoreMenu();

                if (languageSelect) {

                    languageSelect.value =
                        selectedLanguage;
                }

                if (languageModal) {

                    languageModal.classList.add(
                        "show"
                    );
                }
            }
        );
    }


    if (closeLanguage) {

        closeLanguage.addEventListener(
            "click",
            function () {

                if (languageModal) {

                    languageModal.classList.remove(
                        "show"
                    );
                }
            }
        );
    }


    if (saveLanguage) {

        saveLanguage.addEventListener(
            "click",
            function () {

                if (languageSelect) {

                    selectedLanguage =
                        languageSelect.value ||
                        selectedLanguage;
                }


                localStorage.setItem(
                    "viggoLanguage",
                    selectedLanguage
                );


                setupRecognition();


                if (languageModal) {

                    languageModal.classList.remove(
                        "show"
                    );
                }
            }
        );
    }


    /* =====================================================
       MODAL BACKDROP
    ===================================================== */

    if (voiceModal) {

        voiceModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    voiceModal
                ) {

                    voiceModal.classList.remove(
                        "show"
                    );
                }
            }
        );
    }


    if (languageModal) {

        languageModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    languageModal
                ) {

                    languageModal.classList.remove(
                        "show"
                    );
                }
            }
        );
    }


    function closeMoreMenu() {

        if (moreMenu) {

            moreMenu.classList.remove(
                "show"
            );
        }
    }


    /* =====================================================
       SHARE CHAT LINK
    ===================================================== */

    function encodeShareData(data) {

        const json =
            JSON.stringify(data);

        const bytes =
            new TextEncoder()
                .encode(json);

        let binary = "";

        for (
            let i = 0;
            i < bytes.length;
            i++
        ) {

            binary += String.fromCharCode(
                bytes[i]
            );
        }

        return btoa(binary)
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/g, "");
    }


    function decodeShareData(value) {

        try {

            let base64 =
                value
                    .replace(/-/g, "+")
                    .replace(/_/g, "/");

            while (
                base64.length % 4
            ) {

                base64 += "=";
            }


            const binary =
                atob(base64);

            const bytes =
                new Uint8Array(
                    binary.length
                );


            for (
                let i = 0;
                i < binary.length;
                i++
            ) {

                bytes[i] =
                    binary.charCodeAt(i);
            }


            return JSON.parse(
                new TextDecoder()
                    .decode(bytes)
            );

        } catch (error) {

            console.error(
                "Share decode error:",
                error
            );

            return null;
        }
    }


    function createShareLink() {

        const chat =
            getCurrentChat();

        if (!chat) {

            return null;
        }


        /*
          Binary files are not put into the URL.
          Text chat is fully shared.
        */

        const shareChat = {

            title:
                chat.title ||
                "Shared Chat",

            messages:
                (chat.messages || [])
                    .map(
                        function (msg) {

                            return {

                                role:
                                    msg.role,

                                text:
                                    msg.text || "",

                                media:
                                    msg.media
                                        ? {
                                            name:
                                                msg.media.name ||
                                                "File",

                                            type:
                                                msg.media.type ||
                                                ""
                                        }
                                        : null
                            };
                        }
                    )
        };


        const encoded =
            encodeShareData(
                shareChat
            );


        return (
            window.location.origin +
            window.location.pathname +
            "#shared=" +
            encoded
        );
    }


    async function shareCurrentChat() {

        const link =
            createShareLink();


        if (!link) {

            alert(
                "No chat available to share."
            );

            return;
        }


        /*
          If URL is extremely large,
          browser may reject it.
        */

        if (
            link.length >
            180000
        ) {

            alert(
                "This chat is too large for a browser share link."
            );

            return;
        }


        if (
            navigator.share
        ) {

            try {

                await navigator.share({

                    title:
                        "Viggo AI Chat",

                    text:
                        "Shared chat from Viggo AI",

                    url:
                        link
                });

                return;

            } catch (error) {

                /*
                  User may cancel Share.
                  Do nothing.
                */

                if (
                    error &&
                    error.name ===
                    "AbortError"
                ) {

                    return;
                }
            }
        }


        await copyText(
            link
        );


        alert(
            "Share link copied!"
        );
    }


    if (shareBtn) {

        shareBtn.addEventListener(
            "click",
            shareCurrentChat
        );
    }


    /* =====================================================
       OPEN SHARED CHAT
    ===================================================== */

    function loadSharedChat() {

        const hash =
            window.location.hash;


        if (
            !hash.startsWith(
                "#shared="
            )
        ) {

            return false;
        }


        const encoded =
            hash.substring(
                "#shared=".length
            );


        const shared =
            decodeShareData(
                encoded
            );


        if (
            !shared ||
            !Array.isArray(
                shared.messages
            )
        ) {

            alert(
                "This shared chat link is invalid."
            );

            return false;
        }


        const chat = {

            id:
                Date.now().toString() +
                Math.random()
                    .toString(36)
                    .substring(2),

            title:
                shared.title ||
                "Shared Chat",

            pinned:
                false,

            createdAt:
                Date.now(),

            messages:
                shared.messages
                    .map(
                        function (msg) {

                            return {

                                id:
                                    Date.now()
                                        .toString() +
                                    Math.random()
                                        .toString(36)
                                        .substring(2),

                                role:
                                    msg.role ===
                                    "assistant"
                                        ? "assistant"
                                        : "user",

                                text:
                                    msg.text || "",

                                media:
                                    msg.media || null,

                                createdAt:
                                    Date.now()
                            };
                        }
                    )
        };


        chats.unshift(
            chat
        );

        currentChatId =
            chat.id;


        saveChats();

        renderHistory();

        renderConversation();


        /*
          Remove hash after importing.
          The chat remains in localStorage.
        */

        try {

            history.replaceState(
                null,
                "",
                window.location.pathname +
                window.location.search
            );

        } catch (error) {

            console.error(
                error
            );
        }


        return true;
    }


    /* =====================================================
       TIMEZONE
    ===================================================== */

    function getTimezone() {

        try {

            return (
                Intl.DateTimeFormat()
                    .resolvedOptions()
                    .timeZone ||
                "Asia/Kolkata"
            );

        } catch (error) {

            return "Asia/Kolkata";
        }
    }


    /* =====================================================
       INITIALIZE
    ===================================================== */

    loadChats();


    if (!loadSharedChat()) {

        ensureChat();

        renderHistory();

        renderConversation();
    }


    setupRecognition();

    resizeMessageBox();


    console.log(
        "VIGGO AI SCRIPT READY"
    );

})();
