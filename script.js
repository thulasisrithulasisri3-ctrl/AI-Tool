"use strict";

/* =====================================================
   VIGGO AI - FULL SCRIPT.JS
   CHAT + HISTORY + PIN + DELETE + UPLOAD + VOICE
   USER = RIGHT
   AI   = LEFT
   NO DATE/TIME DISPLAY BELOW MESSAGES
===================================================== */

(function () {

    console.log("=================================");
    console.log("VIGGO AI SCRIPT STARTING...");
    console.log("=================================");


    /* =================================================
       API
    ================================================= */

    const API_URL =
        "https://ai-tool-2-zpul.onrender.com/chat";


    /* =================================================
       GET ELEMENT
    ================================================= */

    function get(id) {
        return document.getElementById(id);
    }


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


    /* =================================================
       STATE
    ================================================= */

    let chats = [];

    let currentChatId = null;

    let selectedChats = new Set();

    let selectMode = false;

    let recognition = null;

    let isListening = false;

    let speakerEnabled = true;

    let selectedLanguage =
        localStorage.getItem("viggoLanguage") ||
        "en-IN";


    /* =================================================
       MOBILE VIEWPORT
    ================================================= */

    function fixViewportHeight() {

        const height =
            window.visualViewport
                ? window.visualViewport.height
                : window.innerHeight;

        document.documentElement.style.setProperty(
            "--app-height",
            `${height}px`
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


    /* =================================================
       STORAGE
    ================================================= */

    function saveChats() {

        localStorage.setItem(
            "viggoChats",
            JSON.stringify(chats)
        );

    }


    function loadChats() {

        try {

            const saved =
                localStorage.getItem(
                    "viggoChats"
                );

            if (saved) {

                const parsed =
                    JSON.parse(saved);

                if (Array.isArray(parsed)) {

                    chats = parsed;

                } else {

                    chats = [];

                }

            }

        } catch (error) {

            console.error(
                "Failed to load chats:",
                error
            );

            chats = [];

        }

    }


    /* =================================================
       CREATE CHAT
    ================================================= */

    function createChat() {

        return {

            id:
                Date.now().toString() +
                Math.random()
                    .toString(36)
                    .slice(2),

            title: "New Chat",

            pinned: false,

            createdAt: Date.now(),

            messages: []

        };

    }


    function getCurrentChat() {

        return chats.find(
            chat =>
                chat.id === currentChatId
        );

    }


    /* =================================================
       NEW CHAT
    ================================================= */

    function createNewChat() {

        const chat =
            createChat();

        chats.unshift(chat);

        currentChatId =
            chat.id;

        saveChats();

        renderHistory();

        renderConversation();

        closeSidebarMobile();

        if (messageInput) {

            messageInput.focus();

        }

    }


    /* =================================================
       ENSURE CHAT
    ================================================= */

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


    /* =================================================
       HISTORY
    ================================================= */

    function renderHistory() {

        if (!chatHistory) return;

        chatHistory.innerHTML = "";


        let filtered =
            chats.slice();


        const search =
            searchChat
                ? searchChat.value
                    .trim()
                    .toLowerCase()
                : "";


        if (search) {

            filtered =
                filtered.filter(
                    chat =>
                        (
                            chat.title ||
                            "New Chat"
                        )
                        .toLowerCase()
                        .includes(search)
                );

        }


        /* PINNED FIRST */

        filtered.sort(
            (a, b) => {

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


                /* =================================================
                   CHECKBOX
                ================================================= */

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


                /* =================================================
                   TITLE
                ================================================= */

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


                /* =================================================
                   ACTIONS
                ================================================= */

                const actions =
                    document.createElement(
                        "div"
                    );

                actions.className =
                    "history-actions";


                /* =================================================
                   PIN
                ================================================= */

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


                /* =================================================
                   DELETE
                ================================================= */

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


                /* =================================================
                   OPEN CHAT
                ================================================= */

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


    /* =================================================
       DELETE CHAT
    ================================================= */

    function deleteChat(id) {

        chats =
            chats.filter(
                chat =>
                    chat.id !== id
            );


        selectedChats.delete(id);


        if (
            currentChatId === id
        ) {

            if (chats.length) {

                currentChatId =
                    chats[0].id;

            } else {

                const newChatObject =
                    createChat();

                chats.push(
                    newChatObject
                );

                currentChatId =
                    newChatObject.id;

            }

        }


        saveChats();

        renderHistory();

        renderConversation();

    }


    /* =================================================
       SELECT CHAT
    ================================================= */

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


    /* =================================================
       SELECT MODE
    ================================================= */

    function toggleSelectMode() {

        selectMode =
            !selectMode;

        selectedChats.clear();

        renderHistory();

    }


    /* =================================================
       DELETE SELECTED
    ================================================= */

    function deleteSelectedChats() {

        if (!selectedChats.size) {

            alert(
                "Please select at least one chat."
            );

            return;

        }


        chats =
            chats.filter(
                chat =>
                    !selectedChats.has(
                        chat.id
                    )
            );


        selectedChats.clear();


        if (!chats.length) {

            const newChatObject =
                createChat();

            chats.push(
                newChatObject
            );

        }


        const exists =
            chats.some(
                chat =>
                    chat.id ===
                    currentChatId
            );


        if (!exists) {

            currentChatId =
                chats[0].id;

        }


        saveChats();

        renderHistory();

        renderConversation();

    }


    /* =================================================
       CLEAR CURRENT CHAT
    ================================================= */

    function clearCurrentChat() {

        const chat =
            getCurrentChat();

        if (!chat) return;


        chat.messages = [];

        chat.title =
            "New Chat";


        saveChats();

        renderHistory();

        renderConversation();

    }


    /* =================================================
       MESSAGE RENDER
       
       IMPORTANT:
       NO DATE/TIME IS DISPLAYED HERE.
    ================================================= */

    function renderConversation() {

        if (!conversation) return;

        conversation.innerHTML = "";


        const chat =
            getCurrentChat();


        if (!chat) return;


        if (!Array.isArray(chat.messages)) {

            chat.messages = [];

        }


        chat.messages.forEach(
            msg => {

                addMessageToUI(
                    msg.role,
                    msg.text,
                    msg.media,
                    false
                );

            }
        );


        scrollToBottom();

    }


    /* =================================================
       ADD MESSAGE UI
       
       USER = RIGHT
       AI   = LEFT

       NO DATE
       NO TIME
       NO TIMESTAMP
    ================================================= */

    function addMessageToUI(
        role,
        text,
        media = null,
        shouldScroll = true
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


        /* =================================================
           MEDIA
        ================================================= */

        if (
            media &&
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
                    "Uploaded image";

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


                if (text) {

                    const caption =
                        document.createElement(
                            "div"
                        );

                    caption.textContent =
                        text;

                    caption.style.marginTop =
                        "8px";

                    bubble.appendChild(
                        caption
                    );

                }

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

                video.playsInline =
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


                if (text) {

                    const caption =
                        document.createElement(
                            "div"
                        );

                    caption.textContent =
                        text;

                    caption.style.marginTop =
                        "8px";

                    bubble.appendChild(
                        caption
                    );

                }

            } else {

                bubble.textContent =
                    text ||
                    `📎 ${media.name}`;

            }

        } else {

            bubble.textContent =
                text || "";

        }


        content.appendChild(
            bubble
        );


        /* =================================================
           AI MESSAGE ACTIONS
           
           COPY / SAVE / LIKE / SPEAKER
        ================================================= */

        if (
            role === "ai" &&
            text
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
                    "📋 Copy",
                    "Copy"
                );


            copyBtn.addEventListener(
                "click",
                async function () {

                    try {

                        await navigator
                            .clipboard
                            .writeText(
                                text
                            );

                        copyBtn.textContent =
                            "✓ Copied";

                        setTimeout(
                            function () {

                                copyBtn.textContent =
                                    "📋 Copy";

                            },
                            1200
                        );

                    } catch (error) {

                        console.error(
                            "Copy error:",
                            error
                        );

                    }

                }
            );


            /* SAVE */

            const saveBtn =
                createActionButton(
                    "💾 Save",
                    "Save"
                );


            saveBtn.addEventListener(
                "click",
                function () {

                    const blob =
                        new Blob(
                            [text],
                            {
                                type:
                                    "text/plain"
                            }
                        );


                    const url =
                        URL.createObjectURL(
                            blob
                        );


                    const a =
                        document.createElement(
                            "a"
                        );

                    a.href =
                        url;

                    a.download =
                        "viggo-ai-reply.txt";


                    document.body.appendChild(
                        a
                    );

                    a.click();

                    a.remove();


                    URL.revokeObjectURL(
                        url
                    );

                }
            );


            /* LIKE */

            const likeBtn =
                createActionButton(
                    "👍 Like",
                    "Like"
                );


            likeBtn.addEventListener(
                "click",
                function () {

                    if (
                        likeBtn.textContent
                            .includes("Liked")
                    ) {

                        likeBtn.textContent =
                            "👍 Like";

                    } else {

                        likeBtn.textContent =
                            "👍 Liked";

                    }

                }
            );


            /* SPEAKER */

            const speakerBtn =
                createActionButton(
                    "🔊 Speak",
                    "Speak"
                );


            speakerBtn.addEventListener(
                "click",
                function () {

                    speakText(text);

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


        if (shouldScroll) {

            scrollToBottom();

        }


        return wrapper;

    }


    /* =================================================
       ACTION BUTTON
    ================================================= */

    function createActionButton(
        text,
        title
    ) {

        const button =
            document.createElement(
                "button"
            );

        button.type =
            "button";

        button.textContent =
            text;

        button.title =
            title;

        return button;

    }


    /* =================================================
       TYPING
    ================================================= */

    function showTyping(
        text = "Thinking..."
    ) {

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
            text;


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


    /* =================================================
       SCROLL
    ================================================= */

    function scrollToBottom() {

        if (!conversation) return;


        requestAnimationFrame(
            function () {

                conversation.scrollTop =
                    conversation.scrollHeight;

            }
        );

    }


    /* =================================================
       SEND MESSAGE
    ================================================= */

    async function sendMessage() {

        if (!messageInput) return;


        const text =
            messageInput.value.trim();


        if (!text) return;


        const chat =
            getCurrentChat();


        if (!chat) return;


        /* USER MESSAGE */

        chat.messages.push({

            role:
                "user",

            text:
                text,

            timestamp:
                Date.now()

        });


        /* CHAT TITLE */

        if (
            chat.title ===
            "New Chat"
        ) {

            chat.title =
                text.length > 35
                    ? text.slice(0, 35) +
                      "..."
                    : text;

        }


        messageInput.value =
            "";

        autoResizeTextarea();


        addMessageToUI(
            "user",
            text
        );


        saveChats();

        renderHistory();


        /* TYPING */

        const typing =
            showTyping(
                "Thinking..."
            );


        if (sendBtn) {

            sendBtn.disabled =
                true;

        }


        try {

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
                            JSON.stringify({

                                message:
                                    text,

                                language:
                                    selectedLanguage

                            })

                    }
                );


            const data =
                await response
                    .json()
                    .catch(
                        () => ({})
                    );


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    data.message ||
                    `Server error ${response.status}`
                );

            }


            let reply =
                data.reply ||
                data.response ||
                data.text ||
                data.message;


            if (
                typeof reply !==
                "string"
            ) {

                reply =
                    "Sorry friend, I couldn't get a proper reply from Viggo AI.";

            }


            typing.remove();


            /* AI MESSAGE */

            chat.messages.push({

                role:
                    "ai",

                text:
                    reply,

                timestamp:
                    Date.now()

            });


            addMessageToUI(
                "ai",
                reply
            );


            saveChats();

            renderHistory();


        } catch (error) {

            console.error(
                "CHAT ERROR:",
                error
            );


            if (typing) {

                typing.remove();

            }


            const errorText =
                "Sorry friend, I couldn't connect to Viggo AI right now.";


            chat.messages.push({

                role:
                    "ai",

                text:
                    errorText,

                timestamp:
                    Date.now()

            });


            addMessageToUI(
                "ai",
                errorText
            );


            saveChats();

        } finally {

            if (sendBtn) {

                sendBtn.disabled =
                    false;

            }


            if (messageInput) {

                messageInput.focus();

            }

        }

    }


    /* =================================================
       UPLOAD FILE
    ================================================= */

    async function sendUploadedFile(
        file
    ) {

        if (!file) return;


        const chat =
            getCurrentChat();


        if (!chat) return;


        const reader =
            new FileReader();


        reader.onload =
            async function () {

                const dataURL =
                    reader.result;


                const media = {

                    name:
                        file.name,

                    type:
                        file.type ||
                        "application/octet-stream",

                    data:
                        dataURL

                };


                const text =
                    `Uploaded file: ${file.name}`;


                chat.messages.push({

                    role:
                        "user",

                    text:
                        text,

                    media:
                        media,

                    timestamp:
                        Date.now()

                });


                addMessageToUI(
                    "user",
                    text,
                    media
                );


                saveChats();

                renderHistory();


                const typing =
                    showTyping(
                        "Analyzing your upload..."
                    );


                try {

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
                                    JSON.stringify({

                                        message:
                                            `Please analyze this uploaded file: ${file.name}`,

                                        language:
                                            selectedLanguage,

                                        file: {

                                            name:
                                                file.name,

                                            type:
                                                file.type,

                                            data:
                                                dataURL

                                        }

                                    })

                            }
                        );


                    const data =
                        await response
                            .json()
                            .catch(
                                () => ({})
                            );


                    if (!response.ok) {

                        throw new Error(
                            data.error ||
                            `Server error ${response.status}`
                        );

                    }


                    const reply =
                        data.reply ||
                        data.response ||
                        data.text ||
                        data.message ||
                        "I received your file.";


                    typing.remove();


                    chat.messages.push({

                        role:
                            "ai",

                        text:
                            String(reply),

                        timestamp:
                            Date.now()

                    });


                    addMessageToUI(
                        "ai",
                        String(reply)
                    );


                    saveChats();

                    renderHistory();


                } catch (error) {

                    console.error(
                        "UPLOAD ERROR:",
                        error
                    );


                    if (typing) {

                        typing.remove();

                    }


                    const reply =
                        "I received the upload, but I couldn't analyze it right now.";


                    chat.messages.push({

                        role:
                            "ai",

                        text:
                            reply,

                        timestamp:
                            Date.now()

                    });


                    addMessageToUI(
                        "ai",
                        reply
                    );


                    saveChats();

                }

            };


        reader.onerror =
            function (error) {

                console.error(
                    "FileReader error:",
                    error
                );

            };


        reader.readAsDataURL(
            file
        );

    }


    /* =================================================
       FILE INPUT
    ================================================= */

    function handleFileInput(
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

                    sendUploadedFile(
                        file
                    );

                }


                input.value =
                    "";

            }
        );

    }


    handleFileInput(
        cameraInput
    );

    handleFileInput(
        photoInput
    );

    handleFileInput(
        videoInput
    );

    handleFileInput(
        fileInput
    );


    /* =================================================
       PLUS MENU
    ================================================= */

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


    /* =================================================
       CAMERA
    ================================================= */

    if (cameraBtn) {

        cameraBtn.addEventListener(
            "click",
            function () {

                if (plusMenu) {

                    plusMenu.classList.remove(
                        "show"
                    );

                }


                if (cameraInput) {

                    cameraInput.click();

                }

            }
        );

    }


    /* =================================================
       PHOTO
    ================================================= */

    if (photoBtn) {

        photoBtn.addEventListener(
            "click",
            function () {

                if (plusMenu) {

                    plusMenu.classList.remove(
                        "show"
                    );

                }


                if (photoInput) {

                    photoInput.click();

                }

            }
        );

    }


    /* =================================================
       VIDEO
    ================================================= */

    if (videoBtn) {

        videoBtn.addEventListener(
            "click",
            function () {

                if (plusMenu) {

                    plusMenu.classList.remove(
                        "show"
                    );

                }


                if (videoInput) {

                    videoInput.click();

                }

            }
        );

    }


    /* =================================================
       FILE
    ================================================= */

    if (fileBtn) {

        fileBtn.addEventListener(
            "click",
            function () {

                if (plusMenu) {

                    plusMenu.classList.remove(
                        "show"
                    );

                }


                if (fileInput) {

                    fileInput.click();

                }

            }
        );

    }


    /* =================================================
       SEND BUTTON
    ================================================= */

    if (sendBtn) {

        sendBtn.addEventListener(
            "click",
            sendMessage
        );

    }


    /* =================================================
       ENTER TO SEND
    ================================================= */

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


        messageInput.addEventListener(
            "input",
            autoResizeTextarea
        );

    }


    /* =================================================
       TEXTAREA
    ================================================= */

    function autoResizeTextarea() {

        if (!messageInput) return;


        messageInput.style.height =
            "auto";


        messageInput.style.height =
            Math.min(
                messageInput.scrollHeight,
                130
            ) + "px";

    }


    /* =================================================
       SIDEBAR
    ================================================= */

    if (openSidebar) {

        openSidebar.addEventListener(
            "click",
            function () {

                if (sidebar) {

                    sidebar.classList.add(
                        "open"
                    );

                }

            }
        );

    }


    if (closeSidebar) {

        closeSidebar.addEventListener(
            "click",
            closeSidebarMobile
        );

    }


    function closeSidebarMobile() {

        if (sidebar) {

            sidebar.classList.remove(
                "open"
            );

        }

    }


    /* =================================================
       NEW CHAT
    ================================================= */

    if (newChat) {

        newChat.addEventListener(
            "click",
            createNewChat
        );

    }


    /* =================================================
       SEARCH
    ================================================= */

    if (searchChat) {

        searchChat.addEventListener(
            "input",
            renderHistory
        );

    }


    /* =================================================
       MORE
    ================================================= */

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


    /* =================================================
       VOICE MENU
    ================================================= */

    if (voiceMenuBtn) {

        voiceMenuBtn.addEventListener(
            "click",
            function () {

                if (moreMenu) {

                    moreMenu.classList.remove(
                        "show"
                    );

                }


                openVoiceModal();

            }
        );

    }


    /* =================================================
       LANGUAGE
    ================================================= */

    if (languageBtn) {

        languageBtn.addEventListener(
            "click",
            function () {

                if (moreMenu) {

                    moreMenu.classList.remove(
                        "show"
                    );

                }


                openLanguageModal();

            }
        );

    }


    /* =================================================
       SELECT CHAT
    ================================================= */

    if (selectChatsBtn) {

        selectChatsBtn.addEventListener(
            "click",
            function () {

                if (moreMenu) {

                    moreMenu.classList.remove(
                        "show"
                    );

                }


                toggleSelectMode();

            }
        );

    }


    /* =================================================
       DELETE SELECTED
    ================================================= */

    if (deleteSelectedBtn) {

        deleteSelectedBtn.addEventListener(
            "click",
            function () {

                if (moreMenu) {

                    moreMenu.classList.remove(
                        "show"
                    );

                }


                deleteSelectedChats();

            }
        );

    }


    /* =================================================
       CLEAR CHAT
    ================================================= */

    if (clearChatBtn) {

        clearChatBtn.addEventListener(
            "click",
            function () {

                if (moreMenu) {

                    moreMenu.classList.remove(
                        "show"
                    );

                }


                clearCurrentChat();

            }
        );

    }


    /* =================================================
       VOICE MODAL
    ================================================= */

    function openVoiceModal() {

        if (!voiceModal) return;


        voiceModal.classList.add(
            "show"
        );

        voiceModal.classList.add(
            "open"
        );

    }


    function closeVoiceModal() {

        if (!voiceModal) return;


        voiceModal.classList.remove(
            "show"
        );

        voiceModal.classList.remove(
            "open"
        );

    }


    if (closeVoice) {

        closeVoice.addEventListener(
            "click",
            closeVoiceModal
        );

    }


    if (startVoice) {

        startVoice.addEventListener(
            "click",
            function () {

                if (voiceSelect) {

                    selectedLanguage =
                        voiceSelect.value;


                    localStorage.setItem(
                        "viggoLanguage",
                        selectedLanguage
                    );

                }


                closeVoiceModal();

            }
        );

    }


    /* =================================================
       LANGUAGE MODAL
    ================================================= */

    function openLanguageModal() {

        if (!languageModal) return;


        if (languageSelect) {

            languageSelect.value =
                selectedLanguage;

        }


        languageModal.classList.add(
            "show"
        );

        languageModal.classList.add(
            "open"
        );

    }


    function closeLanguageModal() {

        if (!languageModal) return;


        languageModal.classList.remove(
            "show"
        );

        languageModal.classList.remove(
            "open"
        );

    }


    if (closeLanguage) {

        closeLanguage.addEventListener(
            "click",
            closeLanguageModal
        );

    }


    if (saveLanguage) {

        saveLanguage.addEventListener(
            "click",
            function () {

                if (languageSelect) {

                    selectedLanguage =
                        languageSelect.value;


                    localStorage.setItem(
                        "viggoLanguage",
                        selectedLanguage
                    );

                }


                if (recognition) {

                    recognition.lang =
                        selectedLanguage;

                }


                closeLanguageModal();

            }
        );

    }


    /* =================================================
       MODAL BACKDROP
    ================================================= */

    if (voiceModal) {

        voiceModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    voiceModal
                ) {

                    closeVoiceModal();

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

                    closeLanguageModal();

                }

            }
        );

    }


    /* =================================================
       SPEECH RECOGNITION
    ================================================= */

    function setupSpeechRecognition() {

        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;


        if (!SpeechRecognition) {

            console.warn(
                "Speech Recognition is not supported."
            );

            return null;

        }


        const rec =
            new SpeechRecognition();


        rec.continuous =
            false;

        rec.interimResults =
            false;

        rec.lang =
            selectedLanguage;


        rec.onstart =
            function () {

                isListening =
                    true;


                if (micBtn) {

                    micBtn.classList.add(
                        "active"
                    );

                }

            };


        rec.onresult =
            function (event) {

                const result =
                    event.results[0][0]
                        .transcript;


                if (messageInput) {

                    messageInput.value =
                        result;

                    autoResizeTextarea();

                    messageInput.focus();

                }

            };


        rec.onerror =
            function (event) {

                console.error(
                    "Speech error:",
                    event.error
                );

            };


        rec.onend =
            function () {

                isListening =
                    false;


                if (micBtn) {

                    micBtn.classList.remove(
                        "active"
                    );

                }

            };


        return rec;

    }


    /* =================================================
       MICROPHONE
    ================================================= */

    function toggleMicrophone() {

        if (isListening) {

            if (recognition) {

                recognition.stop();

            }

            return;

        }


        if (!recognition) {

            recognition =
                setupSpeechRecognition();

        }


        if (!recognition) {

            alert(
                "Voice input is not supported in this browser."
            );

            return;

        }


        recognition.lang =
            selectedLanguage;


        try {

            recognition.start();

        } catch (error) {

            console.error(
                "Microphone start error:",
                error
            );

        }

    }


    if (micBtn) {

        micBtn.addEventListener(
            "click",
            toggleMicrophone
        );

    }


    /* =================================================
       SPEAKER
    ================================================= */

    function speakText(text) {

        if (
            !("speechSynthesis" in window)
        ) {

            alert(
                "Speech output is not supported in this browser."
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


        let voice =
            voices.find(
                v =>
                    v.lang ===
                    selectedLanguage
            );


        if (!voice) {

            voice =
                voices.find(
                    v =>
                        v.lang &&
                        v.lang.startsWith(
                            selectedLanguage
                                .split("-")[0]
                        )
                );

        }


        if (voice) {

            utterance.voice =
                voice;

        }


        window.speechSynthesis.speak(
            utterance
        );

    }


    /* =================================================
       SHARE
    ================================================= */

    if (shareBtn) {

        shareBtn.addEventListener(
            "click",
            async function () {

                const chat =
                    getCurrentChat();


                if (!chat) return;


                const text =
                    chat.messages
                        .map(
                            msg =>
                                (
                                    msg.role ===
                                    "user"
                                        ? "You: "
                                        : "Viggo AI: "
                                ) +
                                (
                                    msg.text ||
                                    ""
                                )
                        )
                        .join("\n\n");


                if (
                    navigator.share
                ) {

                    try {

                        await navigator.share({

                            title:
                                "Viggo AI Chat",

                            text:
                                text

                        });

                    } catch (error) {

                        console.log(
                            "Share cancelled."
                        );

                    }

                } else {

                    try {

                        await navigator
                            .clipboard
                            .writeText(
                                text
                            );

                        alert(
                            "Chat copied to clipboard."
                        );

                    } catch (error) {

                        alert(
                            "Sharing is not supported."
                        );

                    }

                }

            }
        );

    }


    /* =================================================
       ESCAPE
    ================================================= */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key ===
                "Escape"
            ) {

                closeSidebarMobile();


                if (plusMenu) {

                    plusMenu.classList.remove(
                        "show"
                    );

                }


                if (moreMenu) {

                    moreMenu.classList.remove(
                        "show"
                    );

                }


                closeVoiceModal();

                closeLanguageModal();

            }

        }
    );


    /* =================================================
       INITIALIZE
    ================================================= */

    loadChats();

    ensureChat();

    renderHistory();

    renderConversation();

    autoResizeTextarea();


    /* =================================================
       LANGUAGE
    ================================================= */

    if (voiceSelect) {

        voiceSelect.value =
            selectedLanguage;

    }


    if (languageSelect) {

        languageSelect.value =
            selectedLanguage;

    }


    console.log(
        "VIGGO AI SCRIPT READY"
    );

})();
