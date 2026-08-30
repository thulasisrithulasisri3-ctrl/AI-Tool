"use strict";

/* =====================================================
   VIGGO AI - FULL SCRIPT.JS
   BUTTONS + CHAT + MOBILE + UPLOAD + VOICE
===================================================== */

(function () {

    console.log("=================================");
    console.log("VIGGO AI STARTING...");
    console.log("=================================");


    /* =================================================
       CONFIG
    ================================================= */

    const API_URL =
        "https://ai-tool-2-zpul.onrender.com/chat";


    /* =================================================
       STATE
    ================================================= */

    let chats =
        JSON.parse(
            localStorage.getItem("viggoChats") || "[]"
        );

    let currentChatId =
        localStorage.getItem("viggoCurrentChatId");


    let selectedLanguage =
        localStorage.getItem("viggoLanguage") ||
        "en-IN";


    let speakerEnabled = true;


    /* =================================================
       GET ELEMENT
    ================================================= */

    function get(id) {
        return document.getElementById(id);
    }


    /* =================================================
       ELEMENTS
    ================================================= */

    const sidebar =
        get("sidebar");

    const openSidebar =
        get("openSidebar");

    const closeSidebar =
        get("closeSidebar");

    const newChatBtn =
        get("newChat");

    const searchChat =
        get("searchChat");

    const chatHistory =
        get("chatHistory");

    const conversation =
        get("conversation");

    const message =
        get("message");

    const sendBtn =
        get("send");

    const micBtn =
        get("mic");

    const plusBtn =
        get("plusBtn");

    const plusMenu =
        get("plusMenu");

    const moreBtn =
        get("moreBtn");

    const moreMenu =
        get("moreMenu");

    const shareBtn =
        get("shareBtn");


    /* =================================================
       FILE INPUTS
    ================================================= */

    const cameraInput =
        get("cameraInput");

    const photoInput =
        get("photoInput");

    const videoInput =
        get("videoInput");

    const fileInput =
        get("fileInput");


    /* =================================================
       MODALS
    ================================================= */

    const voiceModal =
        get("voiceModal");

    const languageModal =
        get("languageModal");


    /* =================================================
       MOBILE VIEWPORT FIX
    ================================================= */

    function fixViewportHeight() {

        const height =
            window.visualViewport
                ? window.visualViewport.height
                : window.innerHeight;

        document.documentElement
            .style
            .setProperty(
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


    /* =================================================
       SAVE CHATS
    ================================================= */

    function saveChats() {

        localStorage.setItem(
            "viggoChats",
            JSON.stringify(chats)
        );

        localStorage.setItem(
            "viggoCurrentChatId",
            currentChatId || ""
        );

    }


    /* =================================================
       CREATE CHAT
    ================================================= */

    function createChat() {

        const chat = {

            id:
                Date.now().toString(),

            title:
                "New Chat",

            messages:
                [],

            createdAt:
                Date.now()

        };


        chats.unshift(chat);

        currentChatId =
            chat.id;


        saveChats();

        renderHistory();

        renderConversation();

    }


    /* =================================================
       GET CURRENT CHAT
    ================================================= */

    function getCurrentChat() {

        if (!currentChatId) {
            return null;
        }

        return chats.find(
            function (chat) {
                return chat.id === currentChatId;
            }
        ) || null;

    }


    /* =================================================
       ENSURE CHAT
    ================================================= */

    function ensureChat() {

        let chat =
            getCurrentChat();

        if (!chat) {

            createChat();

            chat =
                getCurrentChat();

        }

        return chat;

    }


    /* =================================================
       NEW CHAT
    ================================================= */

    function newChat() {

        createChat();

        if (message) {
            message.value = "";
            message.focus();
        }

        closeSidebarMobile();

    }


    window.createNewChat =
        newChat;

    window.newChat =
        newChat;


    /* =================================================
       RENDER HISTORY
    ================================================= */

    function renderHistory(
        search = ""
    ) {

        if (!chatHistory) {
            return;
        }


        chatHistory.innerHTML = "";


        const query =
            search
                .trim()
                .toLowerCase();


        chats
            .filter(
                function (chat) {

                    return !query ||
                        chat.title
                            .toLowerCase()
                            .includes(query);

                }
            )
            .forEach(
                function (chat) {

                    const item =
                        document.createElement(
                            "div"
                        );


                    item.className =
                        "history-item";


                    item.dataset.id =
                        chat.id;


                    const title =
                        document.createElement(
                            "span"
                        );


                    title.className =
                        "history-text";


                    title.textContent =
                        chat.title ||
                        "New Chat";


                    item.appendChild(title);


                    const actions =
                        document.createElement(
                            "div"
                        );


                    actions.className =
                        "history-actions";


                    const pin =
                        document.createElement(
                            "button"
                        );


                    pin.type =
                        "button";

                    pin.className =
                        "history-pin";

                    pin.textContent =
                        "📌";

                    pin.title =
                        "Pin";


                    const del =
                        document.createElement(
                            "button"
                        );


                    del.type =
                        "button";

                    del.className =
                        "history-delete";

                    del.textContent =
                        "🗑️";

                    del.title =
                        "Delete";


                    actions.appendChild(
                        pin
                    );

                    actions.appendChild(
                        del
                    );


                    item.appendChild(
                        actions
                    );


                    item.addEventListener(
                        "click",
                        function (event) {

                            if (
                                event.target ===
                                pin ||
                                event.target ===
                                del
                            ) {
                                return;
                            }

                            openChat(
                                chat.id
                            );

                        }
                    );


                    pin.addEventListener(
                        "click",
                        function (event) {

                            event.stopPropagation();

                            chat.pinned =
                                !chat.pinned;

                            chats.sort(
                                function (a, b) {

                                    if (
                                        a.pinned ===
                                        b.pinned
                                    ) {
                                        return 0;
                                    }

                                    return a.pinned
                                        ? -1
                                        : 1;

                                }
                            );

                            saveChats();

                            renderHistory(
                                search
                            );

                        }
                    );


                    del.addEventListener(
                        "click",
                        function (event) {

                            event.stopPropagation();

                            deleteChat(
                                chat.id
                            );

                        }
                    );


                    if (
                        chat.id ===
                        currentChatId
                    ) {

                        item.classList.add(
                            "active"
                        );

                    }


                    chatHistory.appendChild(
                        item
                    );

                }
            );

    }


    /* =================================================
       OPEN CHAT
    ================================================= */

    function openChat(id) {

        currentChatId =
            id;

        saveChats();

        renderHistory();

        renderConversation();

        closeSidebarMobile();

    }


    /* =================================================
       DELETE CHAT
    ================================================= */

    function deleteChat(id) {

        const index =
            chats.findIndex(
                function (chat) {
                    return chat.id === id;
                }
            );


        if (index === -1) {
            return;
        }


        chats.splice(
            index,
            1
        );


        if (
            currentChatId === id
        ) {

            if (chats.length) {

                currentChatId =
                    chats[0].id;

            } else {

                currentChatId =
                    null;

                createChat();

                return;

            }

        }


        saveChats();

        renderHistory();

        renderConversation();

    }


    /* =================================================
       CLEAR CURRENT CHAT
    ================================================= */

    function clearChat() {

        const chat =
            getCurrentChat();

        if (!chat) {
            return;
        }


        chat.messages =
            [];


        chat.title =
            "New Chat";


        saveChats();

        renderHistory();

        renderConversation();

    }


    window.clearChat =
        clearChat;


    /* =================================================
       SELECT CHATS
    ================================================= */

    function selectChats() {

        if (!chatHistory) {
            return;
        }


        const items =
            chatHistory.querySelectorAll(
                ".history-item"
            );


        items.forEach(
            function (item) {

                item.classList.toggle(
                    "select-mode"
                );


                if (
                    !item.querySelector(
                        "input[type='checkbox']"
                    )
                ) {

                    const checkbox =
                        document.createElement(
                            "input"
                        );


                    checkbox.type =
                        "checkbox";


                    checkbox.className =
                        "chat-select";


                    checkbox.dataset.id =
                        item.dataset.id;


                    item.prepend(
                        checkbox
                    );

                }

            }
        );

    }


    window.selectChats =
        selectChats;


    /* =================================================
       DELETE SELECTED
    ================================================= */

    function deleteSelectedChats() {

        if (!chatHistory) {
            return;
        }


        const checked =
            chatHistory.querySelectorAll(
                ".chat-select:checked"
            );


        if (!checked.length) {

            alert(
                "Select chats first."
            );

            return;

        }


        const ids =
            Array.from(
                checked
            ).map(
                function (checkbox) {
                    return checkbox.dataset.id;
                }
            );


        chats =
            chats.filter(
                function (chat) {

                    return !ids.includes(
                        chat.id
                    );

                }
            );


        if (
            !getCurrentChat() &&
            chats.length
        ) {

            currentChatId =
                chats[0].id;

        }


        saveChats();

        renderHistory();

        renderConversation();

    }


    window.deleteSelectedChats =
        deleteSelectedChats;


    /* =================================================
       RENDER CONVERSATION
    ================================================= */

    function renderConversation() {

        if (!conversation) {
            return;
        }


        conversation.innerHTML = "";


        const chat =
            getCurrentChat();


        if (!chat) {
            return;
        }


        chat.messages.forEach(
            function (msg) {

                addMessageToUI(
                    msg.role,
                    msg.text,
                    false,
                    msg.media
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
        save = true,
        media = null
    ) {

        if (!conversation) {
            return;
        }


        const wrapper =
            document.createElement(
                "div"
            );


        wrapper.className =
            "message-wrapper " +
            role;


        const bubble =
            document.createElement(
                "div"
            );


        bubble.className =
            "message-bubble";


        if (text) {

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


        /* MEDIA */

        if (media) {

            if (
                media.type &&
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
                    media.name || "Image";


                img.style.maxWidth =
                    "100%";

                img.style.maxHeight =
                    "320px";

                img.style.borderRadius =
                    "12px";


                bubble.appendChild(
                    img
                );

            }


            if (
                media.type &&
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

            }

        }


        wrapper.appendChild(
            bubble
        );


        /* =================================================
           ACTIONS
        ================================================= */

        const actions =
            document.createElement(
                "div"
            );


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
            "💾";

        saveBtn.title =
            "Save";


        saveBtn.addEventListener(
            "click",
            function () {

                saveMessage(
                    text
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
            "📋";

        copyBtn.title =
            "Copy";


        copyBtn.addEventListener(
            "click",
            function () {

                copyText(
                    text
                );

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
            "👍";

        likeBtn.title =
            "Like";


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
            document.createElement(
                "button"
            );


        speakerBtn.type =
            "button";

        speakerBtn.textContent =
            "🔊";

        speakerBtn.title =
            "Speak";


        speakerBtn.addEventListener(
            "click",
            function () {

                speakText(
                    text
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


        wrapper.appendChild(
            actions
        );


        conversation.appendChild(
            wrapper
        );


        if (save) {

            const chat =
                ensureChat();


            chat.messages.push({

                role:
                    role,

                text:
                    text || "",

                media:
                    media || null,

                time:
                    Date.now()

            });


            if (
                role === "user" &&
                chat.title === "New Chat" &&
                text
            ) {

                chat.title =
                    text.substring(
                        0,
                        35
                    );

            }


            saveChats();

            renderHistory();

        }


        scrollToBottom();

    }


    /* =================================================
       COPY
    ================================================= */

    async function copyText(text) {

        if (!text) {
            return;
        }


        try {

            await navigator.clipboard.writeText(
                text
            );

            console.log(
                "Copied"
            );

        } catch (error) {

            const area =
                document.createElement(
                    "textarea"
                );


            area.value =
                text;


            document.body.appendChild(
                area
            );


            area.select();

            document.execCommand(
                "copy"
            );


            area.remove();

        }

    }


    /* =================================================
       SAVE MESSAGE
    ================================================= */

    function saveMessage(text) {

        if (!text) {
            return;
        }


        const saved =
            JSON.parse(
                localStorage.getItem(
                    "viggoSavedMessages"
                ) || "[]"
            );


        saved.push({

            text:
                text,

            time:
                Date.now()

        });


        localStorage.setItem(
            "viggoSavedMessages",
            JSON.stringify(saved)
        );


        alert(
            "Message saved."
        );

    }


    /* =================================================
       SPEAKER
    ================================================= */

    function speakText(text) {

        if (
            !speakerEnabled ||
            !text ||
            !window.speechSynthesis
        ) {
            return;
        }


        window.speechSynthesis.cancel();


        const utterance =
            new SpeechSynthesisUtterance(
                text
            );


        utterance.lang =
            selectedLanguage;


        window.speechSynthesis.speak(
            utterance
        );

    }


    /* =================================================
       SCROLL
    ================================================= */

    function scrollToBottom() {

        if (!conversation) {
            return;
        }


        requestAnimationFrame(
            function () {

                conversation.scrollTop =
                    conversation.scrollHeight;

            }
        );

    }


    /* =================================================
       TYPING BUBBLE
    ================================================= */

    function showTyping() {

        if (!conversation) {
            return null;
        }


        const wrapper =
            document.createElement(
                "div"
            );


        wrapper.className =
            "message-wrapper assistant";


        wrapper.id =
            "viggoTyping";


        const bubble =
            document.createElement(
                "div"
            );


        bubble.className =
            "message-bubble";


        bubble.textContent =
            "Thinking...";


        wrapper.appendChild(
            bubble
        );


        conversation.appendChild(
            wrapper
        );


        scrollToBottom();


        return wrapper;

    }


    function removeTyping() {

        const typing =
            get("viggoTyping");


        if (typing) {
            typing.remove();
        }

    }


    /* =================================================
       SEND MESSAGE
    ================================================= */

    async function sendMessage(text) {

        if (!text) {

            if (message) {
                text =
                    message.value.trim();
            }

        }


        if (!text) {
            return;
        }


        const chat =
            ensureChat();


        if (message) {
            message.value = "";
            message.style.height = "auto";
        }


        addMessageToUI(
            "user",
            text,
            true
        );


        const typing =
            showTyping();


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
                await response.json()
                    .catch(
                        function () {
                            return {};
                        }
                    );


            if (typing) {
                typing.remove();
            }


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    data.message ||
                    "Server error " +
                    response.status
                );

            }


            const reply =
                data.reply ||
                data.response ||
                data.text ||
                data.message ||
                "Sorry, I couldn't get a response.";


            addMessageToUI(
                "assistant",
                reply,
                true
            );


        } catch (error) {

            console.error(
                "Viggo API Error:",
                error
            );


            if (typing) {
                typing.remove();
            }


            addMessageToUI(
                "assistant",
                "Sorry friend, I couldn't connect to Viggo AI right now.",
                true
            );

        }

    }


    window.sendMessage =
        sendMessage;


    /* =================================================
       FILE TO DATA URL
    ================================================= */

    function fileToDataURL(file) {

        return new Promise(
            function (resolve, reject) {

                const reader =
                    new FileReader();


                reader.onload =
                    function () {

                        resolve(
                            reader.result
                        );

                    };


                reader.onerror =
                    reject;


                reader.readAsDataURL(
                    file
                );

            }
        );

    }


    /* =================================================
       SEND UPLOADED FILE
    ================================================= */

    async function sendUploadedFile(file) {

        if (!file) {
            return;
        }


        console.log(
            "Uploading:",
            file.name
        );


        try {

            const dataURL =
                await fileToDataURL(
                    file
                );


            const media = {

                name:
                    file.name,

                type:
                    file.type,

                data:
                    dataURL

            };


            const chat =
                ensureChat();


            addMessageToUI(
                "user",
                "Uploaded: " +
                file.name,
                true,
                media
            );


            const typing =
                showTyping();


            /*
               Send file metadata to server.
               Existing server can decide how
               to process it.
            */

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
                                    "Please analyze this uploaded file: " +
                                    file.name,

                                file: {

                                    name:
                                        file.name,

                                    type:
                                        file.type,

                                    size:
                                        file.size,

                                    data:
                                        dataURL

                                },

                                language:
                                    selectedLanguage

                            })

                    }
                );


            const data =
                await response.json()
                    .catch(
                        function () {
                            return {};
                        }
                    );


            if (typing) {
                typing.remove();
            }


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Upload server error"
                );

            }


            const reply =
                data.reply ||
                data.response ||
                data.text ||
                data.message ||
                "File uploaded successfully.";


            addMessageToUI(
                "assistant",
                reply,
                true
            );


        } catch (error) {

            console.error(
                "Upload error:",
                error
            );


            const typing =
                get("viggoTyping");


            if (typing) {
                typing.remove();
            }


            addMessageToUI(
                "assistant",
                "The file was selected, but I couldn't analyze it right now.",
                true
            );

        }

    }


    window.sendUploadedFile =
        sendUploadedFile;


    /* =================================================
       PLUS MENU
    ================================================= */

    function openPlusMenu() {

        if (!plusMenu) {
            return;
        }


        plusMenu.classList.add(
            "show"
        );


        plusMenu.style.display =
            "flex";

    }


    function closePlusMenu() {

        if (!plusMenu) {
            return;
        }


        plusMenu.classList.remove(
            "show"
        );


        plusMenu.style.display =
            "none";

    }


    function togglePlusMenu() {

        if (!plusMenu) {
            return;
        }


        const isOpen =
            plusMenu.classList.contains(
                "show"
            );


        if (isOpen) {

            closePlusMenu();

        } else {

            openPlusMenu();

        }

    }


    /* =================================================
       PLUS BUTTON
    ================================================= */

    if (plusBtn) {

        plusBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                event.stopPropagation();

                togglePlusMenu();

            }
        );

    }


    /* =================================================
       CAMERA BUTTON
    ================================================= */

    const cameraBtn =
        get("cameraBtn");


    if (cameraBtn) {

        cameraBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                event.stopPropagation();

                closePlusMenu();


                if (cameraInput) {

                    cameraInput.value =
                        "";

                    cameraInput.click();

                }

            }
        );

    }


    /* =================================================
       PHOTO BUTTON
    ================================================= */

    const photoBtn =
        get("photoBtn");


    if (photoBtn) {

        photoBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                event.stopPropagation();

                closePlusMenu();


                if (photoInput) {

                    photoInput.value =
                        "";

                    photoInput.click();

                }

            }
        );

    }


    /* =================================================
       VIDEO BUTTON
    ================================================= */

    const videoBtn =
        get("videoBtn");


    if (videoBtn) {

        videoBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                event.stopPropagation();

                closePlusMenu();


                if (videoInput) {

                    videoInput.value =
                        "";

                    videoInput.click();

                }

            }
        );

    }


    /* =================================================
       FILE BUTTON
    ================================================= */

    const fileBtn =
        get("fileBtn");


    if (fileBtn) {

        fileBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                event.stopPropagation();

                closePlusMenu();


                if (fileInput) {

                    fileInput.value =
                        "";

                    fileInput.click();

                }

            }
        );

    }


    /* =================================================
       FILE EVENTS
    ================================================= */

    function processFile(
        input,
        source
    ) {

        if (
            !input ||
            !input.files ||
            !input.files.length
        ) {
            return;
        }


        const file =
            input.files[0];


        console.log(
            source,
            file.name
        );


        const maxSize =
            20 * 1024 * 1024;


        if (
            file.size >
            maxSize
        ) {

            alert(
                "Maximum file size is 20 MB."
            );

            input.value =
                "";

            return;

        }


        sendUploadedFile(
            file
        );

    }


    if (cameraInput) {

        cameraInput.addEventListener(
            "change",
            function () {

                processFile(
                    cameraInput,
                    "camera"
                );

            }
        );

    }


    if (photoInput) {

        photoInput.addEventListener(
            "change",
            function () {

                processFile(
                    photoInput,
                    "photo"
                );

            }
        );

    }


    if (videoInput) {

        videoInput.addEventListener(
            "change",
            function () {

                processFile(
                    videoInput,
                    "video"
                );

            }
        );

    }


    if (fileInput) {

        fileInput.addEventListener(
            "change",
            function () {

                processFile(
                    fileInput,
                    "file"
                );

            }
        );

    }


    /* =================================================
       PLUS VOICE
    ================================================= */

    const plusVoiceBtn =
        get("plusVoiceBtn");


    if (plusVoiceBtn) {

        plusVoiceBtn.addEventListener(
            "click",
            function () {

                closePlusMenu();

                openVoiceModal();

            }
        );

    }


    /* =================================================
       VOICE MODAL
    ================================================= */

    function openVoiceModal() {

        if (voiceModal) {

            voiceModal.style.display =
                "flex";

        }

    }


    function closeVoiceModal() {

        if (voiceModal) {

            voiceModal.style.display =
                "none";

        }

    }


    const closeVoice =
        get("closeVoice");


    if (closeVoice) {

        closeVoice.addEventListener(
            "click",
            closeVoiceModal
        );

    }


    const startVoice =
        get("startVoice");


    if (startVoice) {

        startVoice.addEventListener(
            "click",
            function () {

                closeVoiceModal();

                startRecognition();

            }
        );

    }


    /* =================================================
       MICROPHONE
    ================================================= */

    function startRecognition() {

        const Recognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;


        if (!Recognition) {

            alert(
                "Voice recognition is not supported in this browser."
            );

            return;

        }


        const recognition =
            new Recognition();


        recognition.lang =
            selectedLanguage;


        recognition.continuous =
            false;


        recognition.interimResults =
            false;


        recognition.onstart =
            function () {

                console.log(
                    "🎤 Listening..."
                );

            };


        recognition.onresult =
            function (event) {

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
            function (event) {

                console.error(
                    "Voice error:",
                    event.error
                );

            };


        try {

            recognition.start();

        } catch (error) {

            console.error(
                error
            );

        }

    }


    if (micBtn) {

        micBtn.addEventListener(
            "click",
            function () {

                startRecognition();

            }
        );

    }


    /* =================================================
       VOICE MENU
    ================================================= */

    const voiceMenuBtn =
        get("voiceMenuBtn");


    if (voiceMenuBtn) {

        voiceMenuBtn.addEventListener(
            "click",
            function () {

                closeMoreMenu();

                openVoiceModal();

            }
        );

    }


    /* =================================================
       LANGUAGE
    ================================================= */

    const languageBtn =
        get("languageBtn");


    function openLanguageModal() {

        if (!languageModal) {
            return;
        }


        const select =
            get("languageSelect");


        if (select) {

            select.value =
                selectedLanguage;

        }


        languageModal.style.display =
            "flex";

    }


    function closeLanguageModal() {

        if (languageModal) {

            languageModal.style.display =
                "none";

        }

    }


    if (languageBtn) {

        languageBtn.addEventListener(
            "click",
            function () {

                closeMoreMenu();

                openLanguageModal();

            }
        );

    }


    const closeLanguage =
        get("closeLanguage");


    if (closeLanguage) {

        closeLanguage.addEventListener(
            "click",
            closeLanguageModal
        );

    }


    const saveLanguage =
        get("saveLanguage");


    if (saveLanguage) {

        saveLanguage.addEventListener(
            "click",
            function () {

                const select =
                    get("languageSelect");


                if (select) {

                    selectedLanguage =
                        select.value;


                    localStorage.setItem(
                        "viggoLanguage",
                        selectedLanguage
                    );

                }


                closeLanguageModal();

            }
        );

    }


    /* =================================================
       MORE MENU
    ================================================= */

    function openMoreMenu() {

        if (!moreMenu) {
            return;
        }


        moreMenu.classList.add(
            "show"
        );


        moreMenu.style.display =
            "block";

    }


    function closeMoreMenu() {

        if (!moreMenu) {
            return;
        }


        moreMenu.classList.remove(
            "show"
        );


        moreMenu.style.display =
            "none";

    }


    function toggleMoreMenu() {

        if (!moreMenu) {
            return;
        }


        const open =
            moreMenu.classList.contains(
                "show"
            );


        if (open) {

            closeMoreMenu();

        } else {

            openMoreMenu();

        }

    }


    if (moreBtn) {

        moreBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                event.stopPropagation();

                toggleMoreMenu();

            }
        );

    }


    /* =================================================
       SHARE
    ================================================= */

    if (shareBtn) {

        shareBtn.addEventListener(
            "click",
            async function () {

                const url =
                    window.location.href;


                if (
                    navigator.share
                ) {

                    try {

                        await navigator.share({

                            title:
                                "Viggo AI",

                            text:
                                "Check out Viggo AI",

                            url:
                                url

                        });

                    } catch (error) {

                        console.log(
                            "Share cancelled"
                        );

                    }

                } else {

                    try {

                        await navigator.clipboard
                            .writeText(
                                url
                            );


                        alert(
                            "Viggo AI link copied."
                        );

                    } catch (error) {

                        alert(
                            "Share is not supported."
                        );

                    }

                }

            }
        );

    }


    /* =================================================
       SIDEBAR
    ================================================= */

    function openSidebarMobile() {

        if (!sidebar) {
            return;
        }


        sidebar.classList.add(
            "open"
        );


        sidebar.style.transform =
            "translateX(0)";

    }


    function closeSidebarMobile() {

        if (!sidebar) {
            return;
        }


        sidebar.classList.remove(
            "open"
        );


        if (
            window.innerWidth <=
            768
        ) {

            sidebar.style.transform =
                "translateX(-100%)";

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
       NEW CHAT BUTTON
    ================================================= */

    if (newChatBtn) {

        newChatBtn.addEventListener(
            "click",
            function () {

                newChat();

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

                renderHistory(
                    searchChat.value
                );

            }
        );

    }


    /* =================================================
       SELECT CHAT
    ================================================= */

    const selectChatsBtn =
        get("selectChatsBtn");


    if (selectChatsBtn) {

        selectChatsBtn.addEventListener(
            "click",
            function () {

                selectChats();

            }
        );

    }


    /* =================================================
       DELETE SELECTED
    ================================================= */

    const deleteSelectedBtn =
        get("deleteSelectedBtn");


    if (deleteSelectedBtn) {

        deleteSelectedBtn.addEventListener(
            "click",
            function () {

                deleteSelectedChats();

            }
        );

    }


    /* =================================================
       CLEAR CHAT BUTTON
    ================================================= */

    const clearChatBtn =
        get("clearChatBtn");


    if (clearChatBtn) {

        clearChatBtn.addEventListener(
            "click",
            function () {

                closeMoreMenu();

                clearChat();

            }
        );

    }


    /* =================================================
       CLICK OUTSIDE
    ================================================= */

    document.addEventListener(
        "click",
        function (event) {

            if (
                plusMenu &&
                plusBtn &&
                !plusMenu.contains(
                    event.target
                ) &&
                event.target !== plusBtn
            ) {

                closePlusMenu();

            }


            if (
                moreMenu &&
                moreBtn &&
                !moreMenu.contains(
                    event.target
                ) &&
                event.target !== moreBtn
            ) {

                closeMoreMenu();

            }

        }
    );


    /* =================================================
       MODAL CLICK OUTSIDE
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
       ESCAPE
    ================================================= */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key ===
                "Escape"
            ) {

                closePlusMenu();

                closeMoreMenu();

                closeVoiceModal();

                closeLanguageModal();

                closeSidebarMobile();

            }

        }
    );


    /* =================================================
       INITIAL CHAT
    ================================================= */

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


    /* =================================================
       SEND BUTTON
    ================================================= */

    if (sendBtn) {

        sendBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                sendMessage();

            }
        );

    }


    /* =================================================
       ENTER SEND
    ================================================= */

    if (message) {

        message.addEventListener(
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
       FINAL
    ================================================= */

    console.log(
        "================================="
    );

    console.log(
        "✓ VIGGO AI READY"
    );

    console.log(
        "✓ SEND"
    );

    console.log(
        "✓ NEW CHAT"
    );

    console.log(
        "✓ SIDEBAR"
    );

    console.log(
        "✓ MORE"
    );

    console.log(
        "✓ SHARE"
    );

    console.log(
        "✓ CAMERA"
    );

    console.log(
        "✓ PHOTO"
    );

    console.log(
        "✓ VIDEO"
    );

    console.log(
        "✓ FILE"
    );

    console.log(
        "✓ MICROPHONE"
    );

    console.log(
        "✓ VOICE"
    );

    console.log(
        "✓ LANGUAGE"
    );

    console.log(
        "✓ MOBILE VIEW"
    );

    console.log(
        "================================="
    );


})();
