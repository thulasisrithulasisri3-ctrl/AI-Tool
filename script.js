"use strict";

/* =========================================================
   VIGGO AI - FULL CLEAN SCRIPT.JS
   Text + Camera + Photo + Video + File
   Chat + History + Pin + Delete + Select
   Voice + Language + Speaker + Share
   API: Render /chat
========================================================= */

(() => {

    console.log("=================================");
    console.log("VIGGO AI SCRIPT STARTING...");
    console.log("=================================");


    /* =====================================================
       API
    ===================================================== */

    const API_URL =
        "https://ai-tool-2-zpul.onrender.com/chat";


    /* =====================================================
       ELEMENT HELPER
    ===================================================== */

    const get = (id) =>
        document.getElementById(id);


    /* =====================================================
       HTML ELEMENTS
    ===================================================== */

    const sidebar =
        get("sidebar");

    const openSidebar =
        get("openSidebar");

    const closeSidebar =
        get("closeSidebar");

    const newChat =
        get("newChat");

    const searchChat =
        get("searchChat");

    const chatHistory =
        get("chatHistory");

    const moreBtn =
        get("moreBtn");

    const moreMenu =
        get("moreMenu");

    const voiceMenuBtn =
        get("voiceMenuBtn");

    const languageBtn =
        get("languageBtn");

    const selectChatsBtn =
        get("selectChatsBtn");

    const deleteSelectedBtn =
        get("deleteSelectedBtn");

    const clearChatBtn =
        get("clearChatBtn");

    const shareBtn =
        get("shareBtn");

    const conversation =
        get("conversation");


    /* =====================================================
       PLUS MENU
    ===================================================== */

    const plusBtn =
        get("plusBtn");

    const plusMenu =
        get("plusMenu");

    const cameraBtn =
        get("cameraBtn");

    const photoBtn =
        get("photoBtn");

    const videoBtn =
        get("videoBtn");

    const fileBtn =
        get("fileBtn");


    /* =====================================================
       FILE INPUTS
    ===================================================== */

    const cameraInput =
        get("cameraInput");

    const photoInput =
        get("photoInput");

    const videoInput =
        get("videoInput");

    const fileInput =
        get("fileInput");


    /* =====================================================
       MESSAGE
    ===================================================== */

    const messageInput =
        get("message");

    const micBtn =
        get("mic");

    const sendBtn =
        get("send");


    /* =====================================================
       VOICE MODAL
    ===================================================== */

    const voiceModal =
        get("voiceModal");

    const closeVoice =
        get("closeVoice");

    const voiceSelect =
        get("voiceSelect");

    const voiceGender =
        get("voiceGender");

    const startVoice =
        get("startVoice");


    /* =====================================================
       LANGUAGE MODAL
    ===================================================== */

    const languageModal =
        get("languageModal");

    const closeLanguage =
        get("closeLanguage");

    const languageSelect =
        get("languageSelect");

    const saveLanguage =
        get("saveLanguage");


    /* =====================================================
       STATE
    ===================================================== */

    let chats = [];

    let currentChatId = null;

    let selectedChats =
        new Set();

    let selectMode = false;

    let attachedFile = null;

    let recognition = null;

    let isListening = false;


    /* =====================================================
       SPEAKER
    ===================================================== */

    let speakerEnabled =
        localStorage.getItem(
            "viggoSpeakerEnabled"
        ) !== "false";


    /* =====================================================
       LANGUAGE
    ===================================================== */

    let selectedLanguage =
        localStorage.getItem(
            "viggoLanguage"
        ) || "en-IN";


    /* =====================================================
       VOICE
    ===================================================== */

    let selectedVoice =
        localStorage.getItem(
            "viggoVoice"
        ) || "female";


    /* =====================================================
       FIX FILE INPUTS
    ===================================================== */

    if (cameraInput) {

        cameraInput.accept =
            "image/*";

        cameraInput.setAttribute(
            "capture",
            "environment"
        );
    }


    if (photoInput) {

        photoInput.accept =
            "image/*";

        photoInput.removeAttribute(
            "capture"
        );
    }


    if (videoInput) {

        videoInput.accept =
            "video/*";
    }


    if (fileInput) {

        fileInput.accept =
            "*/*";
    }


    /* =====================================================
       MOBILE VIEWPORT
    ===================================================== */

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


            if (
                Array.isArray(parsed)
            ) {

                chats = parsed;

            } else {

                chats = [];
            }

        } catch (error) {

            console.error(
                "Load chats error:",
                error
            );

            chats = [];
        }
    }


    /* =====================================================
       ID
    ===================================================== */

    function createId() {

        return (
            Date.now().toString(36) +
            Math.random()
                .toString(36)
                .substring(2, 10)
        );
    }


    /* =====================================================
       CREATE CHAT
    ===================================================== */

    function createChat() {

        return {

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
    }


    /* =====================================================
       CURRENT CHAT
    ===================================================== */

    function getCurrentChat() {

        return chats.find(
            chat =>
                chat.id ===
                currentChatId
        );
    }


    /* =====================================================
       ENSURE CHAT
    ===================================================== */

    function ensureChat() {

        if (!chats.length) {

            const chat =
                createChat();

            chats.push(chat);

            currentChatId =
                chat.id;

            saveChats();

            return chat;
        }


        if (!currentChatId) {

            currentChatId =
                chats[0].id;
        }


        let chat =
            getCurrentChat();


        if (!chat) {

            chat =
                chats[0];

            currentChatId =
                chat.id;
        }


        if (
            !Array.isArray(
                chat.messages
            )
        ) {

            chat.messages = [];
        }


        return chat;
    }


    /* =====================================================
       SIDEBAR
    ===================================================== */

    function closeSidebarMobile() {

        if (sidebar) {

            sidebar.classList.remove(
                "open"
            );
        }
    }


    if (openSidebar) {

        openSidebar.addEventListener(
            "click",
            () => {

                sidebar?.classList.add(
                    "open"
                );
            }
        );
    }


    if (closeSidebar) {

        closeSidebar.addEventListener(
            "click",
            closeSidebarMobile
        );
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

        attachedFile =
            null;


        if (messageInput) {

            messageInput.value =
                "";

            messageInput.placeholder =
                "Message Viggo AI...";
        }


        saveChats();

        renderHistory();

        renderConversation();

        closeSidebarMobile();

        messageInput?.focus();
    }


    if (newChat) {

        newChat.addEventListener(
            "click",
            createNewChat
        );
    }


    /* =====================================================
       MORE MENU
    ===================================================== */

    if (moreBtn) {

        moreBtn.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                if (!moreMenu)
                    return;

                moreMenu.classList.toggle(
                    "show"
                );

                moreMenu.classList.toggle(
                    "active"
                );
            }
        );
    }


    /* =====================================================
       PLUS MENU
    ===================================================== */

    if (plusBtn) {

        plusBtn.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                if (!plusMenu)
                    return;

                plusMenu.classList.toggle(
                    "show"
                );

                plusMenu.classList.toggle(
                    "active"
                );
            }
        );
    }


    function closeMenus() {

        plusMenu?.classList.remove(
            "show"
        );

        plusMenu?.classList.remove(
            "active"
        );

        moreMenu?.classList.remove(
            "show"
        );

        moreMenu?.classList.remove(
            "active"
        );
    }


    document.addEventListener(
        "click",
        event => {

            if (
                plusMenu &&
                !plusMenu.contains(
                    event.target
                ) &&
                event.target !==
                    plusBtn
            ) {

                plusMenu.classList.remove(
                    "show"
                );

                plusMenu.classList.remove(
                    "active"
                );
            }


            if (
                moreMenu &&
                !moreMenu.contains(
                    event.target
                ) &&
                event.target !==
                    moreBtn
            ) {

                moreMenu.classList.remove(
                    "show"
                );

                moreMenu.classList.remove(
                    "active"
                );
            }
        }
    );


    /* =====================================================
       CAMERA
    ===================================================== */

    if (cameraBtn) {

        cameraBtn.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                closeMenus();

                if (!cameraInput) {

                    alert(
                        "Camera input not found."
                    );

                    return;
                }

                cameraInput.click();
            }
        );
    }


    /* =====================================================
       PHOTO
    ===================================================== */

    if (photoBtn) {

        photoBtn.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                closeMenus();

                if (!photoInput) {

                    alert(
                        "Photo input not found."
                    );

                    return;
                }

                photoInput.click();
            }
        );
    }


    /* =====================================================
       VIDEO
    ===================================================== */

    if (videoBtn) {

        videoBtn.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                closeMenus();

                if (!videoInput) {

                    alert(
                        "Video input not found."
                    );

                    return;
                }

                videoInput.click();
            }
        );
    }


    /* =====================================================
       FILE
    ===================================================== */

    if (fileBtn) {

        fileBtn.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                closeMenus();

                if (!fileInput) {

                    alert(
                        "File input not found."
                    );

                    return;
                }

                fileInput.click();
            }
        );
    }


    /* =====================================================
       HANDLE FILE
    ===================================================== */

    function handleSelectedFile(
        file
    ) {

        if (!file)
            return;


        attachedFile =
            file;


        console.log(
            "Selected file:",
            file.name
        );


        console.log(
            "Type:",
            file.type
        );


        console.log(
            "Size:",
            file.size
        );


        if (messageInput) {

            messageInput.placeholder =
                `Attached: ${file.name}`;
        }
    }


    if (cameraInput) {

        cameraInput.addEventListener(
            "change",
            () => {

                const file =
                    cameraInput.files?.[0];

                handleSelectedFile(
                    file
                );

                cameraInput.value =
                    "";
            }
        );
    }


    if (photoInput) {

        photoInput.addEventListener(
            "change",
            () => {

                const file =
                    photoInput.files?.[0];

                handleSelectedFile(
                    file
                );

                photoInput.value =
                    "";
            }
        );
    }


    if (videoInput) {

        videoInput.addEventListener(
            "change",
            () => {

                const file =
                    videoInput.files?.[0];

                handleSelectedFile(
                    file
                );

                videoInput.value =
                    "";
            }
        );
    }


    if (fileInput) {

        fileInput.addEventListener(
            "change",
            () => {

                const file =
                    fileInput.files?.[0];

                handleSelectedFile(
                    file
                );

                fileInput.value =
                    "";
            }
        );
    }


    /* =====================================================
       FILE -> DATA URL
    ===================================================== */

    function fileToDataURL(
        file
    ) {

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
                            reader.error
                        );
                    };


                reader.readAsDataURL(
                    file
                );
            }
        );
    }


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHTML(
        value
    ) {

        return String(
            value ?? ""
        )
            .replaceAll(
                "&",
                "&amp;"
            )
            .replaceAll(
                "<",
                "&lt;"
            )
            .replaceAll(
                ">",
                "&gt;"
            )
            .replaceAll(
                '"',
                "&quot;"
            )
            .replaceAll(
                "'",
                "&#039;"
            );
    }


    /* =====================================================
       FORMAT MESSAGE
    ===================================================== */

    function formatMessage(
        text
    ) {

        if (!text)
            return "";


        let html =
            escapeHTML(text);


        html =
            html.replace(
                /\*\*(.*?)\*\*/g,
                "<strong>$1</strong>"
            );


        html =
            html.replace(
                /`([^`]+)`/g,
                "<code>$1</code>"
            );


        html =
            html.replace(
                /\n/g,
                "<br>"
            );


        return html;
    }


    /* =====================================================
       ACTION BUTTON
    ===================================================== */

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


    /* =====================================================
       COPY
    ===================================================== */

    async function copyText(
        text
    ) {

        try {

            await navigator.clipboard.writeText(
                text || ""
            );

        } catch {

            const textarea =
                document.createElement(
                    "textarea"
                );

            textarea.value =
                text || "";

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

    function saveMessage(
        text
    ) {

        try {

            const saved =
                JSON.parse(
                    localStorage.getItem(
                        "viggoSavedMessages"
                    ) || "[]"
                );


            saved.push({

                text:
                    text || "",

                savedAt:
                    Date.now()
            });


            localStorage.setItem(
                "viggoSavedMessages",
                JSON.stringify(saved)
            );


            console.log(
                "Message saved."
            );

        } catch (error) {

            console.error(
                "Save message error:",
                error
            );
        }
    }


    /* =====================================================
       SPEAKER LANGUAGE
    ===================================================== */

    function getSpeechLanguage() {

        if (
            selectedLanguage ===
            "ta-IN"
        ) {

            return "ta-IN";
        }


        if (
            selectedLanguage ===
            "hi-IN"
        ) {

            return "hi-IN";
        }


        return selectedLanguage ||
            "en-IN";
    }


    /* =====================================================
       SPEAK
    ===================================================== */

    function speakText(
        text
    ) {

        if (!speakerEnabled)
            return;


        if (
            !("speechSynthesis" in
                window)
        ) {

            return;
        }


        if (!text)
            return;


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


        const voices =
            window.speechSynthesis
                .getVoices();


        const matchingVoice =
            voices.find(
                voice =>
                    voice.lang &&
                    voice.lang
                        .toLowerCase()
                        .startsWith(
                            selectedLanguage
                                .split("-")[0]
                                .toLowerCase()
                        )
            );


        if (matchingVoice) {

            utterance.voice =
                matchingVoice;
        }


        window.speechSynthesis.speak(
            utterance
        );
    }


    /* =====================================================
       SPEAKER TOGGLE
    ===================================================== */

    function toggleSpeaker() {

        speakerEnabled =
            !speakerEnabled;


        localStorage.setItem(
            "viggoSpeakerEnabled",
            String(
                speakerEnabled
            )
        );


        if (
            !speakerEnabled &&
            "speechSynthesis" in
                window
        ) {

            window.speechSynthesis.cancel();
        }
    }


    /* =====================================================
       SPEAKER ACTION BUTTON
    ===================================================== */

    function createSpeakerButton(
        text
    ) {

        const button =
            createActionButton(
                speakerEnabled
                    ? "🔊"
                    : "🔇",
                speakerEnabled
                    ? "Speaker ON"
                    : "Speaker OFF"
            );


        button.className =
            "speaker-action-btn";


        button.addEventListener(
            "click",
            () => {

                toggleSpeaker();


                button.textContent =
                    speakerEnabled
                        ? "🔊"
                        : "🔇";


                button.title =
                    speakerEnabled
                        ? "Speaker ON"
                        : "Speaker OFF";


                if (
                    speakerEnabled
                ) {

                    speakText(text);
                }
            }
        );


        return button;
    }


    /* =====================================================
       ADD MESSAGE TO UI
    ===================================================== */

    function addMessageToUI(
        message
    ) {

        if (!conversation)
            return;


        const role =
            message.role ===
            "assistant"
                ? "assistant"
                : "user";


        const wrapper =
            document.createElement(
                "div"
            );


        wrapper.className =
            role === "user"
                ? "message user"
                : "message ai";


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

        const media =
            message.media;


        if (
            media &&
            media.data &&
            media.type?.startsWith(
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
                "350px";


            img.style.objectFit =
                "contain";


            img.style.borderRadius =
                "12px";


            img.style.display =
                "block";


            bubble.appendChild(
                img
            );
        }


        if (
            media &&
            media.data &&
            media.type?.startsWith(
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
                "350px";


            video.style.borderRadius =
                "12px";


            bubble.appendChild(
                video
            );
        }


        if (
            media &&
            media.name &&
            !media.type?.startsWith(
                "image/"
            ) &&
            !media.type?.startsWith(
                "video/"
            )
        ) {

            const fileBox =
                document.createElement(
                    "div"
                );


            fileBox.textContent =
                `📎 ${media.name}`;


            bubble.appendChild(
                fileBox
            );
        }


        /* =================================================
           TEXT
        ================================================= */

        if (message.text) {

            const textElement =
                document.createElement(
                    "div"
                );


            textElement.innerHTML =
                formatMessage(
                    message.text
                );


            if (
                media &&
                media.data
            ) {

                textElement.style.marginTop =
                    "8px";
            }


            bubble.appendChild(
                textElement
            );
        }


        content.appendChild(
            bubble
        );


        /* =================================================
           AI ACTIONS
        ================================================= */

        if (
            role ===
            "assistant" &&
            !message.loading
        ) {

            const actions =
                document.createElement(
                    "div"
                );


            actions.className =
                "message-actions";


            const copy =
                createActionButton(
                    "Copy",
                    "Copy"
                );


            copy.addEventListener(
                "click",
                () =>
                    copyText(
                        message.text
                    )
            );


            const save =
                createActionButton(
                    "Save",
                    "Save"
                );


            save.addEventListener(
                "click",
                () =>
                    saveMessage(
                        message.text
                    )
            );


            const like =
                createActionButton(
                    message.liked
                        ? "Liked"
                        : "Like",
                    "Like"
                );


            like.addEventListener(
                "click",
                () => {

                    message.liked =
                        !message.liked;


                    saveChats();


                    like.textContent =
                        message.liked
                            ? "Liked"
                            : "Like";
                }
            );


            const speaker =
                createSpeakerButton(
                    message.text
                );


            actions.appendChild(
                copy
            );

            actions.appendChild(
                save
            );

            actions.appendChild(
                like
            );

            actions.appendChild(
                speaker
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


    /* =====================================================
       RENDER CONVERSATION
    ===================================================== */

    function renderConversation() {

        if (!conversation)
            return;


        conversation.innerHTML =
            "";


        const chat =
            getCurrentChat();


        if (!chat)
            return;


        if (
            !Array.isArray(
                chat.messages
            )
        ) {

            chat.messages = [];
        }


        chat.messages.forEach(
            message => {

                addMessageToUI(
                    message
                );
            }
        );


        scrollToBottom();
    }


    /* =====================================================
       SCROLL
    ===================================================== */

    function scrollToBottom() {

        if (!conversation)
            return;


        requestAnimationFrame(
            () => {

                conversation.scrollTop =
                    conversation.scrollHeight;
            }
        );
    }


    /* =====================================================
       HISTORY
    ===================================================== */

    function renderHistory() {

        if (!chatHistory)
            return;


        chatHistory.innerHTML =
            "";


        const search =
            searchChat?.value
                ?.trim()
                .toLowerCase() || "";


        let list =
            chats.filter(
                chat => {

                    if (!search)
                        return true;


                    return (
                        chat.title ||
                        "New Chat"
                    )
                        .toLowerCase()
                        .includes(
                            search
                        );
                }
            );


        list.sort(
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
                    (b.updatedAt ||
                        b.createdAt ||
                        0) -
                    (a.updatedAt ||
                        a.createdAt ||
                        0)
                );
            }
        );


        if (!list.length) {

            const empty =
                document.createElement(
                    "div"
                );


            empty.textContent =
                "No chats";


            empty.style.padding =
                "15px";


            chatHistory.appendChild(
                empty
            );


            return;
        }


        list.forEach(
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


                /* CHECKBOX */

                if (selectMode) {

                    const checkbox =
                        document.createElement(
                            "input"
                        );


                    checkbox.type =
                        "checkbox";


                    checkbox.checked =
                        selectedChats.has(
                            chat.id
                        );


                    checkbox.addEventListener(
                        "click",
                        event =>
                            event.stopPropagation()
                    );


                    checkbox.addEventListener(
                        "change",
                        () =>
                            toggleSelectedChat(
                                chat.id
                            )
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
                        ? `📌 ${
                            chat.title ||
                            "New Chat"
                        }`
                        : (
                            chat.title ||
                            "New Chat"
                        );


                /* ACTIONS */

                const actions =
                    document.createElement(
                        "div"
                    );


                actions.className =
                    "history-actions";


                /* PIN */

                const pin =
                    createActionButton(
                        chat.pinned
                            ? "📌"
                            : "📍",
                        chat.pinned
                            ? "Unpin"
                            : "Pin"
                    );


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


                /* DELETE */

                const del =
                    createActionButton(
                        "🗑️",
                        "Delete"
                    );


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


                item.appendChild(
                    title
                );

                item.appendChild(
                    actions
                );


                /* OPEN */

                item.addEventListener(
                    "click",
                    () => {

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


    /* =====================================================
       DELETE CHAT
    ===================================================== */

    function deleteChat(
        id
    ) {

        chats =
            chats.filter(
                chat =>
                    chat.id !== id
            );


        selectedChats.delete(
            id
        );


        if (
            currentChatId === id
        ) {

            currentChatId =
                chats.length
                    ? chats[0].id
                    : null;
        }


        if (!chats.length) {

            const chat =
                createChat();


            chats.push(chat);

            currentChatId =
                chat.id;
        }


        saveChats();

        renderHistory();

        renderConversation();
    }


    /* =====================================================
       SELECT MODE
    ===================================================== */

    function toggleSelectedChat(
        id
    ) {

        if (
            selectedChats.has(id)
        ) {

            selectedChats.delete(
                id
            );

        } else {

            selectedChats.add(
                id
            );
        }


        renderHistory();
    }


    if (selectChatsBtn) {

        selectChatsBtn.addEventListener(
            "click",
            () => {

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
            () => {

                if (
                    !selectedChats.size
                ) {

                    alert(
                        "Please select a chat."
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


                selectMode =
                    false;


                if (!chats.length) {

                    const chat =
                        createChat();


                    chats.push(chat);

                    currentChatId =
                        chat.id;

                } else if (
                    !chats.some(
                        chat =>
                            chat.id ===
                            currentChatId
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
       CLEAR CURRENT CHAT
    ===================================================== */

    if (clearChatBtn) {

        clearChatBtn.addEventListener(
            "click",
            () => {

                const chat =
                    getCurrentChat();


                if (!chat)
                    return;


                chat.messages =
                    [];


                chat.title =
                    "New Chat";


                chat.updatedAt =
                    Date.now();


                saveChats();

                renderHistory();

                renderConversation();

                closeMenus();
            }
        );
    }


    /* =====================================================
       SEARCH
    ===================================================== */

    if (searchChat) {

        searchChat.addEventListener(
            "input",
            renderHistory
        );
    }


    /* =====================================================
       API REPLY EXTRACTION
    ===================================================== */

    function extractReply(
        data
    ) {

        if (!data)
            return "";


        if (
            typeof data ===
            "string"
        ) {

            return data;
        }


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
            const field of fields
        ) {

            if (
                typeof data[field] ===
                    "string" &&
                data[field].trim()
            ) {

                return data[field];
            }
        }


        /* GEMINI RESPONSE */

        if (
            Array.isArray(
                data.candidates
            )
        ) {

            for (
                const candidate
                of data.candidates
            ) {

                const parts =
                    candidate
                        ?.content
                        ?.parts;


                if (
                    Array.isArray(
                        parts
                    )
                ) {

                    const text =
                        parts
                            .map(
                                part =>
                                    part?.text ||
                                    ""
                            )
                            .join("");


                    if (
                        text.trim()
                    ) {

                        return text;
                    }
                }
            }
        }


        return "";
    }


    /* =====================================================
       SEND MESSAGE
    ===================================================== */

    async function sendMessage() {

        if (!messageInput)
            return;


        const text =
            messageInput.value.trim();


        if (
            !text &&
            !attachedFile
        ) {

            return;
        }


        const chat =
            ensureChat();


        /* =================================================
           FILE PAYLOAD
        ================================================= */

        let filePayload =
            null;


        if (attachedFile) {

            try {

                const data =
                    await fileToDataURL(
                        attachedFile
                    );


                filePayload = {

                    name:
                        attachedFile.name,

                    type:
                        attachedFile.type ||
                        "application/octet-stream",

                    data:
                        data
                };

            } catch (error) {

                console.error(
                    "File read error:",
                    error
                );


                alert(
                    "Could not read this file."
                );


                return;
            }
        }


        /* =================================================
           USER MESSAGE
        ================================================= */

        const userMessage = {

            role:
                "user",

            text:
                text ||
                (
                    filePayload
                        ? `Attached: ${
                            filePayload.name
                        }`
                        : ""
                ),

            media:
                filePayload &&
                (
                    filePayload.type.startsWith(
                        "image/"
                    ) ||
                    filePayload.type.startsWith(
                        "video/"
                    )
                )
                    ? filePayload
                    : null,

            createdAt:
                Date.now()
        };


        chat.messages.push(
            userMessage
        );


        /* CHAT TITLE */

        if (
            chat.title ===
                "New Chat" &&
            text
        ) {

            chat.title =
                text.length > 40
                    ? text.substring(
                        0,
                        40
                    ) + "..."
                    : text;
        }


        chat.updatedAt =
            Date.now();


        saveChats();


        renderHistory();

        renderConversation();


        /* =================================================
           CLEAR INPUT
        ================================================= */

        messageInput.value =
            "";

        messageInput.placeholder =
            "Message Viggo AI...";


        attachedFile =
            null;


        /* =================================================
           LOADING MESSAGE
        ================================================= */

        const loadingMessage = {

            role:
                "assistant",

            text:
                "Thinking...",

            media:
                null,

            loading:
                true,

            createdAt:
                Date.now()
        };


        chat.messages.push(
            loadingMessage
        );


        renderConversation();

        scrollToBottom();


        /* =================================================
           API HISTORY
        ================================================= */

        const history =
            chat.messages
                .filter(
                    msg =>
                        !msg.loading
                )
                .slice(-30)
                .map(
                    msg => ({

                        role:
                            msg.role ===
                            "assistant"
                                ? "model"
                                : "user",

                        content:
                            msg.text || ""
                    })
                );


        /* =================================================
           PAYLOAD
        ================================================= */

        const payload = {

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
                    .timeZone ||
                "Asia/Kolkata",

            currentDateTime:
                new Date()
                    .toISOString()
        };


        /* =================================================
           SEND FILE
        ================================================= */

        if (filePayload) {

            payload.file =
                filePayload;
        }


        console.log(
            "================================="
        );

        console.log(
            "VIGGO REQUEST"
        );

        console.log(
            "Message:",
            text
        );

        console.log(
            "File:",
            filePayload
                ? filePayload.name
                : "NONE"
        );

        console.log(
            "Type:",
            filePayload
                ? filePayload.type
                : "NONE"
        );

        console.log(
            "================================="
        );


        /* =================================================
           FETCH
        ================================================= */

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
                            JSON.stringify(
                                payload
                            )
                    }
                );


            console.log(
                "Server status:",
                response.status
            );


            const raw =
                await response.text();


            console.log(
                "Server response:",
                raw
            );


            if (
                !response.ok
            ) {

                throw new Error(
                    `Server error ${response.status}: ${raw}`
                );
            }


            let data;


            try {

                data =
                    JSON.parse(
                        raw
                    );

            } catch {

                data =
                    raw;
            }


            const reply =
                extractReply(
                    data
                );


            if (!reply) {

                throw new Error(
                    "No AI reply received."
                );
            }


            /* REMOVE LOADING */

            const loadingIndex =
                chat.messages.indexOf(
                    loadingMessage
                );


            if (
                loadingIndex !==
                -1
            ) {

                chat.messages.splice(
                    loadingIndex,
                    1
                );
            }


            /* AI MESSAGE */

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


            chat.updatedAt =
                Date.now();


            saveChats();


            renderHistory();

            renderConversation();

            scrollToBottom();


            console.log(
                "VIGGO REPLY RECEIVED"
            );

        } catch (error) {

            console.error(
                "VIGGO API ERROR:",
                error
            );


            /* REMOVE LOADING */

            const loadingIndex =
                chat.messages.indexOf(
                    loadingMessage
                );


            if (
                loadingIndex !==
                -1
            ) {

                chat.messages.splice(
                    loadingIndex,
                    1
                );
            }


            /* ERROR MESSAGE */

            chat.messages.push({

                role:
                    "assistant",

                text:
                    "Sorry, Viggo AI could not connect to the server. Please try again.",

                media:
                    null,

                createdAt:
                    Date.now()
            });


            saveChats();

            renderConversation();

            scrollToBottom();
        }
    }


    /* =====================================================
       SEND BUTTON
    ===================================================== */

    if (sendBtn) {

        sendBtn.addEventListener(
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

    if (messageInput) {

        messageInput.addEventListener(
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
    }


    /* =====================================================
       MICROPHONE
    ===================================================== */

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (SpeechRecognition) {

        recognition =
            new SpeechRecognition();


        recognition.continuous =
            false;


        recognition.interimResults =
            false;


        recognition.lang =
            selectedLanguage;


        recognition.onstart =
            () => {

                isListening =
                    true;

                micBtn?.classList.add(
                    "active"
                );
            };


        recognition.onend =
            () => {

                isListening =
                    false;

                micBtn?.classList.remove(
                    "active"
                );
            };


        recognition.onerror =
            error => {

                console.error(
                    "Speech error:",
                    error
                );

                isListening =
                    false;

                micBtn?.classList.remove(
                    "active"
                );
            };


        recognition.onresult =
            event => {

                const result =
                    event.results?.[0]?.[0]
                        ?.transcript;


                if (!result)
                    return;


                if (messageInput) {

                    messageInput.value =
                        messageInput.value
                            ? messageInput.value +
                              " " +
                              result
                            : result;


                    messageInput.dispatchEvent(
                        new Event(
                            "input"
                        )
                    );
                }
            };
    }


    if (micBtn) {

        micBtn.addEventListener(
            "click",
            () => {

                if (!recognition) {

                    alert(
                        "Voice input is not supported in this browser."
                    );

                    return;
                }


                recognition.lang =
                    selectedLanguage;


                if (isListening) {

                    recognition.stop();

                } else {

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


    /* =====================================================
       VOICE MODAL
    ===================================================== */

    if (voiceMenuBtn) {

        voiceMenuBtn.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                closeMenus();

                voiceModal?.classList.add(
                    "show"
                );

                voiceModal?.classList.add(
                    "active"
                );
            }
        );
    }


    if (closeVoice) {

        closeVoice.addEventListener(
            "click",
            () => {

                voiceModal?.classList.remove(
                    "show"
                );

                voiceModal?.classList.remove(
                    "active"
                );
            }
        );
    }


    if (voiceGender) {

        voiceGender.value =
            selectedVoice;


        voiceGender.addEventListener(
            "change",
            () => {

                selectedVoice =
                    voiceGender.value;


                localStorage.setItem(
                    "viggoVoice",
                    selectedVoice
                );
            }
        );
    }


    if (voiceSelect) {

        voiceSelect.addEventListener(
            "change",
            () => {

                selectedVoice =
                    voiceSelect.value;


                localStorage.setItem(
                    "viggoVoice",
                    selectedVoice
                );
            }
        );
    }


    if (startVoice) {

        startVoice.addEventListener(
            "click",
            () => {

                if (
                    voiceGender?.value
                ) {

                    selectedVoice =
                        voiceGender.value;


                    localStorage.setItem(
                        "viggoVoice",
                        selectedVoice
                    );
                }


                voiceModal?.classList.remove(
                    "show"
                );

                voiceModal?.classList.remove(
                    "active"
                );
            }
        );
    }


    /* =====================================================
       LANGUAGE MODAL
    ===================================================== */

    if (languageBtn) {

        languageBtn.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                closeMenus();


                if (languageSelect) {

                    languageSelect.value =
                        selectedLanguage;
                }


                languageModal?.classList.add(
                    "show"
                );

                languageModal?.classList.add(
                    "active"
                );
            }
        );
    }


    if (closeLanguage) {

        closeLanguage.addEventListener(
            "click",
            () => {

                languageModal?.classList.remove(
                    "show"
                );

                languageModal?.classList.remove(
                    "active"
                );
            }
        );
    }


    if (saveLanguage) {

        saveLanguage.addEventListener(
            "click",
            () => {

                if (
                    languageSelect?.value
                ) {

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


                languageModal?.classList.remove(
                    "show"
                );

                languageModal?.classList.remove(
                    "active"
                );
            }
        );
    }


    /* =====================================================
       SHARE CHAT
    ===================================================== */

    if (shareBtn) {

        shareBtn.addEventListener(
            "click",
            async () => {

                const chat =
                    getCurrentChat();


                if (!chat) {

                    alert(
                        "No chat available."
                    );

                    return;
                }


                try {

                    const json =
                        JSON.stringify(
                            chat
                        );


                    const encoded =
                        btoa(
                            unescape(
                                encodeURIComponent(
                                    json
                                )
                            )
                        );


                    const url =
                        window.location.origin +
                        window.location.pathname +
                        "#shared=" +
                        encodeURIComponent(
                            encoded
                        );


                    if (
                        navigator.share
                    ) {

                        await navigator.share({

                            title:
                                chat.title ||
                                "Viggo AI Chat",

                            text:
                                "Shared Viggo AI Chat",

                            url:
                                url
                        });

                    } else {

                        await copyText(
                            url
                        );


                        alert(
                            "Chat link copied!"
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
       LOAD SHARED CHAT
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


        try {

            const encoded =
                decodeURIComponent(
                    hash.substring(8)
                );


            const json =
                decodeURIComponent(
                    escape(
                        atob(
                            encoded
                        )
                    )
                );


            const shared =
                JSON.parse(
                    json
                );


            if (
                !shared ||
                !Array.isArray(
                    shared.messages
                )
            ) {

                return false;
            }


            const imported = {

                id:
                    createId(),

                title:
                    shared.title ||
                    "Shared Chat",

                pinned:
                    false,

                createdAt:
                    Date.now(),

                updatedAt:
                    Date.now(),

                messages:
                    shared.messages
            };


            chats.unshift(
                imported
            );


            currentChatId =
                imported.id;


            saveChats();


            window.history.replaceState(
                {},
                document.title,
                window.location.pathname +
                window.location.search
            );


            return true;

        } catch (error) {

            console.error(
                "Shared chat error:",
                error
            );

            return false;
        }
    }


    /* =====================================================
       ESCAPE KEY
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Escape"
            ) {

                return;
            }


            plusMenu?.classList.remove(
                "show"
            );

            plusMenu?.classList.remove(
                "active"
            );


            moreMenu?.classList.remove(
                "show"
            );

            moreMenu?.classList.remove(
                "active"
            );


            voiceModal?.classList.remove(
                "show"
            );

            voiceModal?.classList.remove(
                "active"
            );


            languageModal?.classList.remove(
                "show"
            );

            languageModal?.classList.remove(
                "active"
            );
        }
    );


    /* =====================================================
       INITIALIZE
    ===================================================== */

    function initialize() {

        loadChats();


        const shared =
            loadSharedChat();


        if (!shared) {

            ensureChat();
        }


        renderHistory();

        renderConversation();


        if (languageSelect) {

            languageSelect.value =
                selectedLanguage;
        }


        if (voiceGender) {

            voiceGender.value =
                selectedVoice;
        }


        console.log(
            "================================="
        );

        console.log(
            "VIGGO AI SCRIPT READY"
        );

        console.log(
            "API:",
            API_URL
        );

        console.log(
            "Camera:",
            !!cameraInput
        );

        console.log(
            "Photo:",
            !!photoInput
        );

        console.log(
            "Video:",
            !!videoInput
        );

        console.log(
            "File:",
            !!fileInput
        );

        console.log(
            "Send:",
            !!sendBtn
        );

        console.log(
            "================================="
        );
    }


    initialize();

})();
