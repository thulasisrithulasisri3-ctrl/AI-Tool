"use strict";

/* =====================================================
   VIGGO AI - FULL SCRIPT.JS
   CHAT + HISTORY + PIN + DELETE + UPLOAD + VOICE
   COPY + SAVE + LIKE + SPEAKER + SHARE
   USER = RIGHT
   AI   = LEFT
   NO DATE/TIME DISPLAY
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


    /* =================================================
       ELEMENTS
    ================================================= */

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

    let pendingMedia = null;


    /* =================================================
       SPEAKER STATE
    ================================================= */

    let speakerEnabled =
        localStorage.getItem("viggoSpeakerEnabled") !== "false";


    /* =================================================
       LANGUAGE
    ================================================= */

    let selectedLanguage =
        localStorage.getItem("viggoLanguage") || "en-IN";


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
                localStorage.getItem("viggoChats");

            if (saved) {

                const parsed =
                    JSON.parse(saved);

                if (Array.isArray(parsed)) {
                    chats = parsed;
                } else {
                    chats = [];
                }

            } else {
                chats = [];
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
            messageInput.value = "";
            messageInput.focus();
        }

        pendingMedia = null;
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
                    document.createElement("div");

                item.className =
                    "history-item";


                if (
                    chat.id === currentChatId
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
                    selectedChats.has(chat.id)
                ) {

                    item.classList.add(
                        "selected"
                    );
                }


                /* CHECKBOX */

                if (selectMode) {

                    const checkbox =
                        document.createElement("input");

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
                    document.createElement("div");

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
                    document.createElement("div");

                actions.className =
                    "history-actions";


                /* PIN */

                const pinBtn =
                    document.createElement("button");

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
                    document.createElement("button");

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


                /* OPEN CHAT */

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

            currentChatId =
                newChatObject.id;
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
    ================================================= */

    function addMessageToUI(
        role,
        text,
        media = null,
        shouldScroll = true
    ) {

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


        /* MEDIA */

        if (
            media &&
            media.type
        ) {

            if (
                media.type.startsWith("image/")
            ) {

                const img =
                    document.createElement("img");

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

            } else {

                const mediaText =
                    document.createElement("div");

                mediaText.textContent =
                    "📎 " +
                    (
                        media.name ||
                        "Uploaded file"
                    );

                bubble.appendChild(
                    mediaText
                );
            }
        }


        /* TEXT */

        if (text) {

            const textDiv =
                document.createElement("div");

            textDiv.className =
                "message-text";

            textDiv.textContent =
                text;

            bubble.appendChild(
                textDiv
            );
        }


        content.appendChild(
            bubble
        );


        /* =================================================
           ACTION BUTTONS
        ================================================= */

        if (role !== "user") {

            const actions =
                document.createElement("div");

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
                async function () {

                    try {

                        await navigator.clipboard.writeText(
                            text || ""
                        );

                        copyBtn.textContent =
                            "✓";

                        setTimeout(
                            function () {
                                copyBtn.textContent =
                                    "📋";
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
                    "💾",
                    "Save"
                );

            saveBtn.addEventListener(
                "click",
                function () {

                    saveMessage(text);

                    saveBtn.textContent =
                        "✓";

                    setTimeout(
                        function () {
                            saveBtn.textContent =
                                "💾";
                        },
                        1200
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
                        "active"
                    );
                }
            );


            /* SPEAKER */

            const speakerBtn =
                createSpeakerButton(
                    text || ""
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
        icon,
        title
    ) {

        const button =
            document.createElement("button");

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


    /* =================================================
       SAVE MESSAGE
    ================================================= */

    function saveMessage(text) {

        if (!text) return;

        try {

            const saved =
                JSON.parse(
                    localStorage.getItem(
                        "viggoSavedMessages"
                    ) || "[]"
                );

            saved.push({
                text: text,
                savedAt: Date.now()
            });

            localStorage.setItem(
                "viggoSavedMessages",
                JSON.stringify(saved)
            );

        } catch (error) {

            console.error(
                "Save message error:",
                error
            );
        }
    }


    /* =================================================
       SPEAKER
    ================================================= */

    function getSpeechLanguage() {

        if (
            selectedLanguage === "ta-IN"
        ) {
            return "ta-IN";
        }

        if (
            selectedLanguage === "hi-IN"
        ) {
            return "hi-IN";
        }

        return "en-IN";
    }


    function speakText(text) {

        if (!speakerEnabled) {
            return;
        }

        if (
            !("speechSynthesis" in window)
        ) {

            console.warn(
                "Speech synthesis is not supported."
            );

            return;
        }

        if (!text) return;

        window.speechSynthesis.cancel();

        const utterance =
            new SpeechSynthesisUtterance(
                text
            );

        utterance.lang =
            getSpeechLanguage();

        utterance.rate =
            1;

        utterance.pitch =
            1;

        utterance.volume =
            1;

        window.speechSynthesis.speak(
            utterance
        );
    }


    function toggleSpeaker() {

        speakerEnabled =
            !speakerEnabled;

        localStorage.setItem(
            "viggoSpeakerEnabled",
            String(
                speakerEnabled
            )
        );


        if (!speakerEnabled) {

            if (
                "speechSynthesis" in window
            ) {

                window.speechSynthesis.cancel();
            }
        }

        console.log(
            "Speaker:",
            speakerEnabled
                ? "ON"
                : "OFF"
        );
    }


    function updateSpeakerButton(
        button
    ) {

        if (!button) return;

        if (speakerEnabled) {

            button.textContent =
                "🔊";

            button.title =
                "Speaker ON - Click to turn OFF";

        } else {

            button.textContent =
                "🔇";

            button.title =
                "Speaker OFF - Click to turn ON";
        }
    }


    function createSpeakerButton(
        text
    ) {

        const button =
            document.createElement("button");

        button.type =
            "button";

        button.className =
            "speaker-action-btn";

        updateSpeakerButton(
            button
        );

        button.addEventListener(
            "click",
            function () {

                toggleSpeaker();

                updateSpeakerButton(
                    button
                );

                if (speakerEnabled) {
                    speakText(text);
                }
            }
        );

        return button;
    }


    /* =================================================
       PLUS MENU
    ================================================= */

    if (plusBtn) {

        plusBtn.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                if (plusMenu) {

                    plusMenu.classList.toggle(
                        "show"
                    );
                }
            }
        );
    }


    if (plusMenu) {

        plusMenu.addEventListener(
            "click",
            function (event) {
                event.stopPropagation();
            }
        );
    }


    /* =================================================
       CAMERA
    ================================================= */

    if (cameraBtn) {

        cameraBtn.addEventListener(
            "click",
            function () {

                if (plusMenu) {
                    plusMenu.classList.remove("show");
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
                    plusMenu.classList.remove("show");
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
                    plusMenu.classList.remove("show");
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
                    plusMenu.classList.remove("show");
                }

                if (fileInput) {
                    fileInput.click();
                }
            }
        );
    }


    /* =================================================
       FILE INPUT HANDLER
    ================================================= */

    function handleFileInput(input) {

        if (!input || !input.files || !input.files.length) {
            return;
        }

        const file =
            input.files[0];

        const reader =
            new FileReader();

        reader.onload =
            function (event) {

                pendingMedia = {

                    name:
                        file.name,

                    type:
                        file.type,

                    data:
                        event.target.result
                };

                console.log(
                    "Selected file:",
                    file.name
                );
            };

        reader.readAsDataURL(file);

        input.value = "";
    }


    if (cameraInput) {

        cameraInput.addEventListener(
            "change",
            function () {
                handleFileInput(
                    cameraInput
                );
            }
        );
    }


    if (photoInput) {

        photoInput.addEventListener(
            "change",
            function () {
                handleFileInput(
                    photoInput
                );
            }
        );
    }


    if (videoInput) {

        videoInput.addEventListener(
            "change",
            function () {
                handleFileInput(
                    videoInput
                );
            }
        );
    }


    if (fileInput) {

        fileInput.addEventListener(
            "change",
            function () {
                handleFileInput(
                    fileInput
                );
            }
        );
    }


    /* =================================================
       SIDEBAR
    ================================================= */

    function openSidebarMobile() {

        if (sidebar) {
            sidebar.classList.add("open");
        }
    }


    function closeSidebarMobile() {

        if (sidebar) {
            sidebar.classList.remove("open");
        }
    }


    if (openSidebar) {

        openSidebar.addEventListener(
            "click",
            function () {
                openSidebarMobile();
            }
        );
    }


    if (closeSidebar) {

        closeSidebar.addEventListener(
            "click",
            function () {
                closeSidebarMobile();
            }
        );
    }


    /* =================================================
       NEW CHAT
    ================================================= */

    if (newChat) {

        newChat.addEventListener(
            "click",
            function () {
                createNewChat();
            }
        );
    }


    /* =================================================
       SEARCH
    ================================================= */

    if (searchChat) {

        searchChat.addEventListener(
            "input",
            function () {
                renderHistory();
            }
        );
    }


    /* =================================================
       SELECT CHATS
    ================================================= */

    if (selectChatsBtn) {

        selectChatsBtn.addEventListener(
            "click",
            function () {
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
                clearCurrentChat();
            }
        );
    }


    /* =================================================
       MORE MENU
    ================================================= */

    if (moreBtn) {

        moreBtn.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                if (moreMenu) {

                    moreMenu.classList.toggle(
                        "show"
                    );
                }
            }
        );
    }


    if (moreMenu) {

        moreMenu.addEventListener(
            "click",
            function (event) {
                event.stopPropagation();
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
                    moreMenu.classList.remove("show");
                }

                if (voiceModal) {
                    voiceModal.classList.add("show");
                }
            }
        );
    }


    /* =================================================
       CLOSE VOICE
    ================================================= */

    if (closeVoice) {

        closeVoice.addEventListener(
            "click",
            function () {

                if (voiceModal) {
                    voiceModal.classList.remove("show");
                }
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
                    moreMenu.classList.remove("show");
                }

                if (languageModal) {
                    languageModal.classList.add("show");
                }
            }
        );
    }


    /* =================================================
       CLOSE LANGUAGE
    ================================================= */

    if (closeLanguage) {

        closeLanguage.addEventListener(
            "click",
            function () {

                if (languageModal) {
                    languageModal.classList.remove("show");
                }
            }
        );
    }


    /* =================================================
       SAVE LANGUAGE
    ================================================= */

    if (saveLanguage) {

        saveLanguage.addEventListener(
            "click",
            function () {

                if (languageSelect) {

                    selectedLanguage =
                        languageSelect.value;
                }

                localStorage.setItem(
                    "viggoLanguage",
                    selectedLanguage
                );

                if (recognition) {
                    recognition.lang =
                        selectedLanguage;
                }

                if (languageModal) {
                    languageModal.classList.remove("show");
                }
            }
        );
    }


    /* =================================================
       SPEECH RECOGNITION
    ================================================= */

    function setupRecognition() {

        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!SpeechRecognition) {

            console.warn(
                "Speech recognition is not supported."
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
            selectedLanguage;


        recognition.onstart =
            function () {

                isListening =
                    true;

                if (micBtn) {
                    micBtn.classList.add(
                        "listening"
                    );
                }
            };


        recognition.onresult =
            function (event) {

                const result =
                    event.results[
                        event.results.length - 1
                    ][0].transcript;

                if (messageInput) {

                    messageInput.value =
                        (
                            messageInput.value
                                ? messageInput.value + " "
                                : ""
                        ) +
                        result;

                    autoResizeTextarea();
                }
            };


        recognition.onerror =
            function (event) {

                console.error(
                    "Speech recognition error:",
                    event.error
                );
            };


        recognition.onend =
            function () {

                isListening =
                    false;

                if (micBtn) {

                    micBtn.classList.remove(
                        "listening"
                    );
                }
            };
    }


    /* =================================================
       MIC
    ================================================= */

    if (micBtn) {

        micBtn.addEventListener(
            "click",
            function () {

                if (!recognition) {
                    setupRecognition();
                }

                if (!recognition) {

                    alert(
                        "Speech recognition is not supported in this browser."
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
                        "Mic start error:",
                        error
                    );
                }
            }
        );
    }


    /* =================================================
       START VOICE
    ================================================= */

    if (startVoice) {

        startVoice.addEventListener(
            "click",
            function () {

                if (!recognition) {
                    setupRecognition();
                }

                if (!recognition) {
                    return;
                }

                recognition.lang =
                    selectedLanguage;

                if (!isListening) {

                    try {

                        recognition.start();

                    } catch (error) {

                        console.error(
                            "Voice start error:",
                            error
                        );
                    }
                }
            }
        );
    }


    /* =================================================
       AUTO RESIZE
    ================================================= */

    function autoResizeTextarea() {

        if (!messageInput) return;

        messageInput.style.height =
            "auto";

        messageInput.style.height =
            Math.min(
                messageInput.scrollHeight,
                160
            ) + "px";
    }


    if (messageInput) {

        messageInput.addEventListener(
            "input",
            function () {
                autoResizeTextarea();
            }
        );


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


    /* =================================================
       SEND
    ================================================= */

    if (sendBtn) {

        sendBtn.addEventListener(
            "click",
            function () {
                sendMessage();
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

        if (!text && !pendingMedia) {
            return;
        }


        ensureChat();

        const chat =
            getCurrentChat();

        if (!chat) return;


        const userMedia =
            pendingMedia;


        const userMessage = {

            role: "user",

            text: text,

            media: userMedia,

            createdAt: Date.now()
        };


        chat.messages.push(
            userMessage
        );


        if (
            chat.title === "New Chat" &&
            text
        ) {

            chat.title =
                text.slice(0, 40);
        }


        saveChats();

        addMessageToUI(
            "user",
            text,
            userMedia,
            true
        );


        messageInput.value = "";

        autoResizeTextarea();

        pendingMedia = null;

        renderHistory();


        /* AI LOADING */

        const loading =
            addMessageToUI(
                "ai",
                "Thinking...",
                null,
                true
            );


        try {

            const history =
                chat.messages
                    .slice(-30)
                    .map(
                        msg => ({
                            role:
                                msg.role === "assistant"
                                    ? "model"
                                    : msg.role,
                            text:
                                msg.text || ""
                        })
                    );


            const body = {

                message:
                    text,

                originalMessage:
                    text,

                conversationHistory:
                    history,

                language:
                    selectedLanguage,

                browserTimezone:
                    Intl.DateTimeFormat()
                        .resolvedOptions()
                        .timeZone,

                currentDateTime:
                    new Date().toISOString()
            };


            if (userMedia) {

                body.file = {

                    name:
                        userMedia.name,

                    type:
                        userMedia.type,

                    data:
                        userMedia.data
                };
            }


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
                            JSON.stringify(body)
                    }
                );


            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}`
                );
            }


            const data =
                await response.json();


            let reply =
                data.reply ||
                data.response ||
                data.message ||
                data.text ||
                "";


            if (!reply) {

                reply =
                    "Sorry, I could not get a response from the server.";
            }


            /* REMOVE LOADING */

            if (loading && loading.parentNode) {

                loading.parentNode.removeChild(
                    loading
                );
            }


            /* SAVE AI MESSAGE */

            chat.messages.push({

                role:
                    "assistant",

                text:
                    reply,

                media:
                    null,

                createdAt:
                    Date.now()
            });


            saveChats();

            addMessageToUI(
                "ai",
                reply,
                null,
                true
            );


            renderHistory();


        } catch (error) {

            console.error(
                "Send message error:",
                error
            );


            if (
                loading &&
                loading.parentNode
            ) {

                loading.parentNode.removeChild(
                    loading
                );
            }


            const errorText =
                "Sorry, I couldn't connect to Viggo AI server.";


            chat.messages.push({

                role:
                    "assistant",

                text:
                    errorText,

                media:
                    null,

                createdAt:
                    Date.now()
            });


            saveChats();

            addMessageToUI(
                "ai",
                errorText,
                null,
                true
            );
        }
    }


    /* =================================================
       SHARE CHAT
    ================================================= */

    if (shareBtn) {

        shareBtn.addEventListener(
            "click",
            async function () {

                const chat =
                    getCurrentChat();

                if (!chat) return;

                const messages =
                    Array.isArray(
                        chat.messages
                    )
                        ? chat.messages
                        : [];


                const shareText =
                    messages
                        .map(
                            msg => {

                                const label =
                                    msg.role === "user"
                                        ? "You"
                                        : "Viggo AI";

                                return (
                                    label +
                                    ": " +
                                    (
                                        msg.text ||
                                        ""
                                    )
                                );
                            }
                        )
                        .join("\n\n");


                try {

                    if (navigator.share) {

                        await navigator.share({

                            title:
                                chat.title ||
                                "Viggo AI Chat",

                            text:
                                shareText
                        });

                    } else {

                        await navigator.clipboard.writeText(
                            shareText
                        );

                        alert(
                            "Chat copied to clipboard."
                        );
                    }

                } catch (error) {

                    console.log(
                        "Share cancelled or failed.",
                        error
                    );
                }
            }
        );
    }


    /* =================================================
       CLOSE MENUS OUTSIDE CLICK
    ================================================= */

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
       ESCAPE
    ================================================= */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key !== "Escape"
            ) {
                return;
            }


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


            if (voiceModal) {

                voiceModal.classList.remove(
                    "show"
                );

                voiceModal.classList.remove(
                    "open"
                );
            }


            if (languageModal) {

                languageModal.classList.remove(
                    "show"
                );

                languageModal.classList.remove(
                    "open"
                );
            }
        }
    );


    /* =================================================
       INITIAL LANGUAGE
    ================================================= */

    if (languageSelect) {

        languageSelect.value =
            selectedLanguage;
    }


    if (voiceSelect) {

        voiceSelect.value =
            selectedLanguage;
    }


    /* =================================================
       SPEECH VOICES
    ================================================= */

    if (
        "speechSynthesis" in window
    ) {

        window.speechSynthesis
            .addEventListener(
                "voiceschanged",
                function () {

                    console.log(
                        "Speech voices loaded."
                    );
                }
            );
    }


    /* =================================================
       INITIALIZE
    ================================================= */

    loadChats();

    ensureChat();

    renderHistory();

    renderConversation();

    autoResizeTextarea();


    console.log(
        "================================="
    );

    console.log(
        "VIGGO AI SCRIPT READY"
    );

    console.log(
        "Current Chat ID:",
        currentChatId
    );

    console.log(
        "Selected Language:",
        selectedLanguage
    );

    console.log(
        "Speaker:",
        speakerEnabled
            ? "ON"
            : "OFF"
    );

    console.log(
        "================================="
    );


})();
